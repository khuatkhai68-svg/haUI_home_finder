/**
 * server.js — HaUI Room Finder Backend
 * Express server: Serve frontend + REST API + Link Health Bot (mỗi 6 tiếng)
 * Port: 3333
 */

'use strict';

const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const http     = require('http');
const autoCrawlBot = require('./auto_crawl_bot');

const app  = express();
const PORT = process.env.PORT || 3333;

// ── Đường dẫn ─────────────────────────────────────────────────────────────────
const DB_ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const WEBDATA_DIR = path.resolve(__dirname, '..', 'webdata');
const LOG_DIR     = path.resolve(__dirname, '..', 'alldata', 'logs');

// Đảm bảo thư mục log tồn tại
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(WEBDATA_DIR));
app.use('/photos', express.static(path.join(DB_ROOM_DIR, 'photos')));

// ═══════════════════════════════════════════════════════════════════════════════
// DB HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Đọc toàn bộ phòng từ DB (file JSON). Bỏ qua file lỗi parse. */
function getAllRooms() {
  if (!fs.existsSync(DB_ROOM_DIR)) return [];
  return fs.readdirSync(DB_ROOM_DIR)
    .filter(f => f.endsWith('.json'))
    .reduce((acc, f) => {
      try {
        const room = JSON.parse(fs.readFileSync(path.join(DB_ROOM_DIR, f), 'utf-8'));
        if (room) acc.push(room);
      } catch { /* bỏ qua file JSON lỗi */ }
      return acc;
    }, []);
}

/** Đọc một phòng theo mã. Trả về null nếu không tồn tại. */
function getRoomById(id) {
  const fp = path.join(DB_ROOM_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; }
}

/** Ghi một phòng vào DB (cập nhật ngay_cap_nhat). */
function writeRoom(room) {
  room.ngay_cap_nhat = new Date().toISOString();
  fs.writeFileSync(
    path.join(DB_ROOM_DIR, `${room.ma_phong}.json`),
    JSON.stringify(room, null, 2),
    'utf-8'
  );
}

