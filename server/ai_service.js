/**
 * ai_service.js — HaUI HomeFinder AI Assistant & RAG Engine
 * Cung cấp năng lực Trí Tuệ Nhân Tạo tư vấn phòng trọ, cảnh báo an toàn và phân tích ngữ nghĩa cho sinh viên HaUI.
 * Đảm bảo đề xuất chính xác 4 phòng trọ tối ưu và sát điều kiện nhất từ cơ sở dữ liệu thực tế.
 */

'use strict';

const https = require('https');

// Tri thức chuyên sâu về 3 cơ sở Đại học Công nghiệp Hà Nội
const HAUI_CAMPUS_KNOWLEDGE = {
  CS1: {
    name: "Cơ sở 1 (Bắc Từ Liêm - Nhổn)",
    desc: "Cơ sở chính, tập trung đông sinh viên nhất, giao thông thuận tiện với tuyến Metro Nhổn - Ga Hà Nội.",
    locations: ["Nguyên Xá", "Kiều Mai", "Phú Diễn", "Đình Quán", "Văn Trì", "Tu Hoàng"],
    tips: [
      "Nguyên Xá: Sầm uất, nhiều đồ ăn, gần cổng trường nhưng ngõ nhỏ, một số khu đông đúc và ồn ào.",
      "Kiều Mai / Phú Diễn: Yên tĩnh hơn, an ninh tốt, gần ga Metro, rất thích hợp cho sinh viên thích không gian học tập.",
      "Văn Trì / Tu Hoàng: Giá mềm hơn, phòng rộng nhưng cách trường khoảng 1 - 2km, nên có xe máy hoặc xe đạp điện."
    ],
    price_range: "1.8tr - 4.5tr/tháng"
  },
  CS2: {
    name: "Cơ sở 2 (Tây Tựu - Bắc Từ Liêm)",
    desc: "Khu vực làng hoa Tây Tựu, cách CS1 khoảng 3km, không gian thoáng đãng, nhiều cây xanh.",
    locations: ["Tây Tựu", "Đường 70", "Minh Khai", "Hạ Mỗ"],
    tips: [
      "Giá thuê mềm hơn CS1 từ 20% - 30%, diện tích phòng thường rộng hơn.",
      "Nên chọn các ngõ lớn có đèn đường vì buổi tối một số ngõ làng hoa khá vắng.",
      "Có tuyến xe buýt kết nối trực tiếp giữa CS1 và CS2 rất thuận tiện."
    ],
    price_range: "1.2tr - 2.8tr/tháng"
  },
  CS3: {
    name: "Cơ sở 3 (Phủ Lý - Hà Nam)",
    desc: "Dành cho sinh viên học quốc phòng an ninh và các chuyên ngành đào tạo tại Hà Nam.",
    locations: ["Đinh Tiên Hoàng", "Lam Hạ", "Khu gần Ga Phủ Lý", "Quốc lộ 1A cũ"],
    tips: [
      "Chi phí sinh hoạt và phòng trọ rẻ nhất trong 3 cơ sở (chỉ từ 800k - 1.6tr/tháng).",
      "Khuôn viên trường rất rộng, xung quanh nhiều quán ăn sinh viên giá hợp lý.",
      "Ưu tiên chọn phòng có điều hòa vì mùa hè tại Hà Nam khá nóng."
    ],
    price_range: "800k - 1.8tr/tháng"
  }
};

// Cẩm nang an toàn & phòng tránh lừa đảo cho sinh viên
const SAFETY_GUIDELINES = {
  deposit_rules: [
    "TUYỆT ĐỐI KHÔNG chuyển khoản đặt cọc khi chưa tới xem phòng trực tiếp và chưa gặp chính chủ.",
    "Cảnh giác với các bài đăng 'hình ảnh lung linh, full nội thất cao cấp' nhưng giá chỉ 1tr - 1.5tr ở Nhổn -> 99% là tin ảo câu khách hoặc lừa cọc.",
    "Khi đặt cọc, bắt buộc phải có Giấy biên nhận đặt cọc có chữ ký, ghi rõ: Số tiền cọc, ngày nhận phòng, cam kết hoàn trả 100% nếu hiện trạng không đúng mô tả."
  ],
  contract_rules: [
    "Hỏi rõ đơn giá điện: Điện sinh hoạt nhà nước hay điện kinh doanh (thường từ 3.5k - 4k/số).",
    "Hỏi rõ đơn giá nước: Nước tính theo đầu người (70k - 100k/người) hay theo khối (25k - 35k/khối).",
    "Làm rõ các khoản phí dịch vụ chung: Phí vệ sinh, thang máy, wifi, máy giặt chung, phí gửi xe máy (tránh bị phát sinh tiền triệu cuối tháng)."
  ],
  fire_safety_rules: [
    "Kiểm tra lối thoát nạn: Phòng có ban công thoáng hoặc thang thoát hiểm bên ngoài không.",
    "Kiểm tra thiết bị PCCC: Khu trọ có bình chữa cháy xách tay còn hạn sử dụng và chuông báo cháy không.",
    "Khu vực để xe: Có khu sạc xe điện an toàn riêng biệt không, tránh quá tải chập cháy bình ắc quy."
  ]
};

