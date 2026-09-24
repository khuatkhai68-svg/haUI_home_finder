/**
 * DATABASE SCHEMA - Hệ thống quản lý dữ liệu phòng trọ HaUI
 * 
 * alldata/
 *   ├── room/            # Dữ liệu phòng trọ
 *   │   └── RM-YYMMDD-XXXXXX.json    # Mỗi phòng 1 file, tên = mã phòng
 *   │
 *   ├── user/            # Tài khoản người dùng (sinh viên / chủ trọ)
 *   │   ├── haui_student/
 *   │   │   └── US-YYMMDD-XXXXXX.json
 *   │   └── chu/
 *   │       └── US-YYMMDD-XXXXXX.json
 *   │
 *   └── admin/           # Tài khoản quản trị viên
 *       └── AD-YYMMDD-XXXXXX.json
 *
 * ─────────────────────────────────────────────────────────────────
 * SCHEMA: room (file RM-YYMMDD-XXXXXX.json)
 * {
 *   "ma_phong"        : "RM-260921-A1B2C3",          // Mã phòng unique
 *   "nguon"           : "facebook" | "phongtro123" | "manual",
 *   "url_nguon"       : "https://...",                // Link bài đăng gốc
 *   "ngay_cao"        : "2026-09-21T19:02:00+07:00", // Thời điểm cào
 *   "ngay_cap_nhat"   : "2026-09-21T19:02:00+07:00",
 *   "trang_thai"      : "con_trong" | "da_thue" | "nghi_ngo_lua_dao",
 *   "thong_tin": {
 *     "tieu_de"       : "Phòng trọ khép kín full đồ Cầu Giấy",
 *     "gia"           : 3000000,                      // VND/tháng
 *     "dien_tich"     : 20,                           // m²
 *     "dia_chi"       : "Số 10 ngõ 68/39 Cầu Giấy, Hà Nội",
 *     "quan_huyen"    : "Cầu Giấy",
 *     "tinh_thanh"    : "Hà Nội",
 *     "mo_ta"         : "Nội dung bài đăng đầy đủ...",
 *     "tien_ich"      : ["dieu_hoa", "nong_lanh", "may_giat", "tu_quan_ao", "giuong", "khoa_van_tay"],
 *     "khong_chung_chu": true,
 *     "gio_giac_tu_do": true
 *   },
 *   "lien_he": {
 *     "ten_chu"       : "Vũ Hoàng Đức",
 *     "so_dien_thoai" : "0397739565",
 *     "facebook"      : "https://facebook.com/..."
 *   },
 *   "anh": [           // Ảnh đã tải về local
 *     {
 *       "url_goc"     : "https://scontent.fbcdn.net/...",
 *       "file_local"  : "RM-260921-A1B2C3_photo_1.jpg"
 *     }
 *   ],
 *   "phan_tich": {     // Kết quả AI Vision Extractor (sau khi chạy pipeline)
 *     "scam_score"    : 0.1,                          // 0.0 - 1.0
 *     "da_kiem_tra"   : false
 *   }
 * }
 *
 * ─────────────────────────────────────────────────────────────────
 * SCHEMA: user (file US-YYMMDD-XXXXXX.json)
 * {
 *   "ma_user"         : "US-260921-D4E5F6",
 *   "loai"            : "haui_student" | "chu",
 *   "ten_hien_thi"    : "Nguyễn Văn A",
 *   "email"           : "a@gmail.com",
 *   "so_dien_thoai"   : "0901234567",
 *   "ngay_tao"        : "2026-09-21T...",
 *   "trang_thai"      : "active" | "banned"
 * }
 *
 * ─────────────────────────────────────────────────────────────────
 * SCHEMA: admin (file AD-YYMMDD-XXXXXX.json)
 * {
 *   "ma_admin"        : "AD-260921-G7H8I9",
 *   "ten_hien_thi"    : "Admin HaUI",
 *   "email"           : "admin@haui.edu.vn",
 *   "quyen"           : ["quan_ly_phong", "quan_ly_user", "duyet_bai"],
 *   "ngay_tao"        : "2026-09-21T..."
 * }
 */
