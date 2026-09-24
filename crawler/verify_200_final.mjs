import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Total rooms in database: ${files.length}`);

const bySource = {};
const byCS = { CS1: 0, CS2: 0, CS3: 0 };
let liveCount = 0;
let validPriceCount = 0;

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  const src = d.nguon || 'other';
  bySource[src] = (bySource[src] || 0) + 1;
  const cs = d.vi_tri?.co_so_gan_nhat || 'CS1';
  byCS[cs] = (byCS[cs] || 0) + 1;
  if (d.url_nguon && d.url_nguon.startsWith('http') && !d.url_nguon.includes('posts/179007299')) {
    liveCount++;
  }
  if (d.thong_tin?.gia >= 700000 && d.thong_tin?.gia <= 6000000) {
    validPriceCount++;
  }
});

console.log('Breakdown by source:', bySource);
console.log('Breakdown by campus:', byCS);
console.log(`Live links: ${liveCount} / ${files.length}`);
console.log(`Valid student prices: ${validPriceCount} / ${files.length}`);
