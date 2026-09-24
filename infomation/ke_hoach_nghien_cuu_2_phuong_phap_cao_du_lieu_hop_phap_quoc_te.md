# KẾ HOẠCH NGHIÊN CỨU SỐ 2 (DEEP RESEARCH PLAN #2)
## Chuyên đề: Chuẩn mực Quốc tế về Thu thập Dữ liệu Web (Web Scraping) — Tính Hợp pháp Thực sự, Các Phương pháp Phổ biến và Kiến trúc Kỹ thuật Hiệu quả Cao

---

## 1. TỔNG QUAN VÀ MỤC TIÊU NGHIÊN CỨU (OBJECTIVES & SCOPE)

### 1.1. Bối cảnh Quốc tế
Trong nền kinh tế dữ liệu toàn cầu, Web Scraping (hay Web Data Extraction) chiếm tới hơn 40% lưu lượng mạng Internet và là nền tảng cho:
- Huấn luyện các mô hình AI/LLM (Common Crawl, The Pile, LAION).
- Các tập đoàn dữ liệu khổng lồ (Bright Data, Oxylabs, Bloomberg, Google Search).
- Giám sát thị trường, so sánh giá, nghiên cứu hàn lâm và tình báo kinh doanh (Business Intelligence).

Tuy nhiên, ranh giới giữa **"Khai thác dữ liệu công khai hợp pháp (Legal Data Mining)"** và **"Hành vi xâm phạm quyền riêng tư / Tấn công mạng (Data Theft / Cyberattack)"** là một trong những chủ đề tranh chấp pháp lý phức tạp nhất trên thế giới hiện nay.

### 1.2. Mục tiêu cốt lõi của Kế hoạch Nghiên cứu số 2
1. **Bản đồ Pháp lý Toàn cầu (Global Legal Map):** Phân tích toàn diện luật pháp của 3 khu vực tài phán lớn nhất thế giới: **Hoa Kỳ, Liên minh Châu Âu (EU), và Châu Á (Việt Nam/APAC)** về quyền thu thập dữ liệu web.
2. **Giải phẫu Mô hình Hoạt động của Các Công ty Dữ liệu Hàng đầu:** Làm rõ cách thức các kỳ lân dữ liệu quốc tế (Bright Data, Oxylabs, Apify, ScraperAPI) vận hành hàng tỷ request/ngày mà vẫn đứng vững trước các vụ kiện từ Meta, LinkedIn, X (Twitter).
3. **Kiến trúc Kỹ thuật Tối ưu & Hiệu quả (State-of-the-Art Architecture):** Nghiên cứu các giải pháp kỹ thuật vừa đảm bảo **hiệu suất cao (tốc độ, độ bền bỉ, tiết kiệm tài nguyên)**, vừa đảm bảo **tính hợp pháp và đạo đức**.
4. **Bộ Quy tắc Khung Thu thập Dữ liệu Đạo đức (Ethical Scraping Standard):** Đưa ra một chuẩn mực có thể chứng minh tính minh bạch trước bất kỳ cơ quan thanh tra nào.

---

## 2. BẢN ĐỒ PHÁP LÝ TOÀN CẦU VỀ WEB SCRAPING (GLOBAL LEGAL LANDSCAPE)

```
                       ┌────────────────────────────────────────────────────────┐
                       │           GLOBAL WEB SCRAPING LEGAL MATRIX             │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
         ┌─────────────────────────────────────────┼────────────────────────────────────────┐
         ▼                                         ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
│     HOA KỲ       │                     │ LIÊN MINH CHÂU ÂU│                     │    VIỆT NAM      │
│ (US JURISDICTION)│                     │ (EU REGULATION)  │                     │(VN JURISDICTION) │
├──────────────────┤                     ├──────────────────┤                     ├──────────────────┤
│ • CFAA § 1030    │                     │ • GDPR Art 6, 17 │                     │ • Nghị định 13   │
│ • Án lệ hiQ      │                     │ • Chỉ thị DSM    │                     │ • Nghị định 91   │
│ • Án lệ Van Buren│                     │   (TDM Art 3 & 4)│                     │ • Điều 288 & 289 │
│ • Án lệ Bright   │                     │ • Database       │                     │   Bộ luật Hình sự│
│   Data v. Meta   │                     │   Directive      │                     │                  │
└──────────────────┘                     └──────────────────┘                     └──────────────────┘
```

