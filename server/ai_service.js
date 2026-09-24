/**
 * ai_service.js — HaUI HomeFinder AI Assistant & RAG Engine
 * Cung cấp năng lực Trí Tuệ Nhân Tạo tư vấn phòng trọ, cảnh báo an toàn và phân tích ngữ nghĩa cho sinh viên HaUI.
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
 */
function extractSearchCriteria(text) {
  const raw = text.toLowerCase();
  const norm = removeVietnameseTones(text);
  let campus = null;
  let maxPrice = null;
  let maxDistance = null;
  let keywords = [];

  // Nhận diện Cơ sở
  if (norm.includes('cs1') || norm.includes('nhon') || norm.includes('nguyen xa') || norm.includes('kieu mai') || norm.includes('phu dien') || norm.includes('co so 1')) {
    campus = 'CS1';
  } else if (norm.includes('cs2') || norm.includes('tay tuu') || norm.includes('co so 2')) {
    campus = 'CS2';
  } else if (norm.includes('cs3') || norm.includes('ha nam') || norm.includes('phu ly') || norm.includes('co so 3')) {
    campus = 'CS3';
  }

  // Bóc tách giá (ví dụ: "dưới 2.5tr", "duoi 2.5 trieu", "tầm 2tr", "khoang 3tr", "<= 3 trieu", "duoi 3m")
  const priceMatch = norm.match(/(?:duoi|tam|khoang|gia|ngan sach|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu|m|k)/i);
  if (priceMatch) {
    let num = parseFloat(priceMatch[1].replace(',', '.'));
    if (priceMatch[0].includes('k') && !priceMatch[0].includes('tr') && !priceMatch[0].includes('trieu')) {
      maxPrice = num * 1000;
    } else {
      maxPrice = num * 1000000;
    }
  }

  // Bóc tách khoảng cách (ví dụ: "dưới 1km", "cách 2km", "< 10 phút")
  const distMatch = norm.match(/(?:duoi|cach|<)\s*(\d+(?:[.,]\d+)?)\s*(?:km|cay|phut)/i);
  if (distMatch) {
    maxDistance = parseFloat(distMatch[1].replace(',', '.'));
  }

  // Tiện ích
  if (norm.includes('gac xep') || norm.includes('gac lung')) keywords.push('gác xép');
  if (norm.includes('dieu hoa') || norm.includes('may lanh')) keywords.push('điều hòa');
  if (norm.includes('nong lanh')) keywords.push('nóng lạnh');
  if (norm.includes('khep kin') || norm.includes('rieng')) keywords.push('khép kín');
  if (norm.includes('ban cong') || norm.includes('thoang')) keywords.push('ban công');
  if (norm.includes('o ghep') || norm.includes('share')) keywords.push('ở ghép');

  return { campus, maxPrice, maxDistance, keywords };
}

/**
 * Lọc phòng trọ phù hợp nhất từ kho DB 257 phòng
 */
function findMatchingRooms(criteria, allRooms, limit = 3) {
  if (!allRooms || allRooms.length === 0) return [];

  let candidates = allRooms.filter(r => {
    // Không lấy phòng đã thuê
    if (r.trang_thai === 'da_thue' || r.trang_thai === 'an') return false;

    // Lọc cơ sở nếu có
    if (criteria.campus && r.co_so && r.co_so !== criteria.campus) {
      return false;
    }

    // Lọc giá nếu có
    if (criteria.maxPrice && r.gia_thang && r.gia_thang > criteria.maxPrice) {
      return false;
    }

    // Lọc khoảng cách nếu có
    if (criteria.maxDistance && r.khoang_cach_km && r.khoang_cach_km > criteria.maxDistance) {
      return false;
    }

    return true;
  });

  // Nếu lọc quá chặt không ra phòng nào, nới lỏng cơ sở
  if (candidates.length === 0 && criteria.campus) {
    candidates = allRooms.filter(r => r.co_so === criteria.campus);
  }

  // Ưu tiên phòng có hình ảnh và giá tốt
  candidates.sort((a, b) => {
    const aImg = (a.hinh_anh && a.hinh_anh.length > 0) ? 1 : 0;
    const bImg = (b.hinh_anh && b.hinh_anh.length > 0) ? 1 : 0;
    if (bImg !== aImg) return bImg - aImg;
    return (a.khoang_cach_km || 99) - (b.khoang_cach_km || 99);
  });

  return candidates.slice(0, limit);
}

/**
 * Gọi Google Gemini API (khi có API Key)
 */
