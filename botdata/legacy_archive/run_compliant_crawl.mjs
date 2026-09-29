import autoCrawlBot from '../server/auto_crawl_bot.js';

console.log('Khởi chạy tiến trình cào dữ liệu chuẩn tuân thủ toàn diện các quy chuẩn thép...');
console.log('Mục tiêu: Bổ sung phòng trọ mới sạch, đã lọc 100% tin hết hạn, cache ảnh local, không dính tin rác.');

const res = await autoCrawlBot.runCrawlJob({
  targetFb: 70,
  targetOther: 60
});

console.log('Kết quả phiên cào:', res);
