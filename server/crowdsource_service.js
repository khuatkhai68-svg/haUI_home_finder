/**
 * crowdsource_service.js — Tầng Người dùng Tham gia Làm sạch Dữ liệu (Human-in-the-Loop)
 * Tiếp nhận báo cáo từ Sinh viên & Chủ trọ, áp dụng ma trận trọng số RBAC để tự động xử lý.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DB_ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');
const REPORTS_FILE = path.resolve(__dirname, '..', 'alldata', 'crowdsource_reports.json');

// Ngưỡng tự động kích hoạt hành động
const THRESHOLD_RENTED_WEIGHT = 1.4;    // Đạt 1.4 điểm (~ 2 SV HaUI) -> tự động chuyển "Đã cho thuê"
const THRESHOLD_SCAM_WEIGHT   = 1.5;    // Đạt 1.5 điểm -> tự động cách ly "Tạm ẩn để kiểm duyệt"

function getAllReports() {
  if (!fs.existsSync(REPORTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
}

/**
 * Tính trọng số người dùng dựa trên vai trò & email xác thực
 */
function calculateUserWeight(user) {
  if (!user) return 0.2; // Khách vãng lai
  if (user.role === 'admin' || user.role === 'moderator') return 3.0;
  if (user.email && (user.email.endsWith('@haui.edu.vn') || user.email.includes('haui'))) {
    return 1.0; // Sinh viên HaUI chính chủ
  }
  if (user.role === 'student') return 0.8;
  if (user.role === 'landlord') return 1.2;
  return 0.5; // Tài khoản đã đăng ký nhưng không rõ trường
}

/**
 * Gửi báo cáo phòng từ cộng đồng sinh viên
 */