/** Xóa file phòng khỏi DB. */
function deleteRoom(id) {
  const fp = path.join(DB_ROOM_DIR, `${id}.json`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

/** Map room JSON → format frontend. */
function formatRoom(r) {
  const ti = r.thong_tin || {};
  const vt = r.vi_tri    || {};
  const lh = r.lien_he   || {};
  return {
    id:            r.ma_phong,
    nguon:         r.nguon,
    url:           r.url_nguon,
    trangThai:     r.trang_thai,
    ngayCao:       r.ngay_cao,
    title:         ti.tieu_de   || '',
    price:         ti.gia       || 0,
    area:          ti.dien_tich || 0,
    address:       ti.dia_chi   || '',
    district:      ti.quan_huyen || '',
    city:          ti.tinh_thanh || 'Hà Nội',
    desc:          ti.mo_ta     || '',
    amenities:     ti.tien_ich  || [],
    noOwner:       ti.khong_chung_chu || false,
    freeTime:      ti.gio_giac_tu_do  || false,
    lat:           vt.lat || null,
    lng:           vt.lng || null,
    distCS1:       vt.khoang_cach_cs1_km || null,
    distCS2:       vt.khoang_cach_cs2_km || null,
    distCS3:       vt.khoang_cach_cs3_km || null,
    nearestCampus: vt.co_so_gan_nhat || (ti.tinh_thanh === 'Hà Nam' ? 'CS3' : 'CS1'),
    commuteMin:    vt.thoi_gian_di_xe_phut || null,
    phone:         lh.so_dien_thoai || '',
    owner:         lh.ten_chu       || '',
    fbLink:        lh.facebook      || '',
    images:        (r.anh || []).map(a => a.url_goc).filter(Boolean),
    scamScore:     r.phan_tich?.scam_score,
    checked:       r.phan_tich?.da_kiem_tra || false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINK HEALTH BOT — chạy tự động mỗi 6 tiếng
// ═══════════════════════════════════════════════════════════════════════════════

const BOT_INTERVAL_MS     = 6 * 60 * 60 * 1000; // 6 tiếng
const BOT_REQUEST_TIMEOUT = 8_000;               // 8 giây / link
const BOT_BATCH_SIZE      = 5;                   // số link kiểm tra song song
const BOT_DELAY_BETWEEN   = 500;                 // ms delay giữa các batch

// User-Agent xoay vòng để tránh bị block
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

let botRunning = false;
let botLastRun = null;
let botStats   = { checked: 0, deleted: 0, ok: 0, lastRunAt: null, durationSec: 0 };

/**
 * Kiểm tra một URL có còn hoạt động không.
 * @param {string} url
 * @param {number} uaIndex - chỉ số User-Agent
 * @returns {Promise<{ ok: boolean, reason: string }>}
 */
function checkLink(url, uaIndex = 0) {
  return new Promise(resolve => {
    let parsed;
    try { parsed = new URL(url); } catch { return resolve({ ok: false, reason: 'Invalid URL' }); }

    const isFB  = url.includes('facebook.com');
    const lib   = parsed.protocol === 'https:' ? https : http;
    const ua    = USER_AGENTS[uaIndex % USER_AGENTS.length];

    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   isFB ? 'GET' : 'HEAD',  // FB chặn HEAD → dùng GET
      headers:  {
        'User-Agent':      ua,
        'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        'Cache-Control':   'no-cache',
      },
      timeout: BOT_REQUEST_TIMEOUT,
    };

    const req = lib.request(options, res => {
      const { statusCode: s, headers } = res;
      const location = headers?.location || '';
      res.resume(); // tiêu thụ body để tránh memory leak

      if (isFB) {
        // FB thường block server request → chỉ xóa nếu rõ ràng redirect về login
        if (location.includes('/login') || location.includes('/checkpoint/'))
          return resolve({ ok: false, reason: `FB redirect → login (${s})` });
        // 403/404 từ FB server-side không đáng tin → giữ lại
        return resolve({ ok: true, reason: `FB HTTP ${s} (kept)` });
      }

      // 2xx/3xx → link sống
      if (s >= 200 && s < 400) return resolve({ ok: true, reason: `HTTP ${s}` });
      // 403 = site chặn bot nhưng link vẫn sống → KHÔNG xóa
      if (s === 403) return resolve({ ok: true, reason: `HTTP 403 blocked (kept)` });
      // Chỉ xóa khi link thực sự không tồn tại
      if (s === 404 || s === 410) return resolve({ ok: false, reason: `HTTP ${s} Gone` });
      // 5xx = server lỗi tạm thời → giữ lại
      if (s >= 500) return resolve({ ok: true, reason: `HTTP ${s} server-error (kept)` });
      // Các code khác (401, 429...) → giữ lại cho an toàn
      return resolve({ ok: true, reason: `HTTP ${s} unknown (kept)` });
    });

    req.on('timeout', () => { req.destroy(); resolve({ ok: false, reason: 'Timeout' }); });
    req.on('error',   err => resolve({ ok: false, reason: err.message }));
    req.end();
  });
}

/** Chạy một batch song song. */
function checkBatch(items) {
  return Promise.all(
    items.map((item, i) => checkLink(item.url, i).then(result => ({ ...item, result })))
  );
}

const delay = ms => new Promise(r => setTimeout(r, ms));

/**
 * Hàm chính: quét toàn bộ phòng, kiểm tra link, xóa link chết.
 */
async function runLinkHealthBot() {
  if (botRunning) {
    console.log('[LinkBot] ⚠️  Đang có lần chạy khác, bỏ qua.');
    return;
  }
  botRunning = true;
  const startTime = Date.now();
  console.log('\n[LinkBot] 🤖 Bắt đầu kiểm tra link... ' + new Date().toLocaleString('vi-VN'));

  let totalChecked = 0, totalDeleted = 0, totalOk = 0;
  const deletedList = [], errorList = [];

  try {
    if (!fs.existsSync(DB_ROOM_DIR)) throw new Error('Thư mục DB không tồn tại');

    const files = fs.readdirSync(DB_ROOM_DIR).filter(f => f.endsWith('.json'));
    console.log(`[LinkBot] 📋 Tổng phòng: ${files.length}`);

    // Lọc phòng có URL hợp lệ
    const roomsToCheck = [];
    for (const f of files) {
      try {
        const room = JSON.parse(fs.readFileSync(path.join(DB_ROOM_DIR, f), 'utf-8'));
        const url  = room.url_nguon || room.url;
        if (!url || !url.startsWith('http')) continue;
        // Bỏ qua URL synthetic đã biết là giả
        if (url.includes('posts/179007299')) {
          deleteRoom(room.ma_phong);
          totalDeleted++;
          deletedList.push({ id: room.ma_phong, url, reason: 'Dummy synthetic URL' });
          continue;
        }
        roomsToCheck.push({ id: room.ma_phong, url });
      } catch { /* file JSON lỗi — bỏ qua */ }
    }

    // Kiểm tra từng batch song song
    for (let i = 0; i < roomsToCheck.length; i += BOT_BATCH_SIZE) {
      const batch   = roomsToCheck.slice(i, i + BOT_BATCH_SIZE);
      const results = await checkBatch(batch);

      for (const { id, url, result } of results) {
        totalChecked++;
        if (result.ok) {
          totalOk++;
        } else {
          deleteRoom(id);
          totalDeleted++;
          deletedList.push({ id, url, reason: result.reason });
          console.log(`[LinkBot] 🗑️  Xóa: ${id} | ${result.reason}`);
        }
      }

      const done = Math.min(i + BOT_BATCH_SIZE, roomsToCheck.length);
      process.stdout.write(`\r[LinkBot] ⏳ ${done}/${roomsToCheck.length} | ✅ ${totalOk} ok | 🗑️ ${totalDeleted} xóa`);

      if (i + BOT_BATCH_SIZE < roomsToCheck.length) await delay(BOT_DELAY_BETWEEN);
    }

    process.stdout.write('\n');

  } catch (err) {
    console.error('[LinkBot] ❌', err.message);
    errorList.push(err.message);
  } finally {
    botRunning = false;
    botLastRun = new Date().toISOString();
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    botStats = { checked: totalChecked, deleted: totalDeleted, ok: totalOk, lastRunAt: botLastRun, durationSec };

    // Ghi log JSON
    const logFile = path.join(LOG_DIR, `link_health_${botLastRun.slice(0, 10)}.json`);
    try {
      fs.writeFileSync(logFile, JSON.stringify({
        runAt: botLastRun, durationSec,
        summary: { checked: totalChecked, ok: totalOk, deleted: totalDeleted },
        deleted: deletedList, errors: errorList,
      }, null, 2), 'utf-8');
    } catch { /* lỗi ghi log — không crash server */ }

    console.log(`[LinkBot] ✅ Checked: ${totalChecked} | OK: ${totalOk} | Xóa: ${totalDeleted} | ${durationSec}s`);
    console.log(`[LinkBot] 📝 Log: ${logFile}`);
    console.log(`[LinkBot] 🕐 Tiếp theo: ${new Date(Date.now() + BOT_INTERVAL_MS).toLocaleString('vi-VN')}\n`);
  }
}

/** Lên lịch chạy bot: lần đầu sau 30s, sau đó mỗi 6 tiếng. */
function scheduleLinkBot() {
  setTimeout(() => {
    runLinkHealthBot();
    setInterval(runLinkHealthBot, BOT_INTERVAL_MS);
  }, 30_000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: /api/rooms
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/rooms
 * Query: min_price, max_price, max_distance, campus, district, nguon, q, limit, sort, status
 */
app.get('/api/rooms', (req, res) => {
  try {
    const {
      min_price, max_price, max_distance,
      campus, district, nguon, q, limit, sort, status,
    } = req.query;

    let rooms = getAllRooms().map(formatRoom);

    // ── Trạng thái ────────────────────────────────────────────────────────────
    if (status === 'all') {
      // giữ nguyên
    } else if (status) {
      rooms = rooms.filter(r => r.trangThai === status);
    } else {
      rooms = rooms.filter(r => !r.trangThai || r.trangThai === 'con_trong');
    }

    // ── Giá ───────────────────────────────────────────────────────────────────
    if (min_price) rooms = rooms.filter(r => r.price >= +min_price);
    if (max_price) rooms = rooms.filter(r => r.price <= +max_price);

    // ── Campus ────────────────────────────────────────────────────────────────
    const distKey = campus === 'cs3' ? 'distCS3' : campus === 'cs2' ? 'distCS2' : 'distCS1';
    if (campus === 'cs1') {
      rooms = rooms.filter(r => r.city !== 'Hà Nam' && (r.nearestCampus === 'CS1' || (r.distCS1 !== null && r.distCS1 <= 15)));
    } else if (campus === 'cs2') {
      rooms = rooms.filter(r => r.city !== 'Hà Nam' && (r.nearestCampus === 'CS2' || (r.distCS2 !== null && r.distCS2 <= 15)));
    } else if (campus === 'cs3') {
      rooms = rooms.filter(r => r.city === 'Hà Nam' || r.nearestCampus === 'CS3' || (r.distCS3 !== null && r.distCS3 <= 25));
    }
    if (max_distance) {
      const maxD = parseFloat(max_distance);
      rooms = rooms.filter(r => r[distKey] !== null && r[distKey] <= maxD);
    }

    // ── Quận, nguồn, text ─────────────────────────────────────────────────────
    if (district) rooms = rooms.filter(r => r.district.includes(district));
    if (nguon)    rooms = rooms.filter(r => r.nguon === nguon);
    if (q) {
      const lq = q.toLowerCase();
      rooms = rooms.filter(r =>
        r.title.toLowerCase().includes(lq)   ||
        r.address.toLowerCase().includes(lq) ||
        r.desc.toLowerCase().includes(lq)
      );
    }

    // ── Sort ──────────────────────────────────────────────────────────────────
    const sortBy = sort || 'newest';
    if      (sortBy === 'price_asc')  rooms.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    else if (sortBy === 'price_desc') rooms.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'distance')   rooms.sort((a, b) => (a[distKey] ?? 999) - (b[distKey] ?? 999));
    else rooms.sort((a, b) => new Date(b.ngayCao) - new Date(a.ngayCao)); // newest

    rooms = rooms.slice(0, parseInt(limit) || 500);
    res.json({ total: rooms.length, data: rooms });
  } catch (e) {
    console.error('[/api/rooms]', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/rooms/:id
 */
app.get('/api/rooms/:id', (req, res) => {
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  res.json(formatRoom(room));
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: /api/admin
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/stats
 */
app.get('/api/admin/stats', (req, res) => {
  try {
    const rooms      = getAllRooms();
    const byStatus   = {};
    const byNguon    = {};
    const byDistrict = {};
    const priceList  = [];

    for (const r of rooms) {
      const s = r.trang_thai || 'unknown';
      const n = r.nguon      || 'other';
      const q = r.thong_tin?.quan_huyen || 'Khác';
      byStatus[s]   = (byStatus[s]   || 0) + 1;
      byNguon[n]    = (byNguon[n]    || 0) + 1;
      byDistrict[q] = (byDistrict[q] || 0) + 1;
      if (r.thong_tin?.gia > 0) priceList.push(r.thong_tin.gia);
    }

    const sum      = priceList.reduce((a, b) => a + b, 0);
    const avgPrice = priceList.length ? Math.round(sum / priceList.length) : 0;
    const minPrice = priceList.length ? Math.min(...priceList) : 0;
    const maxPrice = priceList.length ? Math.max(...priceList) : 0;

    const recent = rooms
      .slice()
      .sort((a, b) => new Date(b.ngay_cao) - new Date(a.ngay_cao))
      .slice(0, 5)
      .map(r => ({
        id:     r.ma_phong,
        title:  (r.thong_tin?.tieu_de || '').slice(0, 60),
        nguon:  r.nguon,
        gia:    r.thong_tin?.gia       || 0,
        area:   r.thong_tin?.dien_tich || 0,
        time:   r.ngay_cao,
        status: r.trang_thai,
      }));

    res.json({ total: rooms.length, byStatus, byNguon, byDistrict,
      price: { avg: avgPrice, min: minPrice, max: maxPrice }, recent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/admin/bot-status
 * Trả về trạng thái + thống kê lần chạy gần nhất của Link Health Bot.
 */
app.get('/api/admin/bot-status', (_req, res) => {
  res.json({
    running:       botRunning,
    lastRunAt:     botLastRun,
    nextRunAt:     botLastRun
      ? new Date(new Date(botLastRun).getTime() + BOT_INTERVAL_MS).toISOString()
      : null,
    intervalHours: BOT_INTERVAL_MS / 3_600_000,
    stats:         botStats,
  });
});

/**
 * POST /api/admin/bot/run-now
 * Kích hoạt bot chạy thủ công ngay lập tức.
 */
app.post('/api/admin/bot/run-now', (_req, res) => {
  if (botRunning) return res.status(409).json({ message: 'Bot đang chạy, vui lòng chờ.' });
  runLinkHealthBot().catch(e => console.error('[LinkBot] Manual run error:', e));
  res.json({ message: 'Bot đã được kích hoạt.' });
});

/**
 * GET /api/admin/crawl-status
 * Trả về trạng thái, luật cứng và thống kê cào của Auto Crawl Bot (mỗi 4 tiếng).
 */
app.get('/api/admin/crawl-status', (_req, res) => {
  res.json(autoCrawlBot.getCrawlBotStatus());
});

/**
 * POST /api/admin/crawl/run-now
 * Kích hoạt cào ngay lập tức (+50 Facebook + nguồn khác, tuân thủ luật cứng).
 */
app.post('/api/admin/crawl/run-now', (req, res) => {
  const status = autoCrawlBot.getCrawlBotStatus();
  if (status.running) {
    return res.status(409).json({ message: 'Bot cào đang chạy, vui lòng chờ.' });
  }
  const targetFb = parseInt(req.body?.targetFb) || 50;
  const targetOther = parseInt(req.body?.targetOther) || 15;
  autoCrawlBot.runCrawlJob({ targetFb, targetOther })
    .catch(e => console.error('[CrawlBot API] Error:', e));
  res.json({
    message: `Đã kích hoạt cào tự động (Mục tiêu: +${targetFb} phòng Facebook, +${targetOther} phòng khác)!`,
    rules: status.rules
  });
});

/**
 * GET /api/admin/crawl-log
 * Xem log kiểm toán mới nhất của crawl bot.
 */
app.get('/api/admin/crawl-log', (_req, res) => {
  const crawlLogPath = path.join(LOG_DIR, 'crawl_bot.log');
  if (!fs.existsSync(crawlLogPath)) {
    return res.json({ log: 'Chưa có dữ liệu log cào.' });
  }
  try {
    const lines = fs.readFileSync(crawlLogPath, 'utf-8').trim().split('\n');
    res.json({ log: lines.slice(-100).join('\n') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /api/rooms/:id/status
 * Body: { trang_thai: "da_thue" | "con_trong" | "nghi_ngo_lua_dao" | "het_han" }
 */
app.patch('/api/rooms/:id/status', (req, res) => {
  const { trang_thai } = req.body;
  const VALID = ['con_trong', 'da_thue', 'nghi_ngo_lua_dao', 'het_han'];
  if (!VALID.includes(trang_thai)) {
    return res.status(400).json({ error: `trang_thai không hợp lệ. Nhận: ${VALID.join(', ')}` });
  }
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  room.trang_thai = trang_thai;
  writeRoom(room);
  res.json({ success: true, id: req.params.id, trang_thai });
});

// ── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(WEBDATA_DIR, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send('Not found');
});

// ═══════════════════════════════════════════════════════════════════════════════
// KHỞI ĐỘNG
// ═══════════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  const sep = '═'.repeat(57);
  const total = fs.existsSync(DB_ROOM_DIR)
    ? fs.readdirSync(DB_ROOM_DIR).filter(f => f.endsWith('.json')).length
    : 0;

  console.log(`\n${sep}`);
  console.log(`🚀 HaUI Room Finder Server đang chạy!`);
  console.log(`   Trang chủ       → http://localhost:${PORT}`);
  console.log(`   Bản đồ          → http://localhost:${PORT}/map.html`);
  console.log(`   Admin           → http://localhost:${PORT}/admin.html`);
  console.log(`   API phòng       → http://localhost:${PORT}/api/rooms`);
  console.log(`   Link Bot status → http://localhost:${PORT}/api/admin/bot-status`);
  console.log(`   Crawl Bot API   → http://localhost:${PORT}/api/admin/crawl-status`);
  console.log(`${sep}`);
  console.log(`📦 DB: ${total} phòng trọ`);
  console.log(`🤖 Link Health Bot: chạy sau 30s, lặp mỗi 6 tiếng`);
  console.log(`🕷️ Playwright Crawl Bot: lặp mỗi 4 tiếng (+50 FB, +phongtro123)`);
  console.log(`⚖️ Luật cứng: Nghị định 13/2023/NĐ-CP, lọc spam, đa dạng CS1-2-3`);
  console.log(`${sep}\n`);

  scheduleLinkBot();
  autoCrawlBot.startAutoCrawlScheduler();
});
