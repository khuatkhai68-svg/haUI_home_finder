import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');

const urlsToScrape = [
  'https://phongtro123.com/pass-phong-khep-kin-full-noi-that-tai-minh-khai-bac-tu-liem-ha-noi-pr712655.html',
  'https://phongtro123.com/cho-thue-phong-sv-gan-cd-fpt-dh-cong-nghiep-kieu-studio-vao-o-luon-pr711003.html',
  'https://phongtro123.com/pass-phong-studio-20m2-tai-tran-cung-co-nhue-1-bac-tu-liem-ha-noi-pr713248.html'
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        const stream = fs.createWriteStream(filepath);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          resolve(filepath);
        });
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrapeDetails() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const roomDetails = [];

  for (let i = 0; i < urlsToScrape.length; i++) {
    const url = urlsToScrape[i];
    console.log(`\nĐang truy cập: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Chụp màn hình trang chi tiết
      const ssPath = path.join(screenshotsDir, `room_${i+1}_page.png`);
      await page.screenshot({ path: ssPath, fullPage: false });

      const data = await page.evaluate(() => {
        const title = document.querySelector('h1')?.innerText?.trim() || '';
        const price = document.querySelector('.item.price span, .post-price, .item-price, .price')?.innerText?.trim() || '';
        const acreage = document.querySelector('.item.acreage span, .post-acreage, .item-acreage')?.innerText?.trim() || '';
        const address = document.querySelector('.post-address, address, .item.address span')?.innerText?.trim() || '';
        const desc = document.querySelector('.section-content, .post-main-content, .post-content')?.innerText?.trim() || '';
        const author = document.querySelector('.author-name, .contact-name')?.innerText?.trim() || '';
        const phone = document.querySelector('.btn-phone, .author-phone, a[href^="tel:"]')?.innerText?.trim() || '';
        
        // Lấy tất cả ảnh của phòng trọ
        const imgElements = Array.from(document.querySelectorAll('.swiper-wrapper img, .post-images img, .gallery-item img, .post-content img, .carousel img, .slick-slide img'));
        const images = imgElements
          .map(img => img.getAttribute('data-src') || img.src)
          .filter(src => src && (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')) && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon'));

        return {
          title,
          price,
          acreage,
          address,
          desc,
          author,
          phone,
          images: Array.from(new Set(images))
        };
      });

      data.url = url;
      data.screenshot = ssPath;
      console.log(`Tiêu đề: ${data.title}`);
      console.log(`Giá: ${data.price} | Diện tích: ${data.acreage}`);
      console.log(`Địa chỉ: ${data.address}`);
      console.log(`Số ảnh tìm thấy: ${data.images.length}`);

      // Tải ảnh thực tế về máy
      data.localImages = [];
      for (let j = 0; j < Math.min(data.images.length, 3); j++) {
        const imgUrl = data.images[j];
        const ext = imgUrl.includes('.png') ? '.png' : (imgUrl.includes('.webp') ? '.webp' : '.jpg');
        const imgFile = path.join(screenshotsDir, `room_${i+1}_photo_${j+1}${ext}`);
        try {
          await downloadImage(imgUrl, imgFile);
          data.localImages.push(imgFile);
          console.log(`   Đã tải ảnh: ${imgFile}`);
        } catch (e) {
          console.log(`   Không tải được ảnh: ${imgUrl}`);
        }
      }

      roomDetails.push(data);
    } catch (err) {
      console.error('Lỗi khi cào URL:', url, err.message);
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'scraped_rooms.json'), JSON.stringify(roomDetails, null, 2), 'utf-8');
  console.log('\nĐã lưu toàn bộ dữ liệu vào scraped_rooms.json!');
}

scrapeDetails();
