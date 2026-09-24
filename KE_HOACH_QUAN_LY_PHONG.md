# KẾ HOẠCH NGHIÊN CỨU & PHÁT TRIỂN HỆ THỐNG QUẢN LÝ PHÒNG TRỌ
**Dự án:** HaUI HomeFinder  
**Đối tượng phục vụ:** Sinh viên Đại học Công nghiệp Hà Nội (HaUI CS1 - Nhổn, CS2 - Tây Tựu, CS3 - Hà Nam) & Ban quản trị / Chủ trọ  

---

## I. MỤC TIÊU NGHIÊN CỨU

1. **Chuẩn hóa dữ liệu phòng trọ:** Chuyển đổi dữ liệu từ dạng cào tự động (unstructured/crawled) sang mô hình dữ liệu có cấu trúc, kiểm soát được vòng đời (lifecycle) của từng phòng.
2. **Quyền kiểm soát của Ban quản trị (Admin):**
   - Xem toàn bộ danh sách phòng theo từng cơ sở (CS1, CS2, CS3).
   - Thêm mới, chỉnh sửa thông tin phòng (giá, diện tích, nội thất, số điện thoại chủ trọ).
   - Đánh dấu trạng thái phòng: *Còn trống*, *Đã thuê*, *Nghi ngờ/Spam*.
   - Xóa phòng ảo, phòng vi phạm hoặc hết hạn.
3. **Mở rộng cho Chủ trọ (Landlord Portal - Giai đoạn tiếp theo):**
   - Cho phép chủ trọ tự đăng ký tài khoản, xác minh số điện thoại/CCCD và tự quản lý các dãy trọ của mình.
   - Báo trạng thái hết phòng/còn phòng theo thời gian thực để sinh viên không mất công gọi điện khi phòng đã có người thuê.

---

## II. MÔ HÌNH DỮ LIỆU PHÒNG TRỌ (DATA SCHEMA CHUẨN)

Mỗi phòng trọ trong hệ thống `HaUI HomeFinder` được định nghĩa theo cấu trúc:

```json
{
  "id": "ROOM_1711234567890",
  "title": "Phòng trọ khép kín full đồ gần ĐH Công nghiệp CS1",
  "campus": "CS1", 
  "address": "Ngõ 132 Cầu Diễn, Bắc Từ Liêm, Hà Nội",
  "distance_km": 0.35,
  "price": 2800000,
  "price_display": "2.8 triệu/tháng",
  "area": 25,
  "phone": "0987654321",
  "owner_name": "Cô Lan",
  "status": "available", 
  "images": [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
  ],
  "amenities": ["Điều hòa", "Nóng lạnh", "Khép kín", "Máy giặt chung", "Khóa vân tay"],
  "deposit": "1 tháng",
  "electricity_price": "3.5k/số",
  "water_price": "80k/người",
  "created_at": "2026-09-25T00:00:00Z",
  "updated_at": "2026-09-25T00:00:00Z",
  "verified": true
}
```

---

## III. CÁC PHÂN HỆ CHỨC NĂNG CẦN TRIỂN KHAI

### 1. Phân hệ Admin Quản Lý (Đã hoàn thiện giai đoạn 1)
- **Danh sách phòng thông minh:** Phân trang, tìm kiếm theo từ khóa/mã phòng/SĐT.
- **Bộ lọc đa chiều:**
  - Lọc theo cơ sở: CS1 (Bắc Từ Liêm), CS2 (Tây Tựu), CS3 (Phủ Lý, Hà Nam).
  - Lọc theo trạng thái: Còn trống, Đã cho thuê, Đang chờ duyệt, Nghi ngờ spam.
- **Thao tác nhanh (Inline Actions):**
  - Chuyển đổi trạng thái trực tiếp trong bảng.
  - Xóa phòng tức thì có cảnh báo xác nhận.
  - Xem chi tiết trang công khai của phòng.
- **Thêm phòng thủ công (Manual Insertion):** Modal form cho phép admin thêm các phòng trọ do chủ nhà tin cậy gửi trực tiếp mà không cần qua crawler.

### 2. Phân hệ Chủ trọ (Giai đoạn 2 - Đề xuất)
- **Đăng ký / Đăng nhập:** Đăng nhập qua OTP SMS hoặc Zalo OA để xác thực chủ nhà thật.
- **Bảng điều khiển chủ nhà (Host Dashboard):**
  - Quản lý danh sách các phòng/căn hộ đang sở hữu.
  - Bật/tắt trạng thái *"Hôm nay còn phòng trống"* chỉ bằng 1 nút gạt (toggle switch).
  - Nhận thông báo khi có sinh viên HaUI quan tâm muốn hẹn giờ xem phòng.

### 3. Phân hệ Kiểm định & Chống Spam (Tích hợp AI)
- **Phát hiện trùng lặp (Deduplication):** Sử dụng thuật toán so khớp địa chỉ và số điện thoại để gộp các bài đăng trùng lặp của cùng một phòng.
- **Cảnh báo môi giới lừa đảo:** Hệ thống ghi nhận các SĐT bị sinh viên báo cáo thu phí cọc trước khi xem phòng và tự động khóa bài đăng.

---

## IV. LỘ TRÌNH TRIỂN KHAI (ROADMAP)

| Giai đoạn | Nội dung công việc | Thời gian dự kiến | Trạng thái |
| :--- | :--- | :--- | :--- |
| **P1** | Đổi tên thương hiệu `HaUI HomeFinder`, dọn sạch crawler menu, fix dãn ảnh card phòng | 1 ngày | **Hoàn thành** |
| **P2** | Xây dựng CRUD API (`POST`, `PUT`, `DELETE /api/rooms`) & Tab Quản lý phòng trên Admin | 1 - 2 ngày | **Đã tạo mẫu & chạy tốt** |
| **P3** | Bổ sung Modal Sửa phòng trọ (Edit Room Form) & Tải ảnh trực tiếp lên server (Multer upload) | 3 ngày | Tiếp theo |
| **P4** | Thêm bảng thống kê tỷ lệ lấp đầy phòng theo từng cơ sở (CS1, CS2, CS3) | 2 ngày | Tiếp theo |
| **P5** | Xây dựng cổng Đăng tin dành riêng cho Chủ trọ có xác minh OTP | 1 tuần | Nghiên cứu sau |

---

## V. KẾT LUẬN & KIẾN NGHỊ
Hiện tại, phiên bản Quản lý phòng đã được tích hợp trực tiếp vào trang Quản trị:
- URL truy cập: `http://localhost:3333/admin.html` -> Chọn mục **"Quản lý phòng"** trên menu bên trái.
- Dữ liệu được đồng bộ trực tiếp với thư mục `alldata/room/` và cập nhật tức thì trên trang chủ `http://localhost:3333/`.
