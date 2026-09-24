import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

async function testHauiPage() {
  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  console.log('Accessing https://www.facebook.com/phongtrohaui ...');
  await page.goto('https://www.facebook.com/phongtrohaui', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Scroll down a few times to load posts
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(2000);
  }

  const posts = await page.evaluate(() => {
    // Find text blocks or post articles
    const articles = Array.from(document.querySelectorAll('div[role="feed"] > div, div[role="article"], div[data-ad-preview="message"]'));
    return articles.map(a => a.innerText?.trim()).filter(t => t && t.length > 30);
  });

  console.log(`Found ${posts.length} post text items on https://www.facebook.com/phongtrohaui`);
  posts.slice(0, 5).forEach((p, idx) => {
    console.log(`--- Post ${idx+1} ---`);
    console.log(p.substring(0, 180));
  });

  await browser.close();
}

testHauiPage();
