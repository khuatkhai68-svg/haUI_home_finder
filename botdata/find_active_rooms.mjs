import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

async function findActiveRooms() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Sắp xếp theo mới nhất: sort=moi-nhat hoặc kiểm tra các tin mới nhất tháng 9/2026
  await page.goto('https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem?gia_tu=2000000&gia_den=3500000&orderby=moi-nhat', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const listings = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('li.post-item, .post-listing .post-item, article, div.post-item'));
    return items.map(el => {
      const a = el.querySelector('a[href*="-pr"]');
      const price = el.querySelector('.post-price, .price, .item.price')?.innerText?.trim() || '';
      const time = el.querySelector('.post-time, time, .time')?.innerText?.trim() || '';
      const title = a ? a.innerText.trim() : '';
      const href = a ? a.href : '';
      return { title, href, price, time, text: el.innerText.slice(0, 200).replace(/\n+/g, ' ') };
    }).filter(x => x.href && x.title);
  });

  console.log(`Tìm thấy ${listings.length} tin:`);
  console.log(listings.slice(0, 10));

  await browser.close();
}

findActiveRooms().catch(console.error);
