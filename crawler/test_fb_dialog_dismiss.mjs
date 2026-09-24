import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const testGroups = [
    'https://www.facebook.com/groups/phongtrophulyhanam',
    'https://www.facebook.com/groups/phongtrokcndongvanhanam',
    'https://www.facebook.com/groups/thuetrohanam',
    'https://www.facebook.com/groups/phongtrohanam'
  ];

  for (const url of testGroups) {
    console.log(`\n========================================`);
    console.log(`Testing: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);

      // Dismiss dialogs
      await page.evaluate(() => {
        document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"], [aria-label="close"]').forEach(el => {
          try { el.click(); } catch {}
        });
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
      });

      // Scroll a few times
      for (let s = 0; s < 5; s++) {
        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(600);
      }

      const info = await page.evaluate(() => {
        const title = document.title;
        const isPrivate = document.body.innerText.includes('Nhóm Riêng tư') || document.body.innerText.includes('Chỉ thành viên mới nhìn thấy');
        const articles = document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]');
        const snippets = [];
        articles.forEach(a => {
          const t = a.innerText.trim();
          if (t.length > 30) snippets.push(t.slice(0, 150).replace(/\n+/g, ' '));
        });
        return {
          title,
          isPrivate,
          articleCount: articles.length,
          snippets: snippets.slice(0, 3)
        };
      });

      console.log('Result:', JSON.stringify(info, null, 2));
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
