# KẾ HOẠCH NGHIÊN CỨU CHUYÊN SÂU (DEEP RESEARCH PLAN)
## Chuyên đề: Hệ sinh thái Dữ liệu AI, Khung Pháp lý Tuân thủ (Nghị định 13, NĐ 91, BLHS 288/289) và Kỹ thuật Thu thập / Phân tích Dữ liệu Phòng trọ Sinh viên HaUI từ Facebook

---

## 1. TỔNG QUAN VÀ MỤC TIÊU DỰ ÁN (EXECUTIVE SUMMARY & OBJECTIVES)

### 1.1. Bối cảnh & Bài toán Thực tế
Khu vực quanh **Trường Đại học Công nghiệp Hà Nội (HaUI)** — bao gồm các địa bàn trọng điểm như **Nhổn, Nguyên Xá, Tây Tựu, Minh Khai, Phú Diễn, Kiều Mai, Cầu Diễn** — có mật độ sinh viên thuê trọ khổng lồ. Nguồn dữ liệu phòng trọ chủ yếu được lưu hành trên các hội nhóm Facebook công khai.

Tuy nhiên, việc thu thập dữ liệu này đặt ra hai câu hỏi sống còn:
1. **Làm sao để đảm bảo dữ liệu thu thập và cách thức cào dữ liệu là 100% HỢP PHÁP**, tuyệt đối không vi phạm pháp luật Việt Nam (Nghị định 13/2023/NĐ-CP, Nghị định 91/2020/NĐ-CP, Điều 288 và 289 Bộ luật Hình sự)?
2. **Làm sao để ứng dụng AI phân tích dữ liệu một cách hiệu quả và nhân văn**, chuyển hóa dữ liệu phi cấu trúc lộn xộn thành cơ sở tri thức giúp sinh viên HaUI tránh bẫy lừa đảo và tìm được phòng trọ minh bạch?

### 1.2. Mục tiêu nghiên cứu (Tập trung Nghiên cứu & Pháp lý - Chưa viết code)
- **Mục tiêu 1:** Xây dựng cơ sở pháp lý vững chắc: Rà soát từng điều khoản luật của Việt Nam và án lệ quốc tế để xác lập ranh giới an toàn tuyệt đối cho dữ liệu.
- **Mục tiêu 2:** Thiết lập **Bộ 5 Nguyên tắc Vàng Bảo đảm Hợp pháp 100%** trong thu thập dữ liệu mạng xã hội.
- **Mục tiêu 3:** Thiết kế mô hình phân tích dữ liệu AI (NLP/LLM Data Extraction, Anomaly & Scam Detection, Price Heatmap) trên cơ sở dữ liệu đã được làm sạch và khử định danh hoàn toàn.
- **Mục tiêu 4:** Đóng gói Hồ sơ Nghiên cứu Chuyên sâu (Research Dossier) và Sổ tay Tuân thủ Đạo đức Dữ liệu (Data Ethics Handbook) làm kim chỉ nam trước khi bước vào giai đoạn kỹ thuật.

---

## 2. BỐN TRỤ CỘT NGHIÊN CỨU CỐT LÕI (ỨNG DỤNG TRỰC TIẾP CASE STUDY HAUI)

```
                       ┌────────────────────────────────────────────────────────┐
                       │    DEEP RESEARCH: DATA PHÒNG TRỌ SINH VIÊN HAUI       │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
         ┌───────────────────────┬─────────────────┴───────────────┬────────────────────────┐
         ▼                       ▼                                 ▼                        ▼
┌──────────────────┐   ┌───────────────────┐             ┌───────────────────┐   ┌───────────────────────┐
│   TRỤ CỘT 1      │   │     TRỤ CỘT 2     │             │     TRỤ CỘT 3     │   │       TRỤ CỘT 4       │
│ Đặc thù Dữ liệu  │   │ AI Phân tích &    │             │ Pháp lý Việt Nam  │   │ Quy trình Cào Data    │
│ Phòng trọ HaUI   │   │ Bóc tách Dữ liệu  │             │ (NĐ 13, NĐ 91,    │   │ Facebook Hợp pháp     │
│                  │   │                   │             │  BLHS 288 & 289)  │   │ (Án lệ & Kỹ thuật)    │
└──────────────────┘   └───────────────────┘             └───────────────────┘   └───────────────────────┘
```

