# KHO LƯU TRỮ CÁC BOT CÀO CŨ (DEPRECATED LEGACY CRAWLERS)

Các tệp trong thư mục này là các bản nháp thử nghiệm, script cào thô hoặc script cũ từ các giai đoạn đầu.

## QUY ĐỊNH BỘ LUẬT THÉP CỦA DỰ ÁN:
1. **CHỈ SỬ DỤNG PLAYWRIGHT ĐỂ CÀO DỮ LIỆU**:
   - Tất cả các crawler chính thức đều chạy qua Playwright Chromium headless.
   - Bắt buộc phải render trang thực tế, cuộn trang, bấm "Xem thêm", đọc DOM chính xác.
   - Tải ảnh thực tế của bài đăng trực tiếp về `/photos/${roomId}_photo_*.jpg` với dung lượng > 3KB.
   - Tuyệt đối cấm cào chay bằng regex/HTTP parser không kiểm soát.
   - Tuyệt đối cấm dùng ảnh mượn / fallback giữa các phòng trọ.

2. **CÁC CÔNG CỤ CHUẨN ĐƯỢC PHÉP CHẠY**:
   - `server/auto_crawl_bot.js`: Bot cào tự động định kỳ 100% bằng Playwright Chromium.
   - `botdata/crawl_real_fb_groups.mjs`: Crawler nhóm FB bằng Playwright.
   - `botdata/crawl_pt123_multi_campus.mjs`: Crawler Phongtro123 bằng Playwright.
   - `botdata/test_fb_posts_live.mjs`: Bộ kiểm tra link Facebook live bằng Playwright.
   - `botdata/test_photo_authenticity.mjs`: Bộ kiểm tra tính xác thực 100% của kho ảnh.
