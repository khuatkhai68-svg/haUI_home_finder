# 🏠 HaUI HomeFinder — Nền Tảng Tìm Trọ Thông Minh & An Toàn Cho Sinh Viên HaUI

> **Dành riêng cho sinh viên Đại học Công nghiệp Hà Nội**  
> 📍 Cơ sở 1 (Nhổn - Bắc Từ Liêm) • Cơ sở 2 (Tây Tựu) • Cơ sở 3 (Phủ Lý - Hà Nam)

---

## ✨ Điểm Nổi Bật & Tính Năng Cốt Lõi

1. **🤖 Trợ Lý AI 5PTL (AI Assistant & Domain Engine):**
   - Không phải bot kịch bản thường mà là **Trí Tuệ Nhân Tạo thực thụ** am hiểu sâu sắc đời sống sinh viên HaUI.
   - **Tư vấn an toàn & Bóc tách hợp đồng:** Cung cấp 3 nguyên tắc vàng chống lừa tiền cọc, nhận diện phòng ảo.
   - **Kiểm định PCCC:** Checklist an toàn lối thoát hiểm, khu vực để xe sạc điện và chuông báo khói.
   - **Gợi ý phòng thực tế (RAG):** Trích xuất thẻ phòng trọ trực quan (ảnh thật, giá tiền, khoảng cách) ngay trong khung chat.

2. **🔍 AI Smart Search (Tìm kiếm bằng ngôn ngữ tự nhiên):**
   - Sinh viên có thể nhập câu tự nhiên ở Hero Section: *"phòng cs1 dưới 2.5 triệu có gác xép"* hoặc *"tìm phòng gần ĐH Công nghiệp CS2 dưới 2tr"*.
   - AI tự động bóc tách Cơ sở, Ngân sách và Tiện ích rồi lọc kết quả tức thì.

3. **🗺️ Bản đồ 3 Cơ sở Trực quan (`/map.html`):**
   - Tọa độ chuẩn của HaUI CS1, CS2, CS3 kèm bán kính đi lại.
   - Hiển thị trực quan từng cụm trọ, trạm xe buýt và tuyến đường sắt đô thị Metro Nhổn - Ga Hà Nội.

4. **🛡️ Phân hệ Quản Lý Phòng & Admin (`/admin.html`):**
   - Quản lý danh mục 257+ phòng trọ thực tế.
   - Lọc nhanh theo cơ sở, trạng thái phòng (Còn trống / Đã thuê / Nghi ngờ).
   - Thêm phòng mới thủ công từ chủ trọ uy tín, chỉnh sửa thông tin hoặc xóa bài đăng vi phạm.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Local

### 1. Yêu cầu hệ thống
- **Node.js** phiên bản `>= 18.0.0` (Khuyên dùng v20 hoặc v24)
- **Git**

### 2. Cài đặt và khởi chạy
```bash
# Clone repository
git clone https://github.com/khuatkhai68-svg/haUI_home_finder.git
cd haUI_home_finder

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy máy chủ
npm start
# Hoặc chạy chế độ phát triển (auto-reload)
npm run dev
```

Truy cập trên trình duyệt:
- 🌐 Trang chủ: [http://localhost:3333](http://localhost:3333)
- 🗺️ Bản đồ 3 cơ sở: [http://localhost:3333/map.html](http://localhost:3333/map.html)
- ⚙️ Bảng quản trị: [http://localhost:3333/admin.html](http://localhost:3333/admin.html)

---

## ☁️ Hướng Dẫn Triển Khai Lên Web (Production Deployment)

Dự án được tối ưu để triển khai 1-click lên các nền tảng Cloud hiện đại:

### Triển khai trên Render.com (Khuyên dùng)
1. Đăng nhập [Render.com](https://render.com) và chọn **New Web Service**.
2. Kết nối với GitHub repository: `khuatkhai68-svg/haUI_home_finder`.
3. Cấu hình triển khai:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/server.js`
4. Biến môi trường (Environment Variables):
   - `PORT`: `3333` (hoặc để Render tự cấp phát)
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Tùy chọn) Khóa API Google Gemini nếu muốn kích hoạt model đám mây*
5. Nhấn **Deploy Web Service** và nhận link web công khai `https://haui-home-finder.onrender.com`.

---

## 📁 Cấu Trúc Dự Án

```
├── alldata/
│   └── room/                 # Kho dữ liệu 257 phòng trọ (JSON)
├── server/
│   ├── server.js             # Máy chủ Express, RESTful APIs & Middleware
│   ├── ai_service.js         # 5PTL AI Assistant & RAG Engine
│   └── auto_crawl_bot.js     # Lịch định kỳ kiểm tra sức khỏe link phòng
├── webdata/
│   ├── index.html            # Trang chủ HaUI HomeFinder + Hero Search + 5PTL Chat
│   ├── map.html              # Bản đồ tìm trọ 3 Cơ sở HaUI
│   ├── admin.html            # Trang Quản trị & Quản lý phòng
│   ├── room-detail.html      # Trang chi tiết phòng trọ
│   ├── styles.css            # Hệ thống CSS Design System
│   └── logo.png              # Logo chính thức
├── KE_HOACH_QUAN_LY_PHONG.md # Kế hoạch nghiên cứu quản lý phòng
└── package.json              # Khai báo cấu hình dự án
```

---

## 📜 Bản Quyền & Giấy Phép
Dự án được phát triển phục vụ cộng đồng sinh viên Đại học Công nghiệp Hà Nội (HaUI).  
Tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân.
