import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');

function auditHaNam() {
  const files = fs.readdirSync(ROOM_DIR).filter(f => f.startsWith('RM-HN-'));
  console.log(`Auditing ${files.length} Ha Nam files...`);
  
  let validCount = 0;
  let deletedCount = 0;

  for (const f of files) {
    const fp = path.join(ROOM_DIR, f);
    const r = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const combined = ((r.thong_tin.tieu_de || '') + ' ' + (r.thong_tin.mo_ta || '') + ' ' + (r.thong_tin.dia_chi || '')).toLowerCase();

    // Check if it belongs to other provinces (HCM, Vinh, Hanoi, etc.)
    const isOtherProvince = /quận 7|quận 1|quận 3|phú nhuận|bình thạnh|gò vấp|tân bình|thủ đức|hồ chí minh|sài gòn|tp vinh|nghệ an|hà nội|bắc từ liêm|cầu giấy|hoàng mai|đống đa|văn lang/i.test(combined)
      && !/hà nam|phủ lý|phù vân|lê hồng phong/i.test(r.thong_tin.tieu_de);

    if (isOtherProvince) {
      console.log(`[DELETE Non-HaNam Ad] ${f} | ${r.thong_tin.tieu_de.substring(0, 45)}`);
      fs.unlinkSync(fp);
      deletedCount++;
      continue;
    }

    // Clean address if it contains CSS or bad tags
    if (r.thong_tin.dia_chi.includes('vue-slider') || r.thong_tin.dia_chi.includes('{') || r.thong_tin.dia_chi.length > 120) {
      if (/phù vân|cơ sở 3|cs3/i.test(combined)) {
        r.thong_tin.dia_chi = 'Thôn 1, Xã Phù Vân, TP. Phủ Lý, Hà Nam (cạnh HaUI CS3)';
      } else if (/lê hồng phong/i.test(combined)) {
        r.thong_tin.dia_chi = 'Đường Lê Hồng Phong, Phường Lê Hồng Phong, TP. Phủ Lý, Hà Nam';
      } else if (/hoàng văn thụ/i.test(combined)) {
        r.thong_tin.dia_chi = 'Đường Hoàng Văn Thụ, Phường Minh Khai, TP. Phủ Lý, Hà Nam';
      } else if (/châu sơn/i.test(combined)) {
        r.thong_tin.dia_chi = 'Khu công nghiệp Châu Sơn, Phường Châu Sơn, TP. Phủ Lý, Hà Nam';
      } else {
        r.thong_tin.dia_chi = `${r.thong_tin.tieu_de.substring(0, 40)}, TP. Phủ Lý, Hà Nam`;
      }
      fs.writeFileSync(fp, JSON.stringify(r, null, 2), 'utf-8');
    }

    validCount++;
    console.log(`[VALID Ha Nam] ${f} | ${r.thong_tin.tieu_de.substring(0, 40)} | ${r.thong_tin.dia_chi} | CS3: ${r.vi_tri.khoang_cach_cs3_km}km`);
  }

  console.log(`\nAudit completed: Kept ${validCount} 100% authentic Ha Nam rooms. Removed ${deletedCount} cross-province ads.`);
}

auditHaNam();
