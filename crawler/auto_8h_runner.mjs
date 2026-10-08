/**
 * auto_8h_runner.mjs
 * ============================================================================
 * TIẾN TRÌNH TỰ ĐỘNG CHẠY PLAYWRIGHT CÀO & LỌC DỮ LIỆU LIÊN TỤC TRONG 8 TIẾNG
 * TUÂN THỦ 100% BỘ LUẬT THÉP & QUY CHUẨN POST-MORTEM
 *
 * 3 BƯỚC LẶP LIÊN TỤC MỖI CHU KỲ:
 *   1. Chạy Playwright cào dữ liệu (Chế độ tiết kiệm dữ liệu: chặn media/font/ads)
 *   2. Lọc ảo qua Data Quality Gate & Bộ Luật Thép (Khử PII, Link thật, Giá thật, Ảnh thật)
 *   3. Xuất bản vào DB & Tự động Đẩy lên Web (Git Push -> Render Auto Deploy)
 *
 * Tiết kiệm dữ liệu:
 *   - Route blocking chặn font, media, video, tracking ads
 *   - Chỉ tải ảnh thực tế đối với tin đã qua 100% các vòng lọc trước
 *   - Chu kỳ giãn cách 45-60 phút để tiết kiệm băng thông & đón tin mới
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { runCrawl, runPublish } from './pipeline_crawl_validate_publish.mjs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const cleaner = require(path.join(ROOT, 'server', 'data_cleaner.js'));
const LOG_FILE = path.join(ROOT, 'alldata', 'logs', 'auto_8h_runner.log');
const STATUS_FILE = path.join(ROOT, 'alldata', 'logs', 'auto_8h_status.json');

const TOTAL_DURATION_MS = 8 * 60 * 60 * 1000; // 8 tiếng = 28.800.000 ms
const CYCLE_INTERVAL_MS  = 50 * 60 * 1000;     // Mỗi chu kỳ giãn cách 50 phút (tiết kiệm băng thông)

let START_TIME = Date.now();
let END_TIME   = START_TIME + TOTAL_DURATION_MS;
let initialCycle = 0;
let initialApproved = 0;

// Khôi phục trạng thái nếu khởi động lại
if (fs.existsSync(STATUS_FILE)) {
  try {
    const prev = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    const prevEnd = new Date(prev.endTime).getTime();
    if (prevEnd > Date.now()) {
      START_TIME = new Date(prev.startTime).getTime();
      END_TIME = prevEnd;
      initialCycle = prev.currentCycle || 0;
      initialApproved = prev.totalApprovedSoFar || 0;
    }
  } catch {}
}

const withTimeout = (p, ms, label = 'task') => Promise.race([
  p,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 60000)}m`)), ms))
]);

function logRunner(msg) {
  const ts = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const line = `[${ts}] [8H-RUNNER] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
  } catch {}
}

function updateStatus(state) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({
      startTime: new Date(START_TIME).toISOString(),
      endTime: new Date(END_TIME).toISOString(),
      totalDurationHours: 8,
      remainingMinutes: Math.max(0, Math.round((END_TIME - Date.now()) / 60000)),
      lastUpdate: new Date().toISOString(),
      ...state
    }, null, 2), 'utf-8');
  } catch {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function pushToWeb(cycleNumber, publishedCount) {
  try {
    logRunner(`🚀 Đang tự động đẩy dữ liệu lên GitHub & Web (Render)...`);
    execSync('git add alldata/room/', { cwd: ROOT, stdio: 'pipe' });
    const commitMsg = `feat(crawler): [Chu ky ${cycleNumber}/8h] nap +${publishedCount} phong chuan Bo Luat Thep`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT, stdio: 'pipe' });
    const pushOut = execSync('git push origin main', { cwd: ROOT, stdio: 'pipe' }).toString();
    logRunner(`✅ Đã đẩy thành công lên GitHub (Render đang tự động deploy lên web)!`);
    return true;
  } catch (err) {
    // Nếu không có thay đổi để commit
    if (err.message && err.message.includes('nothing to commit')) {
      logRunner(`ℹ️ Kho dữ liệu git đã đồng bộ, không có file mới cần commit.`);
      return true;
    }
    logRunner(`⚠️ Lỗi khi đẩy git: ${err.message}`);
    return false;
  }
}

async function main() {
  logRunner('================================================================================');
  logRunner('🚀 KHỞI ĐỘNG TIẾN TRÌNH CÀO - LỌC THÉP - ĐẨY WEB TỰ ĐỘNG TRONG 8 TIẾNG');
  logRunner(`⏰ Thời gian bắt đầu: ${new Date(START_TIME).toLocaleString('vi-VN')}`);
  logRunner(`⏰ Thời gian kết thúc dự kiến: ${new Date(END_TIME).toLocaleString('vi-VN')}`);
  logRunner('⚖️ TUÂN THỦ 100% BỘ LUẬT THÉP (Nghị định 13 khử PII, Link thật, Giá thật, Ảnh thật)');
  logRunner('📶 CHẾ ĐỘ TIẾT KIỆM DỮ LIỆU: Route interception chặn fonts/media/ads, chu kỳ 50 phút');
  logRunner('================================================================================');

  let cycleNumber = initialCycle;
  let totalApprovedAcrossRounds = initialApproved;

  while (Date.now() < END_TIME) {
    cycleNumber++;
    const remainingHours = ((END_TIME - Date.now()) / 3600000).toFixed(1);
    logRunner(`\n🌀 [CHU KỲ ${cycleNumber}] Bắt đầu chu trình 3 bước (Thời gian còn lại: ~${remainingHours} tiếng)`);

    updateStatus({
      currentCycle: cycleNumber,
      status: 'crawling_and_validating',
      totalApprovedSoFar: totalApprovedAcrossRounds
    });

    try {
      // ── BƯỚC 1 & 2: Chạy Playwright cào dữ liệu tiết kiệm & Lọc ảo qua Bộ Luật Thép ──
      logRunner(`[Bước 1 & 2] Chạy Playwright cào đa nguồn & Lọc ảo theo Bộ Luật Thép...`);
      const result = await withTimeout(runCrawl(), 25 * 60 * 1000, 'Playwright pipeline');

      let publishedThisRound = 0;
      if (result && result.approvedCount > 0) {
        // Tự động xuất bản ngay các phòng đã được duyệt đạt chuẩn
        publishedThisRound = runPublish(result.runId);
        totalApprovedAcrossRounds += publishedThisRound;
        logRunner(`🎉 [CHU KỲ ${cycleNumber}] Kiểm định xong: +${publishedThisRound} phòng ĐẠT CHUẨN BỘ LUẬT THÉP!`);

        // ── BƯỚC 3: Đẩy lên Web & GitHub ──────────────────────────────────────
        logRunner(`[Bước 3] Tự động xuất bản và đẩy kho phòng mới lên Web...`);
        pushToWeb(cycleNumber, publishedThisRound);
      } else {
        logRunner(`ℹ️ [CHU KỲ ${cycleNumber}] Không có phòng mới đạt chuẩn trong đợt này (đã loại rác / trùng / link lỗi).`);
      }

      // Kiểm toán toàn diện database sau chu kỳ
      const sweep = cleaner.runFullCleanSweep(false);
      logRunner(`📊 [Kiểm toán DB] Tổng số phòng: ${sweep.totalRoomsChecked} | Sạch: ${sweep.validCleanRooms} | Điểm sức khỏe: ${sweep.healthScore}%`);

      updateStatus({
        currentCycle: cycleNumber,
        status: 'cycle_completed_waiting',
        lastRunId: result ? result.runId : null,
        totalApprovedSoFar: totalApprovedAcrossRounds,
        currentDbTotal: sweep.totalRoomsChecked,
        currentHealthScore: sweep.healthScore,
        publishedThisRound
      });

    } catch (err) {
      logRunner(`❌ [LỖI CHU KỲ ${cycleNumber}]: ${err.message}`);
      updateStatus({
        currentCycle: cycleNumber,
        status: 'cycle_error',
        lastError: err.message
      });
    }

    const timeRemaining = END_TIME - Date.now();
    if (timeRemaining <= 0) break;

    const waitMs = Math.min(CYCLE_INTERVAL_MS, timeRemaining);
    const waitMins = Math.round(waitMs / 60000);
    logRunner(`⏳ [Data-saving] Tạm nghỉ ${waitMins} phút trước chu kỳ kế tiếp để tiết kiệm dữ liệu & đón tin mới...`);
    await sleep(waitMs);
  }

  logRunner('================================================================================');
  logRunner('🏁 TIẾN TRÌNH CÀO & LỌC & ĐẨY WEB TRONG 8 TIẾNG ĐÃ HOÀN TẤT!');
  logRunner(`📦 Tổng số phòng hợp lệ đã thêm qua các chu kỳ: +${totalApprovedAcrossRounds}`);
  logRunner('================================================================================');

  updateStatus({
    status: 'completed',
    currentCycle: cycleNumber,
    totalApprovedSoFar: totalApprovedAcrossRounds
  });
}

main().catch(err => {
  logRunner(`❌ [FATAL ERROR]: ${err.message}`);
});
