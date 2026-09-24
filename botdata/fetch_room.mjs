import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function fetchLiveRoom() {
  console.log('Khởi chạy Playwright tìm phòng trọ thực tế...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  // Search on Google for real rental room listings around HaUI / Bac Tu Liem
  const query = 'phòng trọ "3 triệu" OR "2.8 triệu" "full đồ" "Bắc Từ Liêm" OR "Nhổn" "Đại học Công nghiệp"';
  console.log(`Tìm kiếm Google: ${query}`);
  
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Extract organic search results
  const searchResults = await page.evaluate(() => {
    const results = [];
    const links = document.querySelectorAll('div#search a[href^="http"]');
    for (const a of links) {
      const h3 = a.querySelector('h3');
      if (h3 && !a.href.includes('google.com')) {
        results.push({
          title: h3.innerText.trim(),
          url: a.href
        });
      }
    }
    return results;
  });

  console.log('Kết quả tìm kiếm:', searchResults.slice(0, 5));

  // Find a valid listing link (e.g. from phongtro123, batdongsan, chotot, alonhadat, thuephongtro,...)
  let targetRoomUrl = '';
  for (const r of searchResults) {
    if (r.url.includes('phongtro') || r.url.includes('nha') || r.url.includes('batdongsan') || r.url.includes('chotot') || r.url.includes('homedy')) {
      targetRoomUrl = r.url;
      console.log(`Chọn trang: ${r.title} -> ${targetRoomUrl}`);
      break;
    }
  }

  if (!targetRoomUrl && searchResults.length > 0) {
    targetRoomUrl = searchResults[0].url;
  }

  if (targetRoomUrl) {
    console.log(`Truy cập trang phòng trọ: ${targetRoomUrl}`);
    await page.goto(targetRoomUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const roomScreenshotPath = path.join(screenshotsDir, 'room_listing_detail.png');
    await page.screenshot({ path: roomScreenshotPath, fullPage: false });
    console.log(`Đã chụp ảnh trang tin: ${roomScreenshotPath}`);

    // Extract title, price, photos
    const roomInfo = await page.evaluate(() => {
      const title = document.querySelector('h1, h2.title, .post-title')?.innerText?.trim() || document.title;
      const imgs = Array.from(document.querySelectorAll('img')).map(img => img.src || img.dataset.src).filter(src => src && (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')) && !src.includes('logo') && !src.includes('icon'));
      const text = document.body.innerText;
      return { title, imgs: imgs.slice(0, 5), textSample: text.slice(0, 500) };
    });

    console.log('Room Info:', roomInfo.title);
    console.log('Images found:', roomInfo.imgs);
    
    fs.writeFileSync(path.join(__dirname, 'found_room.json'), JSON.stringify({
      url: targetRoomUrl,
      title: roomInfo.title,
      screenshot: roomScreenshotPath,
      images: roomInfo.imgs
    }, null, 2));
  }

  await browser.close();
}

fetchLiveRoom().catch(console.error);
