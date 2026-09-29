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
    id: 'room_phukieu_2tr8',
    url: 'https://phongtro123.com/nhuong-gap-phong-tro-ngo-5-phu-kieu-kieu-mai-chi-2-8-trieu-thang-pr709216.html'
  },
  {
    id: 'room_phudien_3tr',
    url: 'https://phongtro123.com/phong-tro-kep-kin-cho-ho-gia-dinh-pr604004.html'
  },
  {
    id: 'room_taytuu_2tr7',
    url: 'https://phongtro123.com/goc-nhuong-tro-vi-em-chuyen-noi-lam-viec-a-pr712333.html'
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

async function scrapeCandidates() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const rooms = [];

  for (const t of targets) {
    console.log(`\nĐang cào: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const ssPath = path.join(screenshotsDir, `${t.id}_page.png`);
    await page.screenshot({ path: ssPath, fullPage: false });
    fs.copyFileSync(ssPath, path.join(artifactDir, `${t.id}_page.png`));

    const info = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText?.trim() || '';
      const price = document.querySelector('.item.price span, .post-price, .item-price, .price')?.innerText?.trim() || '';
      const address = document.querySelector('.post-address, address, .item.address span')?.innerText?.trim() || '';
      const desc = document.querySelector('.section-content, .post-main-content, .post-content')?.innerText?.trim() || '';
      const phone = document.querySelector('a[href^="tel:"], .btn-phone, .author-phone')?.innerText?.trim() || '';
      const author = document.querySelector('.author-name, .contact-name')?.innerText?.trim() || '';
      const isExpired = document.body.innerText.includes('tin đăng này đã hết hạn');

      const imgEls = Array.from(document.querySelectorAll('.swiper-wrapper img, .post-images img, .gallery-item img, .carousel img, .slick-slide img, .post-content img'));
      const imgs = imgEls
        .map(i => i.getAttribute('data-src') || i.src)
        .filter(src => src && (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')) && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon'));

      return {
        title,
        price,
        address,
        desc,
        phone,
        author,
        isExpired,
        images: Array.from(new Set(imgs))
      };
    });

    info.id = t.id;
    info.url = t.url;
    info.downloadedPhotos = [];

    console.log(`Tiêu đề: ${info.title}`);
    console.log(`Hết hạn? ${info.isExpired}`);
    console.log(`SĐT: ${info.phone} | Giá: ${info.price}`);

    // Download top 3 photos
    for (let i = 0; i < Math.min(info.images.length, 3); i++) {
      const imgUrl = info.images[i];
      const filename = `${t.id}_photo_${i+1}.jpg`;
      const localFile = path.join(screenshotsDir, filename);
      const artFile = path.join(artifactDir, filename);
      try {
        await download(imgUrl, localFile);
        fs.copyFileSync(localFile, artFile);
        info.downloadedPhotos.push(filename);
        console.log(`   Đã tải ảnh: ${filename}`);
      } catch (e) {
        console.log(`   Lỗi tải ảnh: ${e.message}`);
      }
    }

    rooms.push(info);
  }

  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'candidates.json'), JSON.stringify(rooms, null, 2), 'utf-8');
  console.log('\nHoàn tất lưu candidates.json!');
}

scrapeCandidates().catch(console.error);
