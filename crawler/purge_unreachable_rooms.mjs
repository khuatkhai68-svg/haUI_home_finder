import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeout);
    const finalUrl = res.url || '';
    const text = await res.text();

    // Check if Facebook redirects to login or says unavailable
    if (url.includes('facebook.com')) {
      if (finalUrl.includes('login') || finalUrl.includes('/checkpoint/')) return { ok: false, reason: 'Redirected to FB Login' };
      if (text.includes('không khả dụng') || text.includes('không tìm thấy') || text.includes('trang bạn yêu cầu')) {
        return { ok: false, reason: 'FB Content Unavailable / 404' };
      }
      return { ok: res.status === 200, status: res.status, reason: 'FB 200' };
    }

    // Phongtro123 / Web
    if (res.status === 200) {
      if (text.includes('Tin này đã hết hạn') || text.includes('404 Không tìm thấy trang')) {
        return { ok: false, reason: 'Expired / 404' };
      }
      return { ok: true, status: 200 };
    }
    return { ok: false, status: res.status, reason: 'HTTP Status ' + res.status };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function testAll() {
  console.log(`Testing all ${files.length} rooms...`);
  
  const toDelete = [];
  const valid = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fp = path.join(dir, f);
    const d = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const url = d.url_nguon || d.url;

    if (!url || !url.startsWith('http')) {
      toDelete.push({ file: f, url: 'none', reason: 'No valid URL' });
      continue;
    }

    // Check if dummy generated URL
    if (url.includes('posts/179007299')) {
      toDelete.push({ file: f, url, reason: 'Dummy synthetic URL' });
      continue;
    }

    const check = await checkUrl(url);
    if (!check.ok) {
      toDelete.push({ file: f, url, reason: check.reason });
    } else {
      valid.push({ file: f, url });
    }

    if ((i + 1) % 20 === 0 || i === files.length - 1) {
      console.log(`[Progress ${i + 1}/${files.length}] Valid: ${valid.length} | Bad: ${toDelete.length}`);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`VALID ACCESSIBLE ROOMS: ${valid.length}`);
  console.log(`BAD / UNREACHABLE ROOMS: ${toDelete.length}`);
  console.log('Sample bad rooms to delete:');
  toDelete.slice(0, 15).forEach(b => console.log(` - ${b.file}: [${b.reason}] ${b.url}`));

  // Perform deletion of bad rooms
  toDelete.forEach(b => {
    fs.unlinkSync(path.join(dir, b.file));
  });
  console.log(`DELETED ${toDelete.length} unreachable rooms! Remaining: ${valid.length}`);
}

testAll();
