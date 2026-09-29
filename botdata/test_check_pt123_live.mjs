import fs from 'fs';
import path from 'path';

const roomDir = path.resolve('alldata/room');
const files = fs.readdirSync(roomDir).filter(f => f.startsWith('RM-PT123-'));

console.log(`Checking ${files.length} PT123 listings for live URL status...`);

let okCount = 0;
let deadCount = 0;
let deadRooms = [];

for (const f of files) {
  const p = path.join(roomDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const url = data.url_nguon;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Range': 'bytes=0-20000'
      }
    });

    if (!res.ok) {
      deadCount++;
      deadRooms.push({ id: data.ma_phong, url, status: res.status });
      continue;
    }

    const text = await res.text();
    if (/tin đăng này đã hết hạn|tin hết hạn|bạn đang xem tin cũ tại phongtro123|tin đã cho thuê|phòng đã cho thuê/i.test(text)) {
      deadCount++;
      deadRooms.push({ id: data.ma_phong, url, reason: 'Soft-404 expired' });
    } else {
      okCount++;
    }
  } catch (e) {
    deadCount++;
    deadRooms.push({ id: data.ma_phong, url, error: e.message });
  }
}

console.log({
  totalPT123: files.length,
  livePT123: okCount,
  deadPT123: deadCount,
  deadRooms
});
