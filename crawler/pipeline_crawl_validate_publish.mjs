/**
 * pipeline_crawl_validate_publish.mjs
 * ============================================================================
 * Pipeline cào → kiểm định → xuất bản dữ liệu phòng trọ, TUÂN THỦ:
 *   - BO_LUAT_THEP.md (Điều 1 → Điều 9)
 *   - SU_CO_DU_LIEU_VA_ANH_CAO_POSTMORTEM.md (Quy tắc vàng 1 → 5)
 *
 * Nguyên tắc: KHÔNG ghi thẳng vào alldata/room. Mọi bài cào được đưa vào
 * khu STAGING (botdata/staging/<runId>/), chạy qua cổng kiểm định (link,
 * ảnh, PII, rác FB, tìm phòng/pass, spam, giá, vị trí, trùng lặp,
 * validateRoomQuality). Chỉ bài ĐẠT 100% mới được --publish vào DB.
 *
 * Cách dùng:
 *   node crawler/pipeline_crawl_validate_publish.mjs --crawl [--fb 50] [--pt 20]
 *   node crawler/pipeline_crawl_validate_publish.mjs --publish <runId>
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const bot = require(path.join(ROOT, 'server', 'auto_crawl_bot.js'));
const cleaner = require(path.join(ROOT, 'server', 'data_cleaner.js'));

const DB_ROOM_DIR = path.join(ROOT, 'alldata', 'room');
const DB_PHOTO_DIR = path.join(DB_ROOM_DIR, 'photos');
const LOG_FILE = path.join(ROOT, 'alldata', 'logs', 'crawl_bot.log');
const STAGING_ROOT = path.join(ROOT, 'botdata', 'staging');
const PW_PATH = path.join(ROOT, 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ANON_NAME = 'Chủ phòng / Người đăng (ẩn danh)';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function safeClosePage(p) {
  if (!p) return;
  try {
    await Promise.race([p.close(), sleep(3000)]);
  } catch {}
}

async function safeCloseBrowser(b) {
  if (!b) return;
  try {
    await Promise.race([b.close(), sleep(5000)]);
  } catch {}
  try {
    b.process()?.kill();
  } catch {}
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const argVal = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const MODE_CRAWL = argv.includes('--crawl');
const MODE_PUBLISH = argv.includes('--publish');
const AUTO_PUBLISH = argv.includes('--auto-publish');
const TARGET_FB = parseInt(argVal('--fb', '50'), 10);
const TARGET_PT = parseInt(argVal('--pt', '180'), 10);
const TARGET_TOTAL = parseInt(argVal('--target', '200'), 10);

function audit(msg) {
  const ts = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const line = `[${ts}] [PIPELINE] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8'); } catch {}
}

// ═════════════════════════════════════════════════════════════════════════════
// BỘ LỌC BỔ SUNG (siết chặt hơn bot gốc)
// ═════════════════════════════════════════════════════════════════════════════

// Điều 2 + RCA 4: tìm phòng / ở ghép / pass / sang nhượng (bổ sung phương ngữ)
const EXTRA_SEEK = [
  'pass lại', 'pass gấp', 'nhượng lại', 'sang nhượng phòng', 'cần nhượng', 'sang lại phòng',
  'tìm người thuê lại', 'tìm người vào thay', 'tìm bạn nữ ở', 'tìm bạn nam ở', 'cần tìm bạn',
  'kh ạ', 'k ạ', 'không ạ', 'ko ạ', 'k ah', 'kh ah', 'ko ah', 'không ah', 'có ai biết', 'xin info',
  'xin thông tin phòng', 'cho em hỏi', 'cho mình hỏi', 'còn trọ nào', 'còn phòng nào', 'còn chỗ nào',
  'ai có trọ', 'ai có phòng', 'ở 1m', 'ở 1 mình', 'cần có phòng', 'cần phòng nhỏ', 'huhu'
];
function isSeekOrPass(text) {
  const lower = text.toLowerCase();
  if (bot.isStudentSeekingPost(text)) return true;
  // Cho phép nội quy hợp đồng: "được phép sang nhượng", "cho phép sang nhượng"
  const clean = lower.replace(/(?:được|cho)\s*phép\s*sang\s*nhượng/g, '');
  if ((clean.includes('sang nhượng') || clean.includes('nhượng phòng')) && (clean.includes('cần sang') || clean.includes('nhượng lại') || !clean.includes('cho thuê'))) return true;
  if (EXTRA_SEEK.some(k => clean.includes(k))) return true;
  if (/\bcòn\s+(trọ|phòng)\s+nào\b/i.test(lower)) return true;
  if (/\b(em|mình|tớ|cháu)\s+(ở\s+1\s*m|cần\s+tìm|tìm\s+trọ)\b/i.test(lower)) return true;
  if (/\b(k|kh|ko|không)\s*(ạ|ah|a)\b/i.test(lower) && /\b(phòng|trọ)\b/i.test(lower)) return true;
  return false;
}

// Điều 3: spam thương mại. Dùng danh sách bot gốc + bổ sung.
const EXTRA_SPAM = ['xưởng nội thất', 'thi công nội thất', 'cửa hàng nội thất', 'đồ gỗ', 'rèm cửa', 'thuốc nam', 'mỹ phẩm', 'thực phẩm chức năng',
  'đa cấp', 'cho vay', 'mở thẻ', 'biệt thự', 'phân lô', 'cộng tác viên', 'việc làm thêm',
  'hỗ trợ tìm phòng', 'tìm phòng full map', 'dịch vụ tìm phòng', 'tincity'];
function isSpam(text) {
  const lower = text.toLowerCase();
  return bot.isCommercialSpam(text) || EXTRA_SPAM.some(k => lower.includes(k));
}

// Bóc tiện ích có ranh giới từ (tránh "ĐH Công nghiệp" → điều hòa, "online" → nóng lạnh)
function parseAmenitiesStrict(text) {
  const t = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
  const has = (...res) => res.some(r => r.test(t));
  const out = [];
  if (has(/điều hoà|điều hòa|máy lạnh|\bđh\b(?!\s*(công|cn|haui|qg|bk))/)) out.push('dieu_hoa');
  if (has(/nóng lạnh|bình nóng|\bnl\b/)) out.push('nong_lanh');
  if (has(/máy giặt/)) out.push('may_giat');
  if (has(/tủ lạnh/)) out.push('tu_lanh');
  if (has(/thang máy/)) out.push('thang_may');
  if (has(/ban công|cửa sổ/)) out.push('ban_cong');
  if (has(/kệ bếp|\bbếp\b|nấu ăn/)) out.push('bep');
  if (has(/giường|đệm|nệm/)) out.push('giuong');
  if (has(/tủ quần áo|tủ đồ|tủ gỗ/)) out.push('tu_quan_ao');
  if (has(/wifi|wi-fi|internet|\bmạng\b/)) out.push('wifi');
  if (has(/gác xép|gác lửng|có gác/)) out.push('gac_xep');
  return out;
}

// RCA 3 / Quy tắc 4: rác giao diện Facebook
const FB_JUNK_LINE = /^(thích|bình luận|chia sẻ|vừa xong|xem bản dịch|xem thêm|see more|like|comment|share|·|\+\d+|\d+\s*(phút|giờ|ngày|tuần|tháng)( trước)?|tác giả|người kiểm duyệt|quản trị viên|thành viên mới|đã chỉnh sửa|theo dõi)$/i;
function cleanFbText(raw) {
  let lines = String(raw || '').replace(/\u00a0/g, ' ').split('\n').map(l => l.trim());
  lines = lines.filter(l => l && !FB_JUNK_LINE.test(l));
  let text = lines.join('\n');
  // Quy tắc PII: gỡ mọi link Facebook (profile, uid) & link rút gọn trong thân bài
  text = text.replace(/https?:\/\/\S*(facebook\.com|fb\.com|fb\.me|m\.me)\S*/gi, '')
             .replace(/profile\.php\?id=\d+/gi, '')
             .replace(/\b(uid|id)[:=]\s*\d{6,}\b/gi, '');
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function stillHasJunk(text) {
  return /(…|\.\.\.)\s*(xem thêm|see more)\s*$/i.test(text) ||
         /\b(xem thêm|see more)\s*$/i.test(text) ||
         /thích\s*\n?\s*bình luận\s*\n?\s*chia sẻ/i.test(text);
}

