import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

const FB_HANAM_TARGETS = [
  'https://www.facebook.com/phongtrohaui',
  'https://www.facebook.com/groups/phongtrohanam',
  'https://www.facebook.com/groups/timphongtrohanam',
  'https://www.facebook.com/groups/chothuephongtrophuly',
  'https://www.facebook.com/groups/sinhvienhanam',
  'https://www.facebook.com/groups/sinhvienhauics3'
];

async function checkFbTargets() {
  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  for (const url of FB_HANAM_TARGETS) {
    try {
      console.log(`Checking Facebook: ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      const title = await page.title();
      const bodyText = await page.innerText('body');
      const isPublic = !bodyText.includes('Nhóm riêng tư') && !bodyText.includes('Private group');
      const hasPosts = bodyText.includes('Bài viết') || bodyText.includes('Thích') || bodyText.includes('Bình luận');
      console.log(`  -> Title: ${title}`);
      console.log(`  -> Public: ${isPublic}, Has Posts: ${hasPosts}, Content Length: ${bodyText.length}`);
    } catch (e) {
      console.log(`  -> Error checking ${url}:`, e.message);
    }
  }

  await browser.close();
}

checkFbTargets();
