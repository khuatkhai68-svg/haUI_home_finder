# SỔ TAY QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (STANDARD OPERATING PROCEDURE - SOP)
## Đề tài: Quy chuẩn Vận hành Thu thập, Làm sạch và Phân tích Dữ liệu Phòng trọ Sinh viên Tuân thủ Tuyệt đối Pháp luật

---

## 1. MỤC ĐÍCH VÀ PHẠM VI ÁP DỤNG

### 1.1. Mục đích
Sổ tay này quy định chi tiết từng bước vận hành (Standard Operating Procedure - SOP) cho toàn bộ quy trình: Từ lựa chọn nguồn dữ liệu, bóc tách, khử định danh cá nhân (Sanitization), lưu trữ và xử lý yêu cầu gỡ bỏ dữ liệu của người dân.

### 1.2. Phạm vi áp dụng
Áp dụng cho mọi hoạt động nghiên cứu, thu thập dữ liệu công khai trên mạng xã hội Facebook về phòng trọ sinh viên khu vực Đại học Công nghiệp Hà Nội (HaUI) và các địa bàn lân cận.

---

## 2. QUY TRÌNH VẬN HÀNH 5 BƯỚC (5-STAGE COMPLIANCE WORKFLOW)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   BƯỚC 1     │     │   BƯỚC 2     │     │   BƯỚC 3     │     │   BƯỚC 4     │     │   BƯỚC 5     │
│  LỰA CHỌN    │────►│ BỘ LỌC ĐẦU   │────►│  KHỬ ĐỊNH    │────►│ AI BÓC TÁCH  │────►│ VẬN HÀNH QUY │
│  NGUỒN MỞ    │     │ VÀO CHỦ TRỌ  │     │   DANH PII   │     │  VÀ LƯU TRỮ  │     │ CHẾ TAKEDOWN │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

### BƯỚC 1: LỰA CHỌN NGUỒN DỮ LIỆU CÔNG KHAI (PUBLIC DATA ONLY)

#### Tiêu chí kiểm tra nguồn:
- [x] **CHỈ DUYỆT CÁC NGUỒN CÔNG KHAI:**
  - Group Facebook hiển thị nhãn `Nhóm Công Khai (Public Group)`.
  - Fanpage công khai của các tổ chức, đơn vị môi giới hoặc trang cộng đồng sinh viên mở.
  - Các trang tin niêm yết bất động sản mở trên Web.
- [ ] **DANH MỤC CẤM (RED FLAGS - TUYỆT ĐỐI KHÔNG TRUY CẬP):**
  - ❌ Nhóm Riêng Tư (`Private Group`), nhóm Bí Mật (`Secret Group`).
  - ❌ Tin nhắn riêng tư Messenger.
  - ❌ Không dùng thủ thuật hack tài khoản, không mua cookie tài khoản của người khác để vượt rào bảo mật.

---

### BƯỚC 2: BỘ LỌC ĐẦU VÀO PHÂN LOẠI ĐỐI TƯỢNG (INGESTION FILTER)

Mục đích: Bảo vệ tuyệt đối quyền riêng tư của sinh viên theo Nghị định 13/2023/NĐ-CP.

#### Quy tắc lọc tự động tại bộ nhớ tạm (In-Memory Filtering):
1. **Kiểm tra từ khóa sinh viên tìm phòng:**
   - Nếu văn bản chứa các cụm từ: *"cần tìm phòng"*, *"tìm trọ"*, *"tìm bạn ở ghép"*, *"share phòng"*, *"em là sinh viên k18/k19/k20"*, *"tài chính 1tr5 - 2tr cần tìm"*.
   - **HÀNH ĐỘNG BẮT BUỘC:** **HỦY BỎ NGAY LẬP TỨC.** Không ghi lại bất kỳ thông tin nào vào cơ sở dữ liệu.
2. **Xác nhận bài đăng chào phòng của chủ trọ/môi giới:**
   - Văn bản chứa các thuộc tính: *"cho thuê phòng"*, *"chính chủ cho thuê"*, *"còn 1 phòng duy nhất"*, *"giá 2.xxx"*, *"đầy đủ đồ"*.
   - **HÀNH ĐỘNG:** Đưa vào bước xử lý tiếp theo.

---

### BƯỚC 3: KHỬ ĐỊNH DANH CÁ NHÂN TỨC THÌ (INSTANT PII STRIPPING)

Trước khi dữ liệu được ghi vào cơ sở dữ liệu vĩnh viễn (Database Storage), toàn bộ thông tin định danh cá nhân liên quan đến tài khoản Facebook phải bị tiêu hủy:

