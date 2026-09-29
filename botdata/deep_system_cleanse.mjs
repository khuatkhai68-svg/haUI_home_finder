import fs from 'fs';
import path from 'path';

const ROOM_DIR = path.resolve('alldata/room');
const PHOTOS_DIR = path.resolve('alldata/room/photos');

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));
console.log(`Bắt đầu tổng rà soát và thanh lọc toàn diện ${files.length} phòng trọ...`);

// 1. Danh sách mẫu nhận diện bài tìm phòng / tìm người ở ghép / pass đồ
const SEEKING_SPAM_PATTERNS = [
  /\b(?:cần tìm|mình tìm|em tìm|tôi tìm|chúng mình tìm|hỏi phòng|còn phòng nào|tìm phòng)\b/i,
  /\b(?:tìm bạn|tìm nữ|tìm nam|tìm người)\s+ở\s+ghép\b/i,
  /\b(?:ở ghép|nhượng lại|pass lại|pass phòng|pass đồ|thanh lý đồ)\b/i,
  /\b(?:có phòng nào|xin hình ảnh và giá|ai còn phòng|ai có phòng)\b/i,
  /\b(?:tìm trọ|cần trọ)\b/i
];

// 2. Hàm làm sạch mô tả khỏi rác Facebook
function cleanFacebookGarbage(text) {
  if (!text) return '';
  return text
    .replace(/(?:Thích|Bình luận|Chia sẻ|Xem thêm|Gửi tin nhắn|\bcdot\b|\bhours ago\b|\btrước\b)/gi, ' ')
    .replace(/\b\d+\s+(?:giờ|ngày|tuần|phút)\s+trước\s+\d+\s+(?:giờ|ngày|tuần|phút)?\s*·?/gi, ' ')
    .replace(/Tác giả\s+ib\s+\d+\s+phút/gi, ' ')
    .replace(/[^\p{L}\p{N}\s.,\-–/()]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 3. Tải ảnh với kiểm tra dung lượng hợp lệ (> 3KB)
async function downloadPhoto(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    if (!res.ok) return false;
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (buffer.length < 3500) return false;
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    return false;
  }
}

// BỘ LUẬT THÉP: TUYỆT ĐỐI KHÔNG DÙNG ẢNH MƯỢN / FALLBACK GIỮA CÁC PHÒNG.
// MỖI PHÒNG BẮT BUỘC PHẢI CÓ ẢNH THẬT RIÊNG CỦA CHÍNH NÓ (MÃ PHÒNG TRÙNG KHỚP).


let deletedCount = 0;
let cleanedTextCount = 0;
let downloadedPhotosCount = 0;
let roomsWithLocalPhotos = 0;
let fbFallbackAdjusted = 0;

for (const file of files) {
  const filePath = path.join(ROOM_DIR, file);
  if (!fs.existsSync(filePath)) continue;

  const room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const roomId = room.ma_phong || file.replace('.json', '');
  const title = room.thong_tin?.tieu_de || '';
  let desc = room.thong_tin?.mo_ta || '';
  const fullText = title + ' ' + desc;

  // BƯỚC 1: XÓA TRIỆT ĐỂ BÀI TÌM PHÒNG / Ở GHÉP / SPAM
  const isSeeking = SEEKING_SPAM_PATTERNS.some(pat => pat.test(title)) ||
                    (SEEKING_SPAM_PATTERNS.some(pat => pat.test(desc)) && !/(?:cho thuê|còn phòng|trống phòng)/i.test(fullText));

  if (isSeeking) {
    console.log(`🗑️ [XÓA TIN TÌM PHÒNG]: ${roomId} - "${title}"`);
    fs.unlinkSync(filePath);
    deletedCount++;
    continue;
  }

  // BƯỚC 2: LÀM SẠCH VĂN BẢN RÁC FACEBOOK TRONG MÔ TẢ
  const cleanedDesc = cleanFacebookGarbage(desc);
  if (cleanedDesc !== desc) {
    room.thong_tin.mo_ta = cleanedDesc;
    cleanedTextCount++;
  }

  // BƯỚC 3: XỬ LÝ ẢNH BÀI ĐĂNG
  if (room.nguon === 'facebook') {
    let images = (room.anh || []).map(a => typeof a === 'string' ? a : a.url_goc);
    const newAnh = [];
    let hasLocal = false;

    for (let i = 0; i < images.length; i++) {
      const u = images[i];
      if (!u) continue;

      // Đã là ảnh local
      if (u.startsWith('/photos/')) {
        newAnh.push({ url_goc: u, mo_ta: "Ảnh thực tế bài đăng FB" });
        hasLocal = true;
        continue;
      }

      // Nếu là link fbcdn.net, thử tải về
      if (u.includes('fbcdn.net') || u.includes('scontent')) {
        const destName = `${roomId}_photo_${i + 1}.jpg`;
        const destPath = path.join(PHOTOS_DIR, destName);

        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 3500) {
          newAnh.push({ url_goc: `/photos/${destName}`, mo_ta: "Ảnh thực tế bài đăng FB" });
          hasLocal = true;
        } else {
          const ok = await downloadPhoto(u, destPath);
          if (ok) {
            downloadedPhotosCount++;
            newAnh.push({ url_goc: `/photos/${destName}`, mo_ta: "Ảnh thực tế bài đăng FB" });
            hasLocal = true;
          }
        }
      }
    }

    // Nếu bài FB này không có ảnh nào tải được hoặc ảnh bị lỗi
    if (newAnh.length === 0) {
      console.log(`🗑️ [XÓA PHÒNG KHÔNG ẢNH THẬT]: ${roomId} - "${title}"`);
      fs.unlinkSync(filePath);
      deletedCount++;
      continue;
    }

    room.anh = newAnh;
    roomsWithLocalPhotos++;
  }

  // Lưu file JSON đã làm sạch
  fs.writeFileSync(filePath, JSON.stringify(room, null, 2), 'utf-8');
}

console.log(`\n==============================================`);
console.log(`✅ KẾT QUẢ TỔNG THANH LỌC TOÀN HỆ THỐNG:`);
console.log(`- Đã xóa bài tìm phòng / tin rác: ${deletedCount}`);
console.log(`- Đã làm sạch văn bản mô tả: ${cleanedTextCount} bài`);
console.log(`- Đã tải thêm ảnh FB về local: ${downloadedPhotosCount} ảnh`);
console.log(`- Tổng số phòng Facebook có ảnh local sạch: ${roomsWithLocalPhotos}`);
console.log(`- Số phòng Facebook được chuẩn hóa ảnh phòng sạch (0 watermark): ${fbFallbackAdjusted}`);
console.log(`- Tổng số phòng còn lại trong cơ sở dữ liệu: ${files.length - deletedCount}`);
console.log(`==============================================`);
