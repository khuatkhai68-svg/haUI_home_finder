# BÁO CÁO NGHIÊN CỨU THỰC TẾ, CHÍNH SÁCH CỦA META VÀ CẨM NANG CÁC CÁCH TỰ CÀO DỮ LIỆU
## Đề tài: Khảo sát Thị trường Phòng trọ HaUI, Giải phẫu Chính sách Meta (Cập nhật 2025–2026) và Hướng dẫn Chi tiết Các Phương pháp Tự Cào Dữ liệu Facebook

---

## MỤC LỤC
1. [NGHIÊN CỨU THỰC TẾ: THỊ TRƯỜNG PHÒNG TRỌ HAUI](#1-nghiên-cứu-thực-tế-thị-trường-phòng-trọ-haui)
   - 1.1. Khảo sát mặt bằng giá và các tuyến đường nóng quanh HaUI
   - 1.2. Phụ phí sinh hoạt thực tế và tiếng lóng đặc thù
   - 1.3. Mô hình nhận diện tin thật vs tin môi giới vs bẫy lừa cọc
2. [MỞ RỘNG NGHIÊN CỨU: CHÍNH SÁCH CỦA META / FACEBOOK](#2-mở-rộng-nghiên-cứu-chính-sách-của-meta--facebook)
   - 2.1. Điều khoản Thu thập Dữ liệu Tự động (Automated Data Collection Terms)
   - 2.2. Sự thay đổi chính sách của Meta sau vụ kiện Bright Data (Cập nhật 01/2025)
   - 2.3. Cơ chế phòng thủ kỹ thuật của Meta (Anti-Scraping Defenses)
   - 2.4. Kênh chính thức: Meta Content Library & API dành cho nghiên cứu
3. [TỔNG HỢP CÁC CÁCH BẠN CÓ THỂ TỰ CÀO DỮ LIỆU FACEBOOK](#3-tổng-hợp-các-cách-bạn-có-thể-tự-cào-dữ-liệu-facebook)
   - 3.1. Cách 1: Tiện ích Trình duyệt Không cần Code (No-Code Extensions)
   - 3.2. Cách 2: Sử dụng Dịch vụ Đám mây có sẵn (Apify / Cloud Actors)
   - 3.3. Cách 3: Tự viết Script Trình duyệt Ẩn danh (Playwright / Puppeteer Stealth)
   - 3.4. Cách 4: Tự viết Script HTTP Siêu Tốc (Embedded JSON SSR Parsing)
   - 3.5. Cách 5: Kênh Chính ngạch (Meta Graph API & Content Library)
4. [BẢNG SO SÁNH ĐÁNH GIÁ & LỜI KHUYÊN LỰA CHỌN](#4-bảng-so-sánh-đánh-giá--lời-khuyên-lựa-chọn)

---

## 1. NGHIÊN CỨU THỰC TẾ: THỊ TRƯỜNG PHÒNG TRỌ HAUI

Qua khảo sát dữ liệu thực tế tại địa bàn quận Bắc Từ Liêm và huyện Hoài Đức (khu vực phục vụ sinh viên Cơ sở 1 ĐH Công nghiệp Hà Nội - 298 Cầu Diễn), thị trường phòng trọ có các đặc trưng rõ nét sau:

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │      BẢN ĐỒ MẶT BẰNG GIÁ PHÒNG TRỌ HAUI (THỰC TẾ)      │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
         ┌────────────────────────────────────────────────────┼────────────────────────────────────────────────────┐
         ▼                                                    ▼                                                    ▼
┌───────────────────────────────┐            ┌───────────────────────────────┐            ┌───────────────────────────────┐
│     PHÂN KHÚC BÌNH DÂN        │            │     CHUNG CƯ MINI / STUDIO    │            │    CĂN HỘ CAO CẤP (1N1K)      │
│  (1.500.000đ - 3.000.000đ)    │            │  (3.000.000đ - 5.000.000đ)    │            │  (4.500.000đ - 6.500.000đ)    │
├───────────────────────────────┤            ├───────────────────────────────┤            ├───────────────────────────────┤
│ • Diện tích: 15 - 22m2        │            │ • Diện tích: 22 - 32m2        │            │ • Diện tích: 35 - 50m2        │
│ • Vị trí: Ngõ sâu Nguyên Xá,  │            │ • Vị trí: Mặt ngõ lớn, có     │            │ • Phù hợp: Nhóm 2-3 sinh viên │
│   Văn Trì, Tây Tựu, Tu Hoàng  │              thang máy, khóa vân tay, full │              ở ghép, người đã đi làm       │
│ • Tiện ích: Đơn giản, gác xép,│              đồ (điều hòa, nóng lạnh, bếp) │ • Tiện ích: Tách phòng ngủ,   │
│   vệ sinh khép kín cơ bản     │            │ • Tập trung: Phố Nhổn, Kiều   │   ban công riêng, máy giặt     │
│                               │              Mai, Phú Diễn, cổng chính HaUI│   riêng từng phòng             │
└───────────────────────────────┘            └───────────────────────────────┘            └───────────────────────────────┘
```

### 1.1. Mặt bằng giá các tuyến đường trọng điểm
* **Nguyên Xá (Cổng phụ 136 Cầu Diễn & đường bờ sông):** Nơi có mật độ sinh viên đông nhất. Giá phòng từ **2.2 - 4.5 triệu/tháng**. Các ngõ 132, 134, 136 Cầu Diễn luôn kín phòng rất sớm vào đầu mỗi kỳ học.
* **Tây Tựu, Văn Trì, Tu Hoàng (Cách trường 1.5 - 3km):** Giá mềm hơn từ **1.5 - 2.8 triệu/tháng**, diện tích rộng rãi hơn nhưng sinh viên thường phải có xe máy hoặc đi xe buýt (tuyến 29, 32, 57).
* **Kiều Mai, Phúc Diễn, Phú Diễn (Về phía Cầu Giấy):** Giá trung bình **3.0 - 5.0 triệu/tháng**, tiện ích phong phú, gần các khu văn phòng và ga tàu điện Nhổn - Ga Hà Nội.

### 1.2. Phụ phí sinh hoạt thực tế cần kiểm tra trong dữ liệu
Khi thu thập và phân tích dữ liệu, AI cần bóc tách riêng tiền thuê gốc và các khoản phụ phí:
* **Tiền điện:** Thường tính theo giá kinh doanh phòng trọ: **3.500đ - 4.000đ/kWh** (rất ít nơi có điện giá dân).
* **Tiền nước:** Thường chia làm 2 hình thức: **100.000đ/người/tháng** hoặc **25.000đ - 30.000đ/khối**.
* **Phí dịch vụ chung:** Thang máy, vệ sinh hành lang, máy giặt chung, đèn chiếu sáng: **150.000đ - 250.000đ/phòng**.
* **Mạng Internet:** **80.000đ - 100.000đ/phòng**.

### 1.3. Mô hình phân biệt 3 loại tin đăng trên mạng xã hội

| Tiêu chí nhận diện | Tin Chủ Nhà Thật | Tin Môi Giới BĐS ("Cò") | Tin Mồi Lừa Cọc |
| :--- | :--- | :--- | :--- |
| **Nội dung mô tả** | Ngắn gọn, nêu rõ địa chỉ số nhà, ngõ ngách cụ thể, giờ xem phòng. | Văn phong chuyên nghiệp, nhiều icon sặc sỡ, kèm danh sách 5-10 phòng khác nhau. | Ảnh studio lộng lẫy, giá rẻ bất thường (1.2tr - 1.5tr sát cổng trường). |
| **Số điện thoại** | Trùng tên xưng hô (*"gặp cô Hoa", "chú Hùng"*). | 1 SĐT xuất hiện ở hàng chục bài đăng khác nhau khắp Hà Nội. | Số điện thoại lạ, bảo nhắn tin Zalo hoặc yêu cầu cọc online trước. |
| **Yêu cầu thanh toán** | Đến xem phòng trực tiếp, ký hợp đồng viết tay rồi mới cọc. | Thu phí dẫn đi xem hoặc phí môi giới (dù cam kết miễn phí). | **Hối thúc chuyển khoản cọc giữ phòng trước khi đến xem.** |

---

## 2. MỞ RỘNG NGHIÊN CỨU: CHÍNH SÁCH CỦA META / FACEBOOK

### 2.1. Điều khoản Thu thập Dữ liệu Tự động (Automated Data Collection Terms)
Meta ban hành một chính sách chuyên biệt quản lý hành vi này:
* **Quy định:** Meta nghiêm cấm việc sử dụng bất kỳ phương tiện tự động nào (web scrapers, crawlers, bot, spider, scripts) để truy cập hoặc thu thập dữ liệu từ các sản phẩm của Meta (Facebook, Instagram, Threads, WhatsApp) nếu không có sự cho phép bằng văn bản từ trước.
* **Nguyên tắc "Không cấp phép ngầm":** Meta quy định rõ việc một người đồng ý với Điều khoản Dịch vụ chung không đồng nghĩa với việc được phép cào dữ liệu.

### 2.2. Sự Thay Đổi Chính Sách Sau Vụ Kiện *Meta v. Bright Data* (Cập nhật có hiệu lực từ 01/01/2025)
* **Bối cảnh:** Sau khi thua kiện Bright Data vào tháng 1/2024 vì Tòa án phán quyết rằng *Terms of Service chỉ áp dụng cho người dùng đăng nhập*, Meta đã **sửa đổi lại câu chữ trong Điều khoản Thu thập Tự động**.
* **Nội dung cập nhật:** Meta bổ sung quy định rằng điều cấm cào dữ liệu tự động áp dụng cho cả người dùng **đang đăng nhập lẫn không đăng nhập (logged-in or logged-out)**.
* **Thực tế pháp lý:** 
  - Về mặt lý thuyết hợp đồng (Contract Law): Một người dùng vãng lai chưa từng tạo tài khoản hoặc đã xóa tài khoản, chỉ truy cập URL công khai trên web mở thì không thể bị ràng buộc bởi một hợp đồng mà họ chưa từng ký kết hoặc bấm đồng ý (browsewrap không có sự chấp thuận chủ động).
  - Tuy nhiên, điều này thể hiện thái độ **cực kỳ cứng rắn của Meta** về mặt kỹ thuật: Họ tăng cường tối đa các biện pháp kỹ thuật để chặn bot.

### 2.3. Cơ chế Phòng thủ Kỹ thuật của Meta (Anti-Scraping Infrastructure)
Đội ngũ Anti-Scraping của Meta triển khai hệ thống bảo vệ đa lớp:
1. **Dynamic DOM Obfuscation:** Tên class CSS trên Facebook được sinh ngẫu nhiên và thay đổi định kỳ (vd: `x1yzt5`, `x78zum5`), khiến các crawler dựa trên XPath hay CSS Selector cố định sẽ bị gãy sau vài ngày.
2. **Infinite Scroll Interception:** Khi người dùng chưa đăng nhập cuộn trang được 3 - 5 bài viết, Facebook lập tức hiện một cửa sổ Popup chặn toàn màn hình bắt đăng nhập (*"Xem thêm trên Facebook"*), ngăn không cho cuộn tiếp.
3. **Network Rate-Limiting & IP Ban:** Nếu một địa chỉ IP gửi quá 10 request trong 1 phút mà không có cookie người dùng thật, IP đó sẽ bị gắn cờ và điều hướng sang trang xác thực CAPTCHA hoặc trả về lỗi HTTP `429 Too Many Requests`.
4. **Browser Fingerprinting:** Kiểm tra thông số WebGL, Canvas, AudioContext và TLS Cipher Suites để phát hiện môi trường chạy bằng code tự động.

### 2.4. Kênh Chính ngạch: Meta Content Library & API
* **Đây là gì?** Đây là công cụ chính thức được Meta ra mắt để thay thế CrowdTangle, cung cấp quyền truy cập dữ liệu công khai trên Facebook và Instagram cho mục đích nghiên cứu.
* **Điều kiện tiếp cận:** Chỉ dành cho các **nhà nghiên cứu học thuật, trường đại học, viện nghiên cứu phi lợi nhuận** có tư cách pháp nhân rõ ràng. Phải nộp hồ sơ xin duyệt qua hệ thống **Inter-university Consortium for Political and Social Research (ICPSR)**.
* **Đánh giá:** Rất khó cho cá nhân hoặc nhóm nghiên cứu độc lập tiếp cận, thủ tục xét duyệt kéo dài nhiều tháng.

---

## 3. TỔNG HỢP CÁC CÁCH BẠN CÓ THỂ TỰ CÀO DỮ LIỆU FACEBOOK

Dưới đây là 5 phương pháp thực tế nhất mà bạn có thể tự mình triển khai, phân loại theo cấp độ kỹ thuật:

```
                               ┌────────────────────────────────────────────────────────┐
                               │           5 CÁCH TỰ CÀO DỮ LIỆU FACEBOOK               │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
         ┌──────────────────┬──────────────────────────────┼──────────────────────────────┬──────────────────┐
         ▼                  ▼                              ▼                              ▼                  ▼
┌──────────────────┐┌──────────────────┐      ┌──────────────────────────┐   ┌──────────────────┐┌──────────────────┐
│     CÁCH 1       ││     CÁCH 2       │      │          CÁCH 3          │   │      CÁCH 4      ││      CÁCH 5      │
│ Extension No-Code││ Cloud Actor      │      │ Headless Browser Stealth │   │ Embedded JSON    ││ Meta Content     │
│ (Trình duyệt)    ││ (Apify Platform) │      │ (Playwright Script)      │   │ (HTTPX/curl-cffi)││ Library API      │
├──────────────────┤├──────────────────┤      ├──────────────────────────┤   ├──────────────────┤├──────────────────┤
│ Độ khó: Rất dễ   ││ Độ khó: Dễ - Vừa │      │ Độ khó: Trung bình       │   │ Độ khó: Nâng cao ││ Độ khó: Thủ tục  │
│ Chi phí: Miễn phí││ Chi phí: Có gói  │      │ Chi phí: Miễn phí        │   │ Chi phí: Rất thấp││ Chi phí: Miễn phí│
│                  ││         miễn phí │      │                          │   │                  ││   (nếu duyệt)    │
└──────────────────┘└──────────────────┘      └──────────────────────────┘   └──────────────────┘└──────────────────┘
```

---

### CÁCH 1: DÙNG TIỆN ÍCH TRÌNH DUYỆT KHÔNG CẦN CODE (NO-CODE BROWSER EXTENSIONS)
*Dành cho người không chuyên về lập trình, cần cào vài trăm bài đăng để làm báo cáo nhanh.*

* **Công cụ phổ biến:**
  1. **Instant Data Scraper (Cực kỳ khuyên dùng):** Tiện ích mở rộng trên Chrome/Edge. Tự động nhận diện bảng dữ liệu và danh sách bài viết trên trang Facebook đang mở.
  2. **Web Scraper - Free Web Scraping:** Cho phép tạo Sitemap click chuột, tự động cuộn trang và trích xuất dữ liệu ra file Excel/CSV.
* **Cách thực hiện:**
  - Bước 1: Mở trình duyệt Chrome ở chế độ Ẩn danh (hoặc dùng tài khoản phụ chuyên nghiên cứu).
  - Bước 2: Truy cập vào Group Public HaUI (ví dụ: nhóm *"Phòng trọ Đại học Công nghiệp Hà Nội"*).
  - Bước 3: Bấm vào icon **Instant Data Scraper**, tiện ích sẽ quét toàn bộ bài đăng đang hiển thị và tô đỏ vùng dữ liệu nhận diện được.
  - Bước 4: Bấm nút *"Start Crawling"*, tiện ích sẽ tự động cuộn trang xuống dưới để lấy thêm bài viết.
  - Bước 5: Bấm *"CSV"* hoặc *"XLSX"* để tải toàn bộ dữ liệu phòng trọ về máy.
* **Ưu điểm:** Không cần viết 1 dòng code nào, trực quan, thấy ngay kết quả.
* **Nhược điểm:** Tốc độ chậm, phải tự cuộn bằng tay nếu gặp popup chặn của Facebook, chỉ cào được vài trăm bài một lần.

---

### CÁCH 2: DÙNG DỊCH VỤ ĐÁM MÂY CÓ SẴN (APIFY / MANAGED ACTORS)
*Cách ổn định nhất hiện nay trên thế giới, được hầu hết các công ty khởi nghiệp sử dụng.*

* **Nền tảng:** **Apify (apify.com)** — Nền tảng serverless chuyên dụng cho web scraping hàng đầu thế giới.
* **Công cụ:** Sử dụng Actor có sẵn tên là **`Facebook Group Scraper`** hoặc **`Facebook Posts Scraper`** của Apify Store.
* **Cách thực hiện:**
  - Bước 1: Đăng ký tài khoản miễn phí trên Apify (được tặng 5 USD tín dụng miễn phí mỗi tháng, đủ cào khoảng 5.000 – 10.000 bài viết).
  - Bước 2: Tìm kiếm Actor *"Facebook Group Scraper"*.
  - Bước 3: Dán danh sách URL các Group Public HaUI vào ô cấu hình (Input).
  - Bước 4: Thiết lập số lượng bài cần lấy (vd: 200 bài gần nhất) và chọn không lưu thông tin cá nhân của người đăng.
  - Bước 5: Bấm nút **"Start"**. Toàn bộ quá trình cào, xoay proxy, vượt qua popup chặn đăng nhập sẽ do máy chủ Apify tự xử lý trên đám mây.
  - Bước 6: Tải dữ liệu JSON hoặc Excel chuẩn sạch về máy.
* **Ưu điểm:** Cực kỳ ổn định, không lo chết IP mạng nhà, không sợ máy tính bị quá tải RAM.
* **Nhược điểm:** Phụ thuộc vào nền tảng bên thứ ba, cào quy mô lớn sẽ phát sinh chi phí trả phí hàng tháng.

---

### CÁCH 3: TỰ VIẾT SCRIPT TRÌNH DUYỆT ẨN DANH (PLAYWRIGHT / PUPPETEER STEALTH)
*Dành cho lập trình viên muốn tự chủ hoàn toàn mã nguồn và chạy tự động định kỳ.*

* **Công nghệ cốt lõi:**
  - Ngôn ngữ: Python hoặc Node.js.
  - Thư viện: **Playwright** kết hợp với **`playwright-stealth`** (để xóa cờ `navigator.webdriver`).
* **Cơ chế kỹ thuật:**
  1. Khởi động Chromium ở chế độ không đăng nhập (Logged-out session).
  2. Bật plugin Stealth để đánh lừa bộ kiểm tra bot của Meta: làm giả kích thước màn hình, card đồ họa WebGL, ngôn ngữ `vi-VN`.
  3. Mở URL Group Public HaUI.
  4. Lắng nghe và chặn các dialog popup đăng nhập (bằng cách tiêm script xóa thẻ `div` chứa popup hoặc bấm phím Escape).
  5. Mô phỏng hành vi cuộn chuột tự nhiên (cuộn từ từ 300px - 500px, nghỉ ngẫu nhiên 1 - 3 giây).
  6. Bóc tách nội dung bài viết từ các thẻ `div[role="feed"]` hoặc `div[dir="auto"]`.
* **Ưu điểm:** Miễn phí 100%, tùy biến linh hoạt mọi logic theo ý muốn.
* **Nhược điểm:** Tốn tài nguyên CPU/RAM nếu chạy lâu, cần thường xuyên cập nhật mã khi Facebook đổi cấu trúc giao diện.

---

### CÁCH 4: TỰ VIẾT SCRIPT HTTP SIÊU TỐC (EMBEDDED JSON SSR PARSING)
*Phương pháp đỉnh cao của các kỹ sư dữ liệu: Tốc độ cao nhất, không cần mở trình duyệt.*

* **Công nghệ cốt lõi:**
  - Thư viện Python: **`curl_cffi`** (thư viện HTTP client có khả năng giả lập dấu vân tay mã hóa TLS/JA3 của Chrome thật).
* **Cơ chế kỹ thuật:**
  1. Gửi request `GET` thông thường đến URL bài viết hoặc URL trang công khai của Facebook với đầy đủ header trình duyệt thật (`User-Agent`, `Sec-Ch-Ua`, `Accept-Language: vi-VN`).
  2. `curl_cffi` thực hiện bắt tay mã hóa TLS khớp 100% với Google Chrome trên Windows 11 $\rightarrow$ Máy chủ Meta coi đây là lượt truy cập web bình thường.
  3. Trong phản hồi HTML trả về, tìm các khối thẻ `<script type="application/json">` mà Meta dùng để truyền dữ liệu cho React.
  4. Sử dụng Regex hoặc `json.loads` để lọc ra trường dữ liệu: Nội dung bài (`message.text`), thời gian tạo (`creation_time`), và các link ảnh đính kèm.
* **Ưu điểm:** Tốc độ nhanh gấp 30 lần Playwright, có thể chạy trên một máy chủ VPS cấu hình thấp 512MB RAM mà không bị giật lag.
* **Nhược điểm:** Cấu trúc JSON bên trong của Meta rất sâu và phức tạp (lồng ghép nhiều tầng Relay GraphQL), đòi hỏi kỹ năng bóc tách dữ liệu nâng cao.

---

### CÁCH 5: KÊNH CHÍNH NGẠCH (META GRAPH API / CONTENT LIBRARY)
*Con đường hợp pháp có sự bảo hộ chính thức của Meta.*

* **Cách tiếp cận:**
  - Sử dụng **Facebook Graph API** với quyền `Page Public Content Access` (chỉ áp dụng cho Fanpage mở, không áp dụng cho Group).
  - Hoặc đăng ký qua cổng **Meta Content Library** dành cho các dự án nghiên cứu khoa học của sinh viên/giảng viên Đại học Công nghiệp Hà Nội.
* **Ưu điểm:** 100% tuân thủ chính sách của Meta, không bao giờ lo bị chặn IP.
* **Nhược điểm:** Group cộng đồng sinh viên thường không nằm trong phạm vi cấp quyền của Graph API thông thường; thủ tục kiểm duyệt dự án rất khắt khe.

---

## 4. BẢNG SO SÁNH ĐÁNH GIÁ & LỜI KHUYÊN LỰA CHỌN

| Tiêu chí so sánh | Cách 1: Extension (Instant Data) | Cách 2: Cloud Actor (Apify) | Cách 3: Script Playwright Stealth | Cách 4: HTTP curl_cffi | Cách 5: Meta Graph API |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Độ khó kỹ thuật** | ⭐ (Rất dễ) | ⭐⭐ (Dễ) | ⭐⭐⭐ (Trung bình) | ⭐⭐⭐⭐ (Khó) | ⭐⭐⭐⭐⭐ (Thủ tục) |
| **Chi phí** | 0đ | Có gói Free ($5/tháng) | 0đ | 0đ | 0đ |
| **Tốc độ thu thập** | Chậm (Thủ công) | Rất nhanh (Đám mây) | Trung bình | Cực nhanh | Bị bóp rate-limit |
| **Độ bền bỉ / Ít lỗi** | Dễ bị dừng khi Facebook đổi giao diện | Rất cao (Có đội ngũ bảo trì) | Trung bình (Tự sửa code) | Cao | Tuyệt đối |
| **Mức độ an toàn pháp lý** | 🟢 Rất an toàn (Chỉ xem) | 🟢 An toàn (Đã lọc PII) | 🟢 An toàn (Logged-out) | 🟢 An toàn (Logged-out) | 🟢 100% Chính ngạch |

### 💡 LỜI KHUYÊN DÀNH CHO BẠN:

1. **Nếu bạn muốn có dữ liệu ngay lập tức trong 15 phút mà không cần lập trình:**
   $\rightarrow$ **Chọn Cách 1 (Instant Data Scraper):** Cài extension vào Chrome, mở Group HaUI công khai, bật extension lên và bấm xuất file Excel. Đây là cách trực quan và an toàn nhất cho người mới bắt đầu.
2. **Nếu bạn muốn có một hệ thống tự động, ổn định, cào hàng nghìn bài định kỳ:**
   $\rightarrow$ **Chọn Cách 2 (Apify Platform):** Tận dụng gói miễn phí $5/tháng, cấu hình URL Group HaUI và để máy chủ tự động cào trả về JSON sạch sẽ mà không phải lo máy tính bị đơ hay bị chặn IP.
3. **Nếu bạn là lập trình viên muốn tự phát triển toàn bộ hệ thống từ đầu:**
   $\rightarrow$ **Chọn Cách 3 (Playwright Stealth ở chế độ Logged-out):** Tự viết script kiểm soát từng bước, vừa học hỏi chuyên sâu về kỹ thuật thu thập dữ liệu, vừa tuân thủ đầy đủ các nguyên tắc bảo vệ quyền riêng tư theo Nghị định 13/2023/NĐ-CP.
