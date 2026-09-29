import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\df4e8b92-431c-429f-a1df-45fc3ed7502d';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(dest);
        });
      } else {
        reject(new Error(`Status: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrapeFbPost() {
  const postUrl = 'https://www.facebook.com/groups/140397885361011/posts/1034505209283603/';
  console.log(`Đang mở bài đăng Facebook: ${postUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  try {
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(4000);

    // Kiểm tra xem có nút đóng popup đăng nhập không (nút X hoặc aria-label="Đóng")
    try {
      const closeButtons = await page.$$('[aria-label="Đóng"], [aria-label="Close"], div[role="dialog"] [role="button"]');
      for (const btn of closeButtons) {
        await btn.click().catch(() => {});
      }
    } catch (e) {}

    await page.waitForTimeout(2000);

    // Chụp ảnh màn hình toàn trang bài đăng Facebook
    const ssPath = path.join(screenshotsDir, 'facebook_room_3tr_post.png');
    await page.screenshot({ path: ssPath, fullPage: false });
    fs.copyFileSync(ssPath, path.join(artifactDir, 'facebook_room_3tr_post.png'));
    console.log(`Đã chụp ảnh màn hình lưu tại: ${ssPath}`);

    // Lấy nội dung text của bài đăng
    const postInfo = await page.evaluate(() => {
      const title = document.title;
      // Tìm các ảnh trong bài đăng
      const imgs = Array.from(document.querySelectorAll('img'))
        .map(i => i.src)
        .filter(s => s && !s.includes('data:image') && !s.includes('rsrc.php') && (s.includes('scontent') || s.includes('fbcdn')));
      
      const text = document.body.innerText;
      return { title, imgs, textSample: text.slice(0, 1000) };
    });

    console.log('Tiêu đề Facebook:', postInfo.title);
    console.log(`Tìm thấy ${postInfo.imgs.length} ảnh bài đăng FB.`);
    console.log('Nội dung:', postInfo.textSample.slice(0, 400));

    // Tải ảnh bài đăng nếu có
    if (postInfo.imgs.length > 0) {
      for (let i = 0; i < Math.min(postInfo.imgs.length, 3); i++) {
        const imgFile = path.join(screenshotsDir, `fb_photo_${i+1}.jpg`);
        try {
          await download(postInfo.imgs[i], imgFile);
          fs.copyFileSync(imgFile, path.join(artifactDir, `fb_photo_${i+1}.jpg`));
          console.log(`Đã tải ảnh phòng FB: ${imgFile}`);
        } catch (e) {}
      }
    }

  } catch (err) {
    console.error('Lỗi khi cào FB:', err.message);
  } finally {
    await browser.close();
  }
}

scrapeFbPost().catch(console.error);
