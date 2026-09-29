import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOM_DIR = path.resolve('alldata/room');
const PHOTOS_DIR = path.resolve('alldata/room/photos');

const audit = JSON.parse(fs.readFileSync('botdata/audit_report.json', 'utf-8'));
const list = audit.fbWithPt123Img || [];

console.log(`Auditing ${list.length} Facebook rooms with mismatched static123 images...`);

const spamPatterns = [
  /\b(cần tìm|mình tìm|em tìm|hỏi phòng|tìm phòng|còn phòng nào)\b/i,
  /\b(tìm bạn|tìm nữ|tìm nam)\s+ở\s+ghép\b/i,
  /\bpass\s+(?:đồ|lại|phòng|hợp đồng)\b/i,
  /\bthanh\s+lý\b/i,
  /\bở ghép\b/i
];

let deletedSpam = 0;
let restoredFromGit = 0;
let keepClean = 0;

for (const item of list) {
  const filePath = path.join(ROOM_DIR, item.file);
  if (!fs.existsSync(filePath)) continue;

  const room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const text = (room.thong_tin?.tieu_de || '') + ' ' + (room.thong_tin?.mo_ta || '');

  // 1. Kiểm tra xem có phải tin tìm phòng / spam không
  const isSpam = spamPatterns.some(p => p.test(text));
  if (isSpam) {
    console.log(`❌ Xóa tin tìm phòng / rác: ${item.id} - "${room.thong_tin?.tieu_de}"`);
    fs.unlinkSync(filePath);
    deletedSpam++;
    continue;
  }

  // 2. Thử khôi phục ảnh FB gốc từ git commit f3634d5
  try {
    const oldContent = execSync(`git show f3634d5:alldata/room/${item.file}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const oldJson = JSON.parse(oldContent);
    if (oldJson.anh && oldJson.anh.length > 0) {
      const fbImgs = oldJson.anh.filter(a => {
        const u = typeof a === 'string' ? a : a.url_goc;
        return u && (u.includes('fbcdn.net') || u.includes('scontent') || u.startsWith('/photos/'));
      });

      if (fbImgs.length > 0) {
        room.anh = fbImgs;
        fs.writeFileSync(filePath, JSON.stringify(room, null, 2), 'utf-8');
        console.log(`🔄 Khôi phục ảnh FB gốc cho: ${item.id}`);
        restoredFromGit++;
        continue;
      }
    }
  } catch (e) {}

  // 3. Nếu không có ảnh FB gốc và ảnh hiện tại dính static123 có thể có watermark
  console.log(`⚠️ Không có ảnh FB gốc: ${item.id} - "${room.thong_tin?.tieu_de}"`);
  keepClean++;
}

console.log(`\nKết quả xử lý 29 phòng:`);
console.log(`- Đã xóa bài tìm phòng/spam: ${deletedSpam}`);
console.log(`- Đã khôi phục ảnh FB gốc: ${restoredFromGit}`);
console.log(`- Còn lại cần kiểm tra thêm: ${keepClean}`);
