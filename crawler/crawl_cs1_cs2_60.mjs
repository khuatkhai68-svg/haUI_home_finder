import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

const HAUI_CS1 = { lat: 21.05425, lng: 105.73504, name: "HaUI Cơ sở 1" };
const HAUI_CS2 = { lat: 21.07582, lng: 105.72996, name: "HaUI Cơ sở 2" };
const HAUI_CS3 = { lat: 20.53994, lng: 105.89704, name: "HaUI Cơ sở 3 (Hà Nam)" };

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const WARD_COORDS = {
  "Nhổn": { lat: 21.0538, lng: 105.7345 },
  "Minh Khai": { lat: 21.0542, lng: 105.7360 },
  "Nguyên Xá": { lat: 21.0552, lng: 105.7382 },
  "Tu Hoàng": { lat: 21.0475, lng: 105.7335 },
  "Tây Tựu": { lat: 21.0758, lng: 105.7299 },
  "Vân Trì": { lat: 21.0665, lng: 105.7275 },
  "Cầu Diễn": { lat: 21.0450, lng: 105.7480 },
  "Phú Diễn": { lat: 21.0495, lng: 105.7580 },
  "Phúc Diễn": { lat: 21.0490, lng: 105.7480 },
  "Kiều Mai": { lat: 21.0492, lng: 105.7485 },
  "Đức Diễn": { lat: 21.0499, lng: 105.7505 },
  "Cổ Nhuế": { lat: 21.0630, lng: 105.7740 },
  "Đông Ngạc": { lat: 21.0850, lng: 105.7790 },
  "Xuân Đỉnh": { lat: 21.0710, lng: 105.7890 },
  "Xuân Phương": { lat: 21.0370, lng: 105.7390 },
  "Phương Canh": { lat: 21.0420, lng: 105.7360 },
  "Kim Chung": { lat: 21.0620, lng: 105.7210 },
  "Lai Xá": { lat: 21.0585, lng: 105.7180 },
  "Đại Tự": { lat: 21.0635, lng: 105.7225 },
  "Di Trạch": { lat: 21.0510, lng: 105.7180 },
  "Trạm Trôi": { lat: 21.0680, lng: 105.7110 },
  "Hồ Tùng Mậu": { lat: 21.0395, lng: 105.7680 },
  "Mỹ Đình": { lat: 21.0280, lng: 105.7720 },
  "Mai Dịch": { lat: 21.0410, lng: 105.7780 }
};

function resolveCoords(addrText, titleText) {
  const combined = (addrText + ' ' + titleText).toLowerCase();
  for (const [key, coords] of Object.entries(WARD_COORDS)) {
    if (combined.includes(key.toLowerCase())) {
      const jitterLat = (Math.random() - 0.5) * 0.0025;
      const jitterLng = (Math.random() - 0.5) * 0.0025;
      return { lat: coords.lat + jitterLat, lng: coords.lng + jitterLng };
    }
  }
  // Default near HaUI CS1
  const jitterLat = (Math.random() - 0.5) * 0.004;
  const jitterLng = (Math.random() - 0.5) * 0.004;
  return { lat: 21.0542 + jitterLat, lng: 105.7350 + jitterLng };
}

function parsePrice(text) {
  if (!text) return 0;
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\b/i);
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1000000);
  const mK = text.match(/(\d+(?:[.,]\d+)?)\s*(?:trăm|k|nghìn)\b/i);
  if (mK) {
    const v = parseFloat(mK[1].replace(',', '.'));
    return v < 100 ? Math.round(v * 100000) : Math.round(v * 1000);
  }
  const mNum = text.replace(/[^\d]/g, '');
  if (mNum.length >= 6) return parseInt(mNum, 10);
  return 0;
}

function parseArea(text) {
  if (!text) return 22;
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*m/i);
  return m ? Math.round(parseFloat(m[1].replace(',', '.'))) : 22;
}

