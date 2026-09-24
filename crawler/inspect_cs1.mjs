import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.startsWith('RM-CS1-'));
console.log('Total RM-CS1 files:', files.length);

files.slice(0, 10).forEach(f => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  console.log(`[${f}] ${d.thong_tin?.tieu_de}`);
  console.log(`  Addr: ${d.thong_tin?.dia_chi}`);
  console.log(`  Price: ${(d.thong_tin?.gia/1e6).toFixed(1)} tr | Area: ${d.thong_tin?.dien_tich}m2`);
  console.log(`  Link: ${d.url_nguon}`);
});