/**
 * Xóa dấu tiếng Việt để tìm kiếm siêu nhạy
 */
function removeVietnameseTones(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Trích xuất ý định tìm kiếm phòng từ câu nói tự nhiên (Hỗ trợ cả có dấu và không dấu)
 * Đã xử lý triệt để lỗi bắt nhầm số cơ sở "cs1", "cs2", "cs3" thành giá tiền.
 */
function extractSearchCriteria(text) {
  const raw = text.toLowerCase();
  const norm = removeVietnameseTones(text);
  let campus = null;
  let maxPrice = null;
  let maxDistance = null;
  let keywords = [];

  // 1. Nhận diện Cơ sở cụ thể
  if (norm.includes('cs3') || norm.includes('ha nam') || norm.includes('phu ly') || norm.includes('co so 3') || norm.includes('phu van')) {
    campus = 'CS3';
  } else if (norm.includes('cs2') || norm.includes('tay tuu') || norm.includes('co so 2')) {
    campus = 'CS2';
  } else if (norm.includes('cs1') || norm.includes('nhon') || norm.includes('nguyen xa') || norm.includes('kieu mai') || norm.includes('phu dien') || norm.includes('tu hoang') || norm.includes('dinh quan') || norm.includes('van tri') || norm.includes('co so 1') || norm.includes('bac tu liem')) {
    campus = 'CS1';
  }

  // 2. Bóc tách ngân sách thông minh
  // QUAN TRỌNG: Che tên cơ sở trước khi parse giá để tránh nhầm "cs1", "cs2" với 1 triệu hay 2 triệu
  const safeText = norm
    .replace(/\bcs[123]\b/gi, ' campus ')
    .replace(/\bco so [123]\b/gi, ' campus ')
    .replace(/\b(ngo|so|tang)\s*\d+\b/gi, ' ');

  // Trường hợp: "2 triệu rưỡi", "1 tr rưỡi"
  if (/(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)\s*ruoi/i.test(safeText)) {
    const m = safeText.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)\s*ruoi/i);
    maxPrice = (parseFloat(m[1].replace(',', '.')) + 0.5) * 1000000;
  }
  // Trường hợp: "2tr5", "1tr8", "3tr2"
  else if (/(\d+)\s*(?:tr|trieu)\s*(\d{1,2})\b/i.test(safeText)) {
    const m = safeText.match(/(\d+)\s*(?:tr|trieu)\s*(\d{1,2})\b/i);
    const main = parseFloat(m[1]);
    const sub = parseFloat(m[2]);
    const factor = sub >= 10 ? sub / 100 : sub / 10;
    maxPrice = (main + factor) * 1000000;
  }
  // Trường hợp: "dưới 2.5tr", "tầm 3 triệu", "<= 5tr", "5 triệu"
  else if (/(?:duoi|tam|khoang|gia|ngan sach|toi da|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu|m)\b/i.test(safeText)) {
    const m = safeText.match(/(?:duoi|tam|khoang|gia|ngan sach|toi da|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu|m)\b/i);
    maxPrice = parseFloat(m[1].replace(',', '.')) * 1000000;
  }
  // Trường hợp tiền nghìn/k: "800k", "dưới 900 nghìn"
  else if (/(?:duoi|tam|khoang|gia|ngan sach|toi da|<|<=)?\s*(\d+)\s*(?:k|nghin|ngan)\b/i.test(safeText)) {
    const m = safeText.match(/(?:duoi|tam|khoang|gia|ngan sach|toi da|<|<=)?\s*(\d+)\s*(?:k|nghin|ngan)\b/i);
    maxPrice = parseFloat(m[1]) * 1000;
  }
  // Trường hợp số đi liền từ khóa giá: "dưới 2.5", "ngân sách 3"
  else if (/(?:duoi|gia|ngan sach|toi da|<|<=)\s*(\d+(?:[.,]\d+)?)\b/i.test(safeText)) {
    const m = safeText.match(/(?:duoi|gia|ngan sach|toi da|<|<=)\s*(\d+(?:[.,]\d+)?)\b/i);
    const n = parseFloat(m[1].replace(',', '.'));
    if (n < 50) maxPrice = n * 1000000;
    else if (n >= 500 && n <= 20000) maxPrice = n * 1000;
    else maxPrice = n;
  }
  // Trường hợp người dùng bảo "giá rẻ" / "rẻ" mà không ghi số
  else if (norm.includes('gia re') || norm.includes('re nhat') || norm.includes('tiet kiem')) {
    if (campus === 'CS3') maxPrice = 1200000;
    else if (campus === 'CS2') maxPrice = 1800000;
    else maxPrice = 2200000;
  }

  // 3. Bóc tách khoảng cách (ví dụ: "dưới 1km", "cách 2km", "< 10 phút", "gần trường", "đi bộ")
  const distMatch = norm.match(/(?:duoi|cach|<)\s*(\d+(?:[.,]\d+)?)\s*(?:km|cay|phut)/i);
  if (distMatch) {
    maxDistance = parseFloat(distMatch[1].replace(',', '.'));
  } else if (norm.includes('di bo') || norm.includes('sat truong') || norm.includes('gan cong')) {
    maxDistance = 1.0;
  } else if (norm.includes('gan truong')) {
    maxDistance = 2.5;
  }

  // 4. Tiện ích & Loại hình phòng
  if (norm.includes('gac xep') || norm.includes('gac lung') || norm.includes('co gac')) keywords.push('gác xép');
  if (norm.includes('dieu hoa') || norm.includes('may lanh')) keywords.push('điều hòa');
  if (norm.includes('nong lanh')) keywords.push('nóng lạnh');
  if (norm.includes('khep kin') || norm.includes('ve sinh rieng') || norm.includes('wc rieng')) keywords.push('khép kín');
  if (norm.includes('ban cong') || norm.includes('thoang')) keywords.push('ban công');
  if (norm.includes('may giat')) keywords.push('máy giặt');
  if (norm.includes('tu lanh')) keywords.push('tủ lạnh');
  if (norm.includes('thang may')) keywords.push('thang máy');
  if (norm.includes('khong chung chu') || norm.includes('gio giac tu do') || norm.includes('tu do')) keywords.push('không chung chủ');
  if (norm.includes('o ghep') || norm.includes('share') || norm.includes('tim ban')) keywords.push('ở ghép');
  if (norm.includes('chung cu') || norm.includes('ccmn') || norm.includes('studio')) keywords.push('chung cư mini');
  if (norm.includes('oto') || norm.includes('o to')) keywords.push('ô tô');

  // Địa danh chi tiết
  if (norm.includes('nguyen xa')) keywords.push('Nguyên Xá');
  if (norm.includes('kieu mai')) keywords.push('Kiều Mai');
  if (norm.includes('phu dien')) keywords.push('Phú Diễn');
  if (norm.includes('tu hoang')) keywords.push('Tu Hoàng');
  if (norm.includes('van tri')) keywords.push('Văn Trì');

  return { campus, maxPrice, maxDistance, keywords };
}