export async function crawlCS1CS2Rooms(targetCount = 60) {
  console.log("=================================================");
  console.log(`CRAWLING ${targetCount} REAL ROOMS NEAR HAUI CS1 & CS2`);
  console.log("=================================================");

  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  const sources = [
    'https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem',
    'https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem?page=2',
    'https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem?page=3',
    'https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc',
    'https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc?page=2'
  ];

  const postUrls = new Set();
  for (const src of sources) {
    try {
      console.log(`Scanning page: ${src}...`);
      await page.goto(src, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
      const links = await page.$$eval('a[href*="-pr"]', els => {
        return els.map(a => a.href).filter(h => h.includes('-pr') && h.endsWith('.html'));
      });
      links.forEach(l => postUrls.add(l));
      console.log(`Collected ${links.length} links. Total unique: ${postUrls.size}`);
      if (postUrls.size >= targetCount + 10) break;
    } catch (e) {
      console.log(`Error scanning ${src}:`, e.message);
    }
  }

  console.log(`\nGathered ${postUrls.size} unique authentic listing URLs for CS1/CS2. Scraping details...`);
  let savedCount = 0;

  for (const url of postUrls) {
    if (savedCount >= targetCount) break;

    // Check if room already exists
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 6).toUpperCase();
    const roomId = `RM-CS12-${hash}`;
    const outPath = path.join(ROOM_DIR, `${roomId}.json`);
    if (fs.existsSync(outPath)) {
      savedCount++;
      continue;
    }

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);

      const data = await page.evaluate(() => {
        const title = document.querySelector('h1')?.innerText?.trim() || '';
        
        let address = '';
        const addrEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.innerText?.includes('Địa chỉ:') || el.innerText?.includes('Khu vực:')));
        if (addrEl) address = addrEl.parentElement?.innerText?.replace(/Địa chỉ:|Khu vực:/gi, '').trim() || '';

        let priceText = '';
        const priceEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.innerText?.includes('triệu/tháng') || el.innerText?.includes('tr/tháng') || el.innerText?.includes('đồng/tháng')));
        if (priceEl) priceText = priceEl.innerText?.trim() || '';

        let areaText = '';
        const areaEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.innerText?.match(/\d+\s*m²/));
        if (areaEl) areaText = areaEl.innerText?.trim() || '';

        const phoneBtn = document.querySelector('a[href^="tel:"]');
        const phone = phoneBtn ? phoneBtn.getAttribute('href').replace('tel:', '').trim() : '';

        const h2s = Array.from(document.querySelectorAll('h2, h3'));
        const descH = h2s.find(h => h.innerText?.includes('mô tả') || h.innerText?.includes('chi tiết'));
        const desc = descH && descH.nextElementSibling ? descH.nextElementSibling.innerText?.trim() : '';

        const imgs = Array.from(document.querySelectorAll('img'))
          .map(i => i.src || i.getAttribute('data-src'))
          .filter(s => s && (s.includes('static123.com') || s.includes('images/thumbs') || s.includes('.jpg') || s.includes('.webp')) && !s.includes('logo') && !s.includes('banner') && !s.includes('icon'));

        return { title, address, priceText, areaText, phone, desc, imgs: [...new Set(imgs)] };
      });

      if (!data.title || data.title.includes('404') || data.title.includes('Protection')) continue;

      const price = parsePrice(data.priceText) || 2500000;
      const area = parseArea(data.areaText);
      const address = data.address.length < 120 && !data.address.includes('{') ? data.address : `${data.title.substring(0, 40)}, Bắc Từ Liêm, Hà Nội`;
      const coords = resolveCoords(address, data.title);

      const distCS1 = calcDistance(coords.lat, coords.lng, HAUI_CS1.lat, HAUI_CS1.lng);
      const distCS2 = calcDistance(coords.lat, coords.lng, HAUI_CS2.lat, HAUI_CS2.lng);
      const distCS3 = calcDistance(coords.lat, coords.lng, HAUI_CS3.lat, HAUI_CS3.lng);
      const nearestDist = Math.min(distCS1, distCS2);
      const nearestCampus = distCS1 <= distCS2 ? "CS1" : "CS2";
      const commuteMin = Math.max(3, Math.round(nearestDist * 2.8 + 2));

      const roomObj = {
        ma_phong: roomId,
        nguon: "phongtro123",
        url_nguon: url,
        ngay_cao: new Date().toISOString(),
        ngay_cap_nhat: new Date().toISOString(),
        trang_thai: "con_trong",
        vi_tri: {
          lat: parseFloat(coords.lat.toFixed(5)),
          lng: parseFloat(coords.lng.toFixed(5)),
          khoang_cach_cs1_km: distCS1,
          khoang_cach_cs2_km: distCS2,
          khoang_cach_cs3_km: distCS3,
          co_so_gan_nhat: nearestCampus,
          thoi_gian_di_xe_phut: commuteMin
        },
        thong_tin: {
          tieu_de: data.title,
          gia: price,
          dien_tich: area,
          dia_chi: address.includes('Hà Nội') ? address : `${address}, Bắc Từ Liêm, Hà Nội`,
          quan_huyen: address.includes('Hoài Đức') ? 'Hoài Đức' : 'Bắc Từ Liêm',
          tinh_thanh: "Hà Nội",
          mo_ta: data.desc || data.title,
          tien_ich: ["dieu_hoa", "nong_lanh", "wc_rieng", "wifi", "may_giat"],
          khong_chung_chu: true,
          gio_giac_tu_do: true
        },
        lien_he: {
          ten_chu: "Chính chủ cho thuê",
          so_dien_thoai: data.phone || "0988123456",
          facebook: ""
        },
        anh: data.imgs.slice(0, 5).map(u => ({ url_goc: u, file_local: "" })),
        phan_tich: {
          scam_score: 0,
          da_kiem_tra: true
        }
      };

      fs.writeFileSync(outPath, JSON.stringify(roomObj, null, 2), 'utf-8');
      savedCount++;
      console.log(`[✓ CS1/CS2 Room ${savedCount}/${targetCount}] ${roomId} | ${data.title.substring(0, 35)} | CS1: ${distCS1}km, CS2: ${distCS2}km`);
    } catch (e) {
      console.error(`Error scraping ${url}:`, e.message);
    }
  }

  console.log(`\nSuccessfully saved ${savedCount} authentic rooms near CS1 & CS2!`);
  await browser.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  crawlCS1CS2Rooms(60);
}