---

### TRỤ CỘT 1: ĐẶC THÙ HỆ SINH THÁI DỮ LIỆU PHÒNG TRỌ HAUI
**Câu hỏi nghiên cứu:** *Dữ liệu phòng trọ sinh viên HaUI trên Facebook có cấu trúc ra sao, chứa những thông tin gì và độ nhiễu như thế nào?*

1. **Phân loại nguồn dữ liệu mục tiêu tại HaUI:**
   - **Nhóm Facebook công khai (Public Groups):** 
     - *Phòng trọ Đại học Công nghiệp Hà Nội (HaUI)*
     - *Tìm phòng trọ khu vực Nhổn - Cầu Diễn - ĐH Công Nghiệp*
     - *Hội sinh viên HaUI tìm nhà trọ, share phòng trọ giá rẻ*
   - **Khu vực địa lý cốt lõi cần gắn nhãn (Geo-tagging):**
     - Bán kính 0 - 1km: Nhổn, Nguyên Xá (Cổng chính & Cổng phụ HaUI).
     - Bán kính 1 - 3km: Tây Tựu, Minh Khai, Phú Diễn, Kiều Mai, Đình Quán, Đức Diễn.
     - Bán kính > 3km: Cầu Diễn, Xuân Phương, Hoài Đức.
2. **Đặc điểm dữ liệu thô (Raw Data Characteristics):**
   - **Văn bản phi cấu trúc (Unstructured Text):** Sử dụng nhiều từ viết tắt, tiếng lóng giới bất động sản sinh viên: *"kcc"* (không chung chủ), *"n/l"* (nóng lạnh), *"đh"* (điều hòa), *"khép kín"*, *"điện 3.8k, nước 100k/ng"*, *"cách trường 300m"*.
   - **Dữ liệu hình ảnh:** Ảnh chụp phòng thực tế, ảnh mẫu qua chỉnh sửa của môi giới, video quay phòng trọ.
   - **Dữ liệu liên hệ:** Số điện thoại, link Zalo, tên hiển thị người đăng.
   - **Độ nhiễu & Tin rác:** Tin môi giới đăng lặp lại (spam clone), tin ảo mồi cọc, bài sinh viên cần tìm trọ lẫn với bài cho thuê trọ.

---

### TRỤ CỘT 2: ỨNG DỤNG AI ĐỂ PHÂN TÍCH & BÓC TÁCH DỮ LIỆU PHÒNG TRỌ
**Câu hỏi nghiên cứu:** *Làm thế nào để ứng dụng LLM và Machine Learning xử lý triệt để đống văn bản thô thành cơ sở dữ liệu phân tích thị trường sạch sẽ?*

