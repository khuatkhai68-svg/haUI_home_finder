import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Verifying live accessibility of all ${files.length} rooms...`);

let okCount = 0;
let failCount = 0;
const dead = [];

for (const f of files) {
  const fp = path.join(dir, f);
  const d = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  const url = d.url_nguon || d.url;

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (res.status === 200) {
      okCount++;
    } else {
      failCount++;
      dead.push({ file: f, url, status: res.status });
    }
  } catch (err) {
    failCount++;
    dead.push({ file: f, url, error: err.message });
  }
}

console.log(`Live check complete: ${okCount} OK (200), ${failCount} Dead/Unreachable`);
if (dead.length > 0) {
  console.log('Deleting dead files:', dead);
  dead.forEach(d => fs.unlinkSync(path.join(dir, d.file)));
  console.log(`Deleted ${dead.length} dead files.`);
}
