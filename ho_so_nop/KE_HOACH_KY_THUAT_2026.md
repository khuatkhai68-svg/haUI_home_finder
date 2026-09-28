# TỔNG HỢP KẾ HOẠCH NÂNG CẤP & THAY ĐỔI HỆ THỐNG
## DỰ ÁN: HaUI HOMEFINDER (HỆ THỐNG TÌM TRỌ AN TOÀN SINH VIÊN ĐH CÔNG NGHIỆP HÀ NỘI)
**Ngày lập kế hoạch:** 26/09/2026  
**Phiên bản mục tiêu:** HaUI HomeFinder 2.0  
**Tài liệu tham chiếu:** `HO_SO_DU_AN.md`, `BO_LUAT_THEP.md`, `KE_HOACH_QUAN_LY_PHONG.md`

---

## MỤC LỤC
1. [Bối cảnh & Các vấn đề thực tế phát hiện ngày 26/9](#1-bối-cảnh--các-vấn-đề-thực-tế-phát-hiện-ngày-269)
2. [Bộ lọc 100 quy tắc chống trọ ở xa & làm sạch văn bản](#2-bộ-lọc-100-quy-tắc-chống-trọ-ở-xa--làm-sạch-văn-bản)
3. [Phương pháp số 2 đã chọn: On-Demand Just-In-Time Crawler với Warm Worker Pool](#3-phương-pháp-số-2-đã-chọn-on-demand-just-in-time-crawler-với-warm-worker-pool)
4. [Vòng lặp học từ khóa người dùng tra cứu để liên tục làm sạch data](#4-vòng-lặp-học-từ-khóa-người-dùng-tra-cứu-để-liên-tục-làm-sạch-data)
5. [Thiết kế hệ thống tài khoản & ma trận phân quyền (RBAC)](#5-thiết-kế-hệ-thống-tài-khoản--ma-trận-phân-quyền-rbac)
6. [Hệ thống Quản trị Tài khoản dành riêng cho Admin](#6-hệ-thống-quản-trị-tài-khoản-dành-riêng-cho-admin)
7. [Checklist các đầu việc kỹ thuật sẽ thay đổi trong hệ thống](#7-checklist-các-đầu-việc-kỹ-thuật-sẽ-thay-đổi-trong-hệ-thống)

---

## 1. BỐI CẢNH & CÁC VẤN ĐỀ THỰC TẾ PHÁT HIỆN NGÀY 26/9

Trong quá trình vận hành và kiểm tra thực tế trên môi trường Render (`https://haui-home-finder.onrender.com/room-detail.html?id=RM-PT123-E00C81`), hệ thống đã phát hiện 3 lỗ hổng nghiêm trọng:

### 1.1. Sự cố phòng trọ ở xa mạo danh gần HaUI
* **Hiện tượng:** Phòng trọ tại **1283/17/17 Huỳnh Tấn Phát, Phường Phú Thuận, Quận 7, TP. Hồ Chí Minh** nhưng hệ thống lại hiển thị là: `Quận: Bắc Từ Liêm, Hà Nội` và tính khoảng cách: `Cách HaUI Cơ sở 1 chỉ 0.2 km (1 phút xe máy)`.
* **Nguyên nhân cốt lõi:**
  1. **Cào link bừa bãi:** Script crawler cào toàn bộ thẻ `a[href*="-pr"]` trên trang chuyên mục mà không giới hạn vùng chọn trong container danh sách bài, dẫn đến quét trúng cả banner *"Tin nổi bật toàn quốc"* và *"Phòng trọ TP.HCM xem nhiều"* ở sidebar/footer.
  2. **SEO bẩn mập mờ từ khóa:** Môi giới gắn tag "Gần trường đại học công nghiệp" (ĐH Công nghiệp TP.HCM - IUH ở Gò Vấp) hoặc nhồi nhét từ khóa câu view.
  3. **Fallback tọa độ mù quáng:** Trong hàm `resolveCoords()`, khi địa chỉ không khớp với danh sách xã/phường Hà Nội, bot tự động gán tọa độ mặc định:
     ```javascript
     // LỖI: Tự động gán về cổng HaUI CS1 kèm rung nhẹ!
     const jitterLat = (Math.random() - 0.5) * 0.004;
     const jitterLng = (Math.random() - 0.5) * 0.004;
     return { lat: 21.0542 + jitterLat, lng: 105.7350 + jitterLng };
     ```

### 1.2. Dính rác DOM, JavaScript và CSS SweetAlert2
* **Hiện tượng:** Phần địa chỉ và mô tả phòng trọ bị dính toàn bộ đoạn mã:
  `window.dataLayer = window.dataLayer || [];`, `@charset "UTF-8"`, `@keyframes swal2-show`, `.vue-slider-...`, JSON-LD Schema.
* **Nguyên nhân:** Bộ bóc tách DOM lấy text từ thẻ cha của `Địa chỉ:` mà không loại trừ các thẻ `<script>`, `<style>`, `<template>`, thư viện popup thông báo SweetAlert2 của website nguồn.

---

## 2. BỘ LỌC 100 QUY TẮC CHỐNG TRỌ Ở XA & LÀM SẠCH VĂN BẢN

Hệ thống bổ sung pipeline 6 lớp với 100 quy tắc kỹ thuật nghiêm ngặt:

1. **Lọc nguồn Crawler (Quy tắc 1 - 10):** Thu hẹp selector DOM chỉ lấy trong `#left-col .post-list`, kiểm tra tiền tố breadcrumb URL bắt buộc phải là `/ha-noi/` hoặc `/ha-nam/`, bỏ qua hoàn toàn các link liên quan đến TP.HCM, Đà Nẵng.
2. **Làm sạch DOM & Text Sanitization (Quy tắc 11 - 20):** Tự động clone node và xóa triệt để `script, style, noscript, svg`; loại bỏ mã regex `@charset`, `swal2-.*`, `dataLayer`, JSON-LD schema; giới hạn độ dài địa chỉ hợp lý (15 - 120 ký tự).
3. **Whitelist địa danh chuẩn quanh 3 cơ sở HaUI (Quy tắc 21 - 30):**
   * *Cơ sở 1 (Minh Khai - Nhổn):* Nguyên Xá, Văn Trì, Ngọa Long, Đình Quán, Kiều Mai, Tu Hoàng, Phúc Diễn, Phú Diễn, Cầu Diễn.
   * *Cơ sở 2 (Tây Tựu):* Tây Tựu, Lai Xá, Kim Chung, Di Trạch, Trạm Trôi, Đại Tự, Đức Giang, Đức Thượng.
   * *Cơ sở 3 (Phủ Lý, Hà Nam):* Phù Vân, Lê Hồng Phong, Quang Trung, Minh Khai (Phủ Lý), Kim Bình.
4. **Blacklist ngoại vùng bắt buộc loại bỏ (Quy tắc 31 - 40):** 
   * Tuyệt đối cấm các quận TP.HCM (Quận 1 đến 12, Bình Thạnh, Gò Vấp, Tân Bình, Phú Nhuận, Thủ Đức, v.v.).
   * Cấm các từ khóa phía Nam: IUH, Huỳnh Tấn Phát, Sài Gòn, hẻm xe hơi.
   * Cấm các huyện ngoại thành Hà Nội quá xa (> 15km): Long Biên, Gia Lâm, Hoàng Mai, Thanh Trì, Thường Tín, Mê Linh.
5. **Geofencing & Bán kính Haversine cứng (Quy tắc 41 - 50):**
   * **Bỏ hoàn toàn fallback tọa độ cổng trường.** Không tìm thấy địa chỉ chính xác ➔ `lat: null, lng: null`, không hiển thị lên bản đồ.
   * Giới hạn cự ly tối đa: $\text{CS1} \le 8.0\text{ km}$, $\text{CS2} \le 8.0\text{ km}$, $\text{CS3} \le 15.0\text{ km}$.
   * Hộp Bounding Box Hà Nội: Lat `20.98 - 21.15`, Lng `105.65 - 105.82`.
6. **Xác thực Geocoding & NLP Ngữ nghĩa (Quy tắc 51 - 70):** Phân biệt cụm từ HaUI vs IUH; loại trừ các bài viết gom khách đa quận hoặc nhồi nhét từ khóa SEO.
7. **Phát hiện dị thường bảng giá & lừa cọc (Quy tắc 71 - 80):** Cảnh báo phòng full đồ dưới 1 triệu ở Nhổn (bẫy cọc online); loại bỏ tin bán nhà, sang nhượng mặt bằng.
8. **Kiểm tra hình ảnh & Hậu kiểm cộng đồng (Quy tắc 81 - 100):** Nút báo cáo 1-click cho sinh viên; cơ chế tự động ẩn bài khi nhận đủ 3 báo cáo "Trọ ở xa/Lừa đảo"; Cronjob quét sạch database hàng đêm.

---

## 3. PHƯƠNG PHÁP SỐ 2 ĐÃ CHỌN: ON-DEMAND JUST-IN-TIME CRAWLER VỚI WARM WORKER POOL

Thay vì cào quét thụ động làm đầy ổ đĩa bằng rác, hệ thống chuyển sang mô hình **Cào dữ liệu tức thì theo nhu cầu tìm kiếm thực tế của sinh viên**:

```
[Sinh viên gõ: "ngõ 132 Cầu Diễn"] 
       │
       ▼
Kiểm tra DB: Thiếu phòng (< 3 kết quả)
       │
       ▼
Kích hoạt Worker Playwright "Ấm" sẵn có (0.2s nhận lệnh)
       │
       ▼ (Chặn ảnh/font/CSS -> cào siêu tốc 2-3s)
Bóc tách đúng URL tìm kiếm mục tiêu tại Bắc Từ Liêm
       │
       ▼
Đẩy qua Bộ lọc 100 Quy tắc chuẩn hóa
       │
       ▼
Lưu DB + Bắn tín hiệu Server-Sent Events (SSE) đẩy phòng mới lên màn hình!
```

### Ưu điểm vượt trội:
* **Tốc độ cực nhanh:** Trình duyệt Chromium được giữ ấm chạy nền, loại bỏ thời gian khởi động 8 giây (Cold Start), phản hồi kết quả cào mới chỉ trong **2 đến 3 giây**.
* **Tiết kiệm 80% RAM:** Cấu hình chặn tải toàn bộ hình ảnh, font chữ, CSS nặng (`route.abort()`), mỗi worker chỉ tiêu tốn 45MB - 60MB RAM, chạy ổn định trên gói Render Free 512MB.
* **Đúng trọng tâm:** Chỉ cào những khu vực sinh viên thực sự đang tìm kiếm.

---

## 4. VÒNG LẶP HỌC TỪ KHÓA NGƯỜI DÙNG TRA CỨU ĐỂ LIÊN TỤC LÀM SẠCH DATA

Hệ thống xây dựng cơ chế tự học (Continuous Learning & Data Self-Healing):
1. **Ghi nhật ký Search Telemetry:** Thu thập các câu lệnh tìm kiếm, số lượng kết quả trả về và tỷ lệ nhấp chuột (Click-Through Rate).
2. **Dashboard Từ khóa 0 Kết quả (Zero-Result Queries):** Thống kê các khu vực sinh viên tìm nhiều nhưng hệ thống chưa có dữ liệu để ưu tiên bot cào bù vào ban đêm (Shadow Crawling).
3. **Từ điển Đồng nghĩa Tự động (Dynamic Synonym Mapping):** Tự học tiếng lóng sinh viên: *"kktx"* = *"ký túc xá"*, *"gác lửng"* = *"gác xép"*, *"đhcn"* = *"Đại học Công Nghiệp Hà Nội"*.
4. **Tự động đào thải bài rác:** Các bài đăng hiển thị trong kết quả tìm kiếm nhưng liên tục bị sinh viên bỏ qua (Bounce rate > 90%) hoặc bị bấm báo cáo sai vị trí sẽ tự động bị hạ điểm hiển thị và đưa vào diện cách ly.

---

## 5. THIẾT KẾ HỆ THỐNG TÀI KHOẢN & MA TRẬN PHÂN QUYỀN (RBAC)

Hệ thống thiết lập 4 nhóm tài khoản với các đặc quyền rõ rệt:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         MA TRẬN PHÂN QUYỀN HAUI HOMEFINDER                       │
├─────────────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│ Chức năng           │ Khách vãng lai│ Sinh viên    │ Chủ trọ      │ Ban Quản Trị  │
│                     │ (Anonymous)  │ (Student)    │ (Landlord)   │ (Admin / Mod) │
├─────────────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ Xem danh sách & map │ ✅ Có        │ ✅ Có        │ ✅ Có        │ ✅ Có         │
│ Xem SĐT chủ trọ     │ ⚠️ Giới hạn  │ ✅ Vô hạn    │ ✅ Xem được  │ ✅ Vô hạn     │
│ Đăng ký / Đăng nhập │ -            │ Google @haui │ OTP SĐT/Zalo │ Mật khẩu+2FA  │
│ Lưu phòng yêu thích │ LocalStorage │ Đồng bộ Cloud│ -            │ Xem thống kê  │
│ Đánh giá / Review   │ ❌ Không     │ ✅ Huy hiệu SV│ 💬 Phản hồi  │ Quản duyệt    │
│ Đặt lịch xem phòng  │ ❌ Không     │ ✅ Gửi lịch  │ 📩 Nhận lịch │ Quản lý chung │
│ Báo cáo tin lừa đảo │ ⚠️ Trọng số 0.3│ ⭐ Trọng số 1.0│ -          │ Xử lý / Khóa  │
│ Đăng & Sửa phòng trọ│ ❌ Không     │ ❌ Không     │ ✅ Dãy trọ mình│ ✅ Toàn sàn   │
│ Công tắc Còn / Hết  │ ❌ Không     │ ❌ Không     │ ✅ 1-Click   │ Cưỡng chế sửa │
│ Cấp Tích xanh Host  │ ❌ Không     │ ❌ Không     │ ⏳ Gửi hồ sơ │ ✅ Thẩm định  │
│ Quản lý Bot Crawler │ ❌ Không     │ ❌ Không     │ ❌ Không     │ ✅ Cấu hình   │
└─────────────────────┴──────────────┴──────────────┴──────────────┴───────────────┘
```

### 5.1. Dành cho Chủ trọ (Landlord Portal)
* **Đăng nhập không cần nhớ mật khẩu:** Sử dụng mã xác thực OTP qua SMS hoặc Zalo Login.
* **Công tắc thời gian thực "Còn phòng ⇄ Đã cho thuê":** Khi hết phòng, chủ nhà chỉ cần gạt nút tắt để tin ẩn ngay lập tức, không bị sinh viên gọi làm phiền.
* **Form đăng tin chuẩn hóa:** Bắt buộc nhập chi phí điện, nước, cọc, nội thất và định vị chuẩn trên bản đồ vệ tinh.
* **Cấp bậc uy tín (Trust Tiers):**
  * *Cấp 1:* Chủ trọ mới đăng ký (Chờ duyệt).
  * *Cấp 2:* Đã xác thực Số điện thoại & Zalo chính chủ.
  * *Cấp 3 (Verified Host):* Đã được Admin/Đội sinh viên tình nguyện kiểm tra thực tế dãy trọ, gắn **Tích xanh**, ưu tiên hiển thị đầu trang.

### 5.2. Dành cho Sinh viên HaUI (Student Portal)
* **Đăng nhập nhanh 1-Click bằng Email trường (`@haui.edu.vn`):** Tự động nhận diện sinh viên chính quy, cấp huy hiệu tin cậy.
* **Hệ thống Đánh giá Minh bạch:** Chấm điểm thực tế (chủ trọ có thân thiện không, an ninh ngõ xóm, ngập nước mùa mưa, tiền điện nước có minh bạch không).
* **Báo cáo Scam có trọng số cao:** Sinh viên trường báo cáo lừa đảo sẽ kích hoạt cảnh báo đỏ trên toàn hệ thống.

---

## 6. HỆ THỐNG QUẢN TRỊ TÀI KHOẢN DÀNH RIÊNG CHO ADMIN

Admin giữ quyền lực tối cao để bảo vệ tính toàn vẹn và an toàn của hệ thống:

1. **Phân cấp Quản trị nội bộ:**
   * **Super Admin:** Toàn quyền hệ thống, quản lý cơ sở dữ liệu, phân quyền tài khoản Admin khác.
   * **Moderator (Cán bộ Đoàn / Quản lý KTX):** Thẩm định hồ sơ chủ trọ, duyệt bài đăng, xử lý các đơn khiếu nại lừa đảo.
   * **Student Volunteer (Tình nguyện viên khảo sát):** Đi thực địa tại các làng trọ Nhổn, Tây Tựu, Phù Vân để xác minh vị trí và đề xuất cấp Tích xanh.
2. **Bộ công cụ Quản lý Chủ trọ trên Dashboard:**
   * Bảng danh sách toàn bộ chủ trọ kèm số lượng phòng, đánh giá trung bình và số lượt bị sinh viên báo cáo.
   * **Tính năng Thanh trừng cưỡng chế (Enforced Ban & Purge):** Khi Admin bấm khóa 1 tài khoản lừa đảo, hệ thống tự động xóa sạch toàn bộ các bài đăng của người đó khỏi website trong 1 giây.
   * **Bảng đen toàn cục (Blacklist Engine):** Tự động chặn các số điện thoại lừa cọc không cho đăng ký lại và chặn crawler không thu thập các số này.
3. **Nhật ký Kiểm toán (Audit Logs - Chống lạm quyền):** Mọi hành động duyệt bài, khóa tài khoản, cấp tích xanh đều được ghi log bất biến: `{ admin_id, action, target_user, reason, timestamp }`.

---

## 7. CHECKLIST CÁC ĐẦU VIỆC KỸ THUẬT SẼ THAY ĐỔI TRONG HỆ THỐNG

| Mã Task | Phân hệ | Chi tiết đầu việc kỹ thuật | Mức độ ưu tiên | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| **DATA-01** | `Database` | Chạy script quét và xóa toàn bộ các phòng rác ở Quận 7, Sài Gòn, cự ly > 8km hiện có trong `alldata/room/` | 🔴 Khẩn cấp | Sẵn sàng chạy |
| **DATA-02** | `Sanitizer` | Áp dụng hàm làm sạch text, loại bỏ triệt để rác CSS SweetAlert2, `dataLayer`, JSON-LD khỏi các file phòng | 🔴 Khẩn cấp | Sẵn sàng chạy |
| **BOT-01** | `Crawler` | Sửa `crawl_cs1_cs2_60.mjs` và `auto_crawl_bot.js`: Thu hẹp selector lấy link, bỏ fallback tọa độ mù | 🔴 Khẩn cấp | Chờ tích hợp |
| **BOT-02** | `JIT Bot` | Xây dựng module `warm_crawler_pool.js` với 2 Browser Contexts chạy ngầm chặn media | 🟡 Cao | Đã có thiết kế |
| **BACK-01** | `Server Auth`| Thêm `jsonwebtoken`, tạo API gửi & xác thực OTP SMS/Zalo cho Chủ trọ | 🟡 Cao | Kế hoạch tuần 2 |
| **BACK-02** | `Server SSO` | Tích hợp Google OAuth cho sinh viên có đuôi `@haui.edu.vn` | 🟡 Cao | Kế hoạch tuần 2 |
| **BACK-03** | `Admin APIs` | Xây dựng các API quản trị người dùng: `/api/admin/users`, `/api/admin/blacklist`, Audit Log | 🟡 Cao | Kế hoạch tuần 3 |
| **UI-01** | `Web Layout` | Thay thế nút "Đăng nhập" tĩnh trên Header bằng Modal tab đôi (Chủ trọ / Sinh viên) | 🟢 Trung bình | Kế hoạch tuần 2 |
| **UI-02** | `Room Detail`| Nâng cấp `room-detail.html`: Sửa triệt để lỗi hiện code rác, hiển thị cự ly 3 cơ sở kèm tuyến bus | 🔴 Khẩn cấp | Kế hoạch tuần 1 |
| **UI-03** | `Landlord UI`| Tạo trang `host.html` cho chủ trọ: Quản lý phòng, công tắc Còn/Hết phòng 1-click | 🟡 Cao | Kế hoạch tuần 3 |
| **UI-04** | `Admin UI` | Thêm tab "👥 Quản trị Người Dùng" vào `admin.html` cho phép xem, khóa, cấp tích xanh | 🟡 Cao | Kế hoạch tuần 3 |
| **UI-05** | `Map UI` | Nâng cấp `map.html`: Vẽ vòng tròn bán kính 1.5km, 3km, 5km và nút chuyển nhanh 3 cơ sở | 🟢 Trung bình | Kế hoạch tuần 4 |

---

### KẾT LUẬN & BƯỚC ĐI TIẾP THEO
Toàn bộ các nghiên cứu, nguyên tắc thiết kế và giải pháp kỹ thuật trên đã được chuẩn hóa và ghi nhận chính thức vào hệ thống tài liệu dự án. 

Hành động kỹ thuật đầu tiên được kích hoạt ngay là **DATA-01 & DATA-02**: Thực hiện quét sạch các bài đăng sai lệch vị trí và làm sạch các chuỗi rác hiển thị trên website.
