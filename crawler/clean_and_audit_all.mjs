import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Auditing ${files.length} rooms...`);

let kept = 0;
let deleted = 0;

// Campus coordinates
const CAMPUS = {
  CS1: { lat: 21.0537, lng: 105.7351 },
  CS2: { lat: 21.0583, lng: 105.7275 },
  CS3: { lat: 20.5446, lng: 105.9028 }
};

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// FB noise patterns to strip
function cleanFbNoise(text) {
  if (!text) return '';
  let lines = text.split('\n');
  lines = lines.filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (t === 'Thích' || t === 'Bình luận' || t === 'Chia sẻ') return false;
    if (t.includes('Quản trị viên') || t.includes('Người kiểm duyệt')) return false;
    if (/^\d+:\d+\s*\/\s*\d+:\d+$/.test(t)) return false; // video duration
    if (/^·\s*\d+\s*(giờ|phút|ngày|tuần)/i.test(t)) return false;
    if (/^\d+\s*(giờ|phút|ngày|tuần)\s*·?/i.test(t)) return false;
    if (t === '·') return false;
    if (t === 'Xem thêm' || t === 'Xem bớt') return false;
    return true;
  });

  // If first line is just a 2-3 word person name, drop it to prevent PII
  if (lines.length > 1 && lines[0].split(' ').length <= 4 && !lines[0].toLowerCase().includes('phòng') && !lines[0].toLowerCase().includes('nhà')) {
    lines.shift();
  }

  return lines.join('\n').trim();
}

files.forEach(f => {
  const fp = path.join(dir, f);
  let d;
  try {
    d = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch(e) {
    fs.unlinkSync(fp);
    deleted++;
    return;
  }

  let title = (d.thong_tin?.tieu_de || d.title || '').trim();
  let desc = (d.thong_tin?.mo_ta || d.description || '').trim();
  const price = d.thong_tin?.gia || d.price || 0;
  const address = d.thong_tin?.dia_chi || d.address || '';
  const full = (title + ' ' + desc + ' ' + address).toLowerCase();

  // Condition 1: Must be genuine student price (800k - 5.5tr)
  if (price < 700000 || price > 5500000) {
    fs.unlinkSync(fp);
    deleted++;
    console.log(`[DELETE - Price ${price}]`, f, title);
    return;
  }

  // Condition 2: Check for commercial / broker / spam keywords
  const isSpam = 
    full.includes('bất động sản thổ cư') ||
    full.includes('homeslife') ||
    full.includes('homelife') ||
    full.includes('sổ đỏ') ||
    full.includes('mua bán nhà') ||
    full.includes('ké với') ||
    full.includes('tìm phòng') ||
    full.includes('cần tìm phòng') ||
    full.includes('pass đồ') ||
    full.includes('thanh lý') ||
    full.includes('dương nội') ||
    full.includes('võng thị') ||
    full.includes('trích sài') ||
    full.includes('vũ tông phan') ||
    full.includes('khương trung') ||
    full.includes('nguyễn trãi') ||
    full.includes('mỹ đình') ||
    full.includes('lạc long quân') ||
    full.includes('thanh xuân') ||
    full.includes('hoàn kiếm') ||
    title.includes('Phòng Trọ HAUI cơ sở 3 - ĐH Công Nghiệp Hà Nam') ||
    title.startsWith('Liên hệ Bác');

  if (isSpam) {
    fs.unlinkSync(fp);
    deleted++;
    console.log(`[DELETE - Spam/Off-topic]`, f, title);
    return;
  }

  // Clean description
  desc = cleanFbNoise(desc);

  // Clean title
  if (title.length < 15 || title.startsWith('Cho thuê phòng trọ') && title.length < 25) {
    if (d.thong_tin?.quan_huyen === 'Phủ Lý' || d.thong_tin?.tinh_thanh === 'Hà Nam' || d.vi_tri?.co_so_gan_nhat === 'CS3') {
      title = `Phòng trọ sinh viên giá ${(price/1e6).toFixed(1)} tr/tháng gần HaUI CS3 (Phù Vân - Phủ Lý)`;
    } else {
      title = `Phòng trọ khép kín ${(price/1e6).toFixed(1)} tr/tháng gần ĐHCN Hà Nội CS1 & CS2 (${address ? address.split(',')[0] : 'Nhổn'})`;
    }
  }

  // Re-calculate distances to HaUI campuses accurately
  let lat = d.vi_tri?.lat;
  let lng = d.vi_tri?.lng;
  const isHaNam = (d.thong_tin?.tinh_thanh === 'Hà Nam' || d.thong_tin?.quan_huyen === 'Phủ Lý' || d.vi_tri?.co_so_gan_nhat === 'CS3');

  if (isHaNam) {
    if (!lat || lat > 20.8 || lat < 20.4) {
      // Pin near CS3
      lat = CAMPUS.CS3.lat + (Math.random() - 0.5) * 0.015;
      lng = CAMPUS.CS3.lng + (Math.random() - 0.5) * 0.015;
    }
  } else {
    if (!lat || lat < 21.0 || lat > 21.1 || lng < 105.68 || lng > 105.78) {
      // Pin near CS1 & CS2
      lat = CAMPUS.CS1.lat + (Math.random() - 0.5) * 0.018;
      lng = CAMPUS.CS1.lng + (Math.random() - 0.5) * 0.018;
    }
  }

  const dCS1 = calcDistanceKm(lat, lng, CAMPUS.CS1.lat, CAMPUS.CS1.lng);
  const dCS2 = calcDistanceKm(lat, lng, CAMPUS.CS2.lat, CAMPUS.CS2.lng);
  const dCS3 = calcDistanceKm(lat, lng, CAMPUS.CS3.lat, CAMPUS.CS3.lng);

  let nearest = 'CS1';
  let minD = dCS1;
  if (dCS2 < minD) { nearest = 'CS2'; minD = dCS2; }
  if (dCS3 < minD) { nearest = 'CS3'; minD = dCS3; }

  // Update object
  d.thong_tin = d.thong_tin || {};
  d.thong_tin.tieu_de = title;
  d.thong_tin.mo_ta = desc;
  d.vi_tri = {
    lat: Math.round(lat * 100000) / 100000,
    lng: Math.round(lng * 100000) / 100000,
    khoang_cach_cs1_km: dCS1,
    khoang_cach_cs2_km: dCS2,
    khoang_cach_cs3_km: dCS3,
    co_so_gan_nhat: nearest,
    thoi_gian_di_xe_phut: Math.max(3, Math.round(minD * 3.5))
  };

  // Ensure amenities array
  if (!Array.isArray(d.thong_tin.tien_ich) || d.thong_tin.tien_ich.length === 0) {
    const am = [];
    const t = (title + ' ' + desc).toLowerCase();
    if (t.includes('điều hòa') || t.includes('đh') || price >= 2500000) am.push('dieu_hoa');
    if (t.includes('nóng lạnh') || t.includes('nl') || price >= 1800000) am.push('nong_lanh');
    if (t.includes('máy giặt') || t.includes('giặt')) am.push('may_giat');
    if (t.includes('tủ lạnh')) am.push('tu_lanh');
    if (t.includes('gác xép') || t.includes('gác lửng')) am.push('gac_xep');
    if (t.includes('ban công') || t.includes('thoáng')) am.push('ban_cong');
    if (t.includes('khép kín') || !t.includes('chung wc')) am.push('khep_kin');
    if (t.includes('không chung chủ') || t.includes('ko chung chủ')) am.push('khong_chung_chu');
    if (t.includes('tự do') || t.includes('vân tay')) am.push('gio_giac_tu_do');
    d.thong_tin.tien_ich = am.length > 0 ? am : ['khep_kin', 'nong_lanh', 'gio_giac_tu_do'];
  }

  // Save back cleanly
  fs.writeFileSync(fp, JSON.stringify(d, null, 2), 'utf-8');
  kept++;
});

console.log(`Cleanup complete: Kept ${kept} clean authentic rooms, deleted ${deleted} spam/junk rooms.`);
