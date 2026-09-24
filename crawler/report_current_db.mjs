import fs from 'fs';
import path from 'path';

const ROOM_DIR = 'd:/project/15_webreal/alldata/room';
const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));

let cs12Count = 0;
let cs3Count = 0;
let pt123Count = 0;
let fbCount = 0;

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(ROOM_DIR, f), 'utf-8'));
    if (data.nguon === 'facebook') fbCount++;
    else pt123Count++;

    if (data.vi_tri?.co_so_gan_nhat === 'CS3' || (data.thong_tin?.tinh_thanh && data.thong_tin.tinh_thanh.includes('Hà Nam'))) {
      cs3Count++;
    } else {
      cs12Count++;
    }
  } catch (e) {}
}

console.log('--- DATABASE REPORT ---');
console.log('Total valid room JSONs:', files.length);
console.log('CS1 & CS2 (Hà Nội):', cs12Count);
console.log('CS3 (Hà Nam):', cs3Count);
console.log('Nguồn phongtro123:', pt123Count);
console.log('Nguồn Facebook:', fbCount);
