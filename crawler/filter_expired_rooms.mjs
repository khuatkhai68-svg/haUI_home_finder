/**
 * filter_expired_rooms.mjs
 * Quét toàn bộ 462 phòng trong alldata/room/
 * Phát hiện và xóa triệt để các tin:
 * - "Bạn đang xem tin cũ tại Phongtro123.com, tin đăng này đã hết hạn."
 * - "tin đăng này đã hết hạn", "tin đã cho thuê", "tin hết hạn"
 * - Trang 404 / 410 hoặc bị redirect về trang chủ / danh mục
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function checkUrlStatus(url, redirectCount = 0) {
  return new Promise((resolve) => {
    if (redirectCount > 3) {
      return resolve({ ok: false, reason: 'Too many redirects' });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return resolve({ ok: false, reason: 'Invalid URL' });
    }

    if (url.includes('facebook.com')) {
      // Giữ tin FB trừ khi rõ ràng lỗi cú pháp
      return resolve({ ok: true, reason: 'Facebook listing' });
    }

    const lib = parsed.protocol === 'https:' ? https : http;
    const ua = USER_AGENTS[redirectCount % USER_AGENTS.length];

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    };

    const req = lib.request(options, (res) => {
      const { statusCode, headers } = res;
      const location = headers?.location;

      // Xử lý Redirect (301, 302, 307, 308)
      if (statusCode >= 300 && statusCode < 400 && location) {
        const nextUrl = location.startsWith('http') ? location : new URL(location, url).href;
        // Nếu redirect về trang chủ hoặc trang danh mục -> tin gốc đã bị xóa/hết hạn
        if (
          nextUrl === 'https://phongtro123.com/' ||
          nextUrl === 'https://phongtro123.com' ||
          !nextUrl.includes('-pr')
        ) {
          res.resume();
          return resolve({ ok: false, reason: `Redirect về danh mục/trang chủ: ${nextUrl}` });
        }
        res.resume();
        return checkUrlStatus(nextUrl, redirectCount + 1).then(resolve);
      }

      if (statusCode === 404 || statusCode === 410) {
        res.resume();
        return resolve({ ok: false, reason: `HTTP ${statusCode} Not Found` });
      }

      // Đọc tối đa 120KB để bắt được banner cảnh báo hết hạn
      let body = '';
      res.on('data', (chunk) => {
        if (body.length < 120000) {
          body += chunk.toString('utf-8');
        } else {
          res.destroy();
        }
      });

      const handleEnd = () => {
        const lower = body.toLowerCase();
        
        // 1. Kiểm tra chính xác thông báo hết hạn của Phongtro123
        if (
          lower.includes('bạn đang xem tin cũ tại phongtro123') ||
          lower.includes('tin đăng này đã hết hạn') ||
          lower.includes('bài viết này hiện không tồn tại')
        ) {
          return resolve({ ok: false, reason: 'Tin đăng đã hết hạn (Banner thông báo đỏ)' });
        }

        // 2. Kiểm tra alert bg-danger có chứa từ khóa hết hạn
        if (
          lower.includes('bg-danger') &&
          (lower.includes('hết hạn') || lower.includes('tin cũ') || lower.includes('cho thuê'))
        ) {
          return resolve({ ok: false, reason: 'Tin đăng đã hết hạn (Alert bg-danger)' });
        }

        // 3. Nếu trả về 200 OK và không có cảnh báo
        if (statusCode >= 200 && statusCode < 400) {
          return resolve({ ok: true, reason: `HTTP ${statusCode} Active` });
        }

        return resolve({ ok: true, reason: `HTTP ${statusCode} (kept)` });
      };

      res.on('end', handleEnd);
      res.on('close', handleEnd);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, reason: 'Request Timeout' });
    });

    req.on('error', (err) => {
      resolve({ ok: false, reason: err.message });
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Bắt đầu quét và lọc toàn bộ tin hết hạn trong kho dữ liệu...');
  const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));
  console.log(`📋 Tổng số phòng cần kiểm tra: ${files.length}`);

  let deletedCount = 0;
  let activeCount = 0;
  let checkedCount = 0;
  const deletedList = [];

  const BATCH_SIZE = 8;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const chunk = files.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      chunk.map(async (file) => {
        const filePath = path.join(ROOM_DIR, file);
        let room;
        try {
          room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
          return;
        }

        const url = room.url_nguon || room.url;
        if (!url) {
          return;
        }

        const result = await checkUrlStatus(url);
        checkedCount++;

        if (!result.ok) {
          deletedCount++;
          deletedList.push({
            id: room.ma_phong,
            title: room.thong_tin?.tieu_de || '',
            url,
            reason: result.reason,
          });
          // Xóa file JSON phòng hết hạn
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error(`Không thể xóa ${file}:`, e.message);
          }
          console.log(`[DELETE] 🗑️  ${room.ma_phong}: ${result.reason} | ${room.thong_tin?.tieu_de?.slice(0, 45)}...`);
        } else {
          activeCount++;
        }
      })
    );

    process.stdout.write(`\r[Tiến độ] Đã quét: ${checkedCount}/${files.length} | Còn hoạt động: ${activeCount} | Đã xóa hết hạn: ${deletedCount}`);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('🎉 KẾT QUẢ LỌC TIN HẾT HẠN:');
  console.log(`- Tổng tin đã quét: ${checkedCount}`);
  console.log(`- Tin còn hoạt động (Active): ${activeCount}`);
  console.log(`- Tin hết hạn đã xóa bỏ: ${deletedCount}`);
  console.log('='.repeat(60));

  // Ghi log kết quả
  const logDir = path.resolve(__dirname, '..', 'alldata', 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(
    path.join(logDir, 'loc_tin_het_han_result.json'),
    JSON.stringify({
      time: new Date().toISOString(),
      totalChecked: checkedCount,
      totalActive: activeCount,
      totalDeleted: deletedCount,
      deletedItems: deletedList,
    }, null, 2),
    'utf-8'
  );
}

main().catch(console.error);
