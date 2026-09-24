import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Checking live link accessibility for ${files.length} rooms...`);

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.status;
  } catch (err) {
    return 0; // failed / timeout
  }
}

async function testSample() {
  const ptFiles = files.filter(f => {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    return (d.url_nguon || d.url || '').includes('phongtro123.com');
  });

  console.log(`Found ${ptFiles.length} phongtro123 files. Checking first 10...`);
  for (let i = 0; i < Math.min(10, ptFiles.length); i++) {
    const f = ptFiles[i];
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    const url = d.url_nguon || d.url;
    const status = await checkUrl(url);
    console.log(`[PT123] ${f} -> status ${status} | ${url}`);
  }
}

testSample();