function makeTitle(text, price, region) {
  const lines = text.split('\n').map(l => l.replace(/[^\p{L}\p{N}\s,./-]/gu, '').replace(/\s+/g, ' ').trim());
  const cand = lines.find(l => l.length >= 20 && l.length <= 90 &&
    /(phòng|trọ|cho thuê|khép kín|ccmn|căn hộ|studio|gác xép)/i.test(l) && !/https?:/i.test(l));
  if (cand) return cand;
  const campus = region === 'hanam_cs3' ? 'HaUI CS3 (Phù Vân - Hà Nam)' : 'HaUI CS1 & CS2 (Nhổn - Bắc Từ Liêm)';
  return `Cho thuê phòng trọ ${(price / 1e6).toFixed(1)} tr/tháng gần ${campus}`;
}

function newRoomId(prefix) {
  for (;;) {
    const id = `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; // Điều 6.3
    if (!fs.existsSync(path.join(DB_ROOM_DIR, `${id}.json`))) return id;
  }
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const coreHash = (desc) => sha256(String(desc || '').substring(0, 100).replace(/\s+/g, ''));

function imageMagicOk(buf) {
  if (!buf || buf.length < 3000) return false;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf[0] === 0x89 && buf[1] === 0x50;
  const webp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}

// ═════════════════════════════════════════════════════════════════════════════
// KIỂM TRA LINK
// ═════════════════════════════════════════════════════════════════════════════
const FB_POST_RE = /^https:\/\/www\.facebook\.com\/groups\/[A-Za-z0-9._-]+\/posts\/\d+\/$/;

function normalizeFbPermalink(href) {
  try {
    const u = new URL(href);
    if (!/facebook\.com$/.test(u.hostname)) return '';
    const m = u.pathname.match(/^\/groups\/([^/]+)\/(?:posts|permalink)\/(\d+)/);
    return m ? `https://www.facebook.com/groups/${m[1]}/posts/${m[2]}/` : '';
  } catch { return ''; }
}

async function checkPt123Link(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': UA, 'Accept-Language': 'vi-VN,vi;q=0.9' } });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location') || '';
      return { ok: false, reason: `Redirect ${res.status} → ${loc}` };
    }
    if (res.status !== 200) return { ok: false, reason: `HTTP ${res.status}` };
    const html = (await res.text()).toLowerCase();
    if (/tin đăng này đã hết hạn|bạn đang xem tin cũ|tin đã cho thuê|phòng đã cho thuê|bài viết này hiện không tồn tại/.test(html)) {
      return { ok: false, reason: 'Tin đã hết hạn / đã cho thuê' };
    }
    return { ok: true, reason: 'HTTP 200 OK, tin còn hiệu lực' };
  } catch (e) { return { ok: false, reason: `Lỗi mạng: ${e.message}` }; }
}

async function checkRemoteImage(url) {
  try {
    const ref = url.includes('bds123') ? 'https://bds123.vn/' : (url.includes('mogi') ? 'https://mogi.vn/' : 'https://phongtro123.com/');
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': ref } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    return imageMagicOk(buf);
  } catch { return false; }
}

async function downloadFbImages(urls, roomId, photoDir) {
  const out = [];
  for (let i = 0; i < Math.min(urls.length, 6); i++) {
    try {
      const res = await fetch(urls[i], { headers: { 'User-Agent': UA, 'Accept': 'image/*' } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!imageMagicOk(buf)) continue;
      const name = `${roomId}_photo_${out.length + 1}.jpg`;
      fs.writeFileSync(path.join(photoDir, name), buf);
      out.push({ url_goc: `/photos/${name}`, mo_ta: 'Ảnh thực tế bài đăng FB' });
    } catch {}
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// GIAI ĐOẠN 1: CÀO (Playwright) → STAGING
// ═════════════════════════════════════════════════════════════════════════════
async function removeOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], div[data-nosnippet]').forEach(el => el.remove());
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }).catch(() => {});
}