async function callGeminiAPI(apiKey, prompt, contextData) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `Hệ thống: Bạn là Trợ lý AI HaUI HomeFinder — Chuyên gia tư vấn phòng trọ và người bạn đồng hành tin cậy của sinh viên Đại học Công nghiệp Hà Nội. Hãy xưng hô thân mật (mình - bạn hoặc em/anh/chị tùy ngữ cảnh), trả lời súc tích, chân thành, am hiểu sâu sắc về 3 cơ sở HaUI (CS1 Nhổn, CS2 Tây Tựu, CS3 Hà Nam). Luôn đưa ra lời khuyên an toàn, phòng ngừa lừa đảo cọc và PCCC.\n\nDữ liệu phòng trọ thực tế từ hệ thống:\n${JSON.stringify(contextData)}\n\nCâu hỏi của sinh viên: ${prompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
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
        } catch (e) {
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
 * HaUI AI Domain Reasoning Engine (Local Expert Engine)
 * Xử lý thông minh khi chưa cấu hình Gemini API hoặc mạng chậm, đảm bảo trải nghiệm AI cao cấp không bị ngắt quãng.
 */
function localDomainReasoning(userMessage, allRooms) {
  const query = userMessage.toLowerCase();
  const criteria = extractSearchCriteria(userMessage);
  const matchedRooms = findMatchingRooms(criteria, allRooms, 2);

  // Kịch bản 1: Hỏi về cọc / tiền cọc / lừa đảo / an toàn
  if (query.includes('cọc') || query.includes('lừa đảo') || query.includes('giữ chỗ') || query.includes('chuyển tiền') || query.includes('an toàn')) {
    return {
      text: `Chào bạn! Về vấn đề **đặt cọc và giữ phòng**, Trợ lý AI HaUI khuyên bạn phải cực kỳ thận trọng:\n\n` +
            `🚨 **3 NGUYÊN TẮC VÀNG TRÁNH BỊ LỪA CỌC:**\n` +
            `1. **TUYỆT ĐỐI KHÔNG chuyển khoản trước** khi bạn chưa đến tận nơi xem phòng và chưa gặp trực tiếp chủ nhà thật (có CCCD/hộ khẩu rõ ràng).\n` +
            `2. **Cảnh giác bẫy phòng ảo giá rẻ:** Những bài đăng hình ảnh như khách sạn, full điều hòa nóng lạnh mà giá chỉ 1.2 - 1.5 triệu ở khu Nhổn/Kiều Mai là chiêu trò môi giới câu tương tác hoặc lừa cọc từ xa.\n` +
            `3. **Bắt buộc có giấy cọc viết tay:** Giấy cọc phải ghi cụ thể ngày bàn giao phòng, số tiền cọc (thường là 1 tháng), và điều khoản hoàn lại 100% nếu khi nhận phòng trang thiết bị bị hỏng hoặc sai lệch.\n\n` +
            `💡 *Mẹo:* Nếu bạn muốn mình rà soát phòng cụ thể nào trong hệ thống, hãy gửi link hoặc mã phòng cho mình nhé!`,
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
            `💡 Tất cả phòng trọ trên HaUI HomeFinder đều được khuyến nghị kiểm tra kỹ tiêu chí này trước khi duyệt.`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 3: Hỏi về Cơ sở 1 (Nhổn)
  if (criteria.campus === 'CS1' || query.includes('cs1') || query.includes('nhổn') || query.includes('nguyên xá')) {
    let roomIntro = matchedRooms.length > 0 ? 
      `Dưới đây là **${matchedRooms.length} phòng trọ thực tế** gần Cơ sở 1 khớp với tiêu chí của bạn mà mình vừa kiểm tra từ hệ thống:` : 
      `Hiện mình đang rà soát thêm phòng mới tại CS1.`;

    return {
      text: `Khu vực **HaUI Cơ sở 1 (Nhổn - Bắc Từ Liêm)** là trung tâm sầm uất nhất với hơn 30.000 sinh viên:\n\n` +
            `📍 **Đặc điểm từng khu trọ:**\n` +
            `• **Nguyên Xá (cách 200m - 500m):** Rất gần cổng phụ trường, nhiều quán ăn sinh viên giá rẻ, bước chân ra ngõ là có đồ ăn nhưng nhược điểm là ngõ nhỏ và mật độ dân cư đông đúc.\n` +
            `• **Kiều Mai / Phú Diễn (cách 800m - 1.5km):** Rất gần ga Metro Nhổn, không gian yên tĩnh, an ninh tốt, rất hợp với các bạn thích học tập hoặc làm việc thêm.\n` +
            `• **Mức giá phổ biến:** Phòng đơn giá 1.8tr - 2.5tr; Căn hộ mini khép kín full đồ từ 2.8tr - 4.5tr.\n\n` +
            `${roomIntro}`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 4: Hỏi về Cơ sở 2 (Tây Tựu)
  if (criteria.campus === 'CS2' || query.includes('cs2') || query.includes('tây tựu')) {
    return {
      text: `Khu vực **HaUI Cơ sở 2 (Tây Tựu)** có nhiều điểm cộng lớn về không gian và giá cả:\n\n` +
            `🌸 **Kinh nghiệm thuê trọ tại CS2:**\n` +
            `• **Giá thuê mềm hơn 20% - 30%** so với CS1. Với cùng mức 2 triệu, ở CS2 bạn có thể thuê được phòng rộng 25 - 30m² thoáng mát, trong khi ở CS1 chỉ được phòng 18m².\n` +
            `• **Môi trường:** Nhiều cây xanh, gần vùng hoa Tây Tựu, không khí trong lành, đường xá thông thoáng.\n` +
            `• **Lưu ý:** Buổi tối các tuyến đường nhánh hơi vắng, bạn nên ưu tiên thuê phòng ở mặt ngõ chính có đèn chiếu sáng công cộng.\n\n` +
            (matchedRooms.length > 0 ? `Gợi ý phòng thực tế quanh CS2:` : ``),
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
            `• **Mẹo:** Nên thuê phòng có điều hòa vì mùa hè tại Hà Nam nền nhiệt khá cao.`,
      suggestedRooms: matchedRooms
    };
  }

  // Kịch bản 6: Hỏi về giá điện nước, hợp đồng chung
  if (query.includes('điện') || query.includes('nước') || query.includes('hợp đồng') || query.includes('chi phí')) {
    return {
      text: `Về **chi phí sinh hoạt và hợp đồng thuê trọ**, bạn cần nắm rõ bảng giá tiêu chuẩn sau:\n\n` +
            `📊 **MỨC GIÁ CHUẨN QUANH HaUI:**\n` +
            `• **Tiền điện:** Trung bình 3.500đ - 4.000đ / số (kWh). Hãy chụp ảnh chỉ số công tơ điện ngay khi dọn vào.\n` +
            `• **Tiền nước:** Nước máy thường tính 25.000đ - 35.000đ / khối, hoặc khoán 80.000đ - 100.000đ / người / tháng.\n` +
            `• **Mạng Internet:** 80.000đ - 100.000đ / phòng / tháng.\n` +
            `• **Vệ sinh & máy giặt chung:** Khoảng 50.000đ - 80.000đ / người.\n\n` +
            `⚠️ *Cảnh báo:* Hãy yêu cầu chủ nhà ghi rõ tất cả phụ phí vào hợp đồng bằng văn bản, tuyệt đối không chấp nhận thỏa thuận miệng!`,
      suggestedRooms: matchedRooms
    };
  }

  // Mặc định: Tư vấn tổng quát + Tìm phòng phù hợp theo yêu cầu
  let responseText = `Chào bạn! Mình là **Trợ lý AI HaUI HomeFinder** — hỗ trợ sinh viên ĐH Công nghiệp Hà Nội tìm phòng nhanh, an toàn và đúng giá.\n\n`;
  if (matchedRooms.length > 0) {
    responseText += `Dựa trên yêu cầu của bạn, mình đã quét nhanh kho dữ liệu **257 phòng trọ HaUI** và tìm thấy các lựa chọn sáng giá nhất:\n\n`;
    matchedRooms.forEach((r, idx) => {
      responseText += `${idx + 1}. **${r.tieu_de || 'Phòng trọ HaUI'}**\n` +
                      `   • Cơ sở: **${r.co_so || 'CS1'}** (Cách trường: ~${r.khoang_cach_km || '0.5'} km)\n` +
                      `   • Giá: **${(r.gia_thang ? (r.gia_thang / 1000000).toFixed(1) + ' tr/tháng' : 'Thỏa thuận')}** | SĐT: **${r.so_dien_thoai || 'Liên hệ'}**\n`;
    });
    responseText += `\nBạn có thể bấm vào thẻ phòng bên dưới để xem hình ảnh chi tiết và liên hệ ngay với chủ nhà nhé!`;
  } else {
    responseText += `Bạn có thể cho mình biết cụ thể hơn về nhu cầu của bạn không?\n` +
                    `• Bạn đang học ở **Cơ sở nào (CS1 Nhổn, CS2 Tây Tựu, hay CS3 Hà Nam)**?\n` +
                    `• Ngân sách dự kiến của bạn khoảng bao nhiêu (ví dụ: *dưới 2.5 triệu*)?\n` +
                    `• Bạn có cần các tiện ích như *gác xép, điều hòa, khép kín, ban công* không?`;
  }

  return {
    text: responseText,
    suggestedRooms: matchedRooms
  };
}

/**
 * Xử lý yêu cầu Chat AI chính
 */
async function processAIChat(userMessage, allRooms) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const criteria = extractSearchCriteria(userMessage);
      const matchedRooms = findMatchingRooms(criteria, allRooms, 3);
      const aiResponse = await callGeminiAPI(geminiKey, userMessage, {
        detected_criteria: criteria,
        available_rooms: matchedRooms.map(r => ({
          id: r.id,
          title: r.tieu_de,
          campus: r.co_so,
          price: r.gia_thang,
          distance_km: r.khoang_cach_km,
          phone: r.so_dien_thoai,
          address: r.dia_chi
        }))
      });

      if (aiResponse) {
        return {
          text: aiResponse,
          suggestedRooms: matchedRooms,
          engine: 'Gemini AI Pro'
        };
      }
    } catch (e) {
      console.warn('[AI Service] Gemini error, falling back to Local Reasoning Engine:', e.message);
    }
  }

  // Fallback to Local Reasoning Engine (am hiểu sâu sắc HaUI)
  const result = localDomainReasoning(userMessage, allRooms);
  result.engine = 'HaUI Domain AI Engine';
  return result;
}

module.exports = {
  processAIChat,
  extractSearchCriteria,
  findMatchingRooms,
  HAUI_CAMPUS_KNOWLEDGE,
  SAFETY_GUIDELINES
};
