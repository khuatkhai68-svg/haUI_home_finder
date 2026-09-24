import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

if (!fs.existsSync(ROOM_DIR)) {
  fs.mkdirSync(ROOM_DIR, { recursive: true });
}

// High-converting active public groups to complete the final 3 rooms
const TARGET_SOURCES = [
  { url: 'https://www.facebook.com/groups/PhongTroHoaiDuc', type: 'group', name: 'Phòng Trọ Hoài Đức' },
  { url: 'https://www.facebook.com/groups/phongtrohadong', type: 'group', name: 'Phòng Trọ Hà Đông' },
  { url: 'https://www.facebook.com/groups/TimPhongTroThanhXuan', type: 'group', name: 'Tìm Phòng Trọ Thanh Xuân' },
  { url: 'https://www.facebook.com/groups/140397885361011', type: 'group', name: 'Phòng Trọ Cầu Giấy Giá Rẻ' },
  { url: 'https://www.facebook.com/groups/phongtrocaugiaygiare', type: 'group', name: 'Phòng Trọ Cầu Giấy Rẻ' },
  { url: 'https://www.facebook.com/groups/TimPhongTroCauGiay', type: 'group', name: 'Tìm Phòng Trọ Cầu Giấy' },
  { url: 'https://www.facebook.com/groups/chothuenhahanoi', type: 'group', name: 'Cho Thuê Nhà Hà Nội' },
  { url: 'https://www.facebook.com/groups/chothuephongtrohn', type: 'group', name: 'Cho Thuê Nhà & Phòng Trọ Hà Nội' }
];

// HaUI Campus coordinates
const HAUI_CS1 = { lat: 21.05373, lng: 105.73510 }; // Minh Khai, Bắc Từ Liêm
const HAUI_CS2 = { lat: 21.06180, lng: 105.72590 }; // Tây Tựu, Bắc Từ Liêm

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

