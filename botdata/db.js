/**
 * db.js - Module quản lý cơ sở dữ liệu phòng trọ HaUI
 * Dùng để tạo mã, đọc/ghi file JSON theo đúng schema
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_ROOT = path.join(__dirname, '..', 'alldata');
const ROOM_DIR = path.join(DB_ROOT, 'room');
const USER_DIR = path.join(DB_ROOT, 'user');
const ADMIN_DIR = path.join(DB_ROOT, 'admin');
const PHOTO_DIR = path.join(DB_ROOT, 'room', 'photos');

// Tạo các thư mục nếu chưa tồn tại
function ensureDirs() {
  [ROOM_DIR, path.join(USER_DIR, 'haui_student'), path.join(USER_DIR, 'chu'), ADMIN_DIR, PHOTO_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}
ensureDirs();

/**
 * Tạo mã định danh duy nhất theo format PREFIX-YYMMDD-XXXXXX
 * @param {string} prefix - 'RM', 'US', 'AD'
 */
function generateCode(prefix) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 ký tự hex
  return `${prefix}-${yy}${mm}${dd}-${rand}`;
}

/**
 * Lưu dữ liệu phòng mới vào alldata/room/<MA_PHONG>.json
 * @param {object} roomData - Dữ liệu phòng theo schema
 * @returns {string} - Đường dẫn file đã lưu
 */
function saveRoom(roomData) {
  const maPhong = roomData.ma_phong || generateCode('RM');
  roomData.ma_phong = maPhong;
  roomData.ngay_cao = roomData.ngay_cao || new Date().toISOString();
  roomData.ngay_cap_nhat = new Date().toISOString();
  roomData.trang_thai = roomData.trang_thai || 'con_trong';

  const filePath = path.join(ROOM_DIR, `${maPhong}.json`);
  fs.writeFileSync(filePath, JSON.stringify(roomData, null, 2), 'utf-8');
  console.log(`[DB] ✅ Đã lưu phòng: ${maPhong} -> ${filePath}`);
  return filePath;
}

/**
 * Lưu dữ liệu người dùng vào alldata/user/<loai>/<MA_USER>.json
 */
function saveUser(userData) {
  const maUser = userData.ma_user || generateCode('US');
  userData.ma_user = maUser;
  userData.ngay_tao = userData.ngay_tao || new Date().toISOString();
  userData.trang_thai = userData.trang_thai || 'active';

  const loai = userData.loai || 'haui_student';
  const subDir = path.join(USER_DIR, loai);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const filePath = path.join(subDir, `${maUser}.json`);
  fs.writeFileSync(filePath, JSON.stringify(userData, null, 2), 'utf-8');
  console.log(`[DB] ✅ Đã lưu user: ${maUser}`);
  return filePath;
}

/**
 * Lưu dữ liệu admin vào alldata/admin/<MA_ADMIN>.json
 */
function saveAdmin(adminData) {
  const maAdmin = adminData.ma_admin || generateCode('AD');
  adminData.ma_admin = maAdmin;
  adminData.ngay_tao = adminData.ngay_tao || new Date().toISOString();

  const filePath = path.join(ADMIN_DIR, `${maAdmin}.json`);
  fs.writeFileSync(filePath, JSON.stringify(adminData, null, 2), 'utf-8');
  console.log(`[DB] ✅ Đã lưu admin: ${maAdmin}`);
  return filePath;
}

/**
 * Đọc toàn bộ phòng trong DB
 */
function getAllRooms() {
  return fs.readdirSync(ROOM_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(ROOM_DIR, f), 'utf-8')));
}

/**
 * Lấy phòng theo mã
 */
function getRoomById(maPhong) {
  const filePath = path.join(ROOM_DIR, `${maPhong}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Cập nhật trạng thái phòng
 */
function updateRoomStatus(maPhong, trangThai) {
  const room = getRoomById(maPhong);
  if (!room) throw new Error(`Không tìm thấy phòng: ${maPhong}`);
  room.trang_thai = trangThai;
  room.ngay_cap_nhat = new Date().toISOString();
  return saveRoom(room);
}

/**
 * Thống kê tổng quan DB
 */
function summary() {
  const rooms = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));
  const studs = fs.existsSync(path.join(USER_DIR, 'haui_student'))
    ? fs.readdirSync(path.join(USER_DIR, 'haui_student')).filter(f => f.endsWith('.json'))
    : [];
  const chus = fs.existsSync(path.join(USER_DIR, 'chu'))
    ? fs.readdirSync(path.join(USER_DIR, 'chu')).filter(f => f.endsWith('.json'))
    : [];
  const admins = fs.existsSync(ADMIN_DIR)
    ? fs.readdirSync(ADMIN_DIR).filter(f => f.endsWith('.json'))
    : [];
  return {
    tong_phong: rooms.length,
    tong_sinh_vien: studs.length,
    tong_chu_tro: chus.length,
    tong_admin: admins.length
  };
}

module.exports = {
  generateCode,
  saveRoom,
  saveUser,
  saveAdmin,
  getAllRooms,
  getRoomById,
  updateRoomStatus,
  summary,
  ROOM_DIR,
  USER_DIR,
  ADMIN_DIR,
  PHOTO_DIR
};