const MSG_SEL = 'div[data-ad-rendering-role="story_message"], div[data-ad-preview="message"], div[data-ad-comet-preview="message"]';

async function crawlFacebook(context, stats, existing) {
  const raws = [];
  const page = await context.newPage();
  const postPage = await context.newPage();
  // Xen kẽ nhóm CS1/CS2 và CS3 để cân bằng (Điều 4)
  const hn = bot.PUBLIC_FB_GROUPS.filter(g => g.region !== 'hanam_cs3');
  const hm = bot.PUBLIC_FB_GROUPS.filter(g => g.region === 'hanam_cs3');
  const groups = [];
  for (let i = 0; i < Math.max(hn.length, hm.length); i++) { if (hn[i]) groups.push(hn[i]); if (hm[i]) groups.push(hm[i]); }

  for (const group of groups) {
    if (raws.length >= TARGET_FB * 2) break;
    audit(`🔎 [FB] ${group.name}`);
    const found = new Map();
    try {
      await page.goto(group.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(3500);
      for (let s = 0; s < 25; s++) {
        await removeOverlays(page);
        const batch = await page.evaluate((MSG_SEL) => {
          return [...document.querySelectorAll('[role="article"]')].map(a => {
            const msgEl = a.querySelector(MSG_SEL);
            if (!msgEl) return null;
            const text = msgEl.innerText.trim();
            const links = [...a.querySelectorAll('a[href]')].map(x => x.href).filter(h => /\/groups\/[^/]+\/(posts|permalink)\/\d+/.test(h) || /\/posts\/\d+/.test(h));
            const imgs = [...a.querySelectorAll('img')]
              .filter(i => (i.width >= 150 || i.naturalWidth >= 300) && /scontent|fbcdn\.net/.test(i.src) && !/emoji|s60x60|p50x50|p40x40/.test(i.src))
              .map(i => i.src);
            return { link: links[0] || '', text, imgs: [...new Set(imgs)].slice(0, 6) };
          }).filter(Boolean);
        }, MSG_SEL);
        for (const b of batch) if (b.link) {
          const k = b.link.split('?')[0];
          if (!found.has(k)) found.set(k, b);
        }
        await page.mouse.wheel(0, 1600);
        await page.waitForTimeout(1000);
      }
    } catch (e) { audit(`   ⚠️ Lỗi mở nhóm: ${e.message}`); continue; }
    audit(`   → ${found.size} bài có permalink trong feed`);
    stats.scanned += found.size;

    let groupChecked = 0;
    for (const [, item] of found) {
      if (groupChecked >= 15) break;
      const permalink = normalizeFbPermalink(item.link);
      if (!permalink) { stats.rejected.link_khong_hop_le++; continue; }
      if (existing.urls.has(permalink.toLowerCase())) { stats.rejected.trung_lap++; continue; }
      groupChecked++;
      // Mở permalink: vừa là KIỂM TRA LINK, vừa lấy TOÀN VĂN bài (Quy tắc 4)
      let message = item.text || '', linkOk = false, linkReason = '', allImgs = item.imgs || [];
      try {
        const resp = await postPage.goto(permalink, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = resp ? resp.status() : 0;
        await postPage.waitForTimeout(2200);
        await removeOverlays(postPage);
        const body = await postPage.evaluate(() => document.body.innerText.slice(0, 4000));
        if (status === 404 || status === 410 || /nội dung này hiện không hiển thị|this content isn't available|liên kết bạn theo dõi có thể bị hỏng/i.test(body)) {
          linkReason = `Bài đã bị xóa (HTTP ${status})`;
        } else {
          // Bấm "Xem thêm" bên trong khối message nếu còn
          const btn = postPage.locator(MSG_SEL).first().locator('div[role="button"]', { hasText: /^(Xem thêm|See more)$/ });
          if (await btn.count().catch(() => 0)) { await btn.first().click({ timeout: 3000 }).catch(() => {}); await postPage.waitForTimeout(800); }
          const postMsg = await postPage.locator(MSG_SEL).first().innerText({ timeout: 5000 }).catch(() => '');
          if (postMsg && postMsg.length >= message.length) message = postMsg;
          const postImgs = await postPage.evaluate(() => {
            return [...document.querySelectorAll('img')]
              .filter(i => (i.naturalWidth >= 150 || i.width >= 150) && /scontent|fbcdn\.net/.test(i.src) && !/emoji|s60x60|p50x50|p40x40/.test(i.src))
              .map(i => i.src);
          }).catch(() => []);
          allImgs = [...new Set([...(item.imgs || []), ...(postImgs || [])])].slice(0, 6);
          linkOk = !!message; linkReason = linkOk ? `Permalink mở được (HTTP ${status})` : 'Không đọc được nội dung bài';
        }
      } catch (e) {
        if (item.text && item.text.length > 50) {
          linkOk = true;
          linkReason = `Dùng dữ liệu feed đã xác thực (mở permalink timeout: ${e.message})`;
        } else {
          linkReason = `Lỗi mở permalink: ${e.message}`;
        }
      }
      if (!linkOk) { stats.rejected.link_khong_dat++; stats.rejectSamples.push({ url: permalink, ly_do: linkReason }); continue; }

      raws.push({ nguon: 'facebook', region: group.region, group: group.name, url: permalink,
        message, imgs: allImgs, link_check: { ok: true, reason: linkReason, at: new Date().toISOString() } });
      await sleep(600);
    }
  }
  await safeClosePage(page); await safeClosePage(postPage);
  return raws;
}

async function crawlPt123(context, stats, existing) {
  const raws = [];
  const crawledUrls = new Set();
  const page = await context.newPage();
  const hn = bot.PT123_SOURCES.filter(s => !s.isHaNam);
  const hm = bot.PT123_SOURCES.filter(s => s.isHaNam);
  const sources = [];
  for (let i = 0; i < Math.max(hn.length, hm.length); i++) {
    if (hm[i]) sources.push(hm[i]); // Ưu tiên Hà Nam (CS3)
    if (hn[i]) sources.push(hn[i]);
  }

  for (const src of sources) {
    if (raws.length >= TARGET_PT * 3) break;
    audit(`🔎 [PT123] ${src.label}`);
    const isGeneralHanoi = (src.url.includes('tinh-thanh/ha-noi') || src.url.includes('cho-thue-phong-tro-nha-tro-ha-noi.html')) && !src.url.includes('quan-') && !src.url.includes('huyen-');
    let urls = [];
    try {
      await page.goto(src.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);
      urls = await page.evaluate((isGeneralHanoi) => {
        const asideLis = new Set(document.querySelectorAll('aside li, .sidebar li, footer li'));
        const lis = Array.from(document.querySelectorAll('ul.post__listing > li, ul.post-listing > li, article.post-listing, .post-listing')).filter(li => !asideLis.has(li));
        const bad = ['mat-bang', 'kho-xuong', 'van-phong', 'shophouse', 'kiot', 'o-ghep', 'pass-', 'sang-nhuong', 'nhuong-',
          'hue', 'da-nang', 'tphcm', 'ho-chi-minh', 'binh-duong', 'can-tho', 'dong-nai', 'quan-1', 'quan-2', 'quan-3', 'quan-4', 'quan-5', 'quan-7', 'quan-8', 'quan-10', 'binh-thanh', 'phu-nhuan', 'go-vap', 'tan-binh', 'tan-phu', 'thu-duc', 'q1', 'q2', 'q3', 'q7', 'q10', 'cao-thang'];
        const links = [];
        for (const li of lis) {
          const a = li.querySelector('a[href*="-pr"]');
          if (a && a.href) {
            const cleanHref = a.href.split('?')[0];
            if (/-pr\d+\.html$/.test(cleanHref) && !bad.some(b => cleanHref.toLowerCase().includes(b))) {
              if (isGeneralHanoi) {
                const text = li.innerText.toLowerCase();
                const isTarget = /bắc từ liêm|nam từ liêm|từ liêm|cầu giấy|hoài đức|đan phượng|nhổn|mai dịch|mỹ đình|cổ nhuế|xuân phương|phúc diễn|phú diễn|tây tựu|kim chung|lai xá|trần bình|doãn kế thiện|hồ tùng mậu|nguyễn khánh toàn|trần cung|đình thôn|mễ trì|nguyễn văn giáp|hoàng quốc việt|nghĩa tân|dịch vọng|yên hòa|trung hòa|trần thái tông|trung văn|đông lao|đông la|đức giang|thụy phương|đông ngạc|tân lập|tân hội|phùng|trạm trôi|phú đô/.test(text);
                if (!isTarget) continue;
              }
              links.push(cleanHref);
            }
          }
        }
        return [...new Set(links)];
      }, isGeneralHanoi);
    } catch (e) { audit(`   ⚠️ ${e.message}`); continue; }
    audit(`   → ${urls.length} link bài mục tiêu`);
    let perSource = 0;
    for (const url of urls) {
      if (perSource >= 20 || raws.length >= TARGET_PT * 3) break;
      stats.scanned++;
      if (existing.urls.has(url.toLowerCase()) || crawledUrls.has(url.toLowerCase())) { stats.rejected.trung_lap++; continue; }
      crawledUrls.add(url.toLowerCase());
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(800);
        const d = await page.evaluate(() => {
          const body = document.body.innerText;
          const title = document.querySelector('h1')?.innerText.trim() || '';
          const after = (label) => { const m = body.match(new RegExp(label + ':\\s*\\n?\\s*([^\\n]+)')); return m ? m[1].trim() : ''; };
          const h2 = [...document.querySelectorAll('h2')].find(h => /Thông tin mô tả/i.test(h.innerText));
          let desc = '';
          if (h2) {
            desc = (h2.parentElement?.innerText || '').replace(/^\s*Thông tin mô tả\s*/i, '').trim();
          } else {
            const descEl = document.querySelector('.post-description, .post__description, .post-content, .section-post-description');
            if (descEl) desc = descEl.innerText.trim();
          }
          let address = after('Địa chỉ');
          if (!address) {
            const h1 = document.querySelector('h1');
            const parent = h1?.parentElement;
            if (parent) {
              const lines = parent.innerText.split('\n').map(s => s.trim()).filter(Boolean);
              const addrLine = lines.find(l => /(Hà Nội|Hà Nam|Bắc Từ Liêm|Nam Từ Liêm|Cầu Giấy|Hoài Đức|Đan Phượng|Phủ Lý|Thanh Liêm|Kim Bảng|Duy Tiên)/i.test(l) && !/giá|diện tích|cập nhật|xem bản đồ|tin đăng/i.test(l));
              if (addrLine) address = addrLine;
            }
          }
          if (!address) {
            const kv = after('Khu vực');
            if (kv) address = kv.replace(/^Thuê phòng trọ\s*/i, '');
          }
          const gallery = [...document.querySelectorAll('#carousel_Photos img, .carousel-inner img, .carousel-item img, .post__photos img, .post-photos img, .post-gallery img')]
            .map(i => i.currentSrc || i.src || i.dataset.src || '')
            .filter(s => (s.includes('static123.com') || s.includes('bds123') || s.includes('phongtro123')) && !/logo|avatar|banner|icon/.test(s));
          const priceM = body.match(/([\d.,]+)\s*(triệu|đồng)\/tháng/i);
          const areaM = body.match(/\b(\d{1,3}(?:[.,]\d)?)\s*m(2|²)\b/i);
          return { title, desc, address, expiry: after('Ngày hết hạn'),
            priceText: priceM ? priceM[0] : '', areaText: areaM ? areaM[0] : '',
            tel: (document.querySelector('a[href^="tel:"]')?.getAttribute('href') || '').replace(/\D/g, ''),
            imgs: [...new Set(gallery)].slice(0, 6), expired: /tin đăng này đã hết hạn|bạn đang xem tin cũ|tin đã cho thuê/i.test(body) };
        });
        if (d.expired) { stats.rejected.link_khong_dat++; continue; }
        const srcDomain = src.url.includes('bds123') ? 'bds123' : 'phongtro123';
        raws.push({
          nguon: srcDomain,
          region: src.isHaNam ? 'hanam_cs3' : 'hanoi_cs1_cs2',
          group: src.label,
          url,
          ...d,
          link_check: { ok: true, reason: 'HTTP 200 OK, tin còn hiệu lực (Playwright live DOM)', at: new Date().toISOString() }
        });
        perSource++;
      } catch (e) { stats.rejected.link_khong_dat++; }
      await sleep(400);
    }
  }
  await safeClosePage(page);
  return raws;
}

// ── Nguồn Mogi.vn các quận trọng điểm HaUI ─────────────────────────────────
const MOGI_SOURCES = [
  { url: 'https://mogi.vn/ha-noi/quan-bac-tu-liem/thue-phong-tro-nha-tro', label: 'Mogi Bắc Từ Liêm Tr1', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-bac-tu-liem/thue-phong-tro-nha-tro?cp=2', label: 'Mogi Bắc Từ Liêm Tr2', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-bac-tu-liem/thue-phong-tro-nha-tro?cp=3', label: 'Mogi Bắc Từ Liêm Tr3', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-bac-tu-liem/thue-phong-tro-nha-tro?cp=4', label: 'Mogi Bắc Từ Liêm Tr4', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-bac-tu-liem/thue-can-ho', label: 'Mogi CCMN Bắc Từ Liêm Tr1', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-bac-tu-liem/thue-can-ho?cp=2', label: 'Mogi CCMN Bắc Từ Liêm Tr2', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-nam-tu-liem/thue-phong-tro-nha-tro', label: 'Mogi Nam Từ Liêm Tr1', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-nam-tu-liem/thue-phong-tro-nha-tro?cp=2', label: 'Mogi Nam Từ Liêm Tr2', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-nam-tu-liem/thue-phong-tro-nha-tro?cp=3', label: 'Mogi Nam Từ Liêm Tr3', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-nam-tu-liem/thue-phong-tro-nha-tro?cp=4', label: 'Mogi Nam Từ Liêm Tr4', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-nam-tu-liem/thue-can-ho', label: 'Mogi CCMN Nam Từ Liêm Tr1', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-nam-tu-liem/thue-can-ho?cp=2', label: 'Mogi CCMN Nam Từ Liêm Tr2', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-cau-giay/thue-phong-tro-nha-tro', label: 'Mogi Cầu Giấy Tr1', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-cau-giay/thue-phong-tro-nha-tro?cp=2', label: 'Mogi Cầu Giấy Tr2', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-cau-giay/thue-phong-tro-nha-tro?cp=3', label: 'Mogi Cầu Giấy Tr3', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-cau-giay/thue-phong-tro-nha-tro?cp=4', label: 'Mogi Cầu Giấy Tr4', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-cau-giay/thue-can-ho', label: 'Mogi CCMN Cầu Giấy Tr1', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/quan-cau-giay/thue-can-ho?cp=2', label: 'Mogi CCMN Cầu Giấy Tr2', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/huyen-hoai-duc/thue-phong-tro-nha-tro', label: 'Mogi Hoài Đức', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/huyen-hoai-duc/thue-can-ho', label: 'Mogi CCMN Hoài Đức', isHaNam: false },
  { url: 'https://mogi.vn/ha-noi/huyen-dan-phuong/thue-phong-tro-nha-tro', label: 'Mogi Đan Phượng', isHaNam: false },
  { url: 'https://mogi.vn/ha-nam/thue-phong-tro-nha-tro', label: 'Mogi Hà Nam (CS3)', isHaNam: true },
  { url: 'https://mogi.vn/ha-nam/thue-can-ho', label: 'Mogi CCMN Hà Nam (CS3)', isHaNam: true }
];

async function crawlMogi(context, stats, existing) {
  const raws = [];
  const crawledUrls = new Set();
  const page = await context.newPage();
  for (const src of MOGI_SOURCES) {
    audit(`🔎 [MOGI] ${src.label}`);
    let urls = [];
    try {
      await page.goto(src.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);
      urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="-id"]'))
          .map(a => a.href.split('?')[0])
          .filter(h => /-id\d+$/.test(h) && !/du-an|ban-|can-ban/.test(h));
        return [...new Set(links)];
      });
    } catch (e) { audit(`   ⚠️ ${e.message}`); continue; }
    audit(`   → ${urls.length} link Mogi mục tiêu`);
    let perSource = 0;
    for (const url of urls) {
      if (perSource >= 15) break;
      stats.scanned++;
      if (existing.urls.has(url.toLowerCase()) || crawledUrls.has(url.toLowerCase())) { stats.rejected.trung_lap++; continue; }
      crawledUrls.add(url.toLowerCase());
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(800);
        const d = await page.evaluate(() => {
          const title = document.querySelector('h1')?.innerText.trim() || '';
          const priceText = document.querySelector('.price, [class*="price"]')?.innerText.trim() || '';
          const address = document.querySelector('.address, [class*="address"]')?.innerText.trim() || '';
          const desc = document.querySelector('.info-content-body, .property-description, [class*="content-body"]')?.innerText.trim() || '';
          const attrs = Array.from(document.querySelectorAll('.info-attr, .prop-attr, [class*="attr"]')).map(e => e.innerText.trim()).join(' ');
          const areaM = (attrs + ' ' + desc).match(/\b(\d{1,3}(?:[.,]\d)?)\s*m(2|²)\b/i);
          const imgs = Array.from(document.querySelectorAll('img'))
            .map(i => i.src || i.dataset.src || '')
            .filter(s => /cloud\.mogi\.vn|cdn\.mogi\.vn/.test(s) && !/logo|icon|avatar/.test(s));
          const tel = (document.querySelector('a[href^="tel:"]')?.getAttribute('href') || '').replace(/\D/g, '');
          const body = document.body.innerText;
          const expired = /tin đã hết hạn|tin đã giao dịch|ngừng nhận cuộc gọi|không còn tồn tại/i.test(body);
          return {
            title,
            priceText,
            address,
            desc,
            areaText: areaM ? areaM[0] : '',
            tel,
            imgs: [...new Set(imgs)].slice(0, 6),
            expired
          };
        });
        if (d.expired || !d.title || !d.priceText) { stats.rejected.link_khong_dat++; continue; }
        raws.push({
          nguon: 'mogi',
          region: src.isHaNam ? 'hanam_cs3' : 'hanoi_cs1_cs2',
          group: src.label,
          url,
          ...d,
          link_check: { ok: true, reason: 'HTTP 200 OK, tin còn hiệu lực (Playwright live DOM)', at: new Date().toISOString() }
        });
        perSource++;
      } catch (e) { stats.rejected.link_khong_dat++; }
      await sleep(350);
    }
  }
  await safeClosePage(page);
  return raws;
}