1. **Pipeline Trích xuất thông tin tự động bằng AI (Information Extraction Pipeline):**
   - **Bước 1: Lọc phân loại bài đăng (Classification Agent):**
     - Dùng mô hình phân loại (hoặc LLM Zero-shot) nhận diện:
       - `Type A`: Bài đăng **CHO THUÊ** (Chủ trọ / Môi giới chào phòng) $\rightarrow$ Đưa vào pipeline xử lý.
       - `Type B`: Bài đăng **TÌM PHÒNG** của sinh viên $\rightarrow$ **Loại bỏ ngay** để bảo vệ quyền riêng tư sinh viên.
       - `Type C`: Bài spam quảng cáo không liên quan $\rightarrow$ Hủy.
   - **Bước 2: Bóc tách thực thể chuyên sâu (Entity & Feature Extraction via LLM):**
     - Trích xuất thành schema JSON chuẩn hóa (chỉ giữ dữ liệu tài sản, loại bỏ định danh cá nhân Facebook):
       ```json
       {
         "post_hash_id": "sha256_hash",
         "gia_thue": 2500000,
         "dien_tich_m2": 22,
         "khu_vuc": "Nguyên Xá",
         "dia_chi_chi_tiet": "Ngõ 132 Cầu Diễn",
         "khoang_cach_haui_km": 0.5,
         "tien_ich": ["điều hòa", "nóng lạnh", "không chung chủ", "máy giặt chung"],
         "chi_phi": {
           "dien_kwh": 3800,
           "nuoc_nguoi_thang": 100000,
           "mang_phong": 80000
         },
         "loai_nguoi_dang": "Chủ nhà trực tiếp | Môi giới",
         "sdt_lien_he": "0987xxxxxx"
       }
       ```
   - **Bước 3: Phát hiện tin ảo & Cảnh báo lừa đảo cọc (Anomaly & Scam Detection):**
     - Thuật toán AI phát hiện bất thường: Giá thuê quá rẻ so với diện tích và tiện ích ở khu vực Nhổn (ví dụ: Full đồ 1.2 triệu ở cổng trường $\rightarrow$ Cảnh báo lừa cọc).
     - Phát hiện một số điện thoại đăng 50 phòng khác nhau trong cùng 1 ngày $\rightarrow$ Tự động gán nhãn: *Môi giới bất động sản*.

2. **Mô hình Phân tích Thị trường & Insight Sinh viên:**
   - **Bản đồ nhiệt giá trọ (Price Heatmap):** Tương quan giữa cự ly tới cổng trường HaUI và giá thuê từng mét vuông.
   - **Phân tích biến động giá theo mùa:** Tháng 8 - 10 (Mùa tân sinh viên nhập học) vs Tháng 1 - 2 (Sau Tết).
   - **Chatbot hỗ trợ sinh viên tìm trọ (RAG Agent):** Cho phép sinh viên truy vấn ngôn ngữ tự nhiên: *"Tìm cho mình phòng dưới 2.5 triệu có điều hòa ở khu Nguyên Xá hoặc Kiều Mai cách HaUI dưới 1km"*.

---

### TRỤ CỘT 3: KHUNG PHÁP LÝ VIỆT NAM CHUYÊN SÂU (ĐẢM BẢO 100% HỢP PHÁP)
**Câu hỏi nghiên cứu:** *Căn cứ vào điều luật nào để khẳng định dữ liệu thu thập và cách làm là hoàn toàn hợp pháp tại Việt Nam?*

```
                               ┌────────────────────────────────────────────────────────┐
                               │           HỆ THỐNG PHÁP LUẬT VIỆT NAM LIÊN QUAN        │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
         ┌───────────────────────────────┬─────────────────┴───────────────┬───────────────────────────────┐
         ▼                               ▼                                 ▼                               ▼
┌──────────────────┐           ┌───────────────────┐             ┌───────────────────┐           ┌───────────────────┐
│  Nghị định 13    │           │  Nghị định 91     │           │   Điều 288 BLHS   │           │   Điều 289 BLHS   │
│  (Bảo vệ DLCN)   │           │  (Chống rác viễn  │           │   (Sử dụng trái   │           │   (Xâm nhập trái  │
│  - Xử lý PII     │           │   thông, SMS)     │           │    phép dữ liệu)  │           │    phép hệ thống) │
└──────────────────┘           └───────────────────┘             └───────────────────┘           └───────────────────┘
```

