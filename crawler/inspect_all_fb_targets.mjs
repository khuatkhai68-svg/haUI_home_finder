import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

const targets = [
  'https://www.facebook.com/phongtrohaui',
  'https://www.facebook.com/chothuephongtrodhcncs3hanam',
  'https://www.facebook.com/DaiHocCongNghiepHaNoiCoSo3',
  'https://www.facebook.com/groups/phongtrodhcnhanam',
  'https://www.facebook.com/groups/phongtrophulyhanam',
  'https://www.facebook.com/groups/phongtrokcndongvanhanam',
  'https://www.facebook.com/groups/phongtrohaui',
  'https://www.facebook.com/groups/378297619208077',
  'https://www.facebook.com/groups/2625290924409395'
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  for (const url of targets) {
    console.log(`\n==================================================`);
    console.log(`TARGET: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);

      // Dismiss dialog
      await page.evaluate(() => {
        document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
          try { el.click(); } catch {}
        });
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
      });

      const data = await page.evaluate(() => {
        const title = document.title;
        const body = document.body.innerText;
        const isLoginWall = body.includes('Bạn hiện không xem được nội dung này') || body.includes('Đăng nhập để xem');
        const isPrivate = body.includes('Nhóm Riêng tư') || body.includes('Chỉ thành viên mới nhìn thấy');
        const isPublic = body.includes('Nhóm Công khai') || body.includes('Bất kỳ ai cũng có thể nhìn thấy');
        
        // Count posts / articles
        const articles = Array.from(document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]'));
        const posts = articles.map(a => a.innerText.trim()).filter(t => t.length > 30);

        return {
          title,
          isLoginWall,
          isPrivate,
          isPublic,
          postCount: posts.length,
          samplePost: posts[0] ? posts[0].slice(0, 150).replace(/\n+/g, ' ') : null
        };
      });

      console.log('Result:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