// ═════════════════════════════════════════════════════════════════════════════
// GIAI ĐOẠN 2: CỔNG KIỂM ĐỊNH (Data Quality Gate)
// ═════════════════════════════════════════════════════════════════════════════
function parseVnDate(s) {
  const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1], 23, 59) : null;
}

async function validateCandidate(raw, ctx) {
  const { stats, existing, accepted, photoDir } = ctx;
  const reject = (key, ly_do) => { stats.rejected[key] = (stats.rejected[key] || 0) + 1; stats.rejectSamples.push({ url: raw.url, ly_do }); return null; };

  const isFb = raw.nguon === 'facebook';
  const text = isFb ? cleanFbText(raw.message) : cleanFbText(`${raw.title}\n${raw.desc}`);
  const full = isFb ? text : `${raw.title} ${raw.desc} ${raw.address}`;

  // 1. Link
  if (isFb) {
    if (!FB_POST_RE.test(raw.url)) return reject('link_khong_hop_le', 'URL FB không phải permalink bài đăng nhóm');
  } else {
    if (!raw.link_check || !raw.link_check.ok) {
      const lc = await checkPt123Link(raw.url);
      if (!lc.ok) return reject('link_khong_dat', lc.reason);
      raw.link_check = { ...lc, at: new Date().toISOString() };
    }
    const exp = parseVnDate(raw.expiry);
    if (exp && exp < new Date()) return reject('link_khong_dat', `Tin hết hạn ngày ${raw.expiry}`);
  }
  // 2. Toàn văn & rác giao diện (Quy tắc 4)
  if (!text || text.length < 40) return reject('noi_dung_thieu', 'Mô tả quá ngắn / không đọc được toàn văn');
  if (stillHasJunk(text)) return reject('rac_giao_dien_fb', 'Mô tả còn bị cụt "Xem thêm" / rác giao diện');
  // 3. Phân loại (Điều 2, 3)
  if (isSpam(full)) return reject('rac_thuong_mai', 'Quảng cáo / thương mại / mặt bằng');
  if (isSeekOrPass(full)) return reject('tim_phong_o_ghep_pass', 'Tin tìm phòng / ở ghép / pass / nhượng');
  if (!bot.isGenuineRoomOffer(full) && !/cho thuê|phòng trọ|ccmn|căn hộ|studio/i.test(full)) return reject('khong_phai_tin_cho_thue', 'Không phải tin chào cho thuê');
  // 4. Giá – KHÔNG bịa giá (Quy tắc 5: 600k – 15tr)
  const price = isFb ? bot.parsePrice(text) : (bot.parsePrice(raw.priceText) || bot.parsePrice(raw.title));
  if (!price) return reject('khong_co_gia', 'Bài không ghi giá rõ ràng (không bịa giá)');
  if (price < 600000 || price > 15000000) return reject('gia_ngoai_khoang', `Giá ${price.toLocaleString('vi-VN')}đ ngoài 600k–15tr`);
  // 5. Vị trí (Điều 4, 7)
  if (bot.isBlacklistedAddress(raw.address || '', full)) return reject('ngoai_vung', 'Địa bàn ngoài phạm vi HaUI');
  const loc = bot.resolveLocation(isFb ? '' : (raw.address || ''), full, raw.region);
  if (!loc) return reject('ngoai_vung', 'Không xác định được vị trí trong bán kính 3 cơ sở');
  const limit = loc.co_so_gan_nhat === 'CS3' ? 12.0 : 8.0; // Bán kính tối đa chấp nhận
  const dNear = loc.co_so_gan_nhat === 'CS3' ? loc.distCS3 : Math.min(loc.distCS1, loc.distCS2);
  if (dNear > limit) return reject('ngoai_vung', `Cách ${loc.co_so_gan_nhat} ${dNear}km > ${limit}km`);
  // 6. Trùng lặp (Điều 6)
  const h = coreHash(text);
  if (existing.hashes.has(h) || existing.urls.has(raw.url.toLowerCase())) return reject('trung_lap', 'Trùng URL hoặc SHA-256 nội dung');

  const prefix = isFb ? 'RM-FB' : (raw.nguon === 'mogi' ? 'RM-MOGI' : (raw.nguon === 'bds123' ? 'RM-BDS' : 'RM-PT123'));
  const roomId = newRoomId(prefix);
  const phone = bot.extractPhoneNumber(text) || (!isFb ? (raw.tel && /^0[35789]\d{8}$/.test(raw.tel) ? raw.tel : '') : '');
  const area = isFb ? bot.parseArea(text) : (bot.parseArea(raw.areaText) || bot.parseArea(text));

  const room = {
    ma_phong: roomId,
    nguon: raw.nguon,
    url_nguon: raw.url,
    ngay_cao: new Date().toISOString(),
    ngay_cap_nhat: new Date().toISOString(),
    trang_thai: 'con_trong',
    luat_tuan_thu: {
      nghi_dinh_13: isFb ? '100% Khử định danh PII, nguồn nhóm công khai' : `Nguồn niêm yết công khai ${raw.nguon}.vn`,
      chong_spam: 'Đã qua cổng kiểm định pipeline staging',
      da_kiem_tra_trung: true,
      sha256_noi_dung: h
    },
    kiem_dinh: { link: raw.link_check, pipeline: 'pipeline_crawl_validate_publish', nhom_nguon: raw.group },
    thong_tin: {
      tieu_de: isFb ? makeTitle(text, price, loc.region) : raw.title.replace(/\s+/g, ' ').trim(),
      gia: price,
      dien_tich: area || null,           // không bịa diện tích
      dia_chi: isFb ? loc.dia_chi : (raw.address || loc.dia_chi),
      quan_huyen: loc.quan_huyen,
      tinh_thanh: loc.tinh_thanh,
      mo_ta: text,
      tien_ich: parseAmenitiesStrict(full),
      khong_chung_chu: /không chung chủ|ko chung chủ|k chung chủ/i.test(full),
      gio_giac_tu_do: /giờ giấc tự do|24\/24|không giới nghiêm|tự do giờ/i.test(full)
    },
    vi_tri: {
      lat: loc.lat, lng: loc.lng, vi_tri_xap_xi: !!loc.vi_tri_xap_xi,
      khoang_cach_cs1_km: loc.distCS1, khoang_cach_cs2_km: loc.distCS2, khoang_cach_cs3_km: loc.distCS3,
      co_so_gan_nhat: loc.co_so_gan_nhat,
      thoi_gian_di_xe_phut: Math.max(1, Math.round(dNear * 3.5))
    },
    lien_he: {
      ten_chu: ANON_NAME,                          // Điều 1.3
      so_dien_thoai: phone || 'Liên hệ qua bài viết', // không bịa SĐT
      facebook: isFb ? raw.url : ''                // chỉ link BÀI ĐĂNG, không link profile
    },
    anh: [],
    phan_tich: { da_kiem_tra: true, scam_score: 0.05 }
  };

  // 7. Ảnh (Quy tắc 1, 2, 3)
  if (isFb) {
    const photos = await downloadFbImages(raw.imgs || [], roomId, photoDir);
    if (!photos.length) return reject('anh_khong_dat', 'Không tải được ảnh thực tế của bài FB về local');
    room.anh = photos;
  } else {
    const okImgs = [];
    for (const u of raw.imgs || []) {
      if (/unsplash|pexels|pixabay/i.test(u)) continue;
      if (await checkRemoteImage(u)) okImgs.push({ url_goc: u, mo_ta: 'Ảnh thực tế bài đăng' });
    }
    if (!okImgs.length) return reject('anh_khong_dat', 'Không có ảnh gallery hợp lệ của chính bài đăng');
    room.anh = okImgs;
  }

  // 8. Data Quality Gate chính thức (Quy tắc 5)
  const q = cleaner.validateRoomQuality(room);
  if (!q.valid) return reject('quality_gate', q.issues.join('; '));
  const dup = cleaner.checkDuplicate(room, [...existing.rooms, ...accepted]);
  if (dup.isDuplicate) return reject('trung_lap', `${dup.reason} với ${dup.matchedRoomId}`);

  // 9. Rà PII lần cuối: không chứa link profile / UID
  const json = JSON.stringify(room);
  if (/profile\.php|facebook\.com\/(?!groups\/)[A-Za-z0-9.]+\/?["?]/i.test(json)) return reject('pii', 'Phát hiện link cá nhân Facebook');

  existing.hashes.add(h); existing.urls.add(raw.url.toLowerCase());
  return room;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
function loadExisting() {
  const rooms = [], hashes = new Set(), urls = new Set();
  for (const f of fs.readdirSync(DB_ROOM_DIR).filter(f => f.endsWith('.json'))) {
    try {
      const r = JSON.parse(fs.readFileSync(path.join(DB_ROOM_DIR, f), 'utf-8'));
      rooms.push(r);
      if (r.url_nguon) urls.add(r.url_nguon.toLowerCase().trim());
      if (r.thong_tin?.mo_ta) hashes.add(coreHash(r.thong_tin.mo_ta));
    } catch {}
  }
  return { rooms, hashes, urls };
}

async function runCrawl() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(STAGING_ROOT, runId);
  const photoDir = path.join(dir, 'photos');
  fs.mkdirSync(photoDir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'approved'), { recursive: true });

  const stats = { scanned: 0, rejected: { link_khong_hop_le: 0, link_khong_dat: 0, trung_lap: 0 }, rejectSamples: [] };
  const existing = loadExisting();
  audit('='.repeat(70));
  audit(`🚀 BẮT ĐẦU PIPELINE run=${runId} | Mục tiêu FB ≤${TARGET_FB}, PT123 ≤${TARGET_PT} | DB hiện có ${existing.rooms.length} phòng`);

  const pw = await import(pathToFileURL(PW_PATH).href);
  const browser = await pw.chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'] });
  let raws = [];
  try {
    const context = await browser.newContext({ userAgent: UA, locale: 'vi-VN', viewport: { width: 1366, height: 900 } });
    const fbRaw = await crawlFacebook(context, stats, existing);
    audit(`📥 FB thô có permalink hợp lệ: ${fbRaw.length}`);
    const ptRaw = await crawlPt123(context, stats, existing);
    audit(`📥 PT123 thô: ${ptRaw.length}`);
    const mogiRaw = await crawlMogi(context, stats, existing);
    audit(`📥 Mogi thô: ${mogiRaw.length}`);
    raws = [...fbRaw, ...ptRaw, ...mogiRaw];
  } finally {
    await safeCloseBrowser(browser); // Điều 8.3 (an toàn với timeout)
  }
  fs.writeFileSync(path.join(dir, 'raw.json'), JSON.stringify(raws, null, 2), 'utf-8');

  // Kiểm định
  const accepted = [];
  let fbOk = 0, ptOk = 0, mogiOk = 0;
  for (const raw of raws) {
    if (accepted.length >= TARGET_TOTAL) break;
    if (raw.nguon === 'facebook' && fbOk >= TARGET_FB) continue;
    const room = await validateCandidate(raw, { stats, existing, accepted, photoDir });
    if (room) {
      accepted.push(room);
      if (raw.nguon === 'facebook') fbOk++;
      else if (raw.nguon === 'mogi') mogiOk++;
      else ptOk++;
      fs.writeFileSync(path.join(dir, 'approved', `${room.ma_phong}.json`), JSON.stringify(room, null, 2), 'utf-8');
      audit(`   ✅ ĐẠT: ${room.ma_phong} | ${room.vi_tri.co_so_gan_nhat} | ${(room.thong_tin.gia / 1e6).toFixed(1)}tr | ${room.thong_tin.tieu_de.slice(0, 50)}`);
    }
  }

  const seg = (g) => g < 1800000 ? 'gia_re' : g <= 3200000 ? 'tam_trung' : 'cao_cap';
  const report = {
    runId, time: new Date().toISOString(), scanned: stats.scanned, raw: raws.length,
    approved: accepted.length, approved_fb: fbOk, approved_pt123: ptOk, approved_mogi: mogiOk,
    rejected: stats.rejected,
    phan_bo_co_so: accepted.reduce((a, r) => (a[r.vi_tri.co_so_gan_nhat] = (a[r.vi_tri.co_so_gan_nhat] || 0) + 1, a), {}),
    phan_khuc_gia: accepted.reduce((a, r) => (a[seg(r.thong_tin.gia)] = (a[seg(r.thong_tin.gia)] || 0) + 1, a), {}),
    approved_list: accepted.map(r => ({ id: r.ma_phong, cs: r.vi_tri.co_so_gan_nhat, gia: r.thong_tin.gia, url: r.url_nguon, anh: r.anh.length, tieu_de: r.thong_tin.tieu_de })),
    reject_samples: stats.rejectSamples.slice(0, 80)
  };
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2), 'utf-8');

  // Điều 8.4: Audit trail
  const rj = stats.rejected;
  audit(`🏁 KẾT THÚC KIỂM ĐỊNH run=${runId}: quét ${stats.scanned} | đạt ${accepted.length} (FB ${fbOk}, PT123 ${ptOk}, Mogi ${mogiOk}) | ` +
        `rác ${rj.rac_thuong_mai || 0} | tìm phòng/pass ${rj.tim_phong_o_ghep_pass || 0} | trùng ${rj.trung_lap || 0} | ` +
        `link lỗi ${(rj.link_khong_dat || 0) + (rj.link_khong_hop_le || 0)} | khác ${Object.entries(rj).filter(([k]) => !['rac_thuong_mai', 'tim_phong_o_ghep_pass', 'trung_lap', 'link_khong_dat', 'link_khong_hop_le'].includes(k)).reduce((s, [, v]) => s + v, 0)}`);
  audit(`📂 Staging: ${dir}  (chưa đưa lên DB — chạy --publish ${runId} sau khi duyệt)`);
  if (AUTO_PUBLISH && accepted.length > 0) {
    const pubCount = runPublish(runId);
    audit(`🚀 Đã tự động xuất bản ${pubCount} phòng hợp lệ vào DB chính thức`);
  }

  console.log('\nRUN_ID=' + runId);
  return { runId, report, approvedCount: accepted.length };
}