### 2.1. Khung Pháp lý Hoa Kỳ (Nền tảng của hầu hết các án lệ lớn)
Nước Mỹ là nơi định hình các án lệ về cào dữ liệu qua 3 cột mốc pháp lý mang tính bước ngoặt:

1. **Đạo luật Lừa đảo và Lạm dụng Máy tính (CFAA - 18 U.S.C. § 1030):**
   - Trước năm 2021: Các công ty lớn thường dùng CFAA để kiện các bên cào dữ liệu với lý do "truy cập trái phép hoặc vượt quá thẩm quyền truy cập".
   - Bước ngoặt **Van Buren v. United States (Tối cao Pháp viện Hoa Kỳ - 2021):** Tòa án tối cao đã thu hẹp định nghĩa CFAA. Việc một người truy cập vào thông tin mà hệ thống mở cho họ xem (dù vi phạm nội quy/chính sách sử dụng) **không cấu thành tội phạm hình sự theo CFAA**.
2. **Án lệ hiQ Labs, Inc. v. LinkedIn Corp. (Tòa Phúc thẩm Liên bang Khu vực 9 - 2022):**
   - **Phán quyết lịch sử:** Tòa án khẳng định việc cào **dữ liệu công khai trên Internet mở (không cần tài khoản, không có mật khẩu bảo vệ)** không cấu thành hành vi xâm nhập trái phép máy tính.
   - **Tư tưởng:** Internet mở thuộc về công chúng; việc dựng hàng rào kỹ thuật ngăn cản đối thủ cạnh tranh đọc dữ liệu công khai là hành vi phản cạnh tranh (anti-competitive).
3. **Án lệ Meta Platforms, Inc. v. Bright Data Ltd. (Tòa án Liên bang Mỹ - Tháng 01/2024):**
   - **Vấn đề kiện tụng:** Meta kiện Bright Data vi phạm hợp đồng (Breach of Terms of Service) khi cào dữ liệu từ Facebook và Instagram.
   - **Phán quyết:** Bright Data thắng. Tòa án kết luận việc cào dữ liệu ở trạng thái **không đăng nhập (Logged-out public data)** không chịu sự trói buộc của hợp đồng điều khoản người dùng của Meta.

---

### 2.2. Khung Pháp lý Liên minh Châu Âu (EU - Tiêu chuẩn cao nhất về quyền riêng tư)
EU không chỉ xét khía cạnh kỹ thuật mà đánh giá sâu vào **bảo vệ dữ liệu cá nhân** và **bản quyền cơ sở dữ liệu**:

1. **Đạo luật Bảo vệ Dữ liệu Chung (GDPR - General Data Protection Regulation):**
   - **Nguyên tắc "Legitimate Interest" (Lợi ích hợp pháp - Điều 6(1)(f)):** Cào dữ liệu có thể được xem là hợp pháp nếu phục vụ lợi ích kinh doanh/nghiên cứu chính đáng, **MIỄN LÀ** không xâm phạm đến quyền và lợi ích cơ bản của chủ thể dữ liệu.
   - **Nguyên tắc ẩn danh hóa (Anonymization):** Nếu dữ liệu sau khi cào được loại bỏ toàn bộ định danh cá nhân (PII), GDPR sẽ **ngừng áp dụng**, dữ liệu trở thành dữ liệu phi cá nhân hợp pháp tự do lưu hành.
2. **Ngoại lệ Khai thác Dữ liệu và Văn bản (TDM - Text and Data Mining) theo Chỉ thị Bản quyền DSM (EU Directive 2019/790):**
   - **Điều 3 (Nghiên cứu khoa học):** Cho phép các trường đại học, viện nghiên cứu cào dữ liệu công khai mà không cần xin phép chủ sở hữu bản quyền.
   - **Điều 4 (Khai thác thương mại):** Cho phép cào dữ liệu cho mục đích thương mại **trừ khi** chủ sở hữu dữ liệu đã sử dụng các biện pháp máy đọc được (như `robots.txt` hoặc metadata "opt-out") để từ chối rõ ràng.

---

## 3. CÁC PHƯƠNG PHÁP THU THẬP DỮ LIỆU PHỔ BIẾN TRÊN THẾ GIỚI

