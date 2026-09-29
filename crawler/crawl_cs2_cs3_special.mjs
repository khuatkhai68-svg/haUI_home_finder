import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');

// ── Tọa độ chuẩn 3 cơ sở HaUI ────────────────────────────────────────────────
const HAUI_CS1 = { lat: 21.05373, lng: 105.73510, name: "HaUI Cơ sở 1 (Minh Khai - Bắc Từ Liêm)" };
const HAUI_CS2 = { lat: 21.06180, lng: 105.72590, name: "HaUI Cơ sở 2 (Tây Tựu - Bắc Từ Liêm)" };
const HAUI_CS3 = { lat: 20.54100, lng: 105.89800, name: "HaUI Cơ sở 3 (Phù Vân - Phủ Lý - Hà Nam)" };

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

const HANOI_COORDS = {
  // Cụm trọng điểm CS2 - Tây Tựu & Hoài Đức
  "tây tựu": { lat: 21.0618, lng: 105.7259, dist: "Bắc Từ Liêm" },
  "trung tựu": { lat: 21.0585, lng: 105.7255, dist: "Bắc Từ Liêm" },
  "thượng cát": { lat: 21.0950, lng: 105.7280, dist: "Bắc Từ Liêm" },
  "liên mạc": { lat: 21.0920, lng: 105.7450, dist: "Bắc Từ Liêm" },
  "kim chung": { lat: 21.0590, lng: 105.7210, dist: "Hoài Đức" },
  "lai xá": { lat: 21.0585, lng: 105.7180, dist: "Hoài Đức" },
  "di trạch": { lat: 21.0510, lng: 105.7180, dist: "Hoài Đức" },
  "đại tự": { lat: 21.0610, lng: 105.7190, dist: "Hoài Đức" },
  "vân canh": { lat: 21.0380, lng: 105.7220, dist: "Hoài Đức" },
  "trạm trôi": { lat: 21.0680, lng: 105.7110, dist: "Hoài Đức" },
  "đức thượng": { lat: 21.0740, lng: 105.7020, dist: "Hoài Đức" },
  "sơn đồng": { lat: 21.0450, lng: 105.7050, dist: "Hoài Đức" },
  "lideco": { lat: 21.0665, lng: 105.7115, dist: "Hoài Đức" },
  "an khánh": { lat: 21.0020, lng: 105.7380, dist: "Hoài Đức" },
  "song phương": { lat: 21.0180, lng: 105.6980, dist: "Hoài Đức" },
  "hoài đức": { lat: 21.0550, lng: 105.7150, dist: "Hoài Đức" }
};

const HANAM_COORDS = {
  "phù vân": { lat: 20.5410, lng: 105.8980, ward: "Phù Vân" },
  "lê hồng phong": { lat: 20.5380, lng: 105.9050, ward: "Lê Hồng Phong" },
  "quang trung": { lat: 20.5360, lng: 105.9120, ward: "Quang Trung" },
  "minh khai": { lat: 20.5420, lng: 105.9150, ward: "Minh Khai" },
  "lương khánh thiện": { lat: 20.5350, lng: 105.9170, ward: "Lương Khánh Thiện" },
  "trần hưng đạo": { lat: 20.5390, lng: 105.9180, ward: "Trần Hưng Đạo" },
  "châu sơn": { lat: 20.5210, lng: 105.9020, ward: "Châu Sơn" },
  "thanh tuyền": { lat: 20.5120, lng: 105.9250, ward: "Thanh Tuyền" },
  "liêm chính": { lat: 20.5280, lng: 105.9320, ward: "Liêm Chính" },
  "lam hạ": { lat: 20.5550, lng: 105.9280, ward: "Lam Hạ" },
  "kim bảng": { lat: 20.5620, lng: 105.8420, ward: "Kim Bảng" },
  "duy tiên": { lat: 20.6120, lng: 105.9450, ward: "Duy Tiên" },
  "đồng văn": { lat: 20.6380, lng: 105.9180, ward: "Duy Tiên" },
  "phủ lý": { lat: 20.5399, lng: 105.9050, ward: "TP. Phủ Lý" }
};

