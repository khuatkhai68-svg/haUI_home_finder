/**
 * init_db.js - Khởi tạo dữ liệu mẫu: 1 admin + 2 user mẫu
 * Chạy 1 lần để seed dữ liệu cơ bản
 */

const db = require('./db');

// Tạo admin mặc định
db.saveAdmin({
  ten_hien_thi: 'Admin HaUI WebReal',
  email: 'admin@haui.edu.vn',
  quyen: ['quan_ly_phong', 'quan_ly_user', 'duyet_bai', 'xoa_bai', 'phan_tich_ai'],
});

// Tạo tài khoản sinh viên mẫu
db.saveUser({
  loai: 'haui_student',
  ten_hien_thi: 'Nguyễn Văn An',
  email: 'an.sv@haui.edu.vn',
  so_dien_thoai: '0901234567',
  truong: 'ĐH Công nghiệp Hà Nội (HaUI)',
  khoa: 'Công nghệ Thông tin',
  nien_khoa: '2024-2028',
});

// Tạo tài khoản chủ trọ mẫu
db.saveUser({
  loai: 'chu',
  ten_hien_thi: 'Trần Thị Lan',
  email: 'lan.chu@gmail.com',
  so_dien_thoai: '0912345678',
  dia_chi: 'Bắc Từ Liêm, Hà Nội',
});

console.log('\n[INIT DB] Thống kê sau khi khởi tạo:');
console.log(db.summary());
