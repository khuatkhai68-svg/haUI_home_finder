import fs from 'fs';
import path from 'path';

const photosDir = path.resolve('alldata/room/photos');
const files = fs.readdirSync(photosDir);
console.log(`Total photos in alldata/room/photos: ${files.length}`);

// Group by room ID
const roomPhotos = {};
files.forEach(f => {
  const m = f.match(/^(RM-[A-Z0-9]+-[A-Z0-9]+)/);
  if (m) {
    const id = m[1];
    roomPhotos[id] = (roomPhotos[id] || 0) + 1;
  }
});

console.log(`Unique rooms with dedicated photos: ${Object.keys(roomPhotos).length}`);
console.log('Sample rooms with own photos:', Object.entries(roomPhotos).slice(0, 20));