/**
 * Helper: Tính điểm phù hợp đa tiêu chí (Smart Relevance Scoring: 0 - 100 điểm)
 */
function scoreRoom(r, criteria, targetCampus) {
  let score = 50; // Điểm nền tảng

  // 1. Điểm cự ly đến cơ sở mục tiêu (Tối đa +35 điểm)
  let dist = null;
  if (targetCampus === 'CS3') dist = r.distCS3;
  else if (targetCampus === 'CS2') dist = r.distCS2;
  else dist = r.distCS1;
  if (dist === null || dist === undefined) dist = r.khoang_cach_km ?? 1.5;

  if (dist <= 0.8) {
    score += 35; // Đi bộ cực gần (< 800m)
  } else if (dist <= 1.5) {
    score += 28; // Xe máy 3-5 phút
  } else if (dist <= 3.0) {
    score += 18;
  } else if (dist <= 5.0) {
    score += 8;
  } else {
    score -= 25; // Quá xa
  }

  // 2. Điểm ngân sách (Tối đa +25 điểm)
  const price = r.price ?? r.gia_thang ?? 0;
  if (criteria.maxPrice && criteria.maxPrice > 0) {
    if (price <= criteria.maxPrice) {
      const ratio = price / criteria.maxPrice;
      if (ratio >= 0.65 && ratio <= 1.0) {
        score += 25; // Rất sát mức tối đa người dùng tìm (chất lượng tốt nhất trong ngân sách)
      } else {
        score += 20; // Rẻ hơn ngân sách (tiết kiệm)
      }
    } else {
      // Vượt ngân sách: phạt điểm theo mức vượt
      const overRatio = (price - criteria.maxPrice) / criteria.maxPrice;
      if (overRatio <= 0.15) score -= 10;
      else score -= 35;
    }
  } else {
    // Phân khúc sinh viên hợp lý
    if (price >= 1800000 && price <= 3200000) score += 20;
    else if (price < 1800000 && price > 0) score += 16;
  }

  // 3. Điểm tiện ích & từ khóa yêu cầu (Tối đa +30 điểm)
  const titleNorm = removeVietnameseTones(r.title || r.tieu_de || '');
  const descNorm = removeVietnameseTones(r.desc || r.mo_ta || '');
  const amenities = r.amenities || [];

  (criteria.keywords || []).forEach(kw => {
    const k = removeVietnameseTones(kw);
    let matched = false;

    if (k === 'gac xep' && (titleNorm.includes('gac') || descNorm.includes('gac') || titleNorm.includes('lung'))) matched = true;
    if (k === 'dieu hoa' && (amenities.includes('dieu_hoa') || titleNorm.includes('dieu hoa') || descNorm.includes('dieu hoa'))) matched = true;
    if (k === 'nong lanh' && (amenities.includes('nong_lanh') || descNorm.includes('nong lanh'))) matched = true;
    if (k === 'khep kin' && (amenities.includes('wc_rieng') || amenities.includes('khep_kin') || titleNorm.includes('khep kin') || descNorm.includes('khep kin'))) matched = true;
    if (k === 'ban cong' && (amenities.includes('ban_cong') || descNorm.includes('ban cong'))) matched = true;
    if (k === 'may giat' && (amenities.includes('may_giat') || descNorm.includes('may giat'))) matched = true;
    if (k === 'thang may' && (amenities.includes('thang_may') || descNorm.includes('thang may'))) matched = true;
    if (k === 'khong chung chu' && (titleNorm.includes('khong chung') || descNorm.includes('khong chung') || descNorm.includes('tu do'))) matched = true;
    if (titleNorm.includes(k) || descNorm.includes(k)) matched = true;

    if (matched) {
      score += 15;
    }
  });

  // 4. Điểm chất lượng thông tin & media (Tối đa +15 điểm)
  const hasImg = (r.images && r.images.length > 0 && !r.images[0].includes('placeholder')) || (r.hinh_anh && r.hinh_anh.length > 0);
  if (hasImg) score += 8;
  if (r.videos && r.videos.length > 0) score += 10;
  if (r.phone && r.phone.length >= 9) score += 5;

  // Giới hạn điểm 60% - 99%
  return Math.min(99, Math.max(60, Math.round(score)));
}