Qua khảo sát mô hình của các đơn vị khai thác dữ liệu hàng đầu thế giới (Bright Data, Oxylabs, Common Crawl, ZenRows), có 3 phương pháp chính được phân loại theo tính hợp pháp và độ phức tạp:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                     3 CẤP ĐỘ THU THẬP DỮ LIỆU PHỔ BIẾN QUỐC TẾ                        │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ CẤP ĐỘ 1: CHÍNH THỨC (OFFICIAL APIS & PARTNERSHIPS) - 100% PHÁP LÝ CHẮC CHẮN          │
│   • Sử dụng Graph API, Twitter API, Reddit Data API, Google Serp API chính ngạch.     │
│   • Ưu điểm: Không sợ bị kiện, dữ liệu chuẩn cấu trúc JSON.                           │
│   • Nhược điểm: Chi phí cực kỳ đắt, bị bóp rate-limit khắt khe, kiểm duyệt dữ liệu.  │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ CẤP ĐỘ 2: CÀO WEB CÔNG KHAI KHÔNG ĐĂNG NHẬP (LOGGED-OUT PUBLIC SCRAPING) - TIÊU CHUẨN │
│   • Thu thập trang tĩnh (SSR), trích xuất dữ liệu từ mã nguồn HTML hoặc API nội bộ mở.│
│   • Áp dụng đầy đủ án lệ Bright Data: Không dùng tài khoản, không login, không bypass.│
│   • Ưu điểm: Chi phí tối ưu, tuân thủ pháp lý theo án lệ quốc tế, ổn định lâu dài.   │
│   • Nhược điểm: Phải xử lý chống chặn IP (Proxy rotation, TLS fingerprinting).       │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ CẤP ĐỘ 3: TỰ ĐỘNG HÓA TÀI KHOẢN ĐĂNG NHẬP (AUTHENTICATED AUTOMATION) - VÙNG NGUY HIỂM  │
│   • Dùng hàng ngàn tài khoản ảo (clone), cookie session để cào dữ liệu sâu bên trong. │
│   • Rủi ro pháp lý: Vi phạm hợp đồng Clickwrap, nguy cơ phạm tội hình sự gian lận.   │
│   • ❌ QUỐC TẾ KHUYÊN KHÔNG NÊN SỬ DỤNG CHO CÁC DỰ ÁN NGHIÊN CỨU/HỢP PHÁP.            │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. KIẾN TRÚC KỸ THUẬT HIỆU QUẢ CAO & BỀN VỮNG (STATE-OF-THE-ART TECHNICAL ARCHITECTURE)

Một hệ thống thu thập dữ liệu đạt chuẩn quốc tế phải đáp ứng được cả 3 yếu tố: **Tốc độ cao**, **Tài nguyên thấp**, và **Tàng hình hợp pháp (Không làm nghẽn máy chủ đối tác)**.

```
                    ┌────────────────────────────────────────────────────────┐
                    │      HIGH-EFFICIENCY ETHICAL SCRAPING PIPELINE         │
                    └───────────────────────────┬────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                   ┌──────────────────┐
│  TẦNG KẾT NỐI    │                  │  TẦNG PHÒNG VỆ   │                   │  TẦNG XỬ LÝ DỮ   │
│ (NETWORK LAYER)  │                  │  (BYPASS & STEALTH)                  │  LIỆU (INGESTION)│
├──────────────────┤                  ├──────────────────┤                   ├──────────────────┤
│ • Reverse Eng.   │                  │ • Proxy Pool     │                   │ • Real-time PII  │
│   Internal API   │                  │   (Residential / │                   │   Sanitizer      │
│ • Async HTTPX /  │                  │    Datacenter)   │                   │ • Stream Parser  │
│   Curl-impersonate                  │ • TLS/JA3 Finger-│                   │ • Deduplication  │
│ • Playwright (chỉ│                  │   print Matching │                   │   (Bloom Filter/ │
│   dùng khi cần)  │                  │ • Rate Governor  │                   │    Hash Set)     │
└──────────────────┘                  └──────────────────┘                   └──────────────────┘
```