| Thuộc tính ban đầu | Hành động kỹ thuật bắt buộc |
| :--- | :--- |
| **Facebook User ID (UID)** | ❌ **TIÊU HỦY HOÀN TOÀN** (Không lưu vào DB). |
| **URL Profile cá nhân** | ❌ **TIÊU HỦY HOÀN TOÀN** (Không lưu vào DB). |
| **Ảnh đại diện (Avatar)** | ❌ **TIÊU HỦY HOÀN TOÀN** (Không tải về, không lưu). |
| **Tên tài khoản Facebook** | ❌ **TIÊU HỦY HOÀN TOÀN** (Tránh lưu tên thật cá nhân). |
| **Nội dung bài viết thô** | Băm thành mã **SHA-256 Hash** để nhận diện bài trùng lặp. |
| **Số điện thoại trong bài** | Gán nhãn `sdt_chủ_trọ_công_khai` (Chỉ dùng cho tra cứu). |

---

### BƯỚC 4: ỨNG DỤNG AI BÓC TÁCH DỮ LIỆU & LƯU TRỮ AN TOÀN

1. **Chuẩn hóa thông tin qua AI:**
   - Bóc tách: Giá thuê (VNĐ), diện tích ($m^2$), địa chỉ chi tiết, danh mục tiện ích.
   - Gắn nhãn địa bàn HaUI: Nhổn, Nguyên Xá, Tây Tựu, Kiều Mai, Minh Khai, Cầu Diễn.
   - Chạy thuật toán chấm điểm rủi ro tin ảo lừa cọc.
2. **Cơ chế tự động hết hạn dữ liệu (Data Expiration - TTL):**
   - Dữ liệu bài đăng phòng trọ có tính thời điểm rất cao (thường sau 15 - 30 ngày phòng đã được thuê xong).
   - **Quy định:** Mọi bài đăng trong hệ thống có thời gian tồn tại tối đa là **30 ngày**. Sau 30 ngày, hệ thống tự động ẩn hoặc xóa để đảm bảo không làm phiền chủ trọ khi phòng đã hết.

---

### BƯỚC 5: QUY TRÌNH TIẾP NHẬN VÀ GỠ THÔNG TIN TRONG 24H (TAKEDOWN SOP)

Căn cứ Điều 9 và Điều 16 Nghị định 13/2023/NĐ-CP về quyền rút lại sự đồng ý và quyền yêu cầu xóa dữ liệu của chủ thể:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 QUY TRÌNH XỬ LÝ GỠ BỎ TIN              │
                  └───────────────────────────┬────────────────────────────┘
                                              │
         ┌────────────────────────────────────┴────────────────────────────────────┐
         ▼                                                                         ▼
┌────────────────────────────────┐                        ┌────────────────────────────────┐
│   KÊNH 1: BẤM NÚT TRÊN WEB     │                        │    KÊNH 2: GỌI ĐIỆN / SMS      │
│ Tại mỗi bài hiển thị có nút:   │                        │ Chủ trọ nhắn tin tới hotline:  │
│    [YÊU CẦU GỠ THÔNG TIN NÀY]  │                        │ "Yêu cầu gỡ số 0987xxxxxx"     │
└────────────────┬───────────────┘                        └────────────────┬───────────────┘
                 │                                                         │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                             ┌──────────────────────────────────┐
                             │    BỘ PHẬN XỬ LÝ (TRONG 24H)     │
                             │ 1. Khớp số điện thoại            │
                             │ 2. Chuyển trạng thái: DELETED    │
                             │ 3. Đưa SĐT vào Blacklist vĩnh    │
                             │    viễn (Không bao giờ cào lại)  │
                             └──────────────────────────────────┘
```

#### Cam kết vận hành:
1. Mọi yêu cầu gỡ bỏ từ chính chủ số điện thoại phải được thực hiện **trong vòng tối đa 24 giờ**.
2. **Cơ chế Blacklist vĩnh viễn:** Khi một số điện thoại đã yêu cầu gỡ, số điện thoại đó sẽ được lưu vào danh sách loại trừ (Exclusion List). Các chu kỳ cào dữ liệu tiếp theo sẽ tự động bỏ qua nếu phát hiện số điện thoại này trong bất kỳ bài viết nào trên mạng.

---

## 3. CHECKLIST KIỂM TOÁN HÀNG NGÀY (DAILY AUDIT CHECKLIST)

Người quản trị hệ thống dữ liệu phải kiểm tra và tích chọn các tiêu chí sau:

- [ ] **1. Tần suất cào:** Độ trễ giữa các request tối thiểu là 5.0 giây?
- [ ] **2. Tình trạng máy chủ:** Không nhận bất kỳ cảnh báo nghẽn mạng hoặc mã lỗi 429 kéo dài?
- [ ] **3. Kiểm tra rò rỉ PII:** Database hoàn toàn không chứa trường `facebook_uid` hoặc `profile_link`?
- [ ] **4. Kiểm tra bài đăng sinh viên:** Tỷ lệ bài tìm trọ của sinh viên lọt vào database bằng 0%?
- [ ] **5. Tồn đọng Takedown:** Không có yêu cầu gỡ tin nào của người dân bị trễ quá 24 giờ?
- [ ] **6. Mục đích sử dụng:** Dữ liệu hoàn toàn không bị trích xuất phục vụ mục đích bán danh bạ hoặc spam tin nhắn?
