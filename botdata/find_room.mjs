import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function searchRooms() {
  console.log('Đang tìm kiếm phòng trọ 2.8tr - 3tr full đồ gần HaUI / Bắc Từ Liêm...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  // Thử tìm trên phongtro123.com tại Quận Bắc Từ Liêm, tầm giá 2tr - 3tr
  const targetUrl = 'https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem?gia_tu=2000000&gia_den=3000000';
  console.log(`Điều hướng tới: ${targetUrl}`);

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Lấy danh sách các tin đăng
    const listings = await page.evaluate(() => {
      const items = document.querySelectorAll('li.post-item, .post-listing .post-item, article');
      const results = [];
      for (const item of items) {
        const titleEl = item.querySelector('.post-title a, h3 a, a.title');
        const priceEl = item.querySelector('.post-price, .price');
        const locationEl = item.querySelector('.post-location, .location');
        const imgEl = item.querySelector('img');
        const descEl = item.querySelector('.post-summary, .post-desc, p');

        if (titleEl && priceEl) {
          results.push({
            title: titleEl.innerText.trim(),
            link: titleEl.href,
            price: priceEl.innerText.trim(),
            location: locationEl ? locationEl.innerText.trim() : '',
            description: descEl ? descEl.innerText.trim() : '',
            image: imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : ''
          });
        }
      }
      return results;
    });

    console.log(`Tìm thấy ${listings.length} tin đăng trên phongtro123.`);
    console.log(JSON.stringify(listings.slice(0, 5), null, 2));

    await browser.close();
    return listings;
  } catch (err) {
    console.error('Lỗi khi cào phongtro123:', err.message);
    await browser.close();
    return [];
  }
}

searchRooms();
