import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');

function auditCS12() {
  const files = fs.readdirSync(ROOM_DIR).filter(f => f.startsWith('RM-CS12-'));
  console.log(`Auditing ${files.length} CS1/CS2 room files...`);
  
  let deletedCount = 0;
  let validCount = 0;

  for (const f of files) {
    const fp = path.join(ROOM_DIR, f);
    const r = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const combined = ((r.thong_tin.tieu_de || '') + ' ' + (r.thong_tin.mo_ta || '') + ' ' + (r.thong_tin.dia_chi || '')).toLowerCase();

    // Check if it belongs to other provinces (HCM, Tân Bình, Gò Vấp, Bình Thạnh, etc.)
    const isOtherProvince = /gò vấp|tân bình|bình thạnh|quận 7|quận 1|quận 3|phú nhuận|thủ đức|hồ chí minh|sài gòn/i.test(combined);

    if (isOtherProvince) {
      console.log(`[DELETE Non-Hanoi Ad] ${f} | ${r.thong_tin.tieu_de.substring(0, 45)}`);
      fs.unlinkSync(fp);
      deletedCount++;
      continue;
    }

    validCount++;
  }

  console.log(`\nAudit CS1/CS2 completed: Kept ${validCount} valid Hanoi rooms. Removed ${deletedCount} non-Hanoi ads.`);
}

auditCS12();
