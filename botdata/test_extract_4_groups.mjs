import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);

const targetGroups = [
  { url: 'https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', id: '1896518147417522', name: 'Nhà trọ Nhổn - Nguyên Xá - ĐHCN CS1' },
  { url: 'https://www.facebook.com/groups/611511566512116?locale=vi_VN', id: '611511566512116', name: 'Nhà trọ ĐHCN HaUI CS3 Phù Vân Hà Nam' },
  { url: 'https://www.facebook.com/groups/447547838952346/?locale=vi_VN', id: '447547838952346', name: 'Cho Thuê Phòng Trọ HaUI CS3' },
  { url: 'https://www.facebook.com/groups/219194439373201?locale=vi_VN', id: '219194439373201', name: 'HaUI - Tìm Phòng Trọ' }
];

async function run() {
  const browser = await pw.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'vi-VN'
  });

  const page = await context.newPage();

  for (const grp of targetGroups) {
    console.log(`\nVisiting: ${grp.name} (${grp.url})`);
    try {
      await page.goto(grp.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Dismiss dialogs
      await page.evaluate(() => {
        document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
          try { el.click(); } catch {}
        });
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
      });

      // Scroll a few times to load posts
      for (let s = 0; s < 8; s++) {
        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(800);
      }

      const posts = await page.evaluate((gid) => {
        const results = [];
        const articles = document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]');
        articles.forEach(art => {
          const text = (art.innerText || '').trim();
          if (text.length < 30) return;

          // Find links
          const links = Array.from(art.querySelectorAll('a[href]'));
          let postUrl = '';
          for (const a of links) {
            const h = a.href || '';
            if (h.includes('/posts/') || h.includes('/permalink/') || h.includes('story_fbid=')) {
              postUrl = h.split('?')[0];
              break;
            }
          }

          results.push({
            text: text.substring(0, 150).replace(/\n+/g, ' | '),
            url: postUrl || `https://www.facebook.com/groups/${gid}/`
          });
        });
        return results;
      }, grp.id);

      console.log(`Found ${posts.length} posts in ${grp.name}:`);
      posts.forEach((p, idx) => {
        console.log(`  [${idx+1}] URL: ${p.url}`);
        console.log(`      Text: ${p.text.substring(0, 90)}...`);
      });

    } catch (e) {
      console.error(`Error in group ${grp.name}:`, e.message);
    }
  }

  await browser.close();
}

run();