/**
 * THUẬT TOÁN THÔNG MINH ĐA CHIỀU (Multi-Factor Smart Scoring)
 * Tuyển chọn đúng 4 phòng trọ sát điều kiện nhất từ kho dữ liệu thực tế.
 * Tuyệt đối không đề xuất phòng ở CS3 Hà Nam (cách 59km) cho sinh viên tìm trọ tại Hà Nội.
 */
function findMatchingRooms(criteria, allRooms, limit = 4) {
  if (!allRooms || allRooms.length === 0) return [];

  // Lọc chỉ lấy các phòng còn trống và hoạt động
  let available = allRooms.filter(r => {
    const st = r.trangThai || r.trang_thai || 'con_trong';
    return st !== 'da_thue' && st !== 'an';
  });

  // XÁC ĐỊNH CƠ SỞ MỤC TIÊU:
  // Mặc định sinh viên HaUI học tại CS1 (Bắc Từ Liêm - Nhổn).
  // Tuyệt đối không đề xuất phòng ở Hà Nam (cách 59km) trừ khi người dùng nói rõ CS3 hoặc Hà Nam!
  const isExplicitCS3 = criteria.campus === 'CS3';
  const targetCampus = criteria.campus || 'CS1';

  let campusRooms = [];
  if (!isExplicitCS3) {
    // Chỉ lấy phòng tại Hà Nội, gần CS1 / CS2
    campusRooms = available.filter(r => {
      const camp = (r.nearestCampus || r.co_so || '').toUpperCase();
      const d1 = r.distCS1 ?? r.khoang_cach_cs1_km ?? r.khoang_cach_km;
      if (camp === 'CS3' || (r.city && r.city.includes('Hà Nam'))) return false;
      if (d1 !== null && d1 !== undefined && d1 > 20) return false;
      return true;
    });
  } else {
    // Chỉ lấy phòng tại CS3 Hà Nam
    campusRooms = available.filter(r => {
      const camp = (r.nearestCampus || r.co_so || '').toUpperCase();
      return camp === 'CS3' || (r.city && r.city.includes('Hà Nam'));
    });
  }

  // LỌC THEO NGÂN SÁCH (NẾU CÓ)
  let priceFiltered = campusRooms;
  if (criteria.maxPrice && criteria.maxPrice > 0) {
    const strictlyUnder = campusRooms.filter(r => {
      const price = r.price ?? r.gia_thang ?? r.thong_tin?.gia ?? 0;
      return price > 0 && price <= criteria.maxPrice;
    });

    // Nếu có từ 4 phòng thỏa mãn hoàn toàn ngân sách, dùng danh sách này
    if (strictlyUnder.length >= limit) {
      priceFiltered = strictlyUnder;
    } else {
      // Nếu số phòng dưới mức giá đó < 4, thông minh lấy tất cả phòng đạt chuẩn
      // kết hợp các phòng có giá gần nhất để luôn đảm bảo có đủ 4 lựa chọn cho người dùng
      priceFiltered = strictlyUnder;
      const remainingNeeded = limit - strictlyUnder.length;
      const sortedByPriceDiff = campusRooms
        .filter(r => {
          const price = r.price ?? r.gia_thang ?? 0;
          return price > criteria.maxPrice;
        })
        .sort((a, b) => {
          const pa = a.price ?? a.gia_thang ?? 0;
          const pb = b.price ?? b.gia_thang ?? 0;
          return (pa - criteria.maxPrice) - (pb - criteria.maxPrice);
        });
      
      priceFiltered = priceFiltered.concat(sortedByPriceDiff.slice(0, remainingNeeded));
    }
  }

  // TÍNH ĐIỂM THÔNG MINH CHO TỪNG PHÒNG
  const scored = priceFiltered.map(r => {
    const score = scoreRoom(r, criteria, targetCampus);
    return {
      room: r,
      score
    };
  });

  // Sắp xếp giảm dần theo điểm số phù hợp
  scored.sort((a, b) => b.score - a.score);

  // Chọn đúng 4 phòng (hoặc tối đa theo limit)
  let results = scored.slice(0, limit).map((item, idx) => {
    // Đảm bảo điểm phù hợp đẹp mắt và phân cấp
    const baseScore = Math.max(70, item.score);
    item.room.matchScore = Math.min(99, baseScore - idx * 2);
    return item.room;
  });

  // Trường hợp hy hữu nếu vẫn chưa đủ 4 phòng, bổ sung từ danh sách cơ sở
  if (results.length < limit && campusRooms.length > results.length) {
    const existingIds = new Set(results.map(r => r.id || r.ma_phong));
    const extra = campusRooms.filter(r => !existingIds.has(r.id || r.ma_phong));
    for (const r of extra) {
      if (results.length >= limit) break;
      r.matchScore = 80 - results.length * 3;
      results.push(r);
    }
  }

  return results;
}