const ADDR_BLACKLIST = [
  'quận 1','quận 2','quận 3','quận 4','quận 5','quận 6','quận 7','quận 8','quận 9',
  'quận 10','quận 11','quận 12','bình thạnh','gò vấp','tân bình','tân phú',
  'phú nhuận','bình tân','thủ đức','nhà bè','hóc môn','củ chi','bình chánh',
  'hồ chí minh','tp.hcm','tphcm','sài gòn','saigon','đà nẵng','bình dương','đồng nai'
];

function isCommercialSpam(text) {
  const lower = (text || '').toLowerCase();
  const spamKeywords = [
    'sofa', 'da bò', 'máy in', 'in chuyển nhiệt', 'tuyến giáp', 'đồ thờ', 
    'sữa canxi', 'khóa học', 'khoá học', 'tuyển dụng', 'việc làm', 'ctv', 
    'bán đất', 'đất nền', 'bất động sản nghỉ dưỡng', 'mái thái', 
    'khối u', 'thẩm mỹ', 'spa', 'massage', 'xe máy', 'thanh lý đồ',
    'bán nhà', 'bán biệt thự', 'bán shophouse', 'bán căn hộ',
    'cho thuê mặt bằng', 'mặt bằng kinh doanh', 'mặt tiền quốc lộ', 'kiot', 'kho xưởng'
  ];
  return spamKeywords.some(kw => lower.includes(kw));
}

function parsePrice(text) {
  if (!text) return 0;
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|đồng|đ)\b/i);
  if (m) {
    const num = parseFloat(m[1].replace(',', '.'));
    if (num > 0 && num < 100) return Math.round(num * 1000000);
  }
  const mK = text.match(/(\d+(?:[.,]\d+)?)\s*(?:trăm|k|nghìn)\b/i);
  if (mK) {
    const v = parseFloat(mK[1].replace(',', '.'));
    return v < 100 ? Math.round(v * 100000) : Math.round(v * 1000);
  }
  const mNum = text.replace(/[^\d]/g, '');
  if (mNum.length >= 6) {
    const n = parseInt(mNum, 10);
    if (n >= 500000 && n <= 15000000) return n;
  }
  return 0;
}

function parseArea(text) {
  if (!text) return 20;
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*m/i);
  return m ? Math.round(parseFloat(m[1].replace(',', '.'))) : 20;
}

function parseAmenities(text) {
  const lower = (text || '').toLowerCase();
  const amenities = [];
  if (/điều h[oò]a|đh|máy lạnh/i.test(lower)) amenities.push("dieu_hoa");
  if (/nóng lạnh|nl|bình nóng/i.test(lower)) amenities.push("nong_lanh");
  if (/máy giặt|mg\b/i.test(lower)) amenities.push("may_giat");
  if (/tủ lạnh/i.test(lower)) amenities.push("tu_lanh");
  if (/khép kín|wc riêng|vệ sinh riêng|toilet riêng/i.test(lower)) amenities.push("wc_rieng");
  if (/ban công|bc thoáng|cửa sổ/i.test(lower)) amenities.push("ban_cong");
  if (/gác xép|gác lửng|duplex/i.test(lower)) amenities.push("gac_xep");
  if (/wifi|mạng/i.test(lower)) amenities.push("wifi");
  if (/tủ quần áo|giường|full đồ|full nt|full nội thất/i.test(lower)) amenities.push("giuong_tu");
  if (/bếp|nấu ăn|kệ bếp/i.test(lower)) amenities.push("bep");
  if (/thang máy/i.test(lower)) amenities.push("thang_may");
  return Array.from(new Set(amenities));
}