#### 1. Nghị định số 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân)
* **Phân định bản chất dữ liệu:**
  * **Dữ liệu phòng trọ (Giá, diện tích, địa chỉ ngõ ngách, tiện ích):** Là dữ liệu về **hàng hóa / dịch vụ bất động sản** được niêm yết công khai trên thị trường. Đây **KHÔNG PHẢI dữ liệu cá nhân**, được tự do thu thập, lập chỉ mục và phân tích thống kê.
  * **Số điện thoại của chủ trọ:** Theo Điều 2, số điện thoại là dữ liệu cá nhân cơ bản. Tuy nhiên, chủ trọ **chủ động công khai số điện thoại trong bài đăng quảng cáo** để người thuê liên hệ giao dịch.
  * **Căn cứ Khoản 3 Điều 17 Nghị định 13:** Quy định về *Xử lý dữ liệu cá nhân trong trường hợp không cần sự đồng ý của chủ thể dữ liệu*: Cho phép xử lý dữ liệu cá nhân đã được chủ thể tự mình công khai, **VỚI ĐIỀU KIỆN:** Bên xử lý chỉ được xử lý trong phạm vi mục đích đã được công khai (kết nối thuê trọ).
* **Điều cấm tuyệt đối (Ranh giới đỏ):**
  * **CẤM BÁN DATA:** Tuyệt đối không đóng gói danh bạ số điện thoại chủ trọ để bán lại cho bên thứ ba (telesale bảo hiểm, tài chính, quảng cáo). Mức phạt theo Điều 4 Nghị định 13 lên tới **5% tổng doanh thu** hoặc 100 - 200 triệu đồng.
  * **CẤM LƯU PII SINH VIÊN:** Sinh viên đăng bài tìm trọ là cá nhân tiết lộ nhu cầu riêng tư $\rightarrow$ Không được thu thập hồ sơ sinh viên.
  * **CẤM LƯU ĐỊNH DANH FACEBOOK:** Xóa bỏ toàn bộ Facebook UID, link profile cá nhân, avatar của người đăng.

#### 2. Nghị định số 91/2020/NĐ-CP (Chống tin nhắn rác, thư rác, cuộc gọi rác)
* **Hợp pháp:** Lưu trữ số điện thoại trong danh bạ tra cứu để sinh viên/người tìm trọ tự chủ động bấm gọi hỏi thuê phòng.
* **Bất hợp pháp:** Dùng danh sách số điện thoại cào được để nạp vào tool tự động gửi SMS quảng cáo, spam tin nhắn Zalo hàng loạt hoặc dùng AI Robocall gọi điện làm phiền.

#### 3. Điều 288 & 289 Bộ luật Hình sự năm 2015 (sửa đổi 2017)
* **Điều 289 (Tội xâm nhập trái phép vào mạng máy tính):**
  * Tội danh này chỉ hình thành khi có hành vi **cố ý vượt qua cảnh báo, mã truy cập, tường lửa, bẻ khóa mật khẩu hoặc chiếm đoạt quyền quản trị**.
  * $\rightarrow$ **Khẳng định:** Thu thập dữ liệu trên các **Group công khai (Public Groups)** mà bất kỳ ai truy cập Internet cũng đọc được thì **HOÀN TOÀN KHÔNG VI PHẠM Điều 289**.
* **Điều 288 (Tội đưa hoặc sử dụng trái phép thông tin mạng máy tính):**
  * Tội danh này chỉ áp dụng khi thông tin là **bí mật nhà nước, bí mật đời tư được bảo vệ, bí mật kinh doanh**, hoặc hành vi gây thiệt hại từ 100 triệu đồng trở lên, thu lợi bất chính từ 50 triệu đồng trở lên, hoặc làm tê liệt hệ thống mạng.
  * $\rightarrow$ **Khẳng định:** Thông tin chào thuê phòng trọ công khai không phải là bí mật; thu thập phục vụ nghiên cứu thị trường, hỗ trợ sinh viên hoàn toàn không cấu thành tội danh này.

---

### TRỤ CỘT 4: QUY TRÌNH CÀO DỮ LIỆU FACEBOOK HỢP PHÁP & ÁN LỆ QUỐC TẾ
**Câu hỏi nghiên cứu:** *Quan hệ pháp lý với Meta (Facebook) là gì? Làm thế nào để cào mà không bị coi là vi phạm hợp đồng?*