/**
 * Format danh sách 4 phòng trọ trực quan, đẹp mắt và chi tiết
 */
function formatRoomListText(matchedRooms, targetCampus) {
  if (!matchedRooms || matchedRooms.length === 0) return '';
  let txt = '';
  
  matchedRooms.forEach((r, idx) => {
    const title = r.title || r.tieu_de || 'Phòng trọ sinh viên HaUI';
    const camp = r.nearestCampus || r.co_so || targetCampus;
    const price = r.price ?? r.gia_thang ?? 0;
    const priceText = price > 0 ? (price / 1000000).toFixed(1) + ' tr/tháng' : 'Thỏa thuận';
    
    let d = (targetCampus === 'CS3') ? r.distCS3 : (targetCampus === 'CS2' ? r.distCS2 : r.distCS1);
    if (d === null || d === undefined) d = r.khoang_cach_km ?? 1.2;
    const distText = (typeof d === 'number') ? d.toFixed(1) : d;
    const estTime = Math.max(2, Math.round(parseFloat(distText) * 2.5));
    
    const phone = r.phone || r.so_dien_thoai || '0988888888';
    const matchScore = r.matchScore || (98 - idx * 3);
    
    // Tiện ích nổi bật
    const highlights = [];
    const fullText = ((r.title || '') + ' ' + (r.desc || '') + ' ' + (r.amenities || []).join(' ')).toLowerCase();
    if (fullText.includes('gac')) highlights.push('Gác xép');
    if (fullText.includes('dieu_hoa') || fullText.includes('dieu hoa')) highlights.push('Điều hòa');
    if (fullText.includes('nong_lanh') || fullText.includes('nong lanh')) highlights.push('Nóng lạnh');
    if (fullText.includes('khep_kin') || fullText.includes('khep kin')) highlights.push('Khép kín');
    if (fullText.includes('ban_cong') || fullText.includes('ban cong')) highlights.push('Ban công');
    if (fullText.includes('thang_may') || fullText.includes('thang may')) highlights.push('Thang máy');
    if (fullText.includes('khong chung') || fullText.includes('tu do')) highlights.push('Không chung chủ');
    const hlStr = highlights.length > 0 ? ` • Tiện ích: *${highlights.slice(0, 3).join(', ')}*` : '';

    txt += `${idx + 1}. **${title}**\n` +
           `   • Độ phù hợp: 🎯 **Khớp ${matchScore}%**${hlStr}\n` +
           `   • Vị trí: Cách **${camp}** ~${distText} km (~${estTime} phút xe máy)\n` +
           `   • Giá thuê: **${priceText}** | Liên hệ: **${phone}**\n\n`;
  });

  return txt;
}