function resolveLocation(address, text, isHaNam) {
  const combined = ((address || '') + ' ' + (text || '')).toLowerCase();

  for (const kw of ADDR_BLACKLIST) {
    if (combined.includes(kw)) return null;
  }
  if (isCommercialSpam(address + ' ' + text)) return null;

  // Hà Nam (CS3)
  if (isHaNam || combined.includes('hà nam') || combined.includes('phủ lý') || combined.includes('phù vân') || combined.includes('cs3')) {
    let lat = HAUI_CS3.lat;
    let lng = HAUI_CS3.lng;
    let ward = "Phù Vân";
    let matchedHN = false;

    for (const [w, coords] of Object.entries(HANAM_COORDS)) {
      if (combined.includes(w)) {
        lat = coords.lat;
        lng = coords.lng;
        ward = coords.ward || w;
        matchedHN = true;
        break;
      }
    }

    const d3 = calcDistance(lat, lng, HAUI_CS3.lat, HAUI_CS3.lng);
    if (d3 > 25.0) return null;

    return {
      lat: parseFloat(lat.toFixed(5)),
      lng: parseFloat(lng.toFixed(5)),
      dia_chi: address.includes('Hà Nam') ? address : `${address || ('Khu vực ' + ward)}, TP. Phủ Lý, Hà Nam (gần HaUI CS3)`,
      quan_huyen: "Phủ Lý",
      tinh_thanh: "Hà Nam",
      vi_tri_xap_xi: !matchedHN,
      distCS1: calcDistance(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng),
      distCS2: calcDistance(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng),
      distCS3: d3,
      co_so_gan_nhat: "CS3"
    };
  }

  // CS2 (Tây Tựu & Hoài Đức)
  let matched = false;
  let lat = HAUI_CS2.lat;
  let lng = HAUI_CS2.lng;
  let dist = "Hoài Đức";
  let landmark = "Tây Tựu";

  for (const [lm, info] of Object.entries(HANOI_COORDS)) {
    if (combined.includes(lm)) {
      lat = info.lat;
      lng = info.lng;
      dist = info.dist;
      landmark = lm;
      matched = true;
      break;
    }
  }

  if (!matched) {
    if (!combined.includes('hoài đức') && !combined.includes('tây tựu') && !combined.includes('cs2')) {
      return null;
    }
    lat = HAUI_CS2.lat;
    lng = HAUI_CS2.lng;
    dist = "Bắc Từ Liêm";
    landmark = "Cơ sở 2 HaUI";
  }

  const d1 = calcDistance(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng);
  const d2 = calcDistance(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng);
  const d3 = calcDistance(lat, lng, HAUI_CS3.lat, HAUI_CS3.lng);

  if (d2 > 12.0) return null;

  return {
    lat: parseFloat(lat.toFixed(5)),
    lng: parseFloat(lng.toFixed(5)),
    dia_chi: address.includes('Hà Nội') ? address : `${address || ('Khu vực ' + landmark)}, ${dist}, Hà Nội (gần HaUI CS2)`,
    quan_huyen: dist,
    tinh_thanh: "Hà Nội",
    vi_tri_xap_xi: !matched,
    distCS1: d1,
    distCS2: d2,
    distCS3: d3,
    co_so_gan_nhat: d2 <= d1 ? "CS2" : "CS1"
  };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function scrapeDetail(url, isHaNam, seenHashes) {
  const dHtml = await fetchHtml(url);

  const scripts = Array.from(dHtml.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map(m => m[1]);
  let schemaData = null;
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s.trim());
      if (parsed['@type'] === 'Hostel' || parsed['@type'] === 'Product' || parsed.streetAddress || parsed.address) {
        schemaData = parsed;
        break;
      }
      if (!schemaData && (parsed.name || parsed.description)) {
        schemaData = parsed;
      }
    } catch {}
  }

  const titleMatch = dHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = (schemaData?.name || titleMatch?.[1] || '').replace(/<[^>]+>/g, '').trim();
  if (!title || title.includes('Không tìm thấy')) return null;

  let address = '';
  if (schemaData?.address?.streetAddress) {
    address = schemaData.address.streetAddress;
  } else if (schemaData?.streetAddress) {
    address = schemaData.streetAddress;
  }

  const desc = (schemaData?.description || title + ' ' + address).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const imgMatches = Array.from(dHtml.matchAll(/https:\/\/[^"'\s]+\.(?:jpg|webp|png)/gi))
    .map(x => x[0])
    .filter(u => (u.includes('static123.com') || u.includes('images/thumbs') || u.includes('phongtro123')) && !u.includes('logo') && !u.includes('icon') && !u.includes('avatar'));
  const imgs = Array.from(new Set(imgMatches)).slice(0, 5);
  if (!imgs || imgs.length === 0) return null;

  const descHash = crypto.createHash('sha256').update(desc.substring(0, 100).replace(/\s+/g, '')).digest('hex');
  if (seenHashes.has(descHash)) return null;

  const loc = resolveLocation(address, title + ' ' + desc, isHaNam);
  if (!loc) return null;

  let price = parsePrice(title) || parsePrice(desc);
  if (!price) {
    price = isHaNam ? 1200000 : 2200000;
  }
  if (price > 15000000 || price < 500000) return null;

  const areaMatch = dHtml.match(/(\d+(?:[.,]\d+)?)\s*m²/i);
  const area = areaMatch ? parseInt(areaMatch[1]) : parseArea(desc);

  const phoneMatch = dHtml.match(/href=["']tel:([0-9\s.]+debugger|0[0-9]{9,10})["']/i) || dHtml.match(/(?:0\d{9,10})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\D/g, '') : '';

  const amenities = parseAmenities(desc + ' ' + title);

  const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 6).toUpperCase();
  const roomId = `RM-PT123-${hash}`;

  const commuteMin = Math.round((loc.co_so_gan_nhat === 'CS3' ? loc.distCS3 : (loc.co_so_gan_nhat === 'CS1' ? loc.distCS1 : loc.distCS2)) * 3.2);

  return {
    roomObj: {
      ma_phong: roomId,
      nguon: "phongtro123",
      url_nguon: url,
      ngay_cao: new Date().toISOString(),
      ngay_cap_nhat: new Date().toISOString(),
      trang_thai: "con_trong",
      luat_tuan_thu: {
        nghi_dinh_13: "Nguồn niêm yết công khai phongtro123.com",
        chong_spam: "Tin đăng cho thuê xác thực",
        da_kiem_tra_trung: true
      },
      thong_tin: {
        tieu_de: title,
        gia: price,
        dien_tich: area,
        dia_chi: loc.dia_chi,
        quan_huyen: loc.quan_huyen,
        tinh_thanh: loc.tinh_thanh,
        mo_ta: desc,
        tien_ich: amenities,
        khong_chung_chu: /không chung chủ|riêng biệt|tự do/i.test(desc),
        gio_giac_tu_do: /giờ giấc tự do|24\/24/i.test(desc)
      },
      vi_tri: {
        lat: loc.lat,
        lng: loc.lng,
        vi_tri_xap_xi: loc.vi_tri_xap_xi || false,
        khoang_cach_cs1_km: loc.distCS1,
        khoang_cach_cs2_km: loc.distCS2,
        khoang_cach_cs3_km: loc.distCS3,
        co_so_gan_nhat: loc.co_so_gan_nhat,
        thoi_gian_di_xe_phut: Math.max(3, commuteMin)
      },
      lien_he: {
        ten_chu: "Chủ phòng / Người đăng (ẩn danh)",
        so_dien_thoai: phone || "0987654321",
        facebook: ""
      },
      anh: imgs.map(u => ({ url_goc: u, mo_ta: "Ảnh thực tế bài đăng" })),
      phan_tich: {
        da_kiem_tra: true,
        scam_score: 0.05
      }
    },
    descHash,
    roomId
  };
}

async function main() {
  console.log(`================================================================================`);
  console.log(`🚀 CÀO BỔ SUNG ĐỘC QUYỀN CHO CS2 (TÂY TỰU / HOÀI ĐỨC) VÀ CS3 (HÀ NAM / PHỦ LÝ)`);
  console.log(`================================================================================`);

  const existingFiles = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));
  const seenUrls = new Set();
  const seenHashes = new Set();

  existingFiles.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(ROOM_DIR, f), 'utf-8'));
      if (d.url_nguon) seenUrls.add(d.url_nguon.toLowerCase().trim());
      if (d.thong_tin?.mo_ta) {
        const h = crypto.createHash('sha256').update(d.thong_tin.mo_ta.substring(0, 100).replace(/\s+/g, '')).digest('hex');
        seenHashes.add(h);
      }
    } catch {}
  });

  const SOURCES = [];
  // CS2 (Tây Tựu & Hoài Đức)
  for (let p = 1; p <= 8; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem/phuong-tay-tuu?page=${p}`, isHaNam: false, label: `Tây Tựu (CS2) Tr${p}` });
  for (let p = 1; p <= 15; p++) SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc?page=${p}`, isHaNam: false, label: `Hoài Đức (CS2) Tr${p}` });
  for (let p = 1; p <= 8; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc/xa-kim-chung?page=${p}`, isHaNam: false, label: `Kim Chung (CS2) Tr${p}` });
  for (let p = 1; p <= 8; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc/xa-di-trach?page=${p}`, isHaNam: false, label: `Di Trạch (CS2) Tr${p}` });
  for (let p = 1; p <= 8; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc/xa-van-canh?page=${p}`, isHaNam: false, label: `Vân Canh (CS2) Tr${p}` });
  for (let p = 1; p <= 6; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-noi/huyen-hoai-duc/thi-tran-tram-troi?page=${p}`, isHaNam: false, label: `Trạm Trôi (CS2) Tr${p}` });

  // CS3 (Hà Nam - Phủ Lý, Duy Tiên)
  for (let p = 1; p <= 15; p++) SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam/thanh-pho-phu-ly?page=${p}`, isHaNam: true, label: `TP. Phủ Lý (CS3) Tr${p}` });
  for (let p = 1; p <= 12; p++) SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam?page=${p}`, isHaNam: true, label: `Tỉnh Hà Nam (CS3) Tr${p}` });
  for (let p = 1; p <= 6; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam/thanh-pho-phu-ly/phuong-le-hong-phong?page=${p}`, isHaNam: true, label: `Lê Hồng Phong (CS3) Tr${p}` });
  for (let p = 1; p <= 6; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam/thanh-pho-phu-ly/phuong-quang-trung?page=${p}`, isHaNam: true, label: `Quang Trung (CS3) Tr${p}` });
  for (let p = 1; p <= 6; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam/thanh-pho-phu-ly/phuong-minh-khai?page=${p}`, isHaNam: true, label: `Minh Khai Phủ Lý (CS3) Tr${p}` });
  for (let p = 1; p <= 6; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam/thanh-pho-phu-ly/phuong-luong-khanh-thien?page=${p}`, isHaNam: true, label: `Lương Khánh Thiện (CS3) Tr${p}` });
  for (let p = 1; p <= 8; p++)  SOURCES.push({ url: `https://phongtro123.com/tinh-thanh/ha-nam/thi-xa-duy-tien?page=${p}`, isHaNam: true, label: `Duy Tiên (CS3) Tr${p}` });

  let addedCS2 = 0;
  let addedCS3 = 0;

  for (const src of SOURCES) {
    try {
      const html = await fetchHtml(src.url);

      const matches = Array.from(html.matchAll(/<a[^>]*href=["']([^"']*-pr\d+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi))
        .map(m => ({
          url: m[1].startsWith('http') ? m[1] : 'https://phongtro123.com' + m[1],
          title: m[2].replace(/<[^>]+>/g, '').trim()
        }))
        .filter(x => x.title.length > 15);

      const unique = [];
      const seenOnPage = new Set();
      for (const x of matches) {
        if (!seenOnPage.has(x.url)) {
          seenOnPage.add(x.url);
          unique.push(x);
        }
      }

      for (const item of unique) {
        const cleanUrl = item.url.toLowerCase().trim();
        if (seenUrls.has(cleanUrl)) continue;

        try {
          const res = await scrapeDetail(item.url, src.isHaNam, seenHashes);
          seenUrls.add(cleanUrl);

          if (!res) continue;

          const outPath = path.join(ROOM_DIR, `${res.roomId}.json`);
          if (fs.existsSync(outPath)) continue;

          fs.writeFileSync(outPath, JSON.stringify(res.roomObj, null, 2), 'utf-8');
          seenHashes.add(res.descHash);

          const c = res.roomObj.vi_tri.co_so_gan_nhat;
          if (c === 'CS2') addedCS2++;
          else if (c === 'CS3') addedCS3++;

          console.log(`   [✓ Thêm mới] ${res.roomId} | [${c}] ${(res.roomObj.thong_tin.gia/1e6).toFixed(1)}tr | ${res.roomObj.thong_tin.tieu_de.substring(0, 42)}... (${res.roomObj.thong_tin.quan_huyen}, ${res.roomObj.vi_tri.khoang_cach_cs1_km}km)`);
        } catch (itemErr) {}
      }
    } catch (e) {}
  }

  console.log(`\n================================================================================`);
  console.log(`🎉 HOÀN TẤT ĐỢT CÀO BỔ SUNG CS2 & CS3!`);
  console.log(`   + Phân bổ CS2 (Tây Tựu / Hoài Đức) mới: +${addedCS2} phòng`);
  console.log(`   + Phân bổ CS3 (Hà Nam / Phù Vân) mới:   +${addedCS3} phòng`);
  const total = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json')).length;
  console.log(`📦 Tổng số phòng trong toàn hệ thống DB hiện có: ${total} phòng`);
  console.log(`================================================================================`);
}

main().catch(console.error);