### 4.1. Tầng Kết Nối: Bí quyết Tốc độ & Tiết kiệm Tài nguyên
* **Phương pháp lỗi thời (Chậm, ngốn RAM):** Mở trình duyệt giả lập (Selenium / Puppeteer) cho mọi trang web $\rightarrow$ Tiêu tốn hàng chục GB RAM, tốc độ rùa bò, dễ bị phát hiện bởi `navigator.webdriver`.
* **Phương pháp chuẩn quốc tế (High-Efficiency):**
  1. **Reverse Engineering Hidden APIs:** Bắt gói tin mạng (Network Tab) để tìm các endpoint JSON nội bộ mà frontend của web gọi về. Gọi trực tiếp endpoint này giúp tăng tốc độ gấp **20 - 50 lần** và tiết kiệm 95% băng thông vì không phải tải hình ảnh hay render CSS/JS.
  2. **Curl-impersonate & HTTP/2:** Sử dụng các thư viện giả lập chính xác bắt tay mã hóa TLS/JA3 của trình duyệt Chrome hoặc Firefox thực thụ, vượt qua 90% các hệ thống Cloudflare / Akamai Bot Management mà không cần mở trình duyệt.

### 4.2. Tầng Quản trị Tốc độ & Lịch sự (Rate Governor & Politeness)
* **Tiêu chuẩn RFC 9309 (Robots Exclusion Protocol):** Đọc và tôn trọng các chỉ thị `robots.txt` hợp lý.
* **Exponential Backoff with Jitter (Thuật toán lùi số mũ kết hợp độ trễ ngẫu nhiên):**
  - Khi máy chủ mục tiêu có dấu hiệu chậm lại (Status 429 hoặc 503), hệ thống tự động giãn thời gian request (ví dụ: nghỉ 2s $\rightarrow$ 4s $\rightarrow$ 8s + một độ trễ ngẫu nhiên ngẫu hứng 0.5s - 1.5s).
  - Điều này đảm bảo crawler **không bao giờ biến thành một cuộc tấn công từ chối dịch vụ (DoS)**, tránh tuyệt đối bẫy vi phạm Điều 288 Bộ luật Hình sự.

### 4.3. Tầng Làm sạch & Khử Định danh Dữ liệu Tức thì (Real-time PII Sanitizer)
* Dữ liệu nhận về từ Network được đưa ngay vào bộ nhớ RAM tạm thời:
  - Bóc tách nội dung phục vụ nghiên cứu.
  - Tự động lọc sạch (Drop hoặc Mask) các trường: IP cá nhân, User ID, Profile URL, Email cá nhân.
  - Chỉ lưu vào Cơ sở dữ liệu lâu dài (PostgreSQL/DuckDB) những dữ liệu đã được làm sạch hoàn toàn.

---

## 5. BỘ QUY TẮC ĐẠO ĐỨC VÀ TUÂN THỦ QUỐC TẾ (THE ETHICAL SCRAPING MANIFESTO)

Một dự án dữ liệu được cộng đồng quốc tế công nhận là **"White-Hat" (Chính thống & Đạo đức)** khi thỏa mãn **Bộ 6 Tiêu Chí Vàng**:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                    THE 6-PILLAR ETHICAL SCRAPING MANIFESTO                            │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CHỈ THU THẬP DỮ LIỆU CÔNG KHAI (PUBLIC DATA ONLY)                                  │
│    Tuyệt đối không vượt tường lửa, không dùng tài khoản hack, không cào sau màn hình   │
│    đăng nhập cá nhân hoặc group kín.                                                  │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 2. KHÔNG LÀM TỔN HẠI HẠ TẦNG (DO NO HARM TO INFRASTRUCTURE)                         │
│    Giới hạn tần suất request (Rate limiting), chạy tải ngoài giờ cao điểm để không    │
│    gây nghẽn mạng hay làm tăng chi phí máy chủ của đơn vị bị cào.                     │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 3. BẢO VỆ TUYỆT ĐỐI QUYỀN RIÊNG TƯ (RESPECT PRIVACY & GDPR/NĐ 13)                    │
│    Khử định danh ngay lập tức các thông tin nhạy cảm. Không thu thập thông tin trẻ em, │
│    học sinh, sinh viên yếu thế khi chưa có sự cho phép.                               │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 4. MINH BẠCH DANH TÍNH ROBOT (TRANSPARENT USER-AGENT)                                 │
│    Khai báo Header User-Agent chuyên nghiệp có gắn link thông tin dự án hoặc email     │
│    liên hệ (vd: `HaUIResearchBot/1.0 (+https://du-an-nghien-cuu.vn/bot-info)`).       │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 5. MỤC ĐÍCH HỢP PHÁP VÀ NHÂN VĂN (LEGITIMATE PURPOSE)                                 │
│    Dữ liệu phục vụ cộng đồng, nghiên cứu thị trường, chống lừa đảo; tuyệt đối không   │
│    bán lại data cá nhân để trục lợi hoặc chạy spam viễn thông.                        │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 6. CƠ CHẾ RÚT LUI VÀ GỠ THÔNG TIN (RIGHT TO OPT-OUT & TAKEDOWN)                       │
│    Có quy trình rõ ràng và xử lý trong 24h khi có cá nhân yêu cầu xóa thông tin của họ.│
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. LỘ TRÌNH THỰC HIỆN KẾ HOẠCH NGHIÊN CỨU SỐ 2 (4 GIAI ĐOẠN)

