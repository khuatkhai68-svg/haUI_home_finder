import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\df4e8b92-431c-429f-a1df-45fc3ed7502d';

async function captureUnobstructed() {
  const postUrl = 'https://www.facebook.com/groups/140397885361011/posts/1034505209283603/';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 1300 }
  });

  const page = await context.newPage();
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(3000);

  // Xóa modal đăng nhập che khuất
  await page.evaluate(() => {
    // Xóa overlay backdrop và dialog
    document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
    document.querySelectorAll('div[data-nosnippet]').forEach(el => el.remove());
    // Mở khóa thanh cuộn nếu bị chặn
    document.body.style.overflow = 'auto';
  });

  await page.waitForTimeout(1000);

  // Chụp lại toàn bộ phần bài đăng đã sạch bóng modal
  const ssPath = path.join(screenshotsDir, 'facebook_room_3tr_clear.png');
  await page.screenshot({ path: ssPath, fullPage: false });
  fs.copyFileSync(ssPath, path.join(artifactDir, 'facebook_room_3tr_clear.png'));

  // Tìm và tải các file ảnh lớn của bài đăng
  const photoUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .map(i => i.src)
      .filter(s => s && s.includes('scontent') && !s.includes('p50x50') && !s.includes('s60x60'));
  });

  console.log('Ảnh phòng trích xuất được:', photoUrls);

  await browser.close();
  console.log('Đã lưu ảnh sạch tại:', ssPath);
}

captureUnobstructed().catch(console.error);
