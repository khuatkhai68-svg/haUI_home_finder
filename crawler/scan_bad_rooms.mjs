import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Total files: ${files.length}`);

const badFiles = [];

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  let d;
  try {
    d = JSON.parse(content);
  } catch(e) {
    badFiles.push({ file: f, reason: 'Invalid JSON' });
    return;
  }

  const title = (d.thong_tin?.tieu_de || d.title || '');
  const desc = (d.thong_tin?.mo_ta || d.description || '');
  const allText = (title + ' ' + desc).toLowerCase();

  // Check bad keywords
  const spamKeywords = [
    'bất động sản thổ cư', 'homelife', 'homeslife', 'mua bán nhà', 'sổ đỏ',
    'ké với', 'tìm phòng', 'cần tìm', 'tìm giúp', 'pass đồ', 'thanh lý',
    'tuyển dụng', 'việc làm', 'bán đất', 'phòng trọ haui cơ sở 3 - đh công nghiệp hà nam',
    'quản trị viên', 'bình luận\nchia sẻ', 'thích\nbình luận'
  ];

  for (const kw of spamKeywords) {
    if (allText.includes(kw)) {
      badFiles.push({ file: f, reason: `Contains spam keyword: "${kw}"`, title: title.substring(0, 50) });
      break;
    }
  }
});

console.log(`Found ${badFiles.length} bad / spam files:`);
badFiles.forEach(b => console.log(` - ${b.file}: [${b.reason}] ${b.title}`));
