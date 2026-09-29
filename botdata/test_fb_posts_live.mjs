import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const PW_PATH = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(PW_PATH).href);

const roomDir = path.resolve('alldata/room');
const photosDir = path.resolve('alldata/room/photos');
const files = fs.readdirSync(roomDir).filter(f => f.startsWith('RM-FB-'));

// Find rooms that have their OWN photos
const candidates = [];
for (const f of files) {
  const p = path.join(roomDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const roomId = data.ma_phong;
  const imgs = (data.anh || []).map(a => typeof a === 'string' ? a : a.url_goc).filter(Boolean);

  let hasOwn = false;
  let hasBorrowed = false;
  for (const img of imgs) {
    if (img.startsWith('/photos/')) {
      const base = path.basename(img);
      if (base.startsWith(roomId)) {
        hasOwn = true;
      } else {
        hasBorrowed = true;
      }
    }
  }

  if (hasOwn && !hasBorrowed) {
    candidates.push({ id: roomId, file: f, url: data.url_nguon, title: data.thong_tin?.tieu_de });
  }
}

console.log(`Testing live status of ${candidates.length} FB rooms with authentic photos...`);

const browser = await pw.chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});
const page = await context.newPage();

let liveFb = [];
let deadFb = [];

for (const c of candidates) {
  try {
    const res = await page.goto(c.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');
    
    // Check Facebook dead/unavailable text
    if (
      bodyText.includes('Bạn hiện không xem được nội dung này') ||
      bodyText.includes('Nội dung này hiện không khả dụng') ||
      bodyText.includes('Liên kết bạn truy cập có thể bị hỏng') ||
      bodyText.includes('Trang này không khả dụng') ||
      bodyText.includes('This content isn\'t available right now') ||
      bodyText.includes('May be broken, or the page may have been removed')
    ) {
      console.log(`❌ [DEAD FB] ${c.id}: ${c.url}`);
      deadFb.push(c);
    } else {
      console.log(`✅ [LIVE FB] ${c.id}: ${c.url}`);
      liveFb.push(c);
    }
  } catch (e) {
    console.log(`⚠️ [ERROR FB] ${c.id}: ${e.message}`);
    deadFb.push(c);
  }
}

await browser.close();

console.log('\n====================================');
console.log(`Total checked: ${candidates.length}`);
console.log(`Live Facebook posts: ${liveFb.length}`);
console.log(`Dead/inaccessible Facebook posts: ${deadFb.length}`);