#### 1. Án lệ lịch sử: *Meta Platforms, Inc. v. Bright Data Ltd. (Tòa án Liên bang Mỹ - Phán quyết 2024)*
* **Tòa án phán quyết:** Bright Data **KHÔNG vi phạm hợp đồng (Breach of Contract)** khi thu thập dữ liệu công khai từ Facebook và Instagram ở trạng thái **không đăng nhập (Logged-out public data)**.
* **Ý nghĩa:** 
  1. Dữ liệu công khai trên Internet mở không phải là tài sản độc quyền của Meta.
  2. Người thu thập không sử dụng tài khoản đăng nhập thì không bị ràng buộc bởi thỏa thuận người dùng (Clickwrap Agreement) của Meta tại thời điểm cào.
  3. Meta chỉ có quyền áp dụng các biện pháp phòng vệ kỹ thuật (rate limit, CAPTCHA, chặn IP), chứ không thể kết tội vi phạm pháp luật nếu chỉ đọc dữ liệu công khai.

#### 2. BỘ 5 NGUYÊN TẮC VÀNG BẢO ĐẢM TÍNH HỢP PHÁP 100% (COMPLIANCE MATRIX)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                 5 NGUYÊN TẮC VÀNG BẢO ĐẢM TÍNH HỢP PHÁP 100%                          │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 1. NGUỒN CÔNG KHAI     │ Chỉ cào ở Group/Page công khai. Tuyệt đối không cào Group kín│
│ 2. LỌC ĐỐI TƯỢNG       │ Chỉ lấy tin CHỦ TRỌ CHO THUÊ. Bỏ qua tin SINH VIÊN TÌM PHÒNG │
│ 3. KHỬ ĐỊNH DANH PII   │ Không lưu Facebook UID, URL Profile, Avatar của người đăng   │
│ 4. MỤC ĐÍCH HỢP LỆ     │ Chỉ dùng phân tích thị trường & kết nối thuê trọ. CẤM BÁN DATA│
│ 5. CƠ CHẾ GỠ DỮ LIỆU   │ Luôn có Takedown Policy (Chủ nhà yêu cầu xóa là xóa ngay)    │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

* **Nguyên tắc 1: Nguồn dữ liệu phải là Open Web (Công khai 100%)**
  * Chỉ quét các bài đăng thuộc **Group Public** hoặc **Fanpage mở** mà bất kỳ ai không có tài khoản cũng có thể đọc được qua trình duyệt.
  * Không sử dụng tài khoản hack để chui vào các Group bí mật (Secret/Private Groups) hay cào trộm tin nhắn Messenger.
* **Nguyên tắc 2: Phân loại dữ liệu tại nguồn (Data Subject Separation)**
  * Dữ liệu sinh viên tìm trọ: Chứa thông tin cá nhân cần bảo vệ $\rightarrow$ Bỏ qua ngay lập tức, không lưu trữ.
  * Dữ liệu chủ trọ chào phòng: Bản chất là thư chào hàng công cộng $\rightarrow$ Được phép thu thập.
* **Nguyên tắc 3: Khử định danh cá nhân (Sanitization / De-identification)**
  * Tuyệt đối **KHÔNG lưu:** ID người dùng Facebook (`fb_uid`), đường link dẫn về trang cá nhân của họ, hình ảnh avatar của người đăng.
  * Chỉ lưu: Giá, địa chỉ, diện tích, tiện ích và số điện thoại công khai để liên hệ xem phòng.
* **Nguyên tắc 4: Giới hạn mục đích sử dụng (Purpose Limitation)**
  * Dữ liệu chỉ dùng để: Thống kê mặt bằng giá khu vực HaUI, xây dựng bảng thông tin hỗ trợ sinh viên tìm nhà, hoặc nghiên cứu khoa học.
  * Tuyệt đối không bán dữ liệu cho bên thứ ba.
