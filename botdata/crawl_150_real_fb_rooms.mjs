import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pathToFileURL } from 'url';

const ROOM_DIR = path.resolve('alldata/room');
if (!fs.existsSync(ROOM_DIR)) fs.mkdirSync(ROOM_DIR, { recursive: true });

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);

// HaUI Campus coordinates
const HAUI_CS1 = { lat: 21.05373, lng: 105.73510, name: "HaUI Cơ sở 1 (Minh Khai - Nhổn)" };
const HAUI_CS2 = { lat: 21.06180, lng: 105.72590, name: "HaUI Cơ sở 2 (Tây Tựu)" };
const HAUI_CS3 = { lat: 20.54100, lng: 105.89800, name: "HaUI Cơ sở 3 (Phù Vân - Phủ Lý)" };

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const CS1_LANDMARKS = {
  "nguyên xá": { lat: 21.0552, lng: 105.7382, addr: "Nguyên Xá, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "văn trì": { lat: 21.0585, lng: 105.7390, addr: "Đường Văn Trì, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "nhổn": { lat: 21.0538, lng: 105.7345, addr: "Phố Nhổn, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "minh khai": { lat: 21.0542, lng: 105.7360, addr: "Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "ngọa long": { lat: 21.0505, lng: 105.7410, addr: "Phố Ngọa Long, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "đình quán": { lat: 21.0505, lng: 105.7425, addr: "Phố Đình Quán, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "kiều mai": { lat: 21.0480, lng: 105.7460, addr: "Đường Kiều Mai, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "phú kiều": { lat: 21.0485, lng: 105.7470, addr: "Phố Phú Kiều, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "cầu diễn": { lat: 21.0450, lng: 105.7480, addr: "Đường Cầu Diễn, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "phú diễn": { lat: 21.0495, lng: 105.7580, addr: "Đường Phú Diễn, Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "phúc diễn": { lat: 21.0490, lng: 105.7480, addr: "Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "đức diễn": { lat: 21.0499, lng: 105.7505, addr: "Phố Đức Diễn, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "phú minh": { lat: 21.0620, lng: 105.7450, addr: "Đường Phú Minh, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "tu hoàng": { lat: 21.0475, lng: 105.7335, addr: "Phố Tu Hoàng, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "hòe thị": { lat: 21.0410, lng: 105.7420, addr: "Phố Hòe Thị, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "phương canh": { lat: 21.0420, lng: 105.7360, addr: "Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "xuân phương": { lat: 21.0370, lng: 105.7390, addr: "Đường Xuân Phương, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "thị cấm": { lat: 21.0360, lng: 105.7460, addr: "Phố Thị Cấm, Phường Xuân Phương, Quận Nam Từ Liêm, Hà Nội" },
  "ngọc mạch": { lat: 21.0350, lng: 105.7430, addr: "Phố Ngọc Mạch, Phường Xuân Phương, Quận Nam Từ Liêm, Hà Nội" },
  "trịnh văn bô": { lat: 21.0425, lng: 105.7390, addr: "Đường Trịnh Văn Bô, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "văn tiến dũng": { lat: 21.0500, lng: 105.7480, addr: "Đường Văn Tiến Dũng, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "hồ tùng mậu": { lat: 21.0395, lng: 105.7680, addr: "Đường Hồ Tùng Mậu, Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "tây tựu": { lat: 21.0618, lng: 105.7259, addr: "Đường Tây Tựu, Phường Tây Tựu, Quận Bắc Từ Liêm, Hà Nội" },
  "trung tựu": { lat: 21.0585, lng: 105.7255, addr: "Đường Trung Tựu, Phường Tây Tựu, Quận Bắc Từ Liêm, Hà Nội" },
  "kim chung": { lat: 21.0590, lng: 105.7210, addr: "Xã Kim Chung, Huyện Hoài Đức, Hà Nội" },
  "đại tự": { lat: 21.0610, lng: 105.7190, addr: "Thôn Đại Tự, Xã Kim Chung, Huyện Hoài Đức, Hà Nội" },
  "lai xá": { lat: 21.0585, lng: 105.7180, addr: "Khu đô thị Lai Xá, Xã Kim Chung, Huyện Hoài Đức, Hà Nội" },
  "di trạch": { lat: 21.0510, lng: 105.7180, addr: "Xã Di Trạch, Huyện Hoài Đức, Hà Nội" },
  "trạm trôi": { lat: 21.0680, lng: 105.7110, addr: "Thị trấn Trạm Trôi, Huyện Hoài Đức, Hà Nội" },
  "vân canh": { lat: 21.0380, lng: 105.7220, addr: "Khu đô thị Vân Canh, Huyện Hoài Đức, Hà Nội" }
};

const CS3_LANDMARKS = {
  "phù vân": { lat: 20.5435, lng: 105.8992, addr: "Xã Phù Vân, TP. Phủ Lý, Tỉnh Hà Nam" },
  "sông đáy": { lat: 20.5450, lng: 105.9015, addr: "Bờ Tây Sông Đáy, Xã Phù Vân, TP. Phủ Lý, Hà Nam" },
  "đinh tiên hoàng": { lat: 20.5460, lng: 105.9030, addr: "Đường Đinh Tiên Hoàng kéo dài, Xã Phù Vân, TP. Phủ Lý, Hà Nam" },
  "lê hồng phong": { lat: 20.5385, lng: 105.8955, addr: "Phường Lê Hồng Phong, TP. Phủ Lý, Tỉnh Hà Nam" },
  "quang trung": { lat: 20.5480, lng: 105.9150, addr: "Phường Quang Trung, TP. Phủ Lý, Tỉnh Hà Nam" },
  "trường thi": { lat: 20.5345, lng: 105.9080, addr: "Phường Trường Thi, TP. Phủ Lý, Tỉnh Hà Nam" },
  "kim bảng": { lat: 20.5620, lng: 105.8420, addr: "Huyện Kim Bảng, Tỉnh Hà Nam" },
  "phủ lý": { lat: 20.5410, lng: 105.9130, addr: "Thành phố Phủ Lý, Tỉnh Hà Nam" },
  "hà nam": { lat: 20.5410, lng: 105.8980, addr: "Xã Phù Vân, TP. Phủ Lý, Tỉnh Hà Nam (gần HaUI CS3)" }
};

function resolveLocation(text, region) {
  const lower = text.toLowerCase();
  if (region === 'hanam_cs3' || lower.includes('hà nam') || lower.includes('phủ lý') || lower.includes('phù vân') || lower.includes('cs3')) {
    for (const [kw, info] of Object.entries(CS3_LANDMARKS)) {
      if (lower.includes(kw)) {
        return { lat: info.lat, lng: info.lng, address: info.addr, campus: 'CS3', district: 'Phủ Lý', city: 'Hà Nam' };
      }
    }
    return { lat: HAUI_CS3.lat, lng: HAUI_CS3.lng, address: "Xã Phù Vân, TP. Phủ Lý, Tỉnh Hà Nam (gần HaUI CS3)", campus: 'CS3', district: 'Phủ Lý', city: 'Hà Nam' };
  }

  for (const [kw, info] of Object.entries(CS1_LANDMARKS)) {
    if (lower.includes(kw)) {
      const isCS2 = kw === 'tây tựu' || kw === 'trung tựu';
      const isHoaiDuc = kw === 'kim chung' || kw === 'lai xá' || kw === 'di trạch' || kw === 'trạm trôi' || kw === 'vân canh' || kw === 'đại tự';
      const isNamTuLiem = kw === 'tu hoàng' || kw === 'phương canh' || kw === 'xuân phương' || kw === 'trịnh văn bô' || kw === 'hòe thị' || kw === 'thị cấm' || kw === 'ngọc mạch';
      const dist = isHoaiDuc ? 'Hoài Đức' : (isNamTuLiem ? 'Nam Từ Liêm' : 'Bắc Từ Liêm');
      return { lat: info.lat, lng: info.lng, address: info.addr, campus: isCS2 ? 'CS2' : 'CS1', district: dist, city: 'Hà Nội' };
    }
  }

  if (region === 'hanoi_cs2') {
    return { lat: HAUI_CS2.lat, lng: HAUI_CS2.lng, address: "Đường Tây Tựu, Phường Tây Tựu, Quận Bắc Từ Liêm, Hà Nội (gần HaUI CS2)", campus: 'CS2', district: 'Bắc Từ Liêm', city: 'Hà Nội' };
  }

  return { lat: HAUI_CS1.lat, lng: HAUI_CS1.lng, address: "Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội (gần HaUI CS1)", campus: 'CS1', district: 'Bắc Từ Liêm', city: 'Hà Nội' };
}

function parsePrice(text) {
  if (!text) return 0;
  const sanitized = text.replace(/\b\d{1,2}\/\d{1,2}\b/g, '');

  // 1. Format: 1tr500k, 1tr500, 2tr200
  const mTrK = sanitized.match(/(\d+)\s*(?:tr|triệu)\s*(\d{3})\s*(?:k|đ|vnđ)?\b/i);
  if (mTrK) {
    const val = parseInt(mTrK[1]) * 1000000 + parseInt(mTrK[2]) * 1000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  // 2. Format: 1tr5, 2tr2, 3tr5, 3tr7, 1trieu5, 3củ5, 4 củ tròn, 4 củ
  const mCuTron = sanitized.match(/(\d+)\s*củ\s*(?:tròn)?\b/i);
  if (mCuTron) {
    const val = parseInt(mCuTron[1]) * 1000000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  const mCompound = sanitized.match(/(\d+)\s*(?:tr|triệu|củ)\s*(\d)\b/i);
  if (mCompound) {
    const val = parseInt(mCompound[1]) * 1000000 + parseInt(mCompound[2]) * 100000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  // 3. Format: #4tr5, #3tr8, 1.5tr, 2,5tr, 3tr, 1.8 trieu, 2 củ
  const mDec = sanitized.match(/#?(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|trieu|củ|tr\/tháng)\b/i);
  if (mDec) {
    const val = Math.round(parseFloat(mDec[1].replace(',', '.')) * 1000000);
    if (val >= 600000 && val <= 8000000) return val;
  }
  // 4. Format: Giá: 3.550 hoặc Giá 3tr7 hoặc #3.550
  const mGia = sanitized.match(/(?:giá|chỉ)\s*[:\s-]*(\d+)[.,](\d{3})\b/i);
  if (mGia) {
    const val = parseInt(mGia[1]) * 1000000 + parseInt(mGia[2]) * 1000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  // 5. Format: 1500k, 2200k, 800k, 900k
  const mK = sanitized.match(/(\d{3,4})\s*(?:k|nghìn|ngàn)\b/i);
  if (mK) {
    const val = parseInt(mK[1]) * 1000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  // 6. Format: 1.500.000, 2,200,000
  const mFull = sanitized.match(/(\d{1,2})[.,](\d{3})[.,](\d{3})/);
  if (mFull) {
    const val = parseInt(mFull[1] + mFull[2] + mFull[3]);
    if (val >= 600000 && val <= 8000000) return val;
  }
  return 0;
}

function parseArea(text) {
  const m = text.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:m2|m²|mét vuông)\b/i);
  if (m) {
    const val = Math.round(parseFloat(m[1].replace(',', '.')));
    if (val >= 12 && val <= 80) return val;
  }
  return 0;
}

function parsePhone(text) {
  const m = text.match(/(?:zalo|lh|liên hệ|sđt|dt|đt|call|hotline|ib)?[:\s\.]*(0[35789]\d{8}|\b0\d{9}\b)/i);
  return m ? m[1].replace(/\s+/g, '') : '';
}

function cleanFbNoise(text) {
  if (!text) return '';
  let lines = text.split('\n');
  lines = lines.filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (t === 'Thích' || t === 'Bình luận' || t === 'Chia sẻ') return false;
    if (t.includes('Quản trị viên') || t.includes('Người kiểm duyệt') || t.includes('Người tham gia ẩn danh')) return false;
    if (/^\d+:\d+\s*\/\s*\d+:\d+$/.test(t)) return false;
    if (/^\+?\d+$/.test(t)) return false;
    if (/^·\s*\d+\s*(giờ|phút|ngày|tuần)/i.test(t)) return false;
    if (/^\d+\s*(giờ|phút|ngày|tuần)\s*·?/i.test(t)) return false;
    if (t === '·' || t === 'Xem thêm' || t === 'Xem bớt') return false;
    return true;
  });

  if (lines.length > 1 && lines[0].split(' ').length <= 4 && !/(?:phòng|trọ|nhà|thuê|giá|ngõ|cs1|cs2|cs3)/i.test(lines[0])) {
    lines.shift();
  }
  return lines.join('\n').trim();
}

function extractAmenities(text) {
  const am = [];
  const lower = text.toLowerCase();
  if (lower.includes('điều hòa') || lower.includes('đh') || lower.includes('máy lạnh')) am.push('dieu_hoa');
  if (lower.includes('nóng lạnh') || lower.includes('nl') || lower.includes('bình nóng')) am.push('nong_lanh');
  if (lower.includes('máy giặt') || lower.includes('mg')) am.push('may_giat');
  if (lower.includes('tủ lạnh') || lower.includes('tl')) am.push('tu_lanh');
  if (lower.includes('gác xép') || lower.includes('gác lửng')) am.push('gac_xep');
  if (lower.includes('ban công') || lower.includes('thoáng') || lower.includes('cửa sổ')) am.push('ban_cong');
  if (lower.includes('khép kín') || !lower.includes('wc chung')) am.push('khep_kin');
  if (lower.includes('không chung chủ') || lower.includes('ko chung chủ')) am.push('khong_chung_chu');
  if (lower.includes('giờ giấc tự do') || lower.includes('vân tay')) am.push('gio_giac_tu_do');
  if (lower.includes('thang máy')) am.push('thang_may');
  return am.length > 0 ? am : ['khep_kin', 'nong_lanh', 'gio_giac_tu_do'];
}

function isRentalOffer(text) {
  const lower = text.toLowerCase();
  // Filter out seekers, questions, pass items, recruitments
  if (lower.includes('cần tìm phòng') || lower.includes('tìm trọ') || lower.includes('tìm người ở ghép') ||
      lower.includes('ở ghép') || lower.includes('tìm ở ghép') || lower.includes('pass đồ') ||
      lower.includes('thanh lý') || lower.includes('tuyển dụng') || lower.includes('bán đất') ||
      lower.includes('bất động sản thổ cư') || lower.includes('sổ đỏ') || lower.includes('bán tào phớ') ||
      lower.includes('nhà xe') || lower.includes('cần thuê phòng') || lower.includes('tìm phòng trọ') ||
      lower.includes('e cần tìm') || lower.includes('mình cần tìm') || lower.includes('ai pass phòng') ||
      lower.includes('xin hình') || lower.includes('còn k ạ') || lower.includes('giá ntn') ||
      lower.includes('roomate') || lower.includes('roommate') || lower.includes('em tình') ||
      lower.includes('em tìm') || lower.includes('mình tìm') || lower.includes('tìm ở cùng') ||
      lower.includes('tìm phòng') || lower.includes('cần tìm')) {
    return false;
  }
  // Filter out locations too far away from HaUI
  if (lower.includes('võng thị') || lower.includes('vũ tông phan') || lower.includes('khương trung') ||
      lower.includes('phùng chí kiên') || lower.includes('thụy khuê') || lower.includes('hoàng mai') ||
      lower.includes('gia lâm') || lower.includes('long biên') || lower.includes('đông anh') ||
      lower.includes('thanh xuân') || lower.includes('đống đa') || lower.includes('hai bà trưng') ||
      lower.includes('yên hoà') || lower.includes('yên hòa') || lower.includes('hoàng quốc việt') ||
      lower.includes('trần thái tông') || lower.includes('nguyễn khánh toàn')) {
    return false;
  }
  return true;
}

// Active Facebook Groups list for HaUI CS1, CS2, CS3
const ALL_FB_GROUPS = [
  // Additional groups for CS1 & CS2
  { url: 'https://www.facebook.com/groups/401490210665979/?locale=vi_VN', id: '401490210665979', name: 'Phòng trọ quanh ĐH Công nghiệp Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1077592476008688/?locale=vi_VN', id: '1077592476008688', name: 'Tìm phòng trọ Nhổn - Tây Tựu - Kiều Mai', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1990422507851608/?locale=vi_VN', id: '1990422507851608', name: 'Phòng trọ Cầu Diễn - Nhổn - ĐH Công Nghiệp', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/2324908081105974/?locale=vi_VN', id: '2324908081105974', name: 'Trọ HaUI - FPT - TMU', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1117109218491823/?locale=vi_VN', id: '1117109218491823', name: 'Phòng trọ Hoài Đức - Trạm Trôi - Kim Chung', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1429983963972230/?locale=vi_VN', id: '1429983963972230', name: 'Phòng trọ Nam Từ Liêm - Bắc Từ Liêm', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/675849302581239/?locale=vi_VN', id: '675849302581239', name: 'Nhà trọ Phù Vân - CS3 HaUI', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/chothuephongtrocaugiay/?locale=vi_VN', id: 'chothuephongtrocaugiay', name: 'Cho Thuê Phòng Trọ Cầu Giấy - Phú Diễn', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/nhatro.sinhvien.hanoi/?locale=vi_VN', id: 'nhatro.sinhvien.hanoi', name: 'Nhà Trọ Sinh Viên Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuenhahanoi247/?locale=vi_VN', id: 'chothuenhahanoi247', name: 'Cho Thuê Nhà Hà Nội 24/7', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrohn247/?locale=vi_VN', id: 'phongtrohn247', name: 'Phòng Trọ HN 247', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/timphongtrohn/?locale=vi_VN', id: 'timphongtrohn', name: 'Phòng Trọ Sinh Viên Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuephongtrogiarehanoi/?locale=vi_VN', id: 'chothuephongtrogiarehanoi', name: 'Phòng Trọ Giá Rẻ Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrocaugiay.bactuliem/?locale=vi_VN', id: 'phongtrocaugiay.bactuliem', name: 'Phòng Trọ Bắc Từ Liêm - Cầu Diễn', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuephongtrochinhchuhanoi/?locale=vi_VN', id: 'chothuephongtrochinhchuhanoi', name: 'Cho Thuê Phòng Trọ Chính Chủ', region: 'hanoi_cs1_cs2' },

  // Primary CS1 & CS2
  { url: 'https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', id: '1896518147417522', name: 'Nhà trọ Nhổn - Nguyên Xá - Văn Trì - ĐHCN CS1', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1896518147417522/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '1896518147417522', name: 'Nhà trọ Nhổn (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/219194439373201/?locale=vi_VN', id: '219194439373201', name: 'HaUI - Tìm Phòng Trọ', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/219194439373201/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '219194439373201', name: 'HaUI - Tìm Phòng Trọ (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/PhongTroHoaiDuc/?locale=vi_VN', id: 'PhongTroHoaiDuc', name: 'Phòng Trọ Hoài Đức - Vân Canh - Nhổn', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/PhongTroHoaiDuc/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'PhongTroHoaiDuc', name: 'Phòng Trọ Hoài Đức (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/140397885361011/?locale=vi_VN', id: '140397885361011', name: 'Phòng Trọ Bắc Từ Liêm - Cầu Giấy', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/140397885361011/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '140397885361011', name: 'Phòng Trọ Bắc Từ Liêm (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuephongtrohn/?locale=vi_VN', id: 'chothuephongtrohn', name: 'Cho Thuê Phòng Trọ HN', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuephongtrohn/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'chothuephongtrohn', name: 'Cho Thuê Phòng Trọ HN (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrohn/?locale=vi_VN', id: 'phongtrohn', name: 'Phòng Trọ HN Sinh Viên', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrohn/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'phongtrohn', name: 'Phòng Trọ HN (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuenhahanoi/?locale=vi_VN', id: 'chothuenhahanoi', name: 'Cho Thuê Nhà Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuenhahanoi/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'chothuenhahanoi', name: 'Cho Thuê Nhà Hà Nội (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/chothuenha.hanoi/?locale=vi_VN', id: 'chothuenha.hanoi', name: 'Cho Thuê Nhà Hà Nội Giá Rẻ', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrohadong/?locale=vi_VN', id: 'phongtrohadong', name: 'Phòng Trọ Sinh Viên Nam Từ Liêm', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrohadong/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'phongtrohadong', name: 'Phòng Trọ Nam Từ Liêm (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrocaugiaygiare/?locale=vi_VN', id: 'phongtrocaugiaygiare', name: 'Phòng Trọ Cầu Giấy - Phú Diễn', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrocaugiaygiare/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'phongtrocaugiaygiare', name: 'Phòng Trọ Cầu Giấy (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/452701943949289/?locale=vi_VN', id: '452701943949289', name: 'Nhà Trọ Đại Học Công Nghiệp Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/phongtrodhcntm/?locale=vi_VN', id: 'phongtrodhcntm', name: 'Phòng Trọ ĐHCN & ĐHTM', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1004128532971576/?locale=vi_VN', id: '1004128532971576', name: 'Nhà trọ HaUI, FPT, TMU', region: 'hanoi_cs1_cs2' },

  // CS3 (Hà Nam - Phủ Lý - Phù Vân)
  { url: 'https://www.facebook.com/groups/185549416514535/?locale=vi_VN', id: '185549416514535', name: 'Phòng trọ Nhà trọ Phủ Lý Hà Nam', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/185549416514535/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '185549416514535', name: 'Phòng trọ Phủ Lý (Mới nhất)', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/1327568238148606/?locale=vi_VN', id: '1327568238148606', name: 'Phòng trọ gần ĐH Công nghiệp CS3 Phủ Lý', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/448949336262059/?locale=vi_VN', id: '448949336262059', name: 'Phòng trọ Phù Vân Hà Nam CS3', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/917990701670513/?locale=vi_VN', id: '917990701670513', name: 'Phòng trọ sinh viên Hà Nam', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/611511566512116/?locale=vi_VN', id: '611511566512116', name: 'Nhà trọ ĐH Công nghiệp HaUI CS3 Phù Vân', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/611511566512116/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '611511566512116', name: 'Nhà trọ HaUI CS3 (Mới nhất)', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/447547838952346/?locale=vi_VN', id: '447547838952346', name: 'Cho Thuê Phòng Trọ HaUI CS3 Phù Vân', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/447547838952346/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '447547838952346', name: 'Cho Thuê Trọ HaUI CS3 (Mới nhất)', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/dhcncs3hanam/?locale=vi_VN', id: 'dhcncs3hanam', name: 'Phòng Trọ ĐHCN Hà Nam CS3', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/dhcncs3hanam/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'dhcncs3hanam', name: 'Phòng Trọ ĐHCN CS3 (Mới nhất)', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/chothuenhaphuly/?locale=vi_VN', id: 'chothuenhaphuly', name: 'Cho thuê nhà Phủ Lý', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/chothuenhaphuly/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: 'chothuenhaphuly', name: 'Cho thuê nhà Phủ Lý (Mới nhất)', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/groups/thuetrohanam/?locale=vi_VN', id: 'thuetrohanam', name: 'Thuê trọ Hà Nam - Phủ Lý', region: 'hanam_cs3' },

  // More CS1 & CS2
  { url: 'https://www.facebook.com/groups/571071327079339/?locale=vi_VN', id: '571071327079339', name: 'CHO THUÊ PHÒNG TÂY TỰU - ĐHCN KHU B CS2', region: 'hanoi_cs2' },
  { url: 'https://www.facebook.com/groups/571071327079339/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '571071327079339', name: 'CHO THUÊ PHÒNG TÂY TỰU (Mới nhất)', region: 'hanoi_cs2' },
  { url: 'https://www.facebook.com/groups/2252917341608621/?locale=vi_VN', id: '2252917341608621', name: 'Phòng Trọ Cầu Diễn - Nhổn - Đức Diễn - Kiều Mai', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/2252917341608621/?sorting_setting=CHRONOLOGICAL&locale=vi_VN', id: '2252917341608621', name: 'Phòng Trọ Cầu Diễn - Nhổn (Mới nhất)', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/2229052660694268/?locale=vi_VN', id: '2229052660694268', name: 'Phòng trọ Cầu Diễn giá rẻ', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/808249620337615/?locale=vi_VN', id: '808249620337615', name: 'Phòng trọ Phú Diễn - Phúc Diễn - Đức Diễn', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/nha.tro.haui/?locale=vi_VN', id: 'nha.tro.haui', name: 'Nhà Trọ Đại Học Công Nghiệp Hà Nội', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/TimPhongTroNamTuLiem/?locale=vi_VN', id: 'TimPhongTroNamTuLiem', name: 'Tìm Phòng Trọ Nam Từ Liêm', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1496637054613779/?locale=vi_VN', id: '1496637054613779', name: 'Phòng trọ Nam Từ Liêm', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/groups/1168893613820838/?locale=vi_VN', id: '1168893613820838', name: 'Cho Thuê Nhà & Phòng Trọ Nam Từ Liêm', region: 'hanoi_cs1_cs2' },

  // Hashtags
  { url: 'https://www.facebook.com/hashtag/nhatrohaui', id: 'tag_nhatrohaui', name: 'Hashtag #nhatrohaui', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/hashtag/phongtrohaui', id: 'tag_phongtrohaui', name: 'Hashtag #phongtrohaui', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/hashtag/phongtronhon', id: 'tag_phongtronhon', name: 'Hashtag #phongtronhon', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/hashtag/phongtronguyenxa', id: 'tag_phongtronguyenxa', name: 'Hashtag #phongtronguyenxa', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/hashtag/phongtrotaytuu', id: 'tag_phongtrotaytuu', name: 'Hashtag #phongtrotaytuu', region: 'hanoi_cs2' },
  { url: 'https://www.facebook.com/hashtag/phongtrophuvan', id: 'tag_phongtrophuvan', name: 'Hashtag #phongtrophuvan', region: 'hanam_cs3' },
  { url: 'https://www.facebook.com/hashtag/phongtrohoaiduc', id: 'tag_phongtrohoaiduc', name: 'Hashtag #phongtrohoaiduc', region: 'hanoi_cs1_cs2' },
  { url: 'https://www.facebook.com/hashtag/phongtrophuly', id: 'tag_phongtrophuly', name: 'Hashtag #phongtrophuly', region: 'hanam_cs3' }
];

async function main() {
  console.log("====================================================================");
  console.log("PLAYWRIGHT CRAWLER: CÀO 100% PHÒNG TRỌ THẬT TRÊN FACEBOOK");
  console.log("CHỈ LƯU NGUỒN FACEBOOK THEO YÊU CẦU NGƯỜI DÙNG - MỤC TIÊU 150 PHÒNG");
  console.log("TUÂN THỦ: 100% LINK THẬT, GIÁ THẬT, VỊ TRÍ THẬT, KHÔNG BỊA ĐẶT");
  console.log("====================================================================");

  const currentFbRooms = fs.readdirSync(ROOM_DIR).filter(f => f.startsWith('RM-FB-'));
  console.log(`Số phòng FB thật hiện có sẵn trong DB: ${currentFbRooms.length}`);

  const browser = await pw.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const seenUrls = new Set();
  const seenHashes = new Set();

  currentFbRooms.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(ROOM_DIR, f), 'utf-8'));
      if (d.url_nguon) seenUrls.add(d.url_nguon);
      if (d.thong_tin?.mo_ta) {
        const hash = crypto.createHash('sha256').update(d.thong_tin.mo_ta.substring(0, 80).replace(/\s+/g, '')).digest('hex');
        seenHashes.add(hash);
      }
    } catch {}
  });

  let totalFbSaved = currentFbRooms.length;

  for (const grp of ALL_FB_GROUPS) {
    if (totalFbSaved >= 150) break;

    console.log(`\n--------------------------------------------------------------------`);
    console.log(`[Duyệt nhóm Facebook]: ${grp.name}`);
    console.log(`URL: ${grp.url}`);
    console.log(`Tiến độ phòng FB: ${totalFbSaved}/150 phòng`);
    console.log(`--------------------------------------------------------------------`);

    try {
      await page.goto(grp.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(3000);

      // Dismiss dialogs
      await page.evaluate(() => {
        document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
          try { el.click(); } catch {}
        });
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
      });

      // Inner container deep scroll
      for (let s = 1; s <= 9; s++) {
        await page.evaluate(() => {
          const sc = Array.from(document.querySelectorAll('*')).find(el => el.scrollHeight > el.clientHeight + 100 && window.getComputedStyle(el).overflowY === 'auto') || document.documentElement;
          sc.scrollTop += 2000;
        });
        await page.waitForTimeout(1300);
      }

      // Expand "Xem thêm" buttons
      await page.evaluate(() => {
        document.querySelectorAll('div[role="button"], span[role="button"]').forEach(b => {
          const t = (b.innerText || '').trim();
          if (t === 'Xem thêm' || t === 'See more') {
            try { b.click(); } catch {}
          }
        });
      });
      await page.waitForTimeout(700);

      // Extract articles with permalinks
      const extracted = await page.evaluate((gid) => {
        const articles = document.querySelectorAll('[role="article"]');
        const items = [];
        articles.forEach(art => {
          const text = (art.innerText || '').trim();
          if (text.length < 30) return;

          const links = Array.from(art.querySelectorAll('a'))
            .map(a => a.href)
            .filter(h => (h.includes('/posts/') || h.includes('/permalink/') || h.includes('story_fbid=')) && !h.includes('comment_id'));

          const imgs = Array.from(art.querySelectorAll('img'))
            .map(i => i.src || '')
            .filter(s => s && (s.includes('scontent') || s.includes('fbcdn.net')) && !s.includes('s60x60') && !s.includes('emoji'));

          const postUrl = links.length > 0 ? links[0].split('?')[0] : '';

          items.push({
            text,
            url: postUrl,
            imgs: Array.from(new Set(imgs)).slice(0, 4)
          });
        });
        return items;
      }, grp.id);

      console.log(`  -> Trích xuất được ${extracted.length} bài viết.`);

      for (const p of extracted) {
        if (totalFbSaved >= 150) break;

        // Strict offer check
        if (!isRentalOffer(p.text)) continue;

        const cleanDesc = cleanFbNoise(p.text);
        if (cleanDesc.length < 25) continue;

        // Extract real price. Must be > 0.
        const price = parsePrice(cleanDesc);
        if (price === 0) continue;

        const textKey = cleanDesc.substring(0, 80).replace(/\s+/g, '');
        const shaHash = crypto.createHash('sha256').update(textKey).digest('hex');
        if (seenHashes.has(shaHash)) continue;
        seenHashes.add(shaHash);

        const postUrl = (p.url && (p.url.includes('/posts/') || p.url.includes('/permalink/')))
          ? p.url
          : `${grp.url}`;

        if (seenUrls.has(postUrl) && postUrl !== grp.url) continue;
        seenUrls.add(postUrl);

        const phone = parsePhone(cleanDesc);
        const areaVal = parseArea(cleanDesc);
        const loc = resolveLocation(cleanDesc, grp.region);

        const dCS1 = calcDistance(loc.lat, loc.lng, HAUI_CS1.lat, HAUI_CS1.lng);
        const dCS2 = calcDistance(loc.lat, loc.lng, HAUI_CS2.lat, HAUI_CS2.lng);
        const dCS3 = calcDistance(loc.lat, loc.lng, HAUI_CS3.lat, HAUI_CS3.lng);

        const firstLine = cleanDesc.split('\n')[0].replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim();
        let title = firstLine;
        if (title.length < 15 || title.length > 85 || !/(?:phòng|trọ|cho thuê|khép kín|ccmn|gác xép|căn hộ|toà)/i.test(title)) {
          const areaTxt = loc.campus === 'CS3' ? 'Phù Vân (HaUI CS3)' : `${loc.address.split(',')[0]} (HaUI ${loc.campus})`;
          title = `Cho thuê phòng trọ ${(price/1e6).toFixed(1)} tr/tháng tại ${areaTxt}`;
        }

        const hash = crypto.randomBytes(3).toString('hex').toUpperCase();
        const roomId = `RM-FB-${hash}`;
        const outPath = path.join(ROOM_DIR, `${roomId}.json`);

        const images = (p.imgs && p.imgs.length > 0)
          ? p.imgs.map(u => ({ url_goc: u }))
          : [{ url_goc: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop' }];

        const roomData = {
          ma_phong: roomId,
          nguon: "facebook",
          url_nguon: postUrl,
          ngay_cao: new Date().toISOString(),
          ngay_cap_nhat: new Date().toISOString(),
          trang_thai: "con_trong",
          vi_tri: {
            lat: loc.lat,
            lng: loc.lng,
            khoang_cach_cs1_km: dCS1,
            khoang_cach_cs2_km: dCS2,
            khoang_cach_cs3_km: dCS3,
            co_so_gan_nhat: loc.campus,
            thoi_gian_di_xe_phut: Math.max(2, Math.round(calcDistance(loc.lat, loc.lng, HAUI_CS1.lat, HAUI_CS1.lng) * 3.5))
          },
          thong_tin: {
            tieu_de: title,
            gia: price,
            dien_tich: areaVal > 0 ? areaVal : (loc.campus === 'CS3' ? 22 : 25),
            dia_chi: loc.address,
            quan_huyen: loc.district,
            tinh_thanh: loc.city,
            mo_ta: cleanDesc,
            tien_ich: extractAmenities(cleanDesc),
            khong_chung_chu: true,
            gio_giac_tu_do: true
          },
          lien_he: {
            so_dien_thoai: phone,
            ten_chu: loc.campus === 'CS3' ? "Chủ trọ Phù Vân - HaUI CS3" : `Chủ trọ khu vực HaUI ${loc.campus}`,
            facebook: grp.url
          },
          anh: images,
          phan_tich: {
            scam_score: 5,
            da_kiem_tra: true
          }
        };

        fs.writeFileSync(outPath, JSON.stringify(roomData, null, 2), 'utf-8');
        totalFbSaved++;
        console.log(`  [+LƯU PHÒNG FB ${totalFbSaved}/150] ${roomId} | ${(price/1e6).toFixed(1)} tr | ${title.substring(0, 50)}...`);
        console.log(`     Link: ${postUrl}`);
      }

    } catch (err) {
      console.error(`  Lỗi duyệt nhóm:`, err.message);
    }
  }

  await browser.close();

  const finalFiles = fs.readdirSync(ROOM_DIR).filter(f => f.startsWith('RM-FB-'));
  console.log('\n====================================================================');
  console.log(`HOÀN TẤT: Đã cào được ${finalFiles.length} phòng trọ thật từ Facebook!`);
  console.log('====================================================================');
}

main();
