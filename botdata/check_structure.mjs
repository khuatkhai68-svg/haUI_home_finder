import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

async function checkStructure() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const posts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(a => a.href.includes('-pr') && a.innerText.length > 15)
      .map(a => {
        let p = a.parentElement;
        for (let i = 0; i < 4 && p; i++) {
          if (p.innerText.includes('triệu/tháng') || p.innerText.includes('đồng/tháng')) {
            return {
              title: a.innerText.trim(),
              href: a.href,
              summary: p.innerText.replace(/\n+/g, ' | ')
            };
          }
          p = p.parentElement;
        }
        return {
          title: a.innerText.trim(),
          href: a.href,
          summary: a.innerText
        };
      });
  });

  console.log(`Tìm thấy ${posts.length} tin:`);
  posts.slice(0, 15).forEach(p => console.log(p));
  await browser.close();
}

checkStructure();
