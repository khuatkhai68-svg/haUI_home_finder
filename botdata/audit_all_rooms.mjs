import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('alldata/room');
const files = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json'));

console.log(`Kiểm tra toàn diện ${files.length} phòng trong cơ sở dữ liệu alldata/room/...`);

let issues = {
  expiredKeywords: [],
  crossDomainImages: [],
  fbImagesNotLocal: [],
  unsplashOrAi: [],
  seekerPosts: [],
  outOfBoundsCoords: [],
  invalidJson: []
};

const SEEKER_REGEX = /^(mình|em|cháu|ai|có ai|bạn nào|cần|tìm|tớ)\s+(tìm|cần|muốn|hỏi)\b|cần tìm phòng|tìm phòng trọ|tìm trọ|tìm bạn ở ghép|tìm bạn cùng phòng|ở ghép|share phòng|cần pass|em là sinh viên|mình là sinh viên|tài chính từ|còn phòng nào tầm/i;

const EXPIRED_REGEX = /tin đăng này đã hết hạn|tin hết hạn|bạn đang xem tin cũ tại phongtro123|tin đã cho thuê|phòng đã cho thuê|bài viết này hiện không tồn tại/i;

for (const file of files) {
  const filePath = path.join(DB_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    issues.invalidJson.push({ file, err: err.message });
    continue;
  }

  // 1. Kiểm tra từ khóa tin hết hạn
  const desc = data.thong_tin?.mo_ta || '';
  const title = data.thong_tin?.tieu_de || '';
  if (EXPIRED_REGEX.test(desc) || EXPIRED_REGEX.test(title)) {
    issues.expiredKeywords.push(file);
  }

  // 2. Kiểm tra bài tìm phòng
  if (SEEKER_REGEX.test(desc) || SEEKER_REGEX.test(title)) {
    issues.seekerPosts.push(file);
  }

  // 3. Kiểm tra ảnh Unsplash hoặc AI
  const imgs = data.anh || [];
  for (const img of imgs) {
    const url = (img.url_goc || '').toLowerCase();
    if (url.includes('unsplash.com') || url.includes('generated') || url.includes('midjourney')) {
      issues.unsplashOrAi.push({ file, url });
    }
    // 4. Nếu là bài Facebook, ảnh có trỏ sang static123 không?
    if (data.nguon === 'facebook') {
      if (url.includes('static123.com') || url.includes('phongtro123.com')) {
        issues.crossDomainImages.push({ file, url });
      }
      if (!url.startsWith('/photos/') && !url.includes('facebook') && !url.includes('fbcdn')) {
        issues.fbImagesNotLocal.push({ file, url });
      }
    }
  }

  // 5. Kiểm tra tọa độ (HaUI CS1: 21.054, 105.735, CS2: 21.061, 105.725, CS3: 20.543, 105.899)
  const lat = data.vi_tri?.lat;
  const lng = data.vi_tri?.lng;
  if (!lat || !lng) {
    issues.outOfBoundsCoords.push({ file, reason: 'Thiếu lat/lng' });
  } else {
    // Không được ở Huế (lat ~ 16) hoặc TP.HCM (lat ~ 10.7)
    if (lat < 20.0 || lat > 22.0 || lng < 105.0 || lng > 106.5) {
      issues.outOfBoundsCoords.push({ file, lat, lng, reason: 'Toạ độ ngoài vùng Hà Nội / Hà Nam' });
    }
  }
}

console.log('--- KẾT QUẢ KIỂM TOÁN HỆ THỐNG ---');
console.log('1. Tin hết hạn (Expired):', issues.expiredKeywords.length);
console.log('2. Bài tìm trọ/ở ghép (Seeker):', issues.seekerPosts.length);
console.log('3. Ảnh Unsplash / AI:', issues.unsplashOrAi.length);
console.log('4. Ảnh mượn chéo sàn FB -> PT123:', issues.crossDomainImages.length);
console.log('5. Tọa độ lạc ra ngoại tỉnh (Huế, SG):', issues.outOfBoundsCoords.length);
console.log('6. JSON hỏng:', issues.invalidJson.length);

if (issues.expiredKeywords.length > 0) console.log('Expired:', issues.expiredKeywords);
if (issues.crossDomainImages.length > 0) console.log('Cross domain:', issues.crossDomainImages);
if (issues.outOfBoundsCoords.length > 0) console.log('Out of bounds:', issues.outOfBoundsCoords);
if (issues.seekerPosts.length > 0) console.log('Seeker posts:', issues.seekerPosts);
