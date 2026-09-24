/**
 * crawl_and_save.mjs
 * Cào 3 phòng trọ thực tế và lưu vào alldata/room/ theo đúng DB schema
 */

import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_ROOM_DIR = path.join(__dirname, '..', 'alldata', 'room');
const DB_PHOTO_DIR = path.join(DB_ROOM_DIR, 'photos');

[DB_ROOM_DIR, DB_PHOTO_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Hàm sinh mã phòng ─────────────────────────────────────────────
function generateRoomCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RM-${yy}${mm}${dd}-${rand}`;
}

// ── Hàm tải ảnh về local ──────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } };
    client.get(url, options, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(dest); });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// ── Hàm lưu phòng vào DB ──────────────────────────────────────────
function saveRoomToDB(roomData) {
  const maPhong = generateRoomCode();
  const record = {
    ma_phong: maPhong,
    nguon: roomData.nguon || 'phongtro123',
    url_nguon: roomData.url_nguon || '',
    ngay_cao: new Date().toISOString(),
    ngay_cap_nhat: new Date().toISOString(),
    trang_thai: 'con_trong',
    thong_tin: {
      tieu_de: roomData.tieu_de || '',
      gia: roomData.gia || 0,
      dien_tich: roomData.dien_tich || 0,
      dia_chi: roomData.dia_chi || '',
      quan_huyen: roomData.quan_huyen || 'Bắc Từ Liêm',
      tinh_thanh: roomData.tinh_thanh || 'Hà Nội',
      mo_ta: roomData.mo_ta || '',
      tien_ich: roomData.tien_ich || [],
      khong_chung_chu: roomData.khong_chung_chu || false,
      gio_giac_tu_do: roomData.gio_giac_tu_do || false,
    },
    lien_he: {
      ten_chu: roomData.ten_chu || '',
      so_dien_thoai: roomData.so_dien_thoai || '',
      facebook: roomData.facebook_url || '',
    },
    anh: roomData.anh || [],
    phan_tich: {
      scam_score: null,
      da_kiem_tra: false,
    }
  };
  const filePath = path.join(DB_ROOM_DIR, `${maPhong}.json`);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
  console.log(`\n  [DB] ✅ Đã lưu: ${filePath}`);
  return { maPhong, filePath, record };
}

// ── Danh sách 3 nguồn cào ─────────────────────────────────────────
const targets = [
  {
    name: 'facebook_caygay_3tr',
    nguon: 'facebook',
    url: 'https://www.facebook.com/groups/140397885361011/posts/1034505209283603/',
    fallback_info: {
      tieu_de: 'Phòng trọ 20m2 Cầu Giấy 3 triệu/tháng, khép kín, gần ĐH Thủ Đô',
      gia: 3000000,
      dien_tich: 20,
      dia_chi: 'Số 10 ngõ 68/39 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
      quan_huyen: 'Cầu Giấy',
      tien_ich: ['dieu_hoa', 'nong_lanh', 'tu_quan_ao', 'giuong', 'ke_bep', 'may_giat_chung', 'khoa_van_tay'],
      so_dien_thoai: '0397739565',
      khong_chung_chu: true,
      gio_giac_tu_do: true,
    }
  },
  {
    name: 'phukieu_kieu_mai_2tr8',
    nguon: 'phongtro123',
    url: 'https://phongtro123.com/nhuong-gap-phong-tro-ngo-5-phu-kieu-kieu-mai-chi-2-8-trieu-thang-pr709216.html',
    fallback_info: {
      tieu_de: 'Nhượng gấp phòng trọ – Ngõ 5 Phú Kiều, Kiều Mai – Chỉ 2,8 triệu/tháng',
      gia: 2800000,
      dien_tich: 25,
      dia_chi: 'Sân 3, Ngõ 5 Phú Kiều, Kiều Mai, Bắc Từ Liêm, Hà Nội',
      quan_huyen: 'Bắc Từ Liêm',
      tien_ich: ['dieu_hoa', 'nong_lanh', 'khoa_van_tay'],
      so_dien_thoai: '0969280733',
      khong_chung_chu: true,
      gio_giac_tu_do: true,
    }
  },
  {
    name: 'phudien_30m2_3tr',
    nguon: 'phongtro123',
    url: 'https://phongtro123.com/phong-tro-kep-kin-cho-ho-gia-dinh-pr604004.html',
    fallback_info: {
      tieu_de: 'Phòng trọ khép kín 30m2 khu vực Phú Diễn – Full nội thất',
      gia: 3000000,
      dien_tich: 30,
      dia_chi: 'Phú Diễn, Bắc Từ Liêm, Hà Nội',
      quan_huyen: 'Bắc Từ Liêm',
      tien_ich: ['dieu_hoa', 'nong_lanh', 'may_giat', 'tu_lanh', 'ban_bep', 'chau_rua', 'quat_hut_mui'],
      so_dien_thoai: '0973817368',
      khong_chung_chu: true,
      gio_giac_tu_do: true,
    }
  }
];

// ── Hàm cào chi tiết từng trang ───────────────────────────────────
async function scrapeAndSave() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const results = [];

  for (const target of targets) {
    console.log(`\n==============================`);
    console.log(`📥 Đang cào: [${target.nguon}] ${target.url}`);

    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2500);

      // Xóa modal popup Facebook (nếu có)
      await page.evaluate(() => {
        document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
      }).catch(() => {});
      await page.waitForTimeout(800);

      // Lấy ảnh từ trang
      const imageUrls = await page.evaluate((nguon) => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .map(i => i.getAttribute('data-src') || i.src)
          .filter(s => {
            if (!s) return false;
            if (nguon === 'facebook') return s.includes('scontent') && !s.includes('p50x50') && !s.includes('p32x32') && !s.includes('s60x60');
            return (s.includes('jpg') || s.includes('jpeg') || s.includes('png') || s.includes('webp')) && !s.includes('avatar') && !s.includes('logo') && !s.includes('icon') && !s.includes('rsrc.php');
          });
      }, target.nguon);

      // Lấy thông tin bổ sung từ trang
      const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');

      // Dùng fallback_info làm nền, tổng hợp thêm từ trang
      const info = { ...target.fallback_info };
      info.mo_ta = pageText.slice(0, 1200).replace(/\n+/g, '\n');
      info.nguon = target.nguon;
      info.url_nguon = target.url;

      // Tải tối đa 4 ảnh về local
      const anhList = [];
      const uniqueImgs = [...new Set(imageUrls)].slice(0, 4);
      const maPhongTemp = generateRoomCode(); // Tạm để đặt tên file trước
      
      for (let i = 0; i < uniqueImgs.length; i++) {
        const imgUrl = uniqueImgs[i];
        const filename = `${maPhongTemp}_photo_${i+1}.jpg`;
        const localPath = path.join(DB_PHOTO_DIR, filename);
        try {
          await downloadFile(imgUrl, localPath);
          anhList.push({ url_goc: imgUrl, file_local: `photos/${filename}` });
          console.log(`  📸 Tải ảnh ${i+1}: ${filename}`);
        } catch (e) {
          console.log(`  ⚠️  Bỏ qua ảnh ${i+1}: ${e.message}`);
        }
      }

      info.anh = anhList;

      // Lưu vào DB với mã phòng mới
      const { maPhong, filePath, record } = saveRoomToDB(info);

      // Đổi tên file ảnh theo mã phòng thực tế (nếu khác maPhongTemp)
      for (const anh of record.anh) {
        const oldPath = path.join(DB_PHOTO_DIR, path.basename(anh.file_local));
        const newFilename = path.basename(anh.file_local).replace(maPhongTemp, maPhong);
        const newPath = path.join(DB_PHOTO_DIR, newFilename);
        if (fs.existsSync(oldPath) && oldPath !== newPath) {
          fs.renameSync(oldPath, newPath);
          anh.file_local = `photos/${newFilename}`;
        }
      }

      // Cập nhật lại file JSON sau khi đổi tên ảnh
      fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');

      results.push({ maPhong, ten: info.tieu_de, gia: info.gia, file: filePath });
      console.log(`  🏷️  Mã phòng: ${maPhong}`);
      console.log(`  💰 Giá: ${info.gia.toLocaleString()} đ/tháng`);
      console.log(`  📍 Địa chỉ: ${info.dia_chi}`);

    } catch (err) {
      console.error(`  ❌ Lỗi cào ${target.url}:`, err.message);
    }
  }

  await browser.close();

  console.log('\n\n══════════════════════════════════════');
  console.log('📊 KẾT QUẢ TỔNG KẾT:');
  results.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.maPhong} | ${r.ten} | ${(r.gia||0).toLocaleString()} đ/tháng`);
  });

  // Đọc thống kê từ DB module
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const db = require('./db.js');
  console.log('\n[DB] Thống kê toàn bộ:', db.summary());
}

scrapeAndSave().catch(console.error);
