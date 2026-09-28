import fs from 'fs';
import path from 'path';

const ROOM_DIR = path.resolve('alldata/room');
const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));

console.log(`Total room JSON files: ${files.length}`);

let fbWithPt123Img = [];
let missingPhoneWithNumberInDesc = [];
let truncatedDesc = [];
let localPhotoRooms = [];
let fbcdnRooms = [];
let pt123Rooms = [];

const phoneRegex = /(?:0|\+84)(?:\s*\.?\d){9,10}/g;

for (const file of files) {
  const filePath = path.join(ROOM_DIR, file);
  const room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const id = room.ma_phong || file.replace('.json', '');
  const nguon = room.nguon;
  const desc = room.thong_tin?.mo_ta || '';
  const phone = room.lien_he?.so_dien_thoai || '';
  const imgs = (room.anh || []).map(a => typeof a === 'string' ? a : a.url_goc);

  // Check 1: nguon is facebook but has static123 / pt123 images
  if (nguon === 'facebook') {
    const hasPt123 = imgs.some(u => u && (u.includes('static123') || u.includes('phongtro123')));
    if (hasPt123) {
      fbWithPt123Img.push({ id, file, title: room.thong_tin?.tieu_de });
    }
    const hasLocal = imgs.some(u => u && u.startsWith('/photos/'));
    if (hasLocal) localPhotoRooms.push(id);
    const hasFbcdn = imgs.some(u => u && u.includes('fbcdn.net'));
    if (hasFbcdn) fbcdnRooms.push(id);
  } else {
    pt123Rooms.push(id);
  }

  // Check 2: Phone is generic but desc has a valid phone number
  if (!phone || phone.includes('Liên hệ') || phone === '0987654321' || phone === '0901234567') {
    const matches = desc.match(phoneRegex);
    if (matches && matches.length > 0) {
      missingPhoneWithNumberInDesc.push({ id, currentPhone: phone, detectedPhone: matches[0], descSnippet: desc.substring(0, 100) });
    }
  }

  // Check 3: Truncated desc with Facebook artifacts
  if (desc.includes('Xem thêm') || desc.includes('Thích Bình luận Chia sẻ') || desc.includes('Tác giả ib')) {
    truncatedDesc.push(id);
  }
}

console.log(`\n=== KẾT QUẢ RÀ SOÁT HỆ THỐNG ===`);
console.log(`1. Phòng Facebook nhưng dính ảnh phongtro123/static123: ${fbWithPt123Img.length}`);
console.log(`2. Phòng có SĐT trong mô tả nhưng chưa được bóc tách: ${missingPhoneWithNumberInDesc.length}`);
console.log(`3. Phòng có mô tả dính rác Facebook ('Xem thêm', 'Thích Bình luận'): ${truncatedDesc.length}`);
console.log(`4. Phòng Facebook đã có ảnh local: ${localPhotoRooms.length}`);
console.log(`5. Phòng Facebook đang dùng link fbcdn.net trực tiếp: ${fbcdnRooms.length}`);
console.log(`6. Phòng nguồn phongtro123: ${pt123Rooms.length}`);

fs.writeFileSync('botdata/audit_report.json', JSON.stringify({
  fbWithPt123Img,
  missingPhoneWithNumberInDesc,
  truncatedDesc,
  summary: {
    total: files.length,
    fbWithPt123ImgCount: fbWithPt123Img.length,
    missingPhoneCount: missingPhoneWithNumberInDesc.length,
    truncatedDescCount: truncatedDesc.length
  }
}, null, 2), 'utf-8');
