/**
 * data_cleaner.js — Hệ thống Thuật toán Làm sạch & Khử trùng lặp Dữ liệu Phòng trọ
 * Áp dụng Entity Resolution (tương tự Dedupe/Splink) và Data Quality Gate (Great Expectations).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const DB_ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const CLEAN_LOG_FILE = path.resolve(__dirname, '..', 'alldata', 'logs', 'data_clean_report.json');

// Ngưỡng phát hiện trùng lặp
const SIMILARITY_THRESHOLD_WITH_SAME_PHONE = 0.65; // Cùng SĐT + văn bản giống > 65%
const SIMILARITY_THRESHOLD_WITHOUT_PHONE   = 0.85; // Không có SĐT + văn bản giống > 85%

/**
 * Chuẩn hóa số điện thoại Việt Nam về định dạng thống nhất: 09xxxxxxxx hoặc rỗng
 */
function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    return '0' + digits.substring(2);
  }
  if (digits.startsWith('0') && (digits.length === 10 || digits.length === 11)) {
    return digits;
  }
  return '';
}

/**
 * Làm sạch văn bản mô tả: bỏ tag rác, emoji thừa, ký tự lặp
 */
function cleanTextContent(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(?:Thích|Bình luận|Chia sẻ|Xem thêm|Gửi tin nhắn|\bcdot\b|\bhours ago\b|\btrước\b)/gi, ' ')
    .replace(/[^\p{L}\p{N}\s.,\-–/]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * KIỂM ĐỊNH CHẤT LƯỢNG DỮ LIỆU (Data Quality Gate)
 * Kiểm tra các tiêu chuẩn cứng trước khi lưu phòng vào DB
 */
function validateRoomQuality(room) {
  const issues = [];

  if (!room || typeof room !== 'object') {
    return { valid: false, issues: ['Bản ghi phòng không hợp lệ'] };
  }

  const thongTin = room.thong_tin || {};
  const viTri = room.vi_tri || {};
  const gia = Number(thongTin.gia) || 0;
  const moTa = thongTin.mo_ta || '';

  // 1. Kiểm tra dải giá
  if (gia < 600000) {
    issues.push(`Giá quá thấp bất thường (${gia.toLocaleString()} đ) — nghi ngờ tin rác hoặc cọc ảo`);
  } else if (gia > 25000000) {
    issues.push(`Giá vượt trần cho phép (${gia.toLocaleString()} đ) — không phù hợp đối tượng sinh viên`);
  }

  // 2. Kiểm tra từ khóa loại trừ (Spam / tìm người ở ghép / pass đồ)
  const spamPatterns = [
    /\b(cần tìm|mình tìm|em tìm|hỏi phòng)\s+(?:trọ|phòng)/i,
    /\b(tìm bạn|tìm nữ|tìm nam)\s+ở\s+ghép\b/i,
    /\bpass\s+(?:đồ|lại|phòng|hợp đồng)\b/i,
    /\bthanh\s+lý\s+đồ\b/i,
    /\btìm\s+người\s+ở\s+ghép\b/i
  ];

  for (const pat of spamPatterns) {
    if (pat.test(moTa) || pat.test(thongTin.tieu_de || '')) {
      issues.push(`Chứa từ khóa loại trừ: bài đăng không phải chào cho thuê phòng chính thống (${pat})`);
      break;
    }
  }

  // 3. Kiểm tra phạm vi địa lý (khoảng cách tới cơ sở gần nhất)
  const dCS1 = viTri.khoang_cach_cs1_km;
  const dCS2 = viTri.khoang_cach_cs2_km;
  const dCS3 = viTri.khoang_cach_cs3_km;
  const minDistance = Math.min(
    dCS1 !== undefined ? dCS1 : 999,
    dCS2 !== undefined ? dCS2 : 999,
    dCS3 !== undefined ? dCS3 : 999
  );

  if (minDistance > 12.0) {
    issues.push(`Khoảng cách quá xa các cơ sở HaUI (${minDistance} km) — ngoài phạm vi phục vụ`);
  }

  // 4. Kiểm tra URL nguồn
  if (!room.url_nguon && !room.lien_he?.facebook) {
    issues.push('Thiếu liên kết nguồn (URL gốc) để kiểm chứng tính xác thực');
  }

  return {
    valid: issues.length === 0,
    issues,
    qualityScore: Math.max(0, 100 - issues.length * 25)
  };
}

/**
 * So khớp xem một phòng mới có bị trùng lặp với danh sách phòng hiện có hay không
 */
function checkDuplicate(newRoom, existingRooms) {
  if (!existingRooms || existingRooms.length === 0) return { isDuplicate: false };

  const newUrl = (newRoom.url_nguon || newRoom.lien_he?.facebook || '').trim().toLowerCase();
  const newPhone = normalizePhone(newRoom.lien_he?.so_dien_thoai);
  const newText = cleanTextContent(newRoom.thong_tin?.mo_ta || newRoom.thong_tin?.tieu_de || '');

  for (const item of existingRooms) {
    if (item.ma_phong === newRoom.ma_phong) continue;

    // 1. Trùng 100% URL gốc
    const itemUrl = (item.url_nguon || item.lien_he?.facebook || '').trim().toLowerCase();
    if (newUrl && itemUrl && newUrl === itemUrl) {
      return {
        isDuplicate: true,
        reason: 'TRUNG_URL',
        matchedRoomId: item.ma_phong,
        similarity: 1.0
      };
    }

    const itemPhone = normalizePhone(item.lien_he?.so_dien_thoai);
    const itemText = cleanTextContent(item.thong_tin?.mo_ta || item.thong_tin?.tieu_de || '');

    if (!newText || !itemText) continue;

    // 2. Trùng cùng SĐT và nội dung tương đồng cao
    if (newPhone && itemPhone && newPhone === itemPhone) {
      const sim = stringSimilarity.compareTwoStrings(newText, itemText);
      if (sim >= SIMILARITY_THRESHOLD_WITH_SAME_PHONE) {
        return {
          isDuplicate: true,
          reason: 'CUNG_SDT_NOI_DUNG_TUONG_DONG',
          matchedRoomId: item.ma_phong,
          similarity: Math.round(sim * 100) / 100
        };
      }
    }

    // 3. Khác SĐT nhưng nội dung mô tả sao chép giống > 85%
    if (newText.length > 50 && itemText.length > 50) {
      const sim = stringSimilarity.compareTwoStrings(newText, itemText);
      if (sim >= SIMILARITY_THRESHOLD_WITHOUT_PHONE) {
        return {
          isDuplicate: true,
          reason: 'NOI_DUNG_COPY_PASTE',
          matchedRoomId: item.ma_phong,
          similarity: Math.round(sim * 100) / 100
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Quét toàn diện kho dữ liệu để phát hiện trùng lặp và đánh giá chất lượng
 */
function runFullCleanSweep(autoResolve = false) {
  if (!fs.existsSync(DB_ROOM_DIR)) {
    return { error: 'Không tìm thấy thư mục dữ liệu phòng' };
  }

  const files = fs.readdirSync(DB_ROOM_DIR).filter(f => f.endsWith('.json'));
  const allRooms = [];

  for (const f of files) {
    try {
      const room = JSON.parse(fs.readFileSync(path.join(DB_ROOM_DIR, f), 'utf-8'));
      if (room && room.ma_phong) allRooms.push(room);
    } catch {}
  }

  const duplicates = [];
  const qualityIssues = [];
  const checkedPairs = new Set();
  let cleanedCount = 0;

  // 1. Kiểm tra chất lượng từng phòng
  for (const r of allRooms) {
    const val = validateRoomQuality(r);
    if (!val.valid) {
      qualityIssues.push({
        ma_phong: r.ma_phong,
        tieu_de: r.thong_tin?.tieu_de,
        gia: r.thong_tin?.gia,
        issues: val.issues
      });
    }
  }

  // 2. Khử trùng lặp chéo giữa các cặp phòng
  for (let i = 0; i < allRooms.length; i++) {
    for (let j = i + 1; j < allRooms.length; j++) {
      const r1 = allRooms[i];
      const r2 = allRooms[j];
      const pairKey = `${r1.ma_phong}_${r2.ma_phong}`;
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);

      const dup = checkDuplicate(r1, [r2]);
      if (dup.isDuplicate) {
        duplicates.push({
          room1: r1.ma_phong,
          room2: r2.ma_phong,
          reason: dup.reason,
          similarity: dup.similarity,
          title1: r1.thong_tin?.tieu_de,
          title2: r2.thong_tin?.tieu_de
        });

        // Nếu autoResolve: chuyển bài cũ hơn sang trạng thái trùng lặp/ẩn
        if (autoResolve) {
          const fileToHide = r1.ngay_cap_nhat > r2.ngay_cap_nhat ? r2 : r1;
          fileToHide.trang_thai = 'da_an_trung_lap';
          fs.writeFileSync(
            path.join(DB_ROOM_DIR, `${fileToHide.ma_phong}.json`),
            JSON.stringify(fileToHide, null, 2),
            'utf-8'
          );
          cleanedCount++;
        }
      }
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalRoomsChecked: allRooms.length,
    validCleanRooms: allRooms.length - duplicates.length - qualityIssues.length,
    duplicateCount: duplicates.length,
    qualityIssueCount: qualityIssues.length,
    healthScore: Math.round(
      Math.max(0, ((allRooms.length - duplicates.length - qualityIssues.length) / (allRooms.length || 1)) * 100)
    ),
    autoResolvedCount: cleanedCount,
    duplicates: duplicates.slice(0, 50),
    qualityIssues: qualityIssues.slice(0, 50)
  };

  try {
    fs.writeFileSync(CLEAN_LOG_FILE, JSON.stringify(report, null, 2), 'utf-8');
  } catch {}

  return report;
}

module.exports = {
  normalizePhone,
  cleanTextContent,
  validateRoomQuality,
  checkDuplicate,
  runFullCleanSweep
};