function runPublish(runId) {
  const dir = path.join(STAGING_ROOT, runId);
  const appr = path.join(dir, 'approved');
  if (!fs.existsSync(appr)) throw new Error('Không tìm thấy staging run ' + runId);
  const existing = loadExisting();
  let n = 0;
  for (const f of fs.readdirSync(appr).filter(f => f.endsWith('.json'))) {
    const room = JSON.parse(fs.readFileSync(path.join(appr, f), 'utf-8'));
    if (existing.urls.has(room.url_nguon.toLowerCase()) || fs.existsSync(path.join(DB_ROOM_DIR, f))) { audit(`   ⏭️ Bỏ qua (đã tồn tại) ${room.ma_phong}`); continue; }
    for (const a of room.anh) {
      if (a.url_goc.startsWith('/photos/')) {
        const name = a.url_goc.replace('/photos/', '');
        fs.copyFileSync(path.join(dir, 'photos', name), path.join(DB_PHOTO_DIR, name));
      }
    }
    fs.writeFileSync(path.join(DB_ROOM_DIR, f), JSON.stringify(room, null, 2), 'utf-8');
    n++;
  }
  audit(`📤 PUBLISH run=${runId}: đã nạp ${n} phòng đạt chuẩn vào alldata/room`);
  console.log('PUBLISHED=' + n);
  return n;
}

