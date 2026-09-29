import fs from 'fs';
import path from 'path';

const roomDir = path.resolve('alldata/room');
const photosDir = path.resolve('alldata/room/photos');
const files = fs.readdirSync(roomDir).filter(f => f.endsWith('.json'));

let validRooms = [];
let invalidPhotoRooms = [];
let pt123Rooms = [];

for (const f of files) {
  const p = path.join(roomDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const roomId = data.ma_phong;
  const src = data.nguon;

  if (src === 'phongtro123') {
    pt123Rooms.push(roomId);
    continue;
  }

  // Facebook room
  const imgs = (data.anh || []).map(a => typeof a === 'string' ? a : a.url_goc).filter(Boolean);
  
  // Check if photos belong to this room
  let hasOwnPhoto = false;
  let hasBorrowedPhoto = false;

  for (const img of imgs) {
    if (img.startsWith('/photos/')) {
      const base = path.basename(img);
      if (base.startsWith(roomId)) {
        const fullLocalPath = path.join(photosDir, base);
        if (fs.existsSync(fullLocalPath) && fs.statSync(fullLocalPath).size > 2000) {
          hasOwnPhoto = true;
        }
      } else {
        hasBorrowedPhoto = true;
      }
    }
  }

  if (hasBorrowedPhoto || !hasOwnPhoto) {
    invalidPhotoRooms.push({
      id: roomId,
      file: f,
      url: data.url_nguon,
      title: data.thong_tin?.tieu_de,
      imgs
    });
  } else {
    validRooms.push({
      id: roomId,
      file: f,
      url: data.url_nguon,
      title: data.thong_tin?.tieu_de,
      imgs
    });
  }
}

console.log({
  totalRooms: files.length,
  pt123Rooms: pt123Rooms.length,
  validFbRoomsWithOwnPhotos: validRooms.length,
  invalidFbRoomsWithBorrowedOrMissingPhotos: invalidPhotoRooms.length
});

console.log('\nSample 10 valid FB rooms:');
validRooms.slice(0, 10).forEach(r => console.log(`  [OK] ${r.id}: ${r.title?.slice(0, 40)} | photos: ${r.imgs.length}`));

console.log('\nSample 10 invalid FB rooms:');
invalidPhotoRooms.slice(0, 10).forEach(r => console.log(`  [FAIL] ${r.id}: ${r.title?.slice(0, 40)} | borrowed: ${r.imgs}`));
