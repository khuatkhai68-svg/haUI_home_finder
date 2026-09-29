import fs from 'fs';
import path from 'path';

const roomDir = 'alldata/room';
const files = fs.readdirSync(roomDir).filter(f => f.endsWith('.json'));

let crossRoomPhotoCount = 0;
let crossRooms = [];

for (const f of files) {
  const p = path.join(roomDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const roomId = data.ma_phong;
  const imgs = (data.anh || []).map(a => typeof a === 'string' ? a : a.url_goc).filter(Boolean);

  let hasCross = false;
  for (const img of imgs) {
    if (img.startsWith('/photos/')) {
      // check if it matches roomId
      const base = path.basename(img);
      if (!base.startsWith(roomId)) {
        hasCross = true;
        break;
      }
    }
  }

  if (hasCross) {
    crossRoomPhotoCount++;
    crossRooms.push({ id: roomId, file: f, imgs });
  }
}

console.log(`Total rooms: ${files.length}`);
console.log(`Rooms with mismatched/cross photos: ${crossRoomPhotoCount}`);
console.log('First 15 cross-photo rooms:');
crossRooms.slice(0, 15).forEach(r => {
  console.log(`- ${r.id}:`, r.imgs);
});
