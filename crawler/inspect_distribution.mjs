import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let cs1Count = 0;
let cs2Count = 0;
let cs3Count = 0;
let fbCount = 0;

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  const cs = d.vi_tri?.co_so_gan_nhat || 'CS1';
  if (cs === 'CS1') cs1Count++;
  else if (cs === 'CS2') cs2Count++;
  else if (cs === 'CS3') cs3Count++;
  if (d.nguon === 'facebook') fbCount++;
});

console.log(`Total authentic rooms: ${files.length}`);
console.log(`CS1 (Nhổn / Cầu Diễn / Minh Khai): ${cs1Count}`);
console.log(`CS2 (Tây Tựu / Bắc Từ Liêm): ${cs2Count}`);
console.log(`CS3 (Phù Vân / Phủ Lý Hà Nam): ${cs3Count}`);
console.log(`Facebook source: ${fbCount}`);
