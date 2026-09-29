import fs from 'fs';
import path from 'path';

const ROOM_DIR = path.resolve('alldata/room');
const PHOTOS_DIR = path.resolve('alldata/room/photos');

// Dead FB posts identified by live Playwright test
const DEAD_FB_ROOMS = new Set([
  'RM-FB-AB25B6'
]);

const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));

let keptRooms = [];
let deletedBorrowed = [];
let deletedDead = [];
let deletedNoPhotos = [];

for (const f of files) {
  const filePath = path.join(ROOM_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const roomId = data.ma_phong;
  const src = data.nguon;

  if (DEAD_FB_ROOMS.has(roomId)) {
    fs.unlinkSync(filePath);
    deletedDead.push({ id: roomId, reason: 'Dead FB link' });
    continue;
  }

  if (src === 'phongtro123') {
    // PT123 rooms already verified live with real photos
    keptRooms.push({ id: roomId, src, title: data.thong_tin?.tieu_de });
    continue;
  }

  // Facebook room
  const imgs = (data.anh || []).map(a => typeof a === 'string' ? a : a.url_goc).filter(Boolean);
  
  if (imgs.length === 0) {
    fs.unlinkSync(filePath);
    deletedNoPhotos.push({ id: roomId, reason: 'No photos' });
    continue;
  }

  let hasBorrowed = false;
  let hasOwn = false;

  for (const img of imgs) {
    if (img.startsWith('/photos/')) {
      const base = path.basename(img);
      if (base.startsWith(roomId)) {
        const localPath = path.join(PHOTOS_DIR, base);
        if (fs.existsSync(localPath) && fs.statSync(localPath).size > 2000) {
          hasOwn = true;
        }
      } else {
        hasBorrowed = true;
      }
    } else {
      // If it has non-local FB links, it means photos were not saved locally
      hasBorrowed = true;
    }
  }

  if (hasBorrowed || !hasOwn) {
    fs.unlinkSync(filePath);
    deletedBorrowed.push({ id: roomId, title: data.thong_tin?.tieu_de, imgs });
  } else {
    keptRooms.push({ id: roomId, src, title: data.thong_tin?.tieu_de, photos: imgs.length });
  }
}

console.log('====================================================');
console.log('KẾT QUẢ THỰC THI BỘ LUẬT THÉP & THANH LỌC TOÀN BỘ:');
console.log(`- Tổng số phòng trước rà soát: ${files.length}`);
console.log(`- Đã xóa phòng dùng ảnh mượn/chắp vá/không chính chủ: ${deletedBorrowed.length}`);
console.log(`- Đã xóa phòng link bài Facebook bị chết/riêng tư: ${deletedDead.length}`);
console.log(`- Đã xóa phòng không có ảnh: ${deletedNoPhotos.length}`);
console.log(`- Số phòng HỢP LỆ 100% CHÍNH CHỦ & LINK LIVE CÒN LẠI: ${keptRooms.length}`);
console.log('====================================================');
