import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const ROOM_DIR = path.resolve('alldata/room');
const HAUI_CS1 = { lat: 21.05373, lng: 105.73510 };
const HAUI_CS2 = { lat: 21.06180, lng: 105.72590 };
const HAUI_CS3 = { lat: 20.54100, lng: 105.89800 };

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const CS1_LANDMARKS = {
  "nguyên xá": { lat: 21.0552, lng: 105.7382, addr: "Nguyên Xá, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "văn trì": { lat: 21.0585, lng: 105.7390, addr: "Đường Văn Trì, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "nhổn": { lat: 21.0538, lng: 105.7345, addr: "Phố Nhổn, Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "minh khai": { lat: 21.0542, lng: 105.7360, addr: "Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội" },
  "đình quán": { lat: 21.0505, lng: 105.7425, addr: "Phố Đình Quán, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "kiều mai": { lat: 21.0480, lng: 105.7460, addr: "Đường Kiều Mai, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "cầu diễn": { lat: 21.0450, lng: 105.7480, addr: "Đường Cầu Diễn, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "phú diễn": { lat: 21.0495, lng: 105.7580, addr: "Đường Phú Diễn, Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "phúc diễn": { lat: 21.0490, lng: 105.7480, addr: "Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "đức diễn": { lat: 21.0499, lng: 105.7505, addr: "Phố Đức Diễn, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "tu hoàng": { lat: 21.0475, lng: 105.7335, addr: "Phố Tu Hoàng, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "phương canh": { lat: 21.0420, lng: 105.7360, addr: "Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "xuân phương": { lat: 21.0370, lng: 105.7390, addr: "Đường Xuân Phương, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "trịnh văn bô": { lat: 21.0425, lng: 105.7390, addr: "Đường Trịnh Văn Bô, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "văn tiến dũng": { lat: 21.0500, lng: 105.7480, addr: "Đường Văn Tiến Dũng, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "hồ tùng mậu": { lat: 21.0395, lng: 105.7680, addr: "Đường Hồ Tùng Mậu, Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "tây tựu": { lat: 21.0618, lng: 105.7259, addr: "Đường Tây Tựu, Phường Tây Tựu, Quận Bắc Từ Liêm, Hà Nội" },
  "kim chung": { lat: 21.0590, lng: 105.7210, addr: "Xã Kim Chung, Huyện Hoài Đức, Hà Nội" },
  "lai xá": { lat: 21.0585, lng: 105.7180, addr: "Khu đô thị Lai Xá, Xã Kim Chung, Huyện Hoài Đức, Hà Nội" },
  "di trạch": { lat: 21.0510, lng: 105.7180, addr: "Xã Di Trạch, Huyện Hoài Đức, Hà Nội" },
  "trạm trôi": { lat: 21.0680, lng: 105.7110, addr: "Thị trấn Trạm Trôi, Huyện Hoài Đức, Hà Nội" },
  "hòe thị": { lat: 21.0410, lng: 105.7420, addr: "Phố Hòe Thị, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội" },
  "đại tự": { lat: 21.0610, lng: 105.7190, addr: "Thôn Đại Tự, Xã Kim Chung, Huyện Hoài Đức, Hà Nội" },
  "phú minh": { lat: 21.0620, lng: 105.7450, addr: "Đường Phú Minh, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội" },
  "thị cấm": { lat: 21.0360, lng: 105.7460, addr: "Phố Thị Cấm, Phường Xuân Phương, Quận Nam Từ Liêm, Hà Nội" },
  "ngọc mạch": { lat: 21.0350, lng: 105.7430, addr: "Phố Ngọc Mạch, Phường Xuân Phương, Quận Nam Từ Liêm, Hà Nội" },
  "vân canh": { lat: 21.0380, lng: 105.7220, addr: "Khu đô thị Vân Canh, Huyện Hoài Đức, Hà Nội" }
};

const CS3_LANDMARKS = {
  "phù vân": { lat: 20.5435, lng: 105.8992, addr: "Xã Phù Vân, TP. Phủ Lý, Tỉnh Hà Nam" },
  "sông đáy": { lat: 20.5450, lng: 105.9015, addr: "Bờ Tây Sông Đáy, Xã Phù Vân, TP. Phủ Lý, Hà Nam" },
  "đinh tiên hoàng": { lat: 20.5460, lng: 105.9030, addr: "Đường Đinh Tiên Hoàng kéo dài, Xã Phù Vân, TP. Phủ Lý, Hà Nam" },
  "lê hồng phong": { lat: 20.5385, lng: 105.8955, addr: "Phường Lê Hồng Phong, TP. Phủ Lý, Tỉnh Hà Nam" },
  "quang trung": { lat: 20.5480, lng: 105.9150, addr: "Phường Quang Trung, TP. Phủ Lý, Tỉnh Hà Nam" },
  "trường thi": { lat: 20.5345, lng: 105.9080, addr: "Phường Trường Thi, TP. Phủ Lý, Tỉnh Hà Nam" },
  "kim bảng": { lat: 20.5620, lng: 105.8420, addr: "Huyện Kim Bảng, Tỉnh Hà Nam" },
  "phủ lý": { lat: 20.5410, lng: 105.9130, addr: "Thành phố Phủ Lý, Tỉnh Hà Nam" }
};

function resolveLocation(text, region) {
  const lower = text.toLowerCase();
  if (region === 'hanam_cs3' || lower.includes('hà nam') || lower.includes('phủ lý') || lower.includes('phù vân') || lower.includes('cs3')) {
    for (const [kw, info] of Object.entries(CS3_LANDMARKS)) {
      if (lower.includes(kw)) {
        return { lat: info.lat, lng: info.lng, address: info.addr, campus: 'CS3', district: 'Phủ Lý', city: 'Hà Nam' };
      }
    }
    return { lat: HAUI_CS3.lat, lng: HAUI_CS3.lng, address: "Xã Phù Vân, TP. Phủ Lý, Tỉnh Hà Nam (gần HaUI CS3)", campus: 'CS3', district: 'Phủ Lý', city: 'Hà Nam' };
  }

  for (const [kw, info] of Object.entries(CS1_LANDMARKS)) {
    if (lower.includes(kw)) {
      const isCS2 = kw === 'tây tựu';
      const isHoaiDuc = kw === 'kim chung' || kw === 'lai xá' || kw === 'di trạch' || kw === 'trạm trôi' || kw === 'vân canh';
      const isNamTuLiem = kw === 'tu hoàng' || kw === 'phương canh' || kw === 'xuân phương' || kw === 'trịnh văn bô';
      const dist = isHoaiDuc ? 'Hoài Đức' : (isNamTuLiem ? 'Nam Từ Liêm' : 'Bắc Từ Liêm');
      return { lat: info.lat, lng: info.lng, address: info.addr, campus: isCS2 ? 'CS2' : 'CS1', district: dist, city: 'Hà Nội' };
    }
  }

  return { lat: HAUI_CS1.lat, lng: HAUI_CS1.lng, address: "Phường Minh Khai, Quận Bắc Từ Liêm, Hà Nội (gần HaUI CS1)", campus: 'CS1', district: 'Bắc Từ Liêm', city: 'Hà Nội' };
}

function parsePrice(text) {
  if (!text) return 0;
  const sanitized = text.replace(/\b\d{1,2}\/\d{1,2}\b/g, '');

  const mTrK = sanitized.match(/(\d+)\s*(?:tr|triệu)\s*(\d{3})\s*(?:k|đ|vnđ)?\b/i);
  if (mTrK) {
    const val = parseInt(mTrK[1]) * 1000000 + parseInt(mTrK[2]) * 1000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  const mCompound = sanitized.match(/(\d+)\s*(?:tr|triệu|củ)\s*(\d)\b/i);
  if (mCompound) {
    const val = parseInt(mCompound[1]) * 1000000 + parseInt(mCompound[2]) * 100000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  const mDec = sanitized.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|trieu|củ|tr\/tháng)\b/i);
  if (mDec) {
    const val = Math.round(parseFloat(mDec[1].replace(',', '.')) * 1000000);
    if (val >= 600000 && val <= 8000000) return val;
  }
  const mGia = sanitized.match(/giá\s*[:\s-]*(\d+)[.,](\d{3})\b/i);
  if (mGia) {
    const val = parseInt(mGia[1]) * 1000000 + parseInt(mGia[2]) * 1000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  const mK = sanitized.match(/(\d{3,4})\s*(?:k|nghìn|ngàn)\b/i);
  if (mK) {
    const val = parseInt(mK[1]) * 1000;
    if (val >= 600000 && val <= 8000000) return val;
  }
  const mFull = sanitized.match(/(\d{1,2})[.,](\d{3})[.,](\d{3})/);
  if (mFull) {
    const val = parseInt(mFull[1] + mFull[2] + mFull[3]);
    if (val >= 600000 && val <= 8000000) return val;
  }
  return 0;
}

function parsePhone(text) {
  const m = text.match(/(?:zalo|lh|liên hệ|sđt|dt|đt|call|hotline|ib)?[:\s\.]*(0[35789]\d{8}|\b0\d{9}\b)/i);
  return m ? m[1].replace(/\s+/g, '') : '';
}

function cleanFbNoise(text) {
  if (!text) return '';
  let lines = text.split('\n');
  lines = lines.filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (t === 'Thích' || t === 'Bình luận' || t === 'Chia sẻ') return false;
    if (t.includes('Quản trị viên') || t.includes('Người kiểm duyệt') || t.includes('Người tham gia ẩn danh')) return false;
    if (/^\d+:\d+\s*\/\s*\d+:\d+$/.test(t)) return false;
    if (/^\+?\d+$/.test(t)) return false;
    if (/^·\s*\d+\s*(giờ|phút|ngày|tuần)/i.test(t)) return false;
    if (/^\d+\s*(giờ|phút|ngày|tuần)\s*·?/i.test(t)) return false;
    if (t === '·' || t === 'Xem thêm' || t === 'Xem bớt') return false;
    return true;
  });

  if (lines.length > 1 && lines[0].split(' ').length <= 4 && !/(?:phòng|trọ|nhà|thuê|giá|ngõ|cs1|cs2|cs3)/i.test(lines[0])) {
    lines.shift();
  }
  return lines.join('\n').trim();
}

function isRentalOffer(text) {
  const lower = text.toLowerCase();
  // Filter out room seekers, roommate seekers, item selling, job ads, land sales, questions
  if (lower.includes('cần tìm phòng') || lower.includes('tìm trọ') || lower.includes('tìm người ở ghép') ||
      lower.includes('ở ghép') || lower.includes('tìm ở ghép') || lower.includes('pass đồ') ||
      lower.includes('thanh lý') || lower.includes('tuyển dụng') || lower.includes('bán đất') ||
      lower.includes('bất động sản thổ cư') || lower.includes('sổ đỏ') || lower.includes('bán tào phớ') ||
      lower.includes('nhà xe') || lower.includes('cần thuê phòng') || lower.includes('tìm phòng trọ') ||
      lower.includes('e cần tìm') || lower.includes('mình cần tìm') || lower.includes('ai pass phòng') ||
      lower.includes('xin hình') || lower.includes('còn k ạ') || lower.includes('giá ntn')) {
    return false;
  }
  // Filter out locations too far away from HaUI
  if (lower.includes('võng thị') || lower.includes('vũ tông phan') || lower.includes('khương trung') ||
      lower.includes('phùng chí kiên') || lower.includes('thụy khuê') || lower.includes('hoàng mai') ||
      lower.includes('gia lâm') || lower.includes('long biên') || lower.includes('đông anh') ||
      lower.includes('thanh xuân') || lower.includes('đống đa') || lower.includes('hai bà trưng')) {
    return false;
  }
  return true;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});

await page.goto('https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

await page.evaluate(() => {
  document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
    try { el.click(); } catch {}
  });
  document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
});

for (let i = 1; i <= 6; i++) {
  await page.evaluate(() => {
    const sc = Array.from(document.querySelectorAll('*')).find(el => el.scrollHeight > el.clientHeight + 100 && window.getComputedStyle(el).overflowY === 'auto') || document.documentElement;
    sc.scrollTop += 2000;
  });
  await page.waitForTimeout(1400);
}

const extracted = await page.evaluate(() => {
  const articles = document.querySelectorAll('[role="article"]');
  const items = [];
  articles.forEach(art => {
    const text = (art.innerText || '').trim();
    if (text.length < 35) return;

    // Get permalinks excluding comment links
    const links = Array.from(art.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => (h.includes('/posts/') || h.includes('/permalink/')) && !h.includes('comment_id'));

    const imgs = Array.from(art.querySelectorAll('img'))
      .map(i => i.src || '')
      .filter(s => s && (s.includes('scontent') || s.includes('fbcdn.net')) && !s.includes('s60x60') && !s.includes('emoji'));

    if (links.length > 0) {
      items.push({
        text,
        url: links[0].split('?')[0],
        imgs: Array.from(new Set(imgs)).slice(0, 4)
      });
    }
  });
  return items;
});

console.log(`Extracted ${extracted.length} posts with valid permalinks!`);
let saved = 0;
for (const p of extracted) {
  if (!isRentalOffer(p.text)) {
    console.log('Skipping non-rental/seeker:', p.text.substring(0, 50));
    continue;
  }
  const cleanDesc = cleanFbNoise(p.text);
  const price = parsePrice(cleanDesc);
  if (price === 0) {
    console.log('Skipping no-price:', cleanDesc.substring(0, 50));
    continue;
  }
  console.log(` -> FOUND VALID ROOM: price=${price} | link=${p.url}`);
  console.log(`    Snippet: ${cleanDesc.substring(0, 80).replace(/\n/g, ' ')}`);
  saved++;
}
console.log(`Total valid rooms in this single page load: ${saved}`);

await browser.close();
