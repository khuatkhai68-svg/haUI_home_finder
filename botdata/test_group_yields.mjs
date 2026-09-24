import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);

const groups = [
  { url: 'https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', name: 'Nhà trọ Nhổn ĐHCN CS1' },
  { url: 'https://www.facebook.com/groups/219194439373201/?locale=vi_VN', name: 'HaUI - Tìm Phòng Trọ' },
  { url: 'https://www.facebook.com/groups/447547838952346/?locale=vi_VN', name: 'HaUI CS3 Phù Vân' },
  { url: 'https://www.facebook.com/groups/611511566512116?locale=vi_VN', name: 'HaUI CS3 Ninh Binh Ha Nam' },
  { url: 'https://www.facebook.com/groups/PhongTroHoaiDuc/?locale=vi_VN', name: 'Phong Tro Hoai Duc Nhon' }
];

async function test() {
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  for (const g of groups) {
    console.log(`\nTesting ${g.name} (${g.url})...`);
    try {
      await page.goto(g.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Dismiss dialogs
      await page.evaluate(() => {
        document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
          try { el.click(); } catch {}
        });
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
      });

      // Scroll 10 times and collect posts
      const postMap = new Map();
      for (let i = 0; i < 10; i++) {
        const batch = await page.evaluate(() => {
          const articles = document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]');
          return Array.from(articles).map(art => {
            const text = (art.innerText || '').trim();
            const link = art.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
            return { text, url: link ? link.href.split('?')[0] : '' };
          }).filter(x => x.text.length > 30);
        });

        batch.forEach(b => {
          const k = b.text.substring(0, 50);
          if (!postMap.has(k)) postMap.set(k, b);
        });

        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(700);
      }

      console.log(`  -> Gathered ${postMap.size} unique posts in ${g.name}.`);
      const sample = Array.from(postMap.values()).slice(0, 3);
      sample.forEach((p, idx) => console.log(`     [${idx+1}] ${p.url || 'NO_URL'} | ${p.text.substring(0, 60)}...`));
    } catch (e) {
      console.log(`Error ${g.name}:`, e.message);
    }
  }

  await browser.close();
}

test();