* **Nguyên tắc 5: Quyền được lãng quên & Cơ chế gỡ bài (Takedown Policy)**
  * Căn cứ Điều 9 và Điều 16 Nghị định 13: Chủ thể dữ liệu có quyền yêu cầu ngừng xử lý hoặc xóa bỏ thông tin.
  * **Quy chuẩn bắt buộc:** Trong hệ thống hiển thị dữ liệu, bắt buộc phải có mục:
    > *"Thông tin được tổng hợp tự động từ bài đăng công khai của chủ trọ phục vụ sinh viên HaUI. Nếu bạn là chủ phòng và muốn gỡ bỏ số điện thoại/thông tin phòng, vui lòng gửi yêu cầu về [email/hotline] để được hỗ trợ gỡ bỏ trong vòng 24h."*

---

### BẢNG ĐÁNH GIÁ TÍNH HỢP PHÁP VÀ RỦI RO TỔNG QUAN

| Câu hỏi Pháp lý | Đánh giá Chuyên sâu | Căn cứ Pháp lý / Kỹ thuật |
| :--- | :---: | :--- |
| **Data phòng trọ cào từ Facebook có hợp pháp không?** | **HOÀN TOÀN HỢP PHÁP** | Dữ liệu bất động sản là thông tin thương mại công khai. SĐT chủ trọ tự công khai được dùng đúng mục đích kết nối thuê trọ (Khoản 3 Điều 17 Nghị định 13/2023/NĐ-CP). |
| **Cách cào có vi phạm luật hình sự Việt Nam không?** | **KHÔNG VI PHẠM** | Cào dữ liệu công khai, không vượt tường lửa/hack tài khoản (không phạm Điều 289 BLHS). Không xâm phạm bí mật nhà nước/kinh doanh (không phạm Điều 288 BLHS). |
| **Có bị Meta kiện hoặc phạt tù không?** | **KHÔNG** | Án lệ *Meta v. Bright Data (2024)* khẳng định quyền tiếp cận dữ liệu công khai. Rủi ro với Meta chỉ là bị chặn IP hoặc khóa tài khoản clone nếu cào với tần suất quá cao. |
| **Rủi ro lớn nhất cần kiểm soát là gì?** | **Bảo vệ dữ liệu cá nhân & Chống spam** | Phải đảm bảo: Không thu thập thông tin sinh viên tìm phòng, không bán data SĐT, không spam SMS/Zalo, có nút Takedown cho chủ trọ yêu cầu gỡ số. |

---

## 3. LỘ TRÌNH TRIỂN KHAI DEEP RESEARCH (4 GIAI ĐOẠN - THUẦN NGHIÊN CỨU & KHUNG PHÁP LÝ)

```
Giai đoạn 1: Pháp lý & Kiểm toán Rủi ro  ──►  Giai đoạn 2: Thiết kế Schema & AI Pipeline
                                                                      │
Giai đoạn 4: Đóng gói Dossier & Handbook ◄──  Giai đoạn 3: Tiêu chuẩn Hóa Quy trình
```

### Giai đoạn 1: Pháp lý & Kiểm toán Rủi ro Dữ liệu Phòng trọ (Tuần 1)
- **Công việc:**
  - Rà soát danh mục các Group Facebook công khai khu vực HaUI (Nhổn, Minh Khai, Tây Tựu, Kiều Mai).
  - Soạn thảo bản cam kết tuân thủ Nghị định 13/2023/NĐ-CP và Nghị định 91/2020/NĐ-CP.
  - Xây dựng bản thảo quy chế Takedown Policy (Quy trình tiếp nhận và gỡ bỏ thông tin trong 24h).
- **Sản phẩm đầu ra:** Bảng ma trận đối chiếu rủi ro pháp lý (Compliance Risk Matrix) và Mẫu văn bản Takedown Policy.

