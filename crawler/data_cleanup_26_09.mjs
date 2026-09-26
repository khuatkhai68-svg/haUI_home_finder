/**
 * data_cleanup_26_09.mjs — Script dọn dẹp khẩn cấp ngày 26/09/2026
 * DATA-01: Xóa tất cả phòng rác bên ngoài bán kính HaUI (Quận 7, Sài Gòn, v.v.)
 * DATA-02: Làm sạch văn bản rác (SweetAlert2, dataLayer, JSON-LD) khỏi các field
 * Sử dụng: node crawler/data_cleanup_26_09.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const LOG_DIR  = path.resolve(__dirname, '..', 'alldata', 'logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const HAUI_CS1 = { lat: 21.05373, lng: 105.73510 };
const HAUI_CS2 = { lat: 21.06180, lng: 105.72590 };
const HAUI_CS3 = { lat: 20.54100, lng: 105.89800 };
const MAX_KM_CS1 = 8.0;
const MAX_KM_CS2 = 8.0;
const MAX_KM_CS3 = 15.0;

const BBOX_HANOI = { minLat: 20.98, maxLat: 21.15, minLng: 105.63, maxLng: 105.84 };
const BBOX_HANAM = { minLat: 20.44, maxLat: 20.62, minLng: 105.82, maxLng: 106.00 };

const BLACKLIST_KEYWORDS = [
  'quan 1','quan 2','quan 3','quan 4','quan 5','quan 6','quan 7',
  'quan 8','quan 9','quan 10','quan 11','quan 12',
  'quận 1','quận 2','quận 3','quận 4','quận 5','quận 6','quận 7',
  'quận 8','quận 9','quận 10','quận 11','quận 12',
  'bình thạnh','gò vấp','tân bình','tân phú','phú nhuận','bình tân',
  'thủ đức','nhà bè','hóc môn','củ chi','bình chánh',
  'hồ chí minh','tp.hcm','tphcm','sài gòn','saigon',
  'huỳnh tấn phát','phú thuận','phường phú thuận',
  'iuh','đại học công nghiệp tphcm','đại học công nghiệp tp',
  'đà nẵng','bình dương','đồng nai','cần thơ',
  'long biên','gia lâm','hoàng mai','thanh trì','thường tín',
  'đông anh','mê linh','phú xuyên','ba vì','thạch thất','quốc oai',
  'hoàn kiếm','đống đa','hai bà trưng','cầu giấy','thanh xuân','hà đông','tây hồ',
];

function getDistKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
}

function cleanGarbageText(str) {
  if (!str || typeof str !== 'string') return str;
  const garbageMarkers = [
    ' - Phongtro123.comwindow.',
    'window.dataLayer',
    '@charset "UTF-8"',
    ".swal2-",
    ".vue-slider-",
    'base_url = "https://phongtro123.com"',
    '{"@context":"http://schema.org"',
    'function gtag(',
    'window.Laravel',
    '@-webkit-keyframes',
    '@keyframes swal2',
  ];
  let result = str;
  for (const marker of garbageMarkers) {
    const idx = result.indexOf(marker);
    if (idx > 0) result = result.substring(0, idx).trim();
  }
  result = result.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  return result;
}

function validateRoom(room) {
  const ti = room.thong_tin || {};
  const vt = room.vi_tri || {};
  const fullText = [
    ti.tieu_de || '', ti.dia_chi || '', ti.mo_ta || '',
    ti.quan_huyen || '', ti.tinh_thanh || '',
  ].join(' ').toLowerCase();

  for (const kw of BLACKLIST_KEYWORDS) {
    if (fullText.includes(kw.toLowerCase())) {
      return { valid: false, reason: `Blacklist: "${kw}"` };
    }
  }

  const lat = vt.lat;
  const lng = vt.lng;
  if (lat && lng) {
    const inHanoi = lat >= BBOX_HANOI.minLat && lat <= BBOX_HANOI.maxLat &&
                    lng >= BBOX_HANOI.minLng && lng <= BBOX_HANOI.maxLng;
    const inHaNam = lat >= BBOX_HANAM.minLat && lat <= BBOX_HANAM.maxLat &&
                    lng >= BBOX_HANAM.minLng && lng <= BBOX_HANAM.maxLng;
    if (!inHanoi && !inHaNam) {
      return { valid: false, reason: `Tọa độ ngoài vùng: lat=${lat}, lng=${lng}` };
    }
    const d1 = getDistKm(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng);
    const d2 = getDistKm(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng);
    const d3 = getDistKm(lat, lng, HAUI_CS3.lat, HAUI_CS3.lng);
    if (d1 > MAX_KM_CS1 && d2 > MAX_KM_CS2 && d3 > MAX_KM_CS3) {
      return { valid: false, reason: `Cự ly quá xa: CS1=${d1}km CS2=${d2}km CS3=${d3}km` };
    }
  }

  const tinh = (ti.tinh_thanh || '').toLowerCase();
  if (tinh && tinh !== 'hà nội' && tinh !== 'hà nam' && !lat && !lng) {
    return { valid: false, reason: `Tỉnh không hợp lệ: "${ti.tinh_thanh}"` };
  }

  return { valid: true };
}

function cleanRoomFile(room) {
  let changed = false;
  if (!room.thong_tin) return false;
  const ti = room.thong_tin;
  for (const f of ['tieu_de', 'dia_chi', 'mo_ta']) {
    if (ti[f]) {
      const cleaned = cleanGarbageText(ti[f]);
      if (cleaned !== ti[f]) { ti[f] = cleaned; changed = true; }
    }
  }
  return changed;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  DATA CLEANUP 26/09 — HaUI HomeFinder');
  console.log('='.repeat(60));

  if (!fs.existsSync(ROOM_DIR)) {
    console.error('Khong tim thay thu muc alldata/room/');
    process.exit(1);
  }

  const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));
  console.log(`Tong so phong: ${files.length}\n`);

  let deleted = 0, cleaned = 0, skipped = 0, errored = 0;
  const deletedList = [], cleanedList = [];

  for (const file of files) {
    const filePath = path.join(ROOM_DIR, file);
    let room;
    try {
      room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`  Loi doc file ${file}: ${e.message}`);
      errored++;
      continue;
    }

    const { valid, reason } = validateRoom(room);
    if (!valid) {
      try {
        fs.unlinkSync(filePath);
        deleted++;
        const id = room.ma_phong || file.replace('.json', '');
        const title = (room.thong_tin?.tieu_de || '').substring(0, 50);
        console.log(`  [XOA] [${id}] ${title}`);
        console.log(`         Ly do: ${reason}`);
        deletedList.push({ id, reason, title });
      } catch (e) {
        console.error(`  Loi xoa ${file}: ${e.message}`);
        errored++;
      }
      continue;
    }

    const wasChanged = cleanRoomFile(room);
    if (wasChanged) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(room, null, 2), 'utf-8');
        cleaned++;
        console.log(`  [CLEAN] [${room.ma_phong}] Da lam sach rac CSS/JS`);
        cleanedList.push(room.ma_phong);
      } catch (e) {
        console.error(`  Loi ghi ${file}: ${e.message}`);
        errored++;
      }
    } else {
      skipped++;
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: { total_scanned: files.length, deleted, cleaned, skipped, errored, remaining: files.length - deleted },
    deleted_rooms: deletedList,
    cleaned_rooms: cleanedList,
  };

  const reportPath = path.join(LOG_DIR, 'cleanup_26_09.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log(`  Tong quet : ${files.length} phong`);
  console.log(`  Da xoa    : ${deleted} phong (rac/ngoai vung)`);
  console.log(`  Da lam sach: ${cleaned} phong`);
  console.log(`  Hop le    : ${skipped} phong`);
  console.log(`  Loi       : ${errored} phong`);
  console.log(`  Con lai   : ${files.length - deleted} phong`);
  console.log(`  Bao cao   : ${reportPath}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
