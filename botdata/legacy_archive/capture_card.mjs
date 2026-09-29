import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\df4e8b92-431c-429f-a1df-45fc3ed7502d';

async function captureCardOnly() {
  const postUrl = 'https://www.facebook.com/groups/140397885361011/posts/1034505209283603/';
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 1200 }
  });

  const page = await context.newPage();
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(3000);

  // Tìm phần tử feed / card bài đăng chính
  const postElement = await page.$('div[role="feed"] > div, div[role="article"], div:has-text("Phòng trọ 20m2 Cầu Giấy 3 triệu/tháng")');
  
  if (postElement) {
    const cardScreenshotPath = path.join(screenshotsDir, 'facebook_room_3tr_card_clean.png');
    await postElement.screenshot({ path: cardScreenshotPath });
    fs.copyFileSync(cardScreenshotPath, path.join(artifactDir, 'facebook_room_3tr_card_clean.png'));
    console.log(`Đã chụp card sạch: ${cardScreenshotPath}`);
  }

  await browser.close();
}

captureCardOnly().catch(console.error);