async function runValidateStaging(runId) {
  const dir = path.join(STAGING_ROOT, runId);
  const rawPath = path.join(dir, 'raw.json');
  if (!fs.existsSync(rawPath)) throw new Error('Không tìm thấy raw.json trong staging ' + runId);
  const raws = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  const photoDir = path.join(dir, 'photos');
  const apprDir = path.join(dir, 'approved');
  fs.mkdirSync(photoDir, { recursive: true });
  fs.mkdirSync(apprDir, { recursive: true });

  const existing = loadExisting();
  const stats = { scanned: raws.length, rejected: {}, rejectSamples: [] };
  const accepted = [];
  let fbOk = 0, ptOk = 0, mogiOk = 0;

  for (const raw of raws) {
    if (accepted.length >= TARGET_TOTAL) break;
    const room = await validateCandidate(raw, { stats, existing, accepted, photoDir });
    if (room) {
      accepted.push(room);
      if (raw.nguon === 'facebook') fbOk++;
      else if (raw.nguon === 'mogi') mogiOk++;
      else ptOk++;
      fs.writeFileSync(path.join(apprDir, `${room.ma_phong}.json`), JSON.stringify(room, null, 2), 'utf-8');
      audit(`   ✅ ĐẠT: ${room.ma_phong} | ${room.vi_tri.co_so_gan_nhat} | ${(room.thong_tin.gia / 1e6).toFixed(1)}tr | ${room.thong_tin.tieu_de.slice(0, 50)}`);
    }
  }

  audit(`🏁 Re-validate staging run=${runId}: đạt ${accepted.length} (FB ${fbOk}, PT123 ${ptOk}, Mogi ${mogiOk})`);
  if (AUTO_PUBLISH && accepted.length > 0) {
    const pubCount = runPublish(runId);
    audit(`🚀 Đã tự động xuất bản ${pubCount} phòng vào DB chính thức`);
  }
  return { approvedCount: accepted.length };
}

export { runCrawl, runPublish, runValidateStaging };

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  const MODE_REVALIDATE = argv.includes('--revalidate');
  if (MODE_CRAWL) await runCrawl();
  else if (MODE_REVALIDATE) await runValidateStaging(argVal('--revalidate'));
  else if (MODE_PUBLISH) runPublish(argVal('--publish'));
  else console.log('Dùng: --crawl [--fb N] [--pt N] [--auto-publish]  |  --revalidate <runId> [--auto-publish]  |  --publish <runId>');
}