```
Giai đoạn 1: So chiếu Chuẩn mực Quốc tế ──► Giai đoạn 2: Phân tích Kỹ thuật & Anti-block
                                                                        │
Giai đoạn 4: Đóng gói Bộ Khung Hoàn Chỉnh ◄── Giai đoạn 3: Thiết kế Pipeline Chuẩn hóa
```

### Giai đoạn 1: Nghiên cứu Chi tiết Các Án lệ Quốc tế & Hướng dẫn Pháp lý (Tuần 1)
- **Nội dung:**
  - Dịch và mổ xẻ toàn văn bản án phúc thẩm vụ *Meta v. Bright Data (2024)* và *hiQ v. LinkedIn (2022)*.
  - Phân tích quy định TDM (Text and Data Mining) theo Điều 3 & 4 Chỉ thị Bản quyền Châu Âu (EU DSM Directive).
- **Đầu ra:** Báo cáo Tổng hợp Án lệ Quốc tế về Quyền Thu thập Dữ liệu Công khai.

### Giai đoạn 2: Khảo sát Kiến trúc Kỹ thuật Không Đăng Nhập (Logged-Out Scraping) (Tuần 2)
- **Nội dung:**
  - Nghiên cứu cách các nền tảng mở (Facebook Public Pages, Reddit, YellowPages, Bất Động Sản) trả về dữ liệu cho người dùng chưa đăng nhập.
  - Khảo sát các công nghệ bắt gói tin API ngầm (Hidden API Endpoints) và công nghệ TLS Fingerprinting.
- **Đầu ra:** Tài liệu Thiết kế Kiến trúc Thu thập Dữ liệu Hiệu năng cao (Technical Architecture Document).

### Giai đoạn 3: Thiết kế Hệ thống Kiểm soát Tần suất & Bộ lọc Đạo đức Dữ liệu (Tuần 3)
- **Nội dung:**
  - Xây dựng thuật toán Rate Governor (Exponential Backoff with Jitter) trên mô hình lý thuyết.
  - Thiết kế luồng Ingestion Pipeline với module Khử định danh tức thời (Instant PII Sanitizer).
- **Đầu ra:** Bản đặc tả kỹ thuật Bộ lọc Đạo đức Dữ liệu (Ethical Data Filter Specification).

### Giai đoạn 4: Đóng gói Hồ sơ Phương pháp Luận Quốc tế (Tuần 4)
- **Nội dung:**
  - Tổng hợp thành **Sổ tay Tiêu chuẩn Web Scraping Quốc tế (International Web Scraping Handbook)**.
  - Tích hợp kết quả nghiên cứu này vào Dự án Dữ liệu Phòng trọ HaUI để đảm bảo dự án có độ tin cậy và pháp lý chuẩn mực toàn cầu.
- **Đầu ra:** Hồ sơ Hoàn chỉnh Phương pháp Luận Thu thập Dữ liệu Hợp pháp Quốc tế.

---

## 7. CƠ SỞ THAM CHIẾU VÀ TÀI LIỆU QUỐC TẾ (GLOBAL REFERENCES)

1. **Văn bản Luật & Phán quyết Toà án:**
   - *Meta Platforms, Inc. v. Bright Data Ltd.*, Case No. 23-cv-00077-EMC (N.D. Cal. Jan 23, 2024).
   - *hiQ Labs, Inc. v. LinkedIn Corp.*, 31 F.4th 1180 (9th Cir. 2022).
   - *Van Buren v. United States*, 141 S. Ct. 1648 (2021).
   - *Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR)*.
   - *Directive (EU) 2019/790 on copyright and related rights in the Digital Single Market (DSM Directive)*.
2. **Tiêu chuẩn Kỹ thuật Internet:**
   - **IETF RFC 9309**: Robots Exclusion Protocol.
   - W3C Data Privacy & Ethics Guidelines.
   - ScrapingHub / Zyte / Bright Data Ethical Scraping Standards.
