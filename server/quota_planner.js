/**
 * quota_planner.js — Quản lý Nhu cầu Phòng trọ & Hạn ngạch Cào dữ liệu HaUI
 * Dựa trên Chỉ tiêu Tuyển sinh Hàng năm của Đại học Công nghiệp Hà Nội.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.resolve(__dirname, '..', 'alldata', 'quota_config.json');
const DB_ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');

// Cấu hình mặc định chuẩn theo đề án tuyển sinh HaUI
const DEFAULT_CONFIG = {
  // Chỉ tiêu tuyển sinh tân sinh viên hàng năm
  annualIntake: {
    cs1: 4800,  // CS1 Minh Khai - Nhổn (60%)
    cs2: 2000,  // CS2 Tây Tựu (25%)
    cs3: 1200   // CS3 Phủ Lý - Hà Nam (15%)
  },
  // Chỗ ký túc xá ưu tiên cho tân sinh viên
  ktxSpots: {
    cs1: 800,
    cs2: 0,
    cs3: 400
  },
  // Tỷ lệ sinh viên có nhà riêng tại Hà Nội / Hà Nam hoặc ở cùng gia đình
  localRatio: 0.25,
  // Hệ số ở ghép (trung bình 2 bạn / phòng)
  roommateRatio: 2.0,
  // Tỷ lệ sinh viên khóa cũ luân chuyển / chuyển trọ trong năm học
  turnoverRatio: 0.15,
  // Hiệu suất chuyển đổi phễu cào (23% bài thô đạt chuẩn lên web sau lọc)
  funnelEfficiency: 0.23,
  // Tần suất cào khuyến nghị (giờ)
  crawlCycleHours: 4
};

function getQuotaConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    saveQuotaConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveQuotaConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

/**
 * Đếm số lượng phòng thực tế hiện có trong alldata/room theo cơ sở
 */
function getCurrentRoomStats() {
  if (!fs.existsSync(DB_ROOM_DIR)) {
    return { cs1: 0, cs2: 0, cs3: 0, total: 0, active: 0, rented: 0, quarantined: 0 };
  }

  const files = fs.readdirSync(DB_ROOM_DIR).filter(f => f.endsWith('.json'));
  let cs1 = 0, cs2 = 0, cs3 = 0;
  let active = 0, rented = 0, quarantined = 0;

  for (const f of files) {
    try {
      const room = JSON.parse(fs.readFileSync(path.join(DB_ROOM_DIR, f), 'utf-8'));
      if (!room) continue;

      const campus = room.vi_tri?.co_so_gan_nhat || 
                     (room.vi_tri?.khoang_cach_cs3_km < 10 ? 'CS3' : 
                     (room.vi_tri?.khoang_cach_cs2_km < room.vi_tri?.khoang_cach_cs1_km ? 'CS2' : 'CS1'));

      if (campus === 'CS3') cs3++;
      else if (campus === 'CS2') cs2++;
      else cs1++;

      const status = room.trang_thai || 'con_trong';
      if (status === 'con_trong') active++;
      else if (status === 'da_cho_thue') rented++;
      else quarantined++;
    } catch {}
  }

  return { cs1, cs2, cs3, total: files.length, active, rented, quarantined };
}

/**
 * Tính toán toàn diện Kế hoạch Hạn ngạch & Nhu cầu dựa trên đầu vào tuyển sinh
 */
function calculateQuotaPlan(customConfig = null) {
  const cfg = customConfig ? { ...getQuotaConfig(), ...customConfig } : getQuotaConfig();
  const currentStats = getCurrentRoomStats();

  const campuses = ['cs1', 'cs2', 'cs3'];
  const campusNames = {
    cs1: 'Cơ sở 1 (Minh Khai - Nhổn)',
    cs2: 'Cơ sở 2 (Tây Tựu)',
    cs3: 'Cơ sở 3 (Phủ Lý - Hà Nam)'
  };

  const plan = {
    generatedAt: new Date().toISOString(),
    config: cfg,
    campuses: {},
    summary: {
      totalAnnualIntake: 0,
      totalRentStudents: 0,
      totalTargetRooms: 0,
      totalRawCrawlQuota: 0,
      currentInventory: currentStats.total,
      activeInventory: currentStats.active,
      rentedInventory: currentStats.rented,
      quarantinedInventory: currentStats.quarantined,
      overallCompletionRate: 0,
      remainingRawToCrawl: 0
    }
  };

  for (const c of campuses) {
    const intake = cfg.annualIntake[c] || 0;
    const ktx = cfg.ktxSpots[c] || 0;
    const local = Math.round(intake * cfg.localRatio);
    const rentStudents = Math.max(0, intake - ktx - local);

    // Nhu cầu phòng tân sinh viên
    const freshmenRooms = Math.round(rentStudents / cfg.roommateRatio);
    // Nhu cầu bổ sung từ sinh viên khóa cũ cần chuyển trọ
    const oldStudentRooms = Math.round(freshmenRooms * cfg.turnoverRatio);
    // Tổng số phòng mục tiêu trên hệ thống (Target Inventory)
    const targetRooms = freshmenRooms + oldStudentRooms;

    // Số bài thô cần cào qua phễu lọc
    const rawCrawlQuota = Math.round(targetRooms / cfg.funnelEfficiency);

    // So sánh với tồn kho thực tế
    const current = currentStats[c] || 0;
    const completionRate = targetRooms > 0 ? Math.min(100, Math.round((current / targetRooms) * 100)) : 0;
    const remainingRoomsNeeded = Math.max(0, targetRooms - current);
    const remainingRawToCrawl = Math.round(remainingRoomsNeeded / cfg.funnelEfficiency);

    plan.campuses[c] = {
      name: campusNames[c],
      intake,
      ktx,
      local,
      rentStudents,
      freshmenRooms,
      oldStudentRooms,
      targetRooms,
      rawCrawlQuota,
      currentRooms: current,
      completionRate,
      remainingRoomsNeeded,
      remainingRawToCrawl,
      status: completionRate >= 85 ? 'DU_QUOTA' : (completionRate >= 50 ? 'DANG_NAP' : 'THIEU_DATA')
    };

    plan.summary.totalAnnualIntake += intake;
    plan.summary.totalRentStudents += rentStudents;
    plan.summary.totalTargetRooms += targetRooms;
    plan.summary.totalRawCrawlQuota += rawCrawlQuota;
  }

  plan.summary.overallCompletionRate = plan.summary.totalTargetRooms > 0
    ? Math.min(100, Math.round((currentStats.total / plan.summary.totalTargetRooms) * 100))
    : 0;

  plan.summary.remainingRawToCrawl = Math.max(0, 
    Math.round((plan.summary.totalTargetRooms - currentStats.total) / cfg.funnelEfficiency)
  );

  return plan;
}

module.exports = {
  getQuotaConfig,
  saveQuotaConfig,
  calculateQuotaPlan,
  getCurrentRoomStats
};