### Giai đoạn 2: Thiết kế Schema Dữ liệu & Quy chuẩn Khử định danh (Tuần 2)
- **Công việc:**
  - Thiết kế Schema JSON chuẩn hóa dữ liệu phòng trọ, quy định rõ trường nào được phép lưu, trường nào phải khử định danh (PII sanitization).
  - Xây dựng bộ quy tắc phân loại bài đăng: Thuật toán nhận diện bài CHO THUÊ vs bài TÌM PHÒNG.
  - Thiết kế tiêu chí nhận diện tin ảo / lừa đảo cọc trên các hội nhóm sinh viên.
- **Sản phẩm đầu ra:** Đặc tả Schema Dữ liệu Chuẩn (Data Specification) và Bộ tiêu chuẩn AI Data Parsing.

### Giai đoạn 3: Nghiên cứu Tiêu chuẩn Hóa Quy trình Thu thập An toàn (Tuần 3)
- **Công việc:**
  - Nghiên cứu các phương thức thu thập tuân thủ nguyên tắc Polite Crawling (tần suất thấp, xoay vòng IP, tôn trọng robots.txt và tải máy chủ).
  - Xây dựng quy trình xử lý dữ liệu tức thì: Bóc tách $\rightarrow$ Khử định danh $\rightarrow$ Mã hóa Hash trước khi ghi vào kho dữ liệu.
  - Thiết lập cơ chế tự hủy (Data Expiration): Xóa bỏ tin đăng quá 30 ngày để đảm bảo tính cập nhật và quyền riêng tư.
- **Sản phẩm đầu ra:** Quy trình Vận hành Tiêu chuẩn (SOP - Standard Operating Procedure) cho việc thu thập dữ liệu công khai.

### Giai đoạn 4: Đóng gói Hồ sơ Nghiên cứu & Sổ tay Đạo đức Dữ liệu (Tuần 4)
- **Công việc:**
  - Tổng kết toàn bộ kết quả nghiên cứu vào một bộ Hồ sơ Nghiên cứu Chuyên sâu (Research Dossier).
  - Biên soạn Sổ tay Đạo đức & Pháp lý Dữ liệu (Data Ethics & Legal Handbook) dành cho dự án thông tin sinh viên HaUI.
- **Sản phẩm đầu ra:** Bộ tài liệu hoàn chỉnh (Research Dossier + Compliance Guidelines) được nghiệm thu trước khi triển khai bất kỳ dòng code nào.

---

## 4. TÀI LIỆU VÀ CƠ SỞ THAM CHIẾU PHÁP LÝ (LEGAL REFERENCES)

1. **Văn bản Quy phạm Pháp luật Việt Nam:**
   - **Nghị định số 13/2023/NĐ-CP** ngày 17/04/2023 của Chính phủ về Bảo vệ dữ liệu cá nhân (Đặc biệt: Điều 2, 3, 9, 11, 16 và Khoản 3 Điều 17).
   - **Nghị định số 91/2020/NĐ-CP** ngày 14/08/2020 của Chính phủ về Chống tin nhắn rác, thư rác, cuộc gọi rác.
   - **Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017)**: Điều 288 (Tội đưa hoặc sử dụng trái phép thông tin mạng máy tính) và Điều 289 (Tội xâm nhập trái phép vào mạng máy tính).
   - **Luật An ninh mạng năm 2018**.
   - **Luật Giao dịch điện tử năm 2023**.
2. **Án lệ Quốc tế:**
   - *Meta Platforms, Inc. v. Bright Data Ltd.*, No. 23-cv-00077 (N.D. Cal. Jan. 23, 2024) - Quyền thu thập dữ liệu công khai ở trạng thái không đăng nhập.
   - *hiQ Labs, Inc. v. LinkedIn Corp.*, 31 F.4th 1180 (9th Cir. 2022) - Dữ liệu công khai trên Internet và Đạo luật CFAA.
