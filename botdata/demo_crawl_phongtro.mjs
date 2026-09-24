import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runRentalCrawlerDemo() {
  console.log('=====================================================');
  console.log('🚀 DEMO CÀO DỮ LIỆU PHÒNG TRỌ VỚI PLAYWRIGHT BROWSER');
  console.log('=====================================================\n');

  console.log('1. Khởi động Chromium Headless với cờ chống bot fingerprint...');
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

  // Test với Facebook Ad Library (Thư viện quảng cáo công khai Meta - Phòng trọ Hà Nội / HaUI)
  const adLibraryUrl = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=VN&q=ph%C3%B2ng%20tr%E1%BB%8D%20HaUI';
  console.log(`2. Điều hướng tới Meta Ad Library: ${adLibraryUrl}`);
  
  try {
    await page.goto(adLibraryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('   Trang đã tải xong DOM content.');
    
    // Đợi một chút để render
    await page.waitForTimeout(3000);

    // Chụp ảnh màn hình lưu lại
    const screenshotPath = path.join(screenshotsDir, 'meta_ad_library_haui.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`3. 📸 Đã chụp ảnh màn hình lưu tại: ${screenshotPath}`);

    const title = await page.title();
    console.log(`4. Tiêu đề trang: "${title}"`);

    // Trích xuất số lượng quảng cáo hoặc nội dung hiển thị
    const bodyText = await page.evaluate(() => document.body.innerText);
    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    console.log('\n5. 📝 Trích xuất mẫu các nội dung tìm thấy trên trang:');
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`   [Dòng ${i+1}]: ${line}`);
    });

    console.log('\n=====================================================');
    console.log('✅ DEMO HOÀN THÀNH: Trình duyệt hoạt động 100% trơn tru!');
    console.log('=====================================================');
  } catch (err) {
    console.error('Lỗi khi truy cập:', err.message);
  } finally {
    await browser.close();
  }
}

runRentalCrawlerDemo();
