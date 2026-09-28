import fs from 'fs';
import path from 'path';

const ROOM_DIR = path.resolve('alldata/room');
const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json') && f.startsWith('RM-PT123-'));

console.log(`Bắt đầu quét và xóa bỏ triệt để các tin hết hạn (Soft-404) trong ${files.length} phòng Phongtro123...`);

const EXPIRED_PATTERNS = [
  /tin đăng này đã hết hạn/i,
  /tin hết hạn/i,
  /bạn đang xem tin cũ tại phongtro123/i,
  /tin đã cho thuê/i,
  /phòng đã cho thuê/i,
  /bài viết này hiện không tồn tại/i
];

let deletedCount = 0;
let aliveCount = 0;

for (const file of files) {
  const filePath = path.join(ROOM_DIR, file);
  const room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const url = room.url_nguon || room.url;

  if (!url) continue;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (res.status === 404 || res.status === 410) {
      console.log(`🗑️ [404 GONE]: Xóa ${room.ma_phong} - "${room.thong_tin?.tieu_de}"`);
      fs.unlinkSync(filePath);
      deletedCount++;
      continue;
    }

    const html = await res.text();
    const isExpired = EXPIRED_PATTERNS.some(p => p.test(html));

    if (isExpired) {
      console.log(`🗑️ [HẾT HẠN SOFT-404]: Xóa ${room.ma_phong} - "${room.thong_tin?.tieu_de}"`);
      fs.unlinkSync(filePath);
      deletedCount++;
    } else {
      aliveCount++;
    }
  } catch (err) {
    console.log(`⚠️ Lỗi kết nối ${room.ma_phong}: ${err.message}`);
  }
}

console.log(`\n========================================`);
console.log(`✅ HOÀN THÀNH THANH LỌC TIN HẾT HẠN:`);
console.log(`- Đã xóa bỏ tin hết hạn: ${deletedCount} phòng`);
console.log(`- Số phòng phongtro123 thực sự còn trống: ${aliveCount} phòng`);
console.log(`- Tổng số phòng còn lại trong cơ sở dữ liệu: ${fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json')).length}`);
console.log(`========================================`);
