import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

async function list2to3mRooms() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem?gia_tu=2000000&gia_den=3000000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const posts = await page.evaluate(() => {
    // Inspect all links that have pr in href
    const links = Array.from(document.querySelectorAll('a'))
      .filter(a => a.href.includes('-pr') && a.innerText.length > 20);
    
    return links.map(a => {
      // Find parent container
      const container = a.closest('div, li, article, section') || a.parentElement;
      return {
        title: a.innerText.trim(),
        href: a.href,
        contextText: container ? container.innerText.slice(0, 300) : ''
      };
    });
  });

  console.log(`Tìm thấy ${posts.length} bài đăng:`);
  for (const p of posts) {
    console.log(`\n- Tiêu đề: ${p.title}\n  Link: ${p.href}\n  Tóm tắt: ${p.contextText.replace(/\n+/g, ' | ')}`);
  }

  await browser.close();
}

list2to3mRooms();
