import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.startsWith('RM-FB-'));
console.log(`Total RM-FB files: ${files.length}`);

let adCount = 0;
let roomCount = 0;

files.forEach((f, i) => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  const title = d.thong_tin?.tieu_de || '';
  const desc = d.thong_tin?.mo_ta || '';
  const price = d.thong_tin?.gia;
  const cs = d.vi_tri?.co_so_gan_nhat;
  console.log(`${i + 1}. [${d.ma_phong}] [${(price/1e6).toFixed(1)}tr] [${cs}] ${title.substring(0, 70)}`);
});
