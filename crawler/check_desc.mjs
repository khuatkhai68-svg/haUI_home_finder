import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

async function checkDescTag() {
  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://phongtro123.com/cho-thue-phong-tro-tai-co-so-3-dai-hoc-cong-nghiep-pr711266.html', { waitUntil: 'domcontentloaded' });

  const desc = await page.evaluate(() => {
    // Find heading with "Thông tin mô tả"
    const h2s = Array.from(document.querySelectorAll('h2, h3'));
    const descH = h2s.find(h => h.innerText?.includes('mô tả') || h.innerText?.includes('chi tiết'));
    if (descH && descH.nextElementSibling) {
      return descH.nextElementSibling.innerText?.trim();
    }
    const sec = document.querySelector('.section-content, .post-content, .post-main-content, .content');
    return sec ? sec.innerText?.trim() : 'not found';
  });

  console.log('Desc extracted:', desc);
  await browser.close();
}

checkDescTag();