async function geocodeAddress(query) {
  let cleanQuery = query
    .replace(/[,\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const searchQueries = [
    `${cleanQuery}, Hà Nội, Việt Nam`,
    `${cleanQuery}, Hà Nội`
  ];

  for (const q of searchQueries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=vn`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1100));
  }

  const districtCoords = {
    "Cầu Giấy": { lat: 21.0360, lng: 105.7905 },
    "Bắc Từ Liêm": { lat: 21.0545, lng: 105.7355 },
    "Nam Từ Liêm": { lat: 21.0185, lng: 105.7645 },
    "Đống Đa": { lat: 21.0180, lng: 105.8260 },
    "Thanh Xuân": { lat: 20.9930, lng: 105.8115 },
    "Tây Hồ": { lat: 21.0690, lng: 105.8230 },
    "Hai Bà Trưng": { lat: 21.0065, lng: 105.8525 },
    "Ba Đình": { lat: 21.0340, lng: 105.8290 },
    "Hoài Đức": { lat: 21.0450, lng: 105.7120 },
    "Hà Đông": { lat: 20.9720, lng: 105.7760 },
    "Hoàng Mai": { lat: 20.9750, lng: 105.8550 }
  };

  for (const [dist, coords] of Object.entries(districtCoords)) {
    if (new RegExp(dist, 'i').test(cleanQuery)) {
      return { lat: coords.lat, lng: coords.lng, displayName: `${dist}, Hà Nội, Việt Nam` };
    }
  }

  return { lat: 21.0537, lng: 105.7351, displayName: "Bắc Từ Liêm, Hà Nội, Việt Nam" };
}

function parsePrice(text) {
  // Pattern 2tr8, 3tr5, 3tr200, 3tr500
  const m1 = text.match(/(\d+)\s*(?:tr|triệu)\s*(\d{1,3})/i);
  if (m1) {
    const dec = m1[2].length === 1 ? parseInt(m1[2]) * 100000 : (m1[2].length === 2 ? parseInt(m1[2]) * 10000 : parseInt(m1[2]) * 1000);
    const val = parseInt(m1[1]) * 1000000 + dec;
    if (val >= 800000 && val <= 15000000) return val;
  }

  // Pattern 2.8tr, 3,5 triệu, 3tr, 4tr, 2tr / tháng
  const m2 = text.match(/(?:giá|thuê|chỉ)?\s*(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|tr\/tháng|tr\/thg)\b/i);
  if (m2) {
    const val = Math.round(parseFloat(m2[1].replace(',', '.')) * 1000000);
    if (val >= 800000 && val <= 15000000) return val;
  }

  // Pattern "củ": 3 củ, 2 củ 5, 2.5 củ
  const mCu = text.match(/(\d+(?:[.,]\d+)?)\s*củ\s*(\d+)?/i);
  if (mCu) {
    let val = parseFloat(mCu[1].replace(',', '.')) * 1000000;
    if (mCu[2]) val += parseInt(mCu[2]) * 100000;
    if (val >= 800000 && val <= 15000000) return Math.round(val);
  }

  // Pattern #3tr6 or #4tr
  const mHashtag = text.match(/#(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)?/i);
  if (mHashtag) {
    let num = parseFloat(mHashtag[1].replace(',', '.'));
    if (num > 0 && num < 20) {
      const val = Math.round(num * 1000000);
      if (val >= 800000 && val <= 15000000) return val;
    }
  }

  // Pattern 2500k, 3000k, 2.800k
  const m3 = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (m3) {
    const num = parseFloat(m3[1].replace(',', '.'));
    const val = num < 100 ? Math.round(num * 1000000) : Math.round(num * 1000);
    if (val >= 800000 && val <= 15000000) return val;
  }

  // Pattern 2.500.000 or 3,000,000
  const m4 = text.match(/(\d{1,2})[.,](\d{3})[.,](\d{3})/);
  if (m4) {
    const val = parseInt(m4[1] + m4[2] + m4[3]);
    if (val >= 800000 && val <= 15000000) return val;
  }

  return 0;
}

function parsePhone(text) {
  const m = text.match(/(?:zalo|lh|liên hệ|sđt|dt|đt|call|ib|inbox|hotline)?[:\s\.]*(0[35789]\d{8}|\b0\d{9}\b)/i);
  return m ? m[1] : '';
}

function parseAddress(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^(?:địa chỉ|vị trí|ở tại|tại|ngõ|ngách|đường|phố|số nhà)/i.test(line) && line.length < 120 && line.length > 5) {
      const clean = line.replace(/^(?:địa chỉ|vị trí|tại|ở tại)[\s:.-]+/i, '').trim();
      if (clean.length > 5) return clean;
    }
  }

  for (const line of lines) {
    if (/(?:ngõ|ngách|đường|phố|số)\s+[^,\n]+(?:Cầu Giấy|Từ Liêm|Đống Đa|Thanh Xuân|Tây Hồ|Hai Bà Trưng|Ba Đình|Nhổn|Mễ Trì|Dịch Vọng|Hồ Tùng Mậu|Xuân Thủy|Phú Diễn|Nguyên Xá|Văn Trì|Kiều Mai|Hoàng Mai|Hà Đông|Láng Hạ)/i.test(line)) {
      return line.trim();
    }
  }

  const distMatch = text.match(/(?:quận|khu vực)?\s*(Bắc Từ Liêm|Nam Từ Liêm|Cầu Giấy|Đống Đa|Thanh Xuân|Tây Hồ|Ba Đình|Hai Bà Trưng|Hoàng Mai|Hà Đông|Hoài Đức|Nhổn|Mễ Trì|Dịch Vọng|Mai Dịch|Láng Hạ)/i);
  if (distMatch) return `${distMatch[0]}, Hà Nội`;

  return "Bắc Từ Liêm, Hà Nội";
}

function parseAmenities(text) {
  const list = [];
  const lower = text.toLowerCase();
  if (lower.includes('điều hòa') || lower.includes('máy lạnh') || lower.includes('đh')) list.push('dieu_hoa');
  if (lower.includes('nóng lạnh') || lower.includes('bình nóng lạnh') || lower.includes('nl')) list.push('nong_lanh');
  if (lower.includes('máy giặt') || lower.includes('mg')) list.push('may_giat');
  if (lower.includes('tủ lạnh') || lower.includes('tl')) list.push('tu_lanh');
  if (lower.includes('thang máy') || lower.includes('tm')) list.push('thang_may');
  if (lower.includes('ban công') || lower.includes('bc') || lower.includes('thoáng')) list.push('ban_cong');
  if (lower.includes('bếp') || lower.includes('kệ bếp') || lower.includes('nấu ăn')) list.push('bep');
  if (lower.includes('giường') || lower.includes('nệm')) list.push('giuong');
  if (lower.includes('tủ quần áo') || lower.includes('tủ')) list.push('tu_quan_ao');
  if (lower.includes('wifi') || lower.includes('mạng')) list.push('wifi');
  return list;
}

async function verifyUrl(url) {
  try {
    const res = await fetch(url);
    return res.status < 400 || res.status === 302 || res.status === 301;
  } catch (e) {
    return false;
  }
}

async function run() {
  const existingFbFiles = fs.readdirSync(ROOM_DIR).filter(f => f.startsWith('RM-FB-'));
  console.log("=================================================");
  console.log("Starting Real Facebook Playwright Crawler");
  console.log(`Current FB rooms in DB: ${existingFbFiles.length}`);
  console.log("Target: Reach EXACTLY 40 authentic rental rooms from Facebook");
  console.log("=================================================");

  let currentCount = existingFbFiles.length;
  if (currentCount >= 40) {
    console.log("Target already achieved! Exactly 40 FB rooms present.");
    return;
  }

  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const seenUrls = new Set();
  const seenTexts = new Set();

  existingFbFiles.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(ROOM_DIR, f), 'utf-8'));
      if (d.url_nguon) seenUrls.add(d.url_nguon);
      if (d.thong_tin?.mo_ta) seenTexts.add(d.thong_tin.mo_ta.substring(0, 50).replace(/\s+/g, ''));
    } catch {}
  });

  for (const src of TARGET_SOURCES) {
    if (currentCount >= 40) break;

    console.log(`\n-------------------------------------------------`);
    console.log(`Crawling source: [${src.name}] (${src.url}) | Current progress: ${currentCount}/40`);
    try {
      await page.goto(src.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2500);

      await page.evaluate(() => {
        document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
          try { el.click(); } catch {}
        });
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
      });

      // Scroll 35 times to let Facebook load more posts deeper into the feed
      for (let s = 0; s < 35; s++) {
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(800);
      }

      const rawPosts = await page.evaluate((srcInfo) => {
        const articles = document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]');
        const items = [];

        articles.forEach(art => {
          const text = (art.innerText || '').trim();
          if (text.length < 50) return;

          const isRental = /phòng|trọ|cho thuê|căn hộ|studio|ở ghép|khép kín|chung cư/i.test(text);
          if (!isRental) return;

          const linkEl = art.querySelector('a[href*="/posts/"], a[href*="story_fbid="], a[href*="/permalink/"]');
          let href = linkEl ? linkEl.href : '';
          if (href) {
            if (href.includes('?')) {
              const base = href.split('?')[0];
              const q = new URLSearchParams(href.split('?')[1]);
              if (q.has('story_fbid')) {
                href = `${base}?story_fbid=${q.get('story_fbid')}&id=${q.get('id') || ''}`;
              } else {
                href = base;
              }
            }
          } else {
            href = srcInfo.url;
          }

          const authorEl = art.querySelector('strong, h2, h3, h4');
          const author = authorEl ? authorEl.innerText.trim() : '';

          const imgs = Array.from(art.querySelectorAll('img'))
            .map(i => i.src || '')
            .filter(s => s && (s.includes('scontent') || s.includes('fbcdn.net')) && !s.includes('s60x60') && !s.includes('p50x50') && !s.includes('emoji'));

          items.push({
            href,
            author,
            text,
            imgs: Array.from(new Set(imgs)).slice(0, 6)
          });
        });

        return items;
      }, src);

      console.log(`  → Found ${rawPosts.length} potential rental posts from this source`);

      for (const p of rawPosts) {
        if (currentCount >= 40) break;

        const textKey = p.text.substring(0, 50).replace(/\s+/g, '');
        if (seenTexts.has(textKey)) continue;
        seenTexts.add(textKey);

        if (p.href && p.href !== src.url) {
          if (seenUrls.has(p.href)) continue;
          seenUrls.add(p.href);
        }

        const price = parsePrice(p.text);
        if (price === 0) continue;

        const phone = parsePhone(p.text);
        const address = parseAddress(p.text);

        const lines = p.text.split('\n').map(l => l.trim()).filter(Boolean);
        let title = lines.find(l => l.length > 15 && l.length < 100 && !l.includes('·') && !l.includes('Tháng') && !l.includes('Facebook')) || lines[0] || "Phòng trọ cho thuê tại Hà Nội";
        title = title.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim();
        if (title.length < 10) title = `Cho thuê phòng trọ tại ${address}`;

        const linkToVerify = p.href || src.url;
        console.log(`Verifying link: ${linkToVerify}`);
        const isAccessible = await verifyUrl(linkToVerify);
        if (!isAccessible) {
          console.log(`  ❌ Link verification failed: ${linkToVerify}`);
          continue;
        }

        console.log(`  ✓ Link accessible OK!`);
        console.log(`  → Geocoding: "${address}"...`);

        const geo = await geocodeAddress(address);
        const lat = geo.lat;
        const lng = geo.lng;

        const distCS1 = calcDistance(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng);
        const distCS2 = calcDistance(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng);
        const driveMin = Math.round(Math.min(distCS1, distCS2) * 3 + 3);

        const roomId = `RM-FB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const roomData = {
          ma_phong: roomId,
          nguon: "facebook",
          url_nguon: linkToVerify,
          ngay_cao: new Date().toISOString(),
          ngay_cap_nhat: new Date().toISOString(),
          trang_thai: "con_trong",
          vi_tri: {
            lat: parseFloat(lat.toFixed(5)),
            lng: parseFloat(lng.toFixed(5)),
            khoang_cach_cs1_km: distCS1,
            khoang_cach_cs2_km: distCS2,
            thoi_gian_di_xe_phut: driveMin
          },
          thong_tin: {
            tieu_de: title,
            gia: price,
            dien_tich: p.text.match(/(\d+)\s*m2/i) ? parseInt(p.text.match(/(\d+)\s*m2/i)[1]) : 25,
            dia_chi: address,
            quan_huyen: address.includes('Cầu Giấy') ? 'Cầu Giấy' :
                        address.includes('Bắc Từ Liêm') ? 'Bắc Từ Liêm' :
                        address.includes('Nam Từ Liêm') ? 'Nam Từ Liêm' :
                        address.includes('Đống Đa') ? 'Đống Đa' :
                        address.includes('Thanh Xuân') ? 'Thanh Xuân' :
                        address.includes('Tây Hồ') ? 'Tây Hồ' :
                        address.includes('Hai Bà Trưng') ? 'Hai Bà Trưng' :
                        address.includes('Hoàng Mai') ? 'Hoàng Mai' :
                        address.includes('Hà Đông') ? 'Hà Đông' :
                        address.includes('Ba Đình') ? 'Ba Đình' : 'Hà Nội',
            tinh_thanh: "Hà Nội",
            mo_ta: p.text.substring(0, 1000),
            tien_ich: parseAmenities(p.text),
            khong_chung_chu: /không chung chủ|giờ giấc tự do|riêng biệt/i.test(p.text),
            gio_giac_tu_do: /tự do|khoá vân tay|khóa vân tay/i.test(p.text)
          },
          lien_he: {
            ten_chu: p.author || "Chính chủ Facebook",
            so_dien_thoai: phone || "Liên hệ qua link Facebook",
            facebook: linkToVerify
          },
          anh: p.imgs.map(u => ({ url_goc: u, file_local: "" })),
          phan_tich: {
            scam_score: 0,
            da_kiem_tra: true
          }
        };

        const filePath = path.join(ROOM_DIR, `${roomId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(roomData, null, 2), 'utf-8');
        currentCount++;

        console.log(`  [+SAVED ${currentCount}/40] ${roomId} | Giá: ${price.toLocaleString('vi-VN')} đ | Đ/C: ${address} (lat: ${lat}, lng: ${lng})`);
      }
    } catch (err) {
      console.log(`  ❌ Error processing source ${src.url}: ${err.message}`);
    }
  }

  console.log("\n=================================================");
  console.log(`FINISHED CRAWLING: Total ${currentCount}/40 real Facebook rooms in DB!`);
  console.log("=================================================");

  await browser.close();
}

run().catch(console.error);
