import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\df4e8b92-431c-429f-a1df-45fc3ed7502d';

const targets = [
  {
    name: 'room_duc_dien_3tr',
    url: 'https://phongtro123.com/dia-chi-nha-so-7-ngo-73-33-duc-dien-phu-dien-bac-tu-liem-trong-phong-202-pr711288.html'
  },
  {
    name: 'room_phu_dien_3tr',
    url: 'https://phongtro123.com/phong-tro-phu-dien-vao-o-ngay-nha-so-39-ngo-193-phu-dien-bac-tu-liem-pr709488.html'
  }
];

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

async function scrapeRooms() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const results = [];

  for (const t of targets) {
    console.log(`\nTruy cập: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const ssPath = path.join(screenshotsDir, `${t.name}_fullpage.png`);
    await page.screenshot({ path: ssPath, fullPage: false });

    // Copy fullpage screenshot to artifact dir
    const artifactSsPath = path.join(artifactDir, `${t.name}_fullpage.png`);
    fs.copyFileSync(ssPath, artifactSsPath);

    const info = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText?.trim() || '';
      const author = document.querySelector('.author-name, .contact-name, .media-heading')?.innerText?.trim() || '';
      const phone = document.querySelector('a[href^="tel:"], .btn-phone, .author-phone')?.innerText?.trim() || '';
      
      // Lấy toàn bộ đoạn text nội dung
      const contentEl = document.querySelector('.section-content, .post-main-content, .post-content, article');
      const desc = contentEl ? contentEl.innerText.trim() : '';

      // Lấy các ảnh lớn trong slide/gallery
      const imgEls = Array.from(document.querySelectorAll('.swiper-wrapper img, .post-images img, .gallery-item img, .carousel img, .slick-slide img, .post-content img'));
      const imgs = imgEls
        .map(i => i.getAttribute('data-src') || i.src)
        .filter(src => src && (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')) && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon'));

      return {
        title,
        author,
        phone,
        desc,
        images: Array.from(new Set(imgs))
      };
    });

    info.name = t.name;
    info.url = t.url;
    info.screenshotArtifact = artifactSsPath;
    info.localPhotos = [];

    console.log(`Tiêu đề: ${info.title}`);
    console.log(`Liên hệ: ${info.author} - SĐT: ${info.phone}`);
    console.log(`Tìm thấy ${info.images.length} ảnh`);

    // Download top 3 photos of the room
    for (let k = 0; k < Math.min(info.images.length, 4); k++) {
      const imgUrl = info.images[k];
      const filename = `${t.name}_photo_${k+1}.jpg`;
      const localPath = path.join(screenshotsDir, filename);
      const artPath = path.join(artifactDir, filename);
      try {
        await download(imgUrl, localPath);
        fs.copyFileSync(localPath, artPath);
        info.localPhotos.push(filename);
        console.log(`  Đã tải ảnh: ${filename}`);
      } catch (e) {
        console.log(`  Lỗi tải ảnh: ${e.message}`);
      }
    }

    results.push(info);
  }

  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'exact_rooms.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nHoàn tất lưu exact_rooms.json!');
}

scrapeRooms().catch(console.error);
