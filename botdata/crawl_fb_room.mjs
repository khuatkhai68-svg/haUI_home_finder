import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\df4e8b92-431c-429f-a1df-45fc3ed7502d';

async function crawlFacebookRoom() {
  console.log('Khởi chạy Playwright cào bài đăng phòng trọ 3tr trên Facebook...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 }
  });

  const page = await context.newPage();

  // Tìm kiếm bài đăng phòng trọ 3 triệu trên Facebook
  const searchKeywords = ['phòng trọ 3 triệu Hà Nội', 'phòng trọ 3tr'];
  const fbUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=VN&q=${encodeURIComponent('phòng trọ 3 triệu')}`;
  
  console.log(`Đang truy cập Facebook Ad Library: ${fbUrl}`);
  await page.goto(fbUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(4000);

  // Cuộn nhẹ xuống để các card bài đăng render
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(2500);

  // Tìm các card quảng cáo bài đăng
  const cardsInfo = await page.evaluate(() => {
    // Mỗi thẻ bài đăng trong Meta Ad Library thường nằm trong các div có role hoặc cấu trúc thẻ
    const allDivs = Array.from(document.querySelectorAll('div'));
    // Tìm các container chứa ID thư viện
    const idSpans = Array.from(document.querySelectorAll('span, div')).filter(el => el.innerText && el.innerText.includes('ID thư viện:'));
    
    const results = [];
    for (const idEl of idSpans) {
      // Tìm khối card cha
      let card = idEl;
      for (let i = 0; i < 8; i++) {
        if (!card.parentElement) break;
        card = card.parentElement;
        if (card.offsetWidth > 250 && card.offsetHeight > 300) {
          break;
        }
      }

      const text = card.innerText || '';
      const links = Array.from(card.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href }));
      const imgs = Array.from(card.querySelectorAll('img')).map(img => img.src).filter(src => src && !src.includes('data:image'));
      
      const idMatch = text.match(/ID thư viện:\s*(\d+)/);
      const adId = idMatch ? idMatch[1] : '';

      results.push({
        adId,
        adLink: adId ? `https://www.facebook.com/ads/library/?id=${adId}` : '',
        snippet: text.slice(0, 400).replace(/\n+/g, ' \n '),
        links,
        imgsCount: imgs.length
      });
    }

    return results;
  });

  console.log(`Tìm thấy ${cardsInfo.length} bài đăng phòng trọ trên Facebook:`);
  console.log(JSON.stringify(cardsInfo.slice(0, 5), null, 2));

  // Chụp toàn màn hình kết quả tìm kiếm
  const fullScreenshot = path.join(screenshotsDir, 'facebook_search_3tr.png');
  await page.screenshot({ path: fullScreenshot, fullPage: false });
  fs.copyFileSync(fullScreenshot, path.join(artifactDir, 'facebook_search_3tr.png'));

  // Tìm bài đăng phù hợp nhất có nhắc đến giá 3tr / 3 triệu / phòng trọ
  let chosenIndex = 0;
  for (let i = 0; i < cardsInfo.length; i++) {
    const text = cardsInfo[i].snippet.toLowerCase();
    if (text.includes('phòng') || text.includes('trọ') || text.includes('triệu') || text.includes('3tr') || text.includes('giá')) {
      chosenIndex = i;
      break;
    }
  }

  // Chụp riêng thẻ bài đăng đó
  const cardElements = await page.$$('div:has-text("ID thư viện:")');
  if (cardElements.length > 0) {
    const targetElement = cardElements[Math.min(chosenIndex, cardElements.length - 1)];
    // Tìm phần tử cha chứa toàn bộ bài đăng
    const cardBox = await page.evaluateHandle(el => {
      let p = el;
      for (let i = 0; i < 6; i++) {
        if (p.parentElement && p.parentElement.offsetHeight > 350) {
          p = p.parentElement;
        }
      }
      return p;
    }, targetElement);

    const singleCardPath = path.join(screenshotsDir, 'facebook_room_3tr_card.png');
    await cardBox.asElement().screenshot({ path: singleCardPath });
    fs.copyFileSync(singleCardPath, path.join(artifactDir, 'facebook_room_3tr_card.png'));
    console.log(`Đã chụp cận cảnh bài đăng Facebook: ${singleCardPath}`);
  }

  await browser.close();

  fs.writeFileSync(path.join(__dirname, 'fb_room_result.json'), JSON.stringify({
    chosen: cardsInfo[chosenIndex],
    all: cardsInfo
  }, null, 2));
}

crawlFacebookRoom().catch(console.error);
