import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Auditing ALL ${files.length} rooms in database...`);

let issues = 0;
let cs1 = 0, cs2 = 0, cs3 = 0;
let fb = 0, pt123 = 0, other = 0;

const spamKeywords = [
  'bất động sản thổ cư', 'homelife', 'homeslife', 'sổ đỏ', 'mua bán nhà',
  'ké với', 'tìm phòng', 'cần tìm phòng', 'pass đồ', 'thanh lý',
  'dương nội', 'võng thị', 'trích sài', 'vũ tông phan', 'khương trung',
  'nguyễn trãi', 'mỹ đình', 'lạc long quân', 'thanh xuân', 'hoàn kiếm',
  'quản trị viên', 'thích\nbình luận', 'bình luận\nchia sẻ'
];

files.forEach((f, i) => {
  const fp = path.join(dir, f);
  const d = JSON.parse(fs.readFileSync(fp, 'utf-8'));

  const title = (d.thong_tin?.tieu_de || d.title || '').trim();
  const desc = (d.thong_tin?.mo_ta || d.description || '').trim();
  const price = d.thong_tin?.gia || d.price;
  const cs = d.vi_tri?.co_so_gan_nhat || 'CS1';
  const full = (title + ' ' + desc).toLowerCase();

  // Track campus
  if (cs === 'CS1') cs1++;
  else if (cs === 'CS2') cs2++;
  else if (cs === 'CS3') cs3++;

  // Track source
  const src = d.nguon || 'other';
  if (src === 'facebook') fb++;
  else if (src === 'phongtro123') pt123++;
  else other++;

  // Checks
  for (const kw of spamKeywords) {
    if (full.includes(kw)) {
      console.error(`[FAIL - Spam Keyword '${kw}'] in ${f}: ${title}`);
      issues++;
    }
  }

  if (!price || price < 700000 || price > 5500000) {
    console.error(`[FAIL - Invalid Price ${price}] in ${f}: ${title}`);
    issues++;
  }

  if (!title || title.length < 15) {
    console.error(`[FAIL - Short Title] in ${f}: ${title}`);
    issues++;
  }

  if (!d.vi_tri?.lat || !d.vi_tri?.lng) {
    console.error(`[FAIL - Missing GPS] in ${f}`);
    issues++;
  }
});

console.log('----------------------------------------------------');
console.log(`TOTAL ROOMS AUDITED: ${files.length}`);
console.log(`TOTAL QUALITY ISSUES FOUND: ${issues}`);
console.log(`CAMPUS BREAKDOWN: CS1=${cs1}, CS2=${cs2}, CS3=${cs3}`);
console.log(`SOURCE BREAKDOWN: Facebook=${fb}, Phongtro123=${pt123}, Other=${other}`);
console.log('----------------------------------------------------');
