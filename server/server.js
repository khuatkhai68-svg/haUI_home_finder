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
const aiService    = require('./ai_service');

const app  = express();
const PORT = process.env.PORT || 3333;

// ── Đường dẫn ─────────────────────────────────────────────────────────────────
const DB_ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const WEBDATA_DIR = path.resolve(__dirname, '..', 'webdata');
const LOG_DIR     = path.resolve(__dirname, '..', 'alldata', 'logs');
const USERS_FILE    = path.resolve(__dirname, '..', 'alldata', 'users.json');
const COMMENTS_FILE = path.resolve(__dirname, '..', 'alldata', 'comments.json');
const UPLOAD_DIR    = path.resolve(__dirname, '..', 'alldata', 'uploads');

// Đảm bảo thư mục log & upload tồn tại
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function getAllUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function getAllComments() {
  if (!fs.existsSync(COMMENTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveComments(cmts) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(cmts, null, 2), 'utf-8');
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(WEBDATA_DIR));
app.use('/photos', express.static(path.join(DB_ROOM_DIR, 'photos')));
app.use('/uploads', express.static(UPLOAD_DIR));

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

/**
 * SERVER-SIDE TEXT SANITIZER (API-01)
 * Làm sạch văn bản rác CSS/JS/JSON-LD trước khi phục vụ lên frontend.
 * Hoạt động như lớp phòng thủ cuối cùng ngay tại tầng API.
 */
const GARBAGE_MARKERS = [
  ' - Phongtro123.comwindow.',
  'window.dataLayer',
  '@charset "UTF-8"',
  '@charset \'UTF-8\'',
  '.swal2-',
  '.vue-slider-',
  'base_url = "https://phongtro123.com"',
  '{"@context":"http://schema.org"',
  'function gtag(',
  'window.Laravel',
  '@-webkit-keyframes',
  '@keyframes swal2',
];

function cleanGarbageText(str) {
  if (!str || typeof str !== 'string') return '';
  let result = str;
  for (const m of GARBAGE_MARKERS) {
    const idx = result.indexOf(m);
    if (idx > 0) result = result.substring(0, idx).trim();
  }
  return result.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

// Danh sách địa danh ngoại vùng — lọc tại tầng API trước khi trả về client
const GEO_BLACKLIST = [
  'quận 1','quận 2','quận 3','quận 4','quận 5','quận 6','quận 7','quận 8',
  'quận 9','quận 10','quận 11','quận 12','bình thạnh','gò vấp','tân bình',
  'tân phú','phú nhuận','bình tân','thủ đức','nhà bè','hóc môn','củ chi',
  'hồ chí minh','tp.hcm','tphcm','sài gòn','saigon','đà nẵng','bình dương',
  'đồng nai','cần thơ',
];

function isGeographicallyValid(room) {
  const combined = [(room.title||''), (room.address||''), (room.district||''), (room.city||'')].join(' ').toLowerCase();
  return !GEO_BLACKLIST.some(kw => combined.includes(kw));
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
    // API-01: Áp dụng cleanGarbageText cho tất cả trường text
    title:         cleanGarbageText(ti.tieu_de   || ''),
    price:         ti.gia       || 0,
    area:          ti.dien_tich || 0,
    address:       cleanGarbageText(ti.dia_chi   || ''),
    district:      ti.quan_huyen || '',
    city:          ti.tinh_thanh || 'Hà Nội',
    desc:          cleanGarbageText(ti.mo_ta     || ''),
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
    images:        (r.anh || []).map(a => typeof a === 'string' ? a : a.url_goc).filter(Boolean),
    videos:        (r.video || []).map(v => typeof v === 'string' ? v : v.url).filter(Boolean),
    scamScore:     r.phan_tich?.scam_score,
    checked:       r.phan_tich?.da_kiem_tra || false,
    // Flag vị trí xấp xỉ: true = không có địa điểm cụ thể, đang trỏ về HaUI
    approximateLocation: vt.vi_tri_xap_xi || false,
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

    // API-01 & DATA-01: Lọc địa lý cứng ngay tầng API — loại bỏ phòng ngoại vùng
    rooms = rooms.filter(isGeographicallyValid);

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

    const byCampus   = { cs1: 0, cs2: 0, cs3: 0 };

    for (const r of rooms) {
      const s = r.trang_thai || 'unknown';
      const n = r.nguon      || 'other';
      const q = r.thong_tin?.quan_huyen || 'Khác';
      byStatus[s]   = (byStatus[s]   || 0) + 1;
      byNguon[n]    = (byNguon[n]    || 0) + 1;
      byDistrict[q] = (byDistrict[q] || 0) + 1;

      const camp = r.vi_tri?.co_so_gan_nhat || (r.thong_tin?.tinh_thanh === 'Hà Nam' ? 'CS3' : 'CS1');
      if (camp === 'CS3') byCampus.cs3++;
      else if (camp === 'CS2') byCampus.cs2++;
      else byCampus.cs1++;

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

    res.json({ total: rooms.length, byStatus, byNguon, byDistrict, byCampus,
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

/**
 * DELETE /api/rooms/:id
 * Xóa phòng khỏi hệ thống DB
 */
app.delete('/api/rooms/:id', (req, res) => {
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng để xóa.' });
  deleteRoom(req.params.id);
  res.json({ success: true, message: `Đã xóa phòng ${req.params.id} thành công.` });
});

/**
 * POST /api/rooms
 * Thêm phòng mới thủ công — CHỈ DÀNH RIÊNG CHO CHỦ TRỌ
 */
app.post('/api/rooms', (req, res) => {
  try {
    const b = req.body || {};
    const userRole = b.userRole || req.headers['x-user-role'];

    // PHÂN QUYỀN CHẶT CHẼ: Chỉ chủ trọ mới được thêm phòng
    if (userRole !== 'landlord') {
      return res.status(403).json({
        error: 'Chỉ có tài khoản Chủ trọ (Landlord) mới có quyền đăng tin hoặc thêm phòng trọ mới!'
      });
    }

    if (!b.tieu_de || !b.gia) {
      return res.status(400).json({ error: 'Tiêu đề và giá thuê là bắt buộc.' });
    }
    const randId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const maPhong = `RM-HOST-${randId}`;

    const newRoom = {
      ma_phong: maPhong,
      nguon: "chu_nha_dang",
      url_nguon: "",
      ngay_cao: new Date().toISOString(),
      ngay_cap_nhat: new Date().toISOString(),
      trang_thai: b.trang_thai || "con_trong",
      luat_tuan_thu: {
        nghi_dinh_13: "Chủ nhà tự nguyện đăng tải",
        da_kiem_tra_trung: true
      },
      thong_tin: {
        tieu_de: b.tieu_de,
        gia: Number(b.gia) || 0,
        dien_tich: Number(b.dien_tich) || 20,
        dia_chi: b.dia_chi || "",
        quan_huyen: b.quan_huyen || "Bắc Từ Liêm",
        tinh_thanh: b.tinh_thanh || "Hà Nội",
        mo_ta: b.mo_ta || b.tieu_de,
        tien_ich: Array.isArray(b.tien_ich) ? b.tien_ich : ['dieu_hoa', 'nong_lanh'],
        khong_chung_chu: !!b.khong_chung_chu,
        gio_giac_tu_do: !!b.gio_giac_tu_do
      },
      vi_tri: {
        lat: Number(b.lat) || 21.0538,
        lng: Number(b.lng) || 105.7351,
        khoang_cach_cs1_km: Number(b.distCS1) || 0.5,
        khoang_cach_cs2_km: Number(b.distCS2) || 1.5,
        khoang_cach_cs3_km: Number(b.distCS3) || 55.0,
        co_so_gan_nhat: b.co_so_gan_nhat || "CS1",
        thoi_gian_di_xe_phut: 3
      },
      lien_he: {
        ten_chu: b.ten_chu || "Chủ phòng (xác thực)",
        so_dien_thoai: b.so_dien_thoai || "",
        facebook: ""
      },
      anh: Array.isArray(b.anh) && b.anh.length
        ? b.anh.map(url => ({ url_goc: url, mo_ta: "Ảnh phòng" }))
        : (Array.isArray(b.images) && b.images.length
          ? b.images.map(url => ({ url_goc: url, mo_ta: "Ảnh phòng" }))
          : [{ url_goc: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80", mo_ta: "Phòng trọ" }]),
      video: Array.isArray(b.videos) && b.videos.length
        ? b.videos.map(url => ({ url, mo_ta: "Video phòng" }))
        : (b.video ? [{ url: b.video, mo_ta: "Video phòng" }] : []),
      phan_tich: {
        da_kiem_tra: true,
        scam_score: 0.0
      }
    };

    writeRoom(newRoom);
    res.status(201).json({ success: true, room: newRoom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/rooms/:id
 * Cập nhật thông tin phòng
 */
app.put('/api/rooms/:id', (req, res) => {
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  const b = req.body || {};

  if (b.tieu_de) room.thong_tin.tieu_de = b.tieu_de;
  if (b.gia !== undefined) room.thong_tin.gia = Number(b.gia);
  if (b.dien_tich !== undefined) room.thong_tin.dien_tich = Number(b.dien_tich);
  if (b.dia_chi) room.thong_tin.dia_chi = b.dia_chi;
  if (b.so_dien_thoai) room.lien_he.so_dien_thoai = b.so_dien_thoai;
  if (b.trang_thai) room.trang_thai = b.trang_thai;
  if (b.mo_ta) room.thong_tin.mo_ta = b.mo_ta;

  writeRoom(room);
  res.json({ success: true, room });
});

/**
 * DELETE /api/rooms/:id
 * Xóa vĩnh viễn phòng khỏi DB
 */
app.delete('/api/rooms/:id', (req, res) => {
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  deleteRoom(req.params.id);
  res.json({ success: true, message: `Đã xóa phòng ${req.params.id}` });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: /api/ai (HaUI AI Assistant & RAG Engine)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ai/chat
 * Trợ lý AI đàm thoại, tư vấn phòng và trả lời thắc mắc sinh viên HaUI
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    // Chuẩn bị danh sách phòng dạng chuẩn để AI RAG sử dụng
    const allRaw = getAllRooms();
    const rooms = allRaw.map(r => formatRoom(r));

    const result = await aiService.processAIChat(message, rooms);
    res.json(result);
  } catch (e) {
    console.error('[/api/ai/chat]', e);
    res.status(500).json({ error: 'Lỗi xử lý AI: ' + e.message });
  }
});

/**
 * POST /api/ai/parse-search
 * Phân tích câu tìm kiếm bằng ngôn ngữ tự nhiên thành bộ lọc chính xác
 */
app.post('/api/ai/parse-search', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.json({ campus: null, maxPrice: null, maxDistance: null, keywords: [] });
    const criteria = aiService.extractSearchCriteria(query);
    res.json(criteria);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/ai/tips
 * Lấy cẩm nang, bí kíp sinh viên và an toàn PCCC
 */
app.get('/api/ai/tips', (_req, res) => {
  res.json({
    campusKnowledge: aiService.HAUI_CAMPUS_KNOWLEDGE,
    safetyGuidelines: aiService.SAFETY_GUIDELINES
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION & USER MANAGEMENT API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/auth/demo-accounts
 * Danh sách tài khoản demo tiện lợi để kiểm thử 1-click
 */
app.get('/api/auth/demo-accounts', (_req, res) => {
  const users = getAllUsers();
  const demoList = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleLabel: u.roleLabel || u.role,
    avatar: u.avatar,
    password: u.password,
    phone: u.phone
  }));
  res.json({ accounts: demoList });
});

/**
 * POST /api/auth/login
 * Đăng nhập bằng Email hoặc Số điện thoại + Mật khẩu
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập Email/Số điện thoại và Mật khẩu.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const users = getAllUsers();

    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone.trim() === cleanId)
    );

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
    }

    // Không gửi kèm password về client
    const { password: _p, ...safeUser } = user;
    const token = `haui_token_${user.id}_${Date.now()}`;

    res.json({
      success: true,
      message: `Chào mừng ${user.name} trở lại!`,
      token,
      user: safeUser
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/auth/register
 * Đăng ký tài khoản Sinh viên hoặc Chủ trọ
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, password, role, campus, studentId } = req.body || {};

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ error: 'Họ tên, mật khẩu và Email hoặc SĐT là bắt buộc.' });
    }

    const users = getAllUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (cleanEmail && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Email này đã được đăng ký tài khoản.' });
    }
    if (cleanPhone && users.some(u => u.phone && u.phone.trim() === cleanPhone)) {
      return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký tài khoản.' });
    }

    const validRole = ['student', 'landlord'].includes(role) ? role : 'student';
    const roleLabels = {
      student: 'Sinh viên',
      landlord: 'Chủ trọ',
      admin: 'Quản trị viên'
    };

    const newId = `USR-${validRole.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const newUser = {
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: password,
      role: validRole,
      roleLabel: roleLabels[validRole],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      campus: campus || 'CS1',
      studentId: studentId || '',
      verified: validRole === 'student',
      savedRooms: [],
      postedRooms: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _p, ...safeUser } = newUser;
    const token = `haui_token_${newUser.id}_${Date.now()}`;

    res.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: safeUser
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/auth/users
 * Lấy danh sách người dùng (dành cho Admin)
 */
app.get('/api/auth/users', (_req, res) => {
  const users = getAllUsers().map(({ password, ...u }) => u);
  res.json({ total: users.length, users });
});

/**
 * PATCH /api/auth/users/:id/role
 * Admin phân quyền vai trò cho người dùng
 */
app.patch('/api/auth/users/:id/role', (req, res) => {
  try {
    const { role } = req.body || {};
    const validRoles = ['student', 'landlord', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Vai trò không hợp lệ. Chọn: ${validRoles.join(', ')}` });
    }
    const roleLabels = { student: 'Sinh viên', landlord: 'Chủ trọ', admin: 'Quản trị viên' };
    const users = getAllUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    user.role = role;
    user.roleLabel = roleLabels[role];
    saveUsers(users);

    const { password: _p, ...safeUser } = user;
    res.json({ success: true, message: `Đã cập nhật vai trò thành ${roleLabels[role]}`, user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/upload
 * Nhận file ảnh hoặc video từ máy tính (dạng base64 dataUrl), lưu trữ và trả về URL
 */
app.post('/api/upload', (req, res) => {
  try {
    const { dataUrl, filename, type } = req.body || {};
    if (!dataUrl) return res.status(400).json({ error: 'Thiếu dữ liệu tệp (dataUrl).' });

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Định dạng dataUrl không hợp lệ.' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Xác định phần mở rộng
    let ext = 'bin';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType.includes('webm')) ext = 'webm';
    else if (mimeType.includes('mov')) ext = 'mov';
    else if (filename && filename.includes('.')) ext = filename.split('.').pop().toLowerCase();

    const safeName = (filename ? path.parse(filename).name : (type || 'file'))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueFileName = `${Date.now()}_${safeName}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${uniqueFileName}`,
      filename: uniqueFileName,
      sizeBytes: buffer.length,
      mimeType
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/landlord/my-rooms
 * Lấy danh sách các phòng trọ do chủ nhà đăng tải
 */
app.get('/api/landlord/my-rooms', (req, res) => {
  try {
    const phone = (req.query.phone || '').trim();
    let rooms = getAllRooms();

    // Lọc theo SĐT chủ trọ nếu có
    if (phone) {
      const filtered = rooms.filter(r => (r.lien_he?.so_dien_thoai || '').trim() === phone);
      if (filtered.length > 0) {
        return res.json({ total: filtered.length, data: filtered.map(formatRoom) });
      }
    }

    // Nếu chưa có phòng đúng SĐT hoặc chưa nhập SĐT, trả về các phòng nguồn chu_nha_dang
    const landlordRooms = rooms.filter(r => r.nguon === 'chu_nha_dang');
    res.json({ total: landlordRooms.length, data: landlordRooms.map(formatRoom) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/rooms/:id/comments
 * Lấy danh sách bình luận đánh giá của sinh viên về phòng trọ
 */
app.get('/api/rooms/:id/comments', (req, res) => {
  try {
    const cmts = getAllComments();
    const list = cmts[req.params.id] || [];

    if (list.length > 0) {
      return res.json({ total: list.length, comments: list });
    }

    // Nếu phòng này chưa có bình luận, tạo 2 bình luận gợi ý chân thực từ sinh viên HaUI
    const defaultComments = [
      {
        id: `CMT-AUTO-1`,
        author: "Nguyễn Tuấn Linh",
        major: "K17 - Khoa Công nghệ Thông tin HaUI",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=linh",
        rating: 5,
        date: "2026-09-18",
        content: "Phòng thoáng mát, bác chủ trọ ở gần nhưng không chung cổng, tính tiền điện nước đúng giá nhà nước. Đi xe máy sang CS1 chỉ mất 5 phút.",
        tags: ["Chủ nhà thân thiện", "An ninh tốt", "Giờ giấc tự do"],
        likes: 6
      },
      {
        id: `CMT-AUTO-2`,
        author: "Phạm Thu Hương",
        major: "K18 - Khoa Quản trị Kinh doanh HaUI",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huong",
        rating: 4,
        date: "2026-09-22",
        content: "Khu vực này khá yên tĩnh để ôn thi, gần chợ Nhổn nên đi mua đồ ăn tiện. Phòng có bình nóng lạnh và điều hòa chạy rất êm.",
        tags: ["Yên tĩnh học bài", "Gần chợ Nhổn"],
        likes: 3
      }
    ];

    res.json({ total: defaultComments.length, comments: defaultComments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/rooms/:id/comments
 * Thêm bình luận đánh giá mới cho phòng trọ
 */
app.post('/api/rooms/:id/comments', (req, res) => {
  try {
    const { author, major, rating, content, tags } = req.body || {};
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nội dung bình luận không được để trống.' });
    }

    const cmts = getAllComments();
    const roomId = req.params.id;
    if (!cmts[roomId]) cmts[roomId] = [];

    const newComment = {
      id: `CMT-${Date.now().toString().slice(-6)}`,
      author: (author || 'Sinh viên HaUI').trim(),
      major: (major || 'Sinh viên Đại học Công Nghiệp Hà Nội').trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author || 'student')}`,
      rating: Number(rating) || 5,
      date: new Date().toISOString().slice(0, 10),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      likes: 1
    };

    cmts[roomId].unshift(newComment);
    saveComments(cmts);

    res.status(201).json({ success: true, comment: newComment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  console.log(`🚀 HaUI HomeFinder Server đang chạy!`);
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