function submitReport({ roomId, reportType, note = '', user = null }) {
  if (!roomId || !reportType) {
    return { success: false, message: 'Thiếu thông tin phòng hoặc loại báo cáo' };
  }

  const roomPath = path.join(DB_ROOM_DIR, `${roomId}.json`);
  if (!fs.existsSync(roomPath)) {
    return { success: false, message: 'Phòng không tồn tại trong hệ thống' };
  }

  let room = null;
  try {
    room = JSON.parse(fs.readFileSync(roomPath, 'utf-8'));
  } catch {
    return { success: false, message: 'Lỗi đọc file phòng' };
  }

  const weight = calculateUserWeight(user);
  const reports = getAllReports();

  const newReport = {
    id: `RPT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    roomId,
    roomTitle: room.thong_tin?.tieu_de || roomId,
    reportType, // 'het_phong' | 'lua_dao_gia_ao' | 'sai_dia_chi' | 'phong_ma'
    note,
    weight,
    user: {
      name: user?.name || 'Ẩn danh',
      email: user?.email || '',
      role: user?.role || 'anonymous'
    },
    timestamp: new Date().toISOString(),
    status: 'pending' // 'pending' | 'auto_actioned' | 'admin_resolved'
  };

  reports.push(newReport);

  // Tính tổng trọng số các báo cáo chưa xử lý của phòng này
  const roomReports = reports.filter(r => r.roomId === roomId && r.status !== 'dismissed');
  const rentedWeight = roomReports
    .filter(r => r.reportType === 'het_phong')
    .reduce((sum, r) => sum + (r.weight || 0.2), 0);

  const scamWeight = roomReports
    .filter(r => r.reportType === 'lua_dao_gia_ao' || r.reportType === 'phong_ma')
    .reduce((sum, r) => sum + (r.weight || 0.2), 0);

  let autoAction = null;

  // Tự động chuyển ĐÃ CHO THUÊ nếu cộng đồng xác nhận đủ uy tín
  if (reportType === 'het_phong' && rentedWeight >= THRESHOLD_RENTED_WEIGHT) {
    room.trang_thai = 'da_cho_thue';
    room.ngay_cap_nhat = new Date().toISOString();
    room.ghi_chu_he_thong = `Tự động chuyển 'Đã cho thuê' do cộng đồng sinh viên báo (Điểm tích lũy: ${rentedWeight.toFixed(1)})`;
    fs.writeFileSync(roomPath, JSON.stringify(room, null, 2), 'utf-8');

    newReport.status = 'auto_actioned';
    autoAction = 'DA_CHO_THUE';
  }
  // Tự động CÁCH LY / TẠM ẨN nếu bị báo lừa đảo / giá ảo vượt ngưỡng
  else if ((reportType === 'lua_dao_gia_ao' || reportType === 'phong_ma') && scamWeight >= THRESHOLD_SCAM_WEIGHT) {
    room.trang_thai = 'tam_an';
    room.ngay_cap_nhat = new Date().toISOString();
    room.ghi_chu_he_thong = `Tự động cách ly do bị cảnh báo lừa đảo/giá ảo (Điểm cảnh báo: ${scamWeight.toFixed(1)})`;
    fs.writeFileSync(roomPath, JSON.stringify(room, null, 2), 'utf-8');

    newReport.status = 'auto_actioned';
    autoAction = 'CACH_LY_TAM_AN';
  }

  saveReports(reports);

  return {
    success: true,
    reportId: newReport.id,
    currentWeights: {
      rentedWeight: Math.round(rentedWeight * 10) / 10,
      scamWeight: Math.round(scamWeight * 10) / 10
    },
    autoAction,
    message: autoAction === 'DA_CHO_THUE'
      ? 'Cảm ơn bạn! Hệ thống đã ghi nhận đủ xác thực và tự động cập nhật phòng sang trạng thái [Đã cho thuê].'
      : (autoAction === 'CACH_LY_TAM_AN'
        ? 'Cảnh báo nghiêm trọng: Phòng đã tạm thời bị cách ly khỏi kết quả tìm kiếm để bảo vệ sinh viên.'
        : 'Báo cáo của bạn đã được ghi nhận vào hệ thống làm sạch dữ liệu cộng đồng.')
  };
}

/**
 * Lấy danh sách hàng đợi kiểm duyệt HITL cho Admin
 */
function getReviewQueue() {
  const reports = getAllReports();
  const queueMap = {};

  for (const r of reports) {
    if (r.status === 'admin_resolved' || r.status === 'dismissed') continue;

    if (!queueMap[r.roomId]) {
      queueMap[r.roomId] = {
        roomId: r.roomId,
        roomTitle: r.roomTitle,
        reports: [],
        totalWeight: 0,
        rentedWeight: 0,
        scamWeight: 0,
        autoActioned: false
      };
    }

    queueMap[r.roomId].reports.push(r);
    queueMap[r.roomId].totalWeight += (r.weight || 0.2);
    if (r.reportType === 'het_phong') queueMap[r.roomId].rentedWeight += (r.weight || 0.2);
    if (r.reportType === 'lua_dao_gia_ao' || r.reportType === 'phong_ma') queueMap[r.roomId].scamWeight += (r.weight || 0.2);
    if (r.status === 'auto_actioned') queueMap[r.roomId].autoActioned = true;
  }

  return Object.values(queueMap).sort((a, b) => b.totalWeight - a.totalWeight);
}

/**
 * Admin giải quyết báo cáo 1 chạm
 */
function resolveReport(roomId, action) {
  const roomPath = path.join(DB_ROOM_DIR, `${roomId}.json`);
  let room = null;
  if (fs.existsSync(roomPath)) {
    try { room = JSON.parse(fs.readFileSync(roomPath, 'utf-8')); } catch {}
  }

  if (room) {
    if (action === 'confirm_rented') {
      room.trang_thai = 'da_cho_thue';
    } else if (action === 'restore_active') {
      room.trang_thai = 'con_trong';
    } else if (action === 'delete_permanently') {
      fs.unlinkSync(roomPath);
    }
    if (action !== 'delete_permanently') {
      room.ngay_cap_nhat = new Date().toISOString();
      fs.writeFileSync(roomPath, JSON.stringify(room, null, 2), 'utf-8');
    }
  }

  // Cập nhật trạng thái trong log reports
  const reports = getAllReports();
  for (const r of reports) {
    if (r.roomId === roomId) {
      r.status = action === 'dismiss' ? 'dismissed' : 'admin_resolved';
      r.resolvedAt = new Date().toISOString();
      r.action = action;
    }
  }
  saveReports(reports);

  return { success: true, action, roomId };
}

module.exports = {
  submitReport,
  getReviewQueue,
  resolveReport,
  calculateUserWeight
};