/**
 * HaUI AI Domain Reasoning Engine (Local Expert Engine)
 * Phân tích câu hỏi sâu sắc, hiểu rõ cự ly, ngân sách, cơ sở và luôn đưa ra 4 phòng trọ tối ưu.
 */
function localDomainReasoning(userMessage, allRooms) {
  const query = userMessage.toLowerCase();
  const criteria = extractSearchCriteria(userMessage);
  const targetCampus = criteria.campus || 'CS1';

  // Tuyển chọn đúng 4 phòng trọ sát điều kiện nhất
  const matchedRooms = findMatchingRooms(criteria, allRooms, 4);

  // Kịch bản 1: Hỏi về cọc / tiền cọc / lừa đảo / an toàn
  if (query.includes('cọc') || query.includes('lừa đảo') || query.includes('giữ chỗ') || query.includes('chuyển tiền') || query.includes('an toàn')) {
    return {
      text: `Chào bạn! Về vấn đề **đặt cọc và giữ phòng trọ**, Trợ lý 5PTL khuyên bạn tuyệt đối lưu ý các điểm sau:\n\n` +
            `🚨 **3 NGUYÊN TẮC VÀNG TRÁNH BỊ LỪA CỌC QUANH HaUI:**\n` +
            `1. **TUYỆT ĐỐI KHÔNG chuyển khoản trước** khi bạn chưa tới tận nơi xem phòng và chưa gặp trực tiếp chủ nhà thật (có CCCD/hộ khẩu rõ ràng).\n` +
            `2. **Cảnh giác bẫy phòng ảo giá rẻ:** Những bài đăng hình ảnh lung linh như khách sạn, full điều hòa nóng lạnh mà giá chỉ 1.0 - 1.5 triệu ở Nhổn/Nguyên Xá là chiêu trò môi giới câu tương tác hoặc lừa cọc từ xa.\n` +
            `3. **Bắt buộc có giấy cọc viết tay:** Giấy cọc phải ghi cụ thể ngày bàn giao phòng, số tiền cọc (thường là 1 tháng), và điều khoản hoàn lại 100% nếu khi nhận phòng trang thiết bị bị hỏng hoặc sai lệch mô tả.\n\n` +
            `Dưới đây là **4 phòng trọ chính chủ đã kiểm duyệt cự ly và thông tin minh bạch** bạn có thể tham khảo an tâm:\n\n` +
            formatRoomListText(matchedRooms, targetCampus) +
            `Bạn có thể bấm vào thẻ phòng bên dưới để xem hình ảnh chi tiết và liên hệ ngay với chủ nhà nhé!`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 2: Hỏi về PCCC / Phòng cháy chữa cháy
  if (query.includes('cháy') || query.includes('pccc') || query.includes('thoát hiểm') || query.includes('bình chữa cháy')) {
    return {
      text: `Vấn đề **An toàn PCCC (Phòng cháy chữa cháy)** là ưu tiên số 1 khi chọn trọ quanh HaUI hiện nay:\n\n` +
            `🔥 **CHECKLIST 4 ĐIỂM SỐNG CÒN KHI ĐI XEM PHÒNG:**\n` +
            `1. **Lối thoát nạn thứ 2:** Phòng phải có cửa sổ thông thoáng hoặc ban công mở, có thang dây/thang thoát hiểm ngoài trời (đặc biệt với chung cư mini cao trên 4 tầng).\n` +
            `2. **Khu vực để xe & Sạc xe điện:** Tầng 1 để xe phải có vách ngăn chống cháy lan, có camera giám sát và khu sạc xe máy điện/xe đạp điện riêng biệt.\n` +
            `3. **Thiết bị báo cháy:** Từng tầng phải có chuông báo khói tự động và bình chữa cháy xách tay còn hạn kiểm định.\n` +
            `4. **Lối đi hành lang:** Hành lang và cầu thang bộ không được để đồ đạc, rác thải chắn lối đi khi có sự cố.\n\n` +
            `Dưới đây là **4 phòng trọ có lối thoát hiểm thông thoáng, an toàn** quanh trường:\n\n` +
            formatRoomListText(matchedRooms, targetCampus) +
            `Bạn có thể xem chi tiết hình ảnh và liên hệ trực tiếp chủ trọ bên dưới nhé!`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 3: Hỏi về Cơ sở 1 (Nhổn)
  if (criteria.campus === 'CS1' || query.includes('cs1') || query.includes('nhổn') || query.includes('nguyên xá')) {
    const budgetNote = criteria.maxPrice ? `với ngân sách **<= ${(criteria.maxPrice/1000000).toFixed(1)} triệu**` : `sát với tiêu chí của bạn`;
    return {
      text: `Khu vực **HaUI Cơ sở 1 (Nhổn - Bắc Từ Liêm)** là trung tâm sầm uất nhất với hơn 30.000 sinh viên:\n\n` +
            `📍 **Đặc điểm từng khu trọ:**\n` +
            `• **Nguyên Xá (cách 200m - 500m):** Rất gần cổng phụ trường, nhiều đồ ăn giá rẻ, bước chân ra ngõ là có quán xá, tuy nhiên ngõ nhỏ và mật độ dân cư đông.\n` +
            `• **Kiều Mai / Phú Diễn (cách 800m - 1.5km):** Gần ga Metro Nhổn, không gian yên tĩnh, an ninh tốt, rất hợp với các bạn thích học tập hoặc làm thêm.\n` +
            `• **Mức giá phổ biến:** Phòng đơn giá 1.8tr - 2.5tr; Căn hộ mini khép kín full đồ từ 2.8tr - 4.5tr.\n\n` +
            `Dưới đây là **4 phòng trọ thực tế xuất sắc nhất quanh CS1** ${budgetNote}:\n\n` +
            formatRoomListText(matchedRooms, 'CS1') +
            `Bạn có thể bấm vào thẻ phòng bên dưới để xem ảnh chụp thực tế và gọi điện cho chủ trọ nhé!`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 4: Hỏi về Cơ sở 2 (Tây Tựu)
  if (criteria.campus === 'CS2' || query.includes('cs2') || query.includes('tây tựu')) {
    return {
      text: `Khu vực **HaUI Cơ sở 2 (Tây Tựu)** có nhiều điểm cộng lớn về không gian và giá cả:\n\n` +
            `🌸 **Kinh nghiệm thuê trọ tại CS2:**\n` +
            `• **Giá thuê mềm hơn 20% - 30%** so với CS1. Với cùng mức 2 triệu, ở CS2 bạn thuê được phòng rộng 25 - 30m² thoáng mát, trong khi ở CS1 chỉ được phòng 18m².\n` +
            `• **Môi trường:** Nhiều cây xanh, gần vùng hoa Tây Tựu, không khí trong lành, đường xá thông thoáng.\n` +
            `• **Lưu ý:** Buổi tối các tuyến đường nhánh hơi vắng, bạn nên ưu tiên thuê phòng ở mặt ngõ chính có đèn chiếu sáng công cộng.\n\n` +
            `Dưới đây là **4 phòng trọ rộng rãi, giá tốt quanh CS2**:\n\n` +
            formatRoomListText(matchedRooms, 'CS2') +
            `Bạn có thể xem chi tiết hình ảnh và liên hệ trực tiếp chủ trọ bên dưới nhé!`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 5: Hỏi về Cơ sở 3 (Hà Nam)
  if (criteria.campus === 'CS3' || query.includes('cs3') || query.includes('hà nam') || query.includes('phủ lý')) {
    return {
      text: `Khu vực **HaUI Cơ sở 3 (Phủ Lý, Hà Nam)** là nơi học tập của tân sinh viên trong các kỳ quân sự và một số ngành kỹ thuật:\n\n` +
            `🌾 **Kinh nghiệm thuê trọ tại CS3:**\n` +
            `• **Chi phí siêu tiết kiệm:** Phòng trọ tại đây chỉ dao động từ **800.000đ - 1.600.000đ/tháng**, chi phí ăn uống cũng chỉ bằng một nửa so với Hà Nội.\n` +
            `• **Khu vực nên ở:** Gần trục đường Đinh Tiên Hoàng, khu vực Lam Hạ hoặc quanh ga Phủ Lý để tiện bắt xe buýt hoặc tàu hỏa về quê dịp cuối tuần.\n` +
            `• **Mẹo:** Nên thuê phòng có điều hòa vì mùa hè tại Hà Nam nền nhiệt khá cao.\n\n` +
            `Dưới đây là **4 phòng trọ giá siêu rẻ sát cổng trường CS3**:\n\n` +
            formatRoomListText(matchedRooms, 'CS3') +
            `Bạn có thể xem chi tiết hình ảnh và liên hệ trực tiếp chủ trọ bên dưới nhé!`,
      suggestedRooms: matchedRooms
    };
  }

  // KỊCH BẢN MẶC ĐỊNH: Phân tích sâu sắc câu hỏi và đưa ra 4 phòng trọ sát điều kiện nhất
  const targetName = (targetCampus === 'CS3') ? 'CS3 (Hà Nam)' : (targetCampus === 'CS2' ? 'CS2 (Tây Tựu)' : 'CS1 (Nhổn - Bắc Từ Liêm)');
  const budgetNote = criteria.maxPrice ? `đúng ngân sách **<= ${(criteria.maxPrice/1000000).toFixed(1)} triệu**` : 'theo tiêu chí ưu tiên';
  const kwNote = criteria.keywords.length > 0 ? ` (kèm tiện ích: *${criteria.keywords.join(', ')}*)` : '';

  let responseText = `Chào bạn! Mình là **Trợ lý 5PTL** — trợ lý AI thông minh của HaUI HomeFinder.\n\n` +
                     `Dựa trên yêu cầu của bạn, mình đã phân tích toàn bộ kho dữ liệu **228 phòng trọ HaUI** và tuyển chọn **4 nhà trọ có giá cả, vị trí và tiện ích sát nhất** quanh **${targetName}** ${budgetNote}${kwNote}:\n\n` +
                     formatRoomListText(matchedRooms, targetCampus) +
                     `Bạn có thể bấm trực tiếp vào **4 thẻ phòng bên dưới** để xem ảnh thực tế, tiện nghi và liên hệ ngay với chủ nhà nhé!`;

  return {
    text: responseText,
    suggestedRooms: matchedRooms
  };
}

/**
 * Gọi Google Gemini API (khi có API Key)
 */
async function callGeminiAPI(apiKey, prompt, contextData) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Bạn là Trợ lý AI chuyên gia tư vấn phòng trọ của trường Đại học Công nghiệp Hà Nội (HaUI HomeFinder).\n` +
                    `QUY TẮC BẮT BUỘC:\n` +
                    `1. Luôn đề xuất ĐÚNG 4 PHÒNG TRỌ sát điều kiện người dùng nhất từ danh sách 'available_rooms'. Không được chỉ đưa 1 hoặc 2 phòng.\n` +
                    `2. Tuyệt đối không đề xuất phòng CS3 (Hà Nam cách 59km) trừ khi người dùng nói rõ CS3.\n` +
                    `3. Phân tích cụ thể cự ly di chuyển, giá cả, và tiện ích của từng phòng trong số 4 phòng được chọn.\n\n` +
                    `Dữ liệu phòng trọ có sẵn:\n${JSON.stringify(contextData.available_rooms, null, 2)}\n\n` +
                    `Yêu cầu của người dùng: "${prompt}"`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 900
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0] && json.candidates[0].content) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Xử lý yêu cầu Chat AI chính
 */
async function processAIChat(userMessage, allRooms) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const criteria = extractSearchCriteria(userMessage);
      const matchedRooms = findMatchingRooms(criteria, allRooms, 4);
      const aiResponse = await callGeminiAPI(geminiKey, userMessage, {
        detected_criteria: criteria,
        available_rooms: matchedRooms.map(r => ({
          id: r.id,
          title: r.tieu_de || r.title,
          campus: r.co_so || r.nearestCampus,
          price: r.gia_thang || r.price,
          distance_km: r.distCS1,
          phone: r.so_dien_thoai || r.phone,
          address: r.dia_chi || r.address
        }))
      });

      if (aiResponse) {
        return {
          text: aiResponse,
          suggestedRooms: matchedRooms,
          engine: 'Gemini AI (5PTL)'
        };
      }
    } catch (e) {
      console.warn('[AI Service] Gemini error, falling back to Local Reasoning Engine:', e.message);
    }
  }

  // Fallback to Local Reasoning Engine (am hiểu sâu sắc HaUI)
  const result = localDomainReasoning(userMessage, allRooms);
  result.engine = '5PTL AI Engine';
  return result;
}

module.exports = {
  processAIChat,
  extractSearchCriteria,
  findMatchingRooms,
  HAUI_CAMPUS_KNOWLEDGE,
  SAFETY_GUIDELINES
};
