import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

async function inspectDetail() {
  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const url = 'https://phongtro123.com/cho-thue-phong-tro-tai-co-so-3-dai-hoc-cong-nghiep-pr711266.html';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(1500);

  const data = await page.evaluate(() => {
    const title = document.querySelector('h1')?.innerText?.trim();
    // address often in address tag or text containing Địa chỉ
    let address = '';
    const addrEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.innerText?.includes('Địa chỉ:') || el.innerText?.includes('Khu vực:')));
    if (addrEl) address = addrEl.parentElement?.innerText?.trim();

    // Price
    let priceText = '';
    const priceEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.innerText?.includes('triệu/tháng') || el.innerText?.includes('tr/tháng') || el.innerText?.includes('đồng/tháng')));
    if (priceEl) priceText = priceEl.innerText?.trim();

    // Area
    let areaText = '';
    const areaEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.innerText?.match(/\d+\s*m²/));
    if (areaEl) areaText = areaEl.innerText?.trim();

    // Phone
    const phoneBtn = document.querySelector('a[href^="tel:"]');
    const phone = phoneBtn ? phoneBtn.getAttribute('href').replace('tel:', '') : '';

    // Description
    const descEl = document.querySelector('.section-content, .post-description, .post-summary, article');
    const desc = descEl ? descEl.innerText?.trim() : '';

    // Images
    const imgs = Array.from(document.querySelectorAll('img'))
      .map(i => i.src || i.getAttribute('data-src'))
      .filter(s => s && (s.includes('static123.com') || s.includes('images/thumbs') || s.includes('.jpg') || s.includes('.webp')) && !s.includes('logo') && !s.includes('banner') && !s.includes('icon'));

    return {
      title,
      address,
      priceText,
      areaText,
      phone,
      descLength: desc.length,
      descPreview: desc.substring(0, 100),
      imgCount: imgs.length,
      imgs: imgs.slice(0, 4)
    };
  });

  console.log('Extracted detail data:');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
}

inspectDetail();
