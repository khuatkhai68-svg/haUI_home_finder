import fs from 'fs';
import path from 'path';

const roomDir = 'alldata/room';
const files = fs.readdirSync(roomDir).filter(f => f.endsWith('.json'));

const HAUI_CS1 = { lat: 21.05373, lng: 105.73510 };
const HAUI_CS2 = { lat: 21.06180, lng: 105.72590 };
const HAUI_CS3 = { lat: 20.54100, lng: 105.89800 };

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const HANOI_COORDS = {
  "nhổn": { lat: 21.0540, lng: 105.7350, dist: "Bắc Từ Liêm" },
  "nguyên xá": { lat: 21.0555, lng: 105.7380, dist: "Bắc Từ Liêm" },
  "văn trì": { lat: 21.0585, lng: 105.7390, dist: "Bắc Từ Liêm" },
  "đình quán": { lat: 21.0505, lng: 105.7425, dist: "Bắc Từ Liêm" },
  "kiều mai": { lat: 21.0480, lng: 105.7460, dist: "Bắc Từ Liêm" },
  "ngọa long": { lat: 21.0505, lng: 105.7410, dist: "Bắc Từ Liêm" },
  "phú kiều": { lat: 21.0485, lng: 105.7470, dist: "Bắc Từ Liêm" },
  "phú diễn": { lat: 21.0450, lng: 105.7550, dist: "Bắc Từ Liêm" },
  "phúc diễn": { lat: 21.0490, lng: 105.7480, dist: "Bắc Từ Liêm" },
  "đức diễn": { lat: 21.0460, lng: 105.7500, dist: "Bắc Từ Liêm" },
  "cầu diễn": { lat: 21.0420, lng: 105.7620, dist: "Bắc Từ Liêm" },
  "tây tựu": { lat: 21.0618, lng: 105.7259, dist: "Bắc Từ Liêm" },
  "trung tựu": { lat: 21.0585, lng: 105.7255, dist: "Bắc Từ Liêm" },
  "thượng cát": { lat: 21.0950, lng: 105.7280, dist: "Bắc Từ Liêm" },
  "liên mạc": { lat: 21.0920, lng: 105.7450, dist: "Bắc Từ Liêm" },
  "thụy phương": { lat: 21.0860, lng: 105.7650, dist: "Bắc Từ Liêm" },
  "đông ngạc": { lat: 21.0820, lng: 105.7750, dist: "Bắc Từ Liêm" },
  "tân xuân": { lat: 21.0810, lng: 105.7790, dist: "Bắc Từ Liêm" },
  "cổ nhuế": { lat: 21.0650, lng: 105.7760, dist: "Bắc Từ Liêm" },
  "phạm văn đồng": { lat: 21.0550, lng: 105.7780, dist: "Bắc Từ Liêm" },
  "trần cung": { lat: 21.0510, lng: 105.7830, dist: "Bắc Từ Liêm" },
  "hoàng công chất": { lat: 21.0480, lng: 105.7620, dist: "Bắc Từ Liêm" },
  "xuân tảo": { lat: 21.0680, lng: 105.7890, dist: "Bắc Từ Liêm" },
  "lideco": { lat: 21.0665, lng: 105.7115, dist: "Hoài Đức" },
  "trạm trôi": { lat: 21.0680, lng: 105.7110, dist: "Hoài Đức" },
  "đức thượng": { lat: 21.0740, lng: 105.7020, dist: "Hoài Đức" },
  "kim chung": { lat: 21.0590, lng: 105.7210, dist: "Hoài Đức" },
  "lai xá": { lat: 21.0585, lng: 105.7180, dist: "Hoài Đức" },
  "di trạch": { lat: 21.0510, lng: 105.7180, dist: "Hoài Đức" },
  "đại tự": { lat: 21.0610, lng: 105.7190, dist: "Hoài Đức" },
  "vân canh": { lat: 21.0380, lng: 105.7220, dist: "Hoài Đức" },
  "sơn đồng": { lat: 21.0450, lng: 105.7050, dist: "Hoài Đức" },
  "tiền yên": { lat: 21.0250, lng: 105.6950, dist: "Hoài Đức" },
  "song phương": { lat: 21.0180, lng: 105.6980, dist: "Hoài Đức" },
  "an khánh": { lat: 21.0020, lng: 105.7380, dist: "Hoài Đức" },
  "lê trọng tấn": { lat: 20.9985, lng: 105.7485, dist: "Hoài Đức" },
  "geleximco": { lat: 20.9990, lng: 105.7450, dist: "Hoài Đức" },
  "phương canh": { lat: 21.0420, lng: 105.7360, dist: "Nam Từ Liêm" },
  "xuân phương": { lat: 21.0370, lng: 105.7360, dist: "Nam Từ Liêm" },
  "tu hoàng": { lat: 21.0475, lng: 105.7335, dist: "Nam Từ Liêm" },
  "hòe thị": { lat: 21.0410, lng: 105.7420, dist: "Nam Từ Liêm" },
  "thị cấm": { lat: 21.0395, lng: 105.7410, dist: "Nam Từ Liêm" },
  "trịnh văn bô": { lat: 21.0425, lng: 105.7390, dist: "Nam Từ Liêm" },
  "miêu nha": { lat: 21.0180, lng: 105.7360, dist: "Nam Từ Liêm" },
  "tây mỗ": { lat: 21.0050, lng: 105.7420, dist: "Nam Từ Liêm" },
  "đại mỗ": { lat: 20.9950, lng: 105.7580, dist: "Nam Từ Liêm" },
  "mỹ đình": { lat: 21.0280, lng: 105.7720, dist: "Nam Từ Liêm" },
  "đình thôn": { lat: 21.0210, lng: 105.7770, dist: "Nam Từ Liêm" },
  "mễ trì": { lat: 21.0150, lng: 105.7790, dist: "Nam Từ Liêm" },
  "phú đô": { lat: 21.0120, lng: 105.7680, dist: "Nam Từ Liêm" },
  "lê đức thọ": { lat: 21.0320, lng: 105.7680, dist: "Nam Từ Liêm" },
  "lê quang đạo": { lat: 21.0180, lng: 105.7690, dist: "Nam Từ Liêm" },
  "hàm nghi": { lat: 21.0380, lng: 105.7650, dist: "Nam Từ Liêm" },
  "nguyễn cơ thạch": { lat: 21.0360, lng: 105.7650, dist: "Nam Từ Liêm" },
  "trần hữu dực": { lat: 21.0410, lng: 105.7550, dist: "Nam Từ Liêm" },
  "hồ tùng mậu": { lat: 21.0390, lng: 105.7720, dist: "Cầu Giấy" },
  "mai dịch": { lat: 21.0370, lng: 105.7770, dist: "Cầu Giấy" },
  "doãn kế thiện": { lat: 21.0420, lng: 105.7780, dist: "Cầu Giấy" },
  "trần bình": { lat: 21.0360, lng: 105.7760, dist: "Cầu Giấy" },
  "xuân thủy": { lat: 21.0365, lng: 105.7860, dist: "Cầu Giấy" },
  "cầu giấy": { lat: 21.0320, lng: 105.7950, dist: "Cầu Giấy" },
  "nghĩa tân": { lat: 21.0450, lng: 105.7920, dist: "Cầu Giấy" },
  "nghĩa đô": { lat: 21.0470, lng: 105.7980, dist: "Cầu Giấy" },
  "hoàng quốc việt": { lat: 21.0460, lng: 105.7940, dist: "Cầu Giấy" }
};

const HANAM_COORDS = {
  "phù vân": { lat: 20.5410, lng: 105.8980, ward: "Phù Vân" },
  "lê hồng phong": { lat: 20.5380, lng: 105.9050, ward: "Lê Hồng Phong" },
  "quang trung": { lat: 20.5360, lng: 105.9120, ward: "Quang Trung" },
  "minh khai": { lat: 20.5420, lng: 105.9150, ward: "Minh Khai" },
  "lương khánh thiện": { lat: 20.5350, lng: 105.9170, ward: "Lương Khánh Thiện" },
  "trần hưng đạo": { lat: 20.5390, lng: 105.9180, ward: "Trần Hưng Đạo" },
  "châu sơn": { lat: 20.5210, lng: 105.9020, ward: "Châu Sơn" },
  "thanh tuyền": { lat: 20.5120, lng: 105.9250, ward: "Thanh Tuyền" },
  "liêm chính": { lat: 20.5280, lng: 105.9320, ward: "Liêm Chính" },
  "lam hạ": { lat: 20.5550, lng: 105.9280, ward: "Lam Hạ" },
  "kim bảng": { lat: 20.5620, lng: 105.8420, ward: "Kim Bảng" },
  "duy tiên": { lat: 20.6120, lng: 105.9450, ward: "Duy Tiên" },
  "ngô gia tự": { lat: 20.5420, lng: 105.9010, ward: "Phù Vân" },
  "hoàng văn thụ": { lat: 20.5370, lng: 105.9080, ward: "Lê Hồng Phong" },
  "đinh tiên hoàng": { lat: 20.5320, lng: 105.9150, ward: "Trần Hưng Đạo" },
  "lý thường kiệt": { lat: 20.5400, lng: 105.9130, ward: "Minh Khai" },
  "biên hòa": { lat: 20.5340, lng: 105.9160, ward: "Lương Khánh Thiện" }
};

let pinnedToHaUI = 0;
let updatedSpecific = 0;

for (const file of files) {
  const p = path.join(roomDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const addr = (data.thong_tin?.dia_chi || '').toLowerCase();
  const title = (data.thong_tin?.tieu_de || '').toLowerCase();
  const desc = (data.thong_tin?.mo_ta || '').toLowerCase();
  const combined = addr + ' ' + title + ' ' + desc;

  let isHaNam = data.thong_tin?.tinh_thanh === 'Hà Nam' || combined.includes('hà nam') || combined.includes('phủ lý') || combined.includes('phù vân');

  if (isHaNam) {
    let matchedHN = false;
    let lat = HAUI_CS3.lat;
    let lng = HAUI_CS3.lng;
    let ward = "Phù Vân";

    for (const [w, coords] of Object.entries(HANAM_COORDS)) {
      if (combined.includes(w)) {
        lat = coords.lat;
        lng = coords.lng;
        ward = coords.ward || w;
        matchedHN = true;
        break;
      }
    }

    const d1 = calcDistance(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng);
    const d2 = calcDistance(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng);
    const d3 = calcDistance(lat, lng, HAUI_CS3.lat, HAUI_CS3.lng);

    data.vi_tri = {
      lat,
      lng,
      vi_tri_xap_xi: !matchedHN,
      khoang_cach_cs1_km: d1,
      khoang_cach_cs2_km: d2,
      khoang_cach_cs3_km: d3,
      co_so_gan_nhat: "CS3",
      thoi_gian_di_xe_phut: Math.max(1, Math.round(d3 * 3.5))
    };

    if (!matchedHN) {
      pinnedToHaUI++;
      data.thong_tin.dia_chi = "Khuôn viên Đại học Công nghiệp Hà Nội (CS3 Phủ Lý, Hà Nam) - Vị trí bài đăng gần trường";
    } else {
      updatedSpecific++;
    }
  } else {
    // Hà Nội (CS1 & CS2)
    let matchedHN = false;
    let lat = HAUI_CS1.lat;
    let lng = HAUI_CS1.lng;
    let landmark = "Nhổn";

    for (const [lm, coords] of Object.entries(HANOI_COORDS)) {
      if (combined.includes(lm)) {
        lat = coords.lat;
        lng = coords.lng;
        landmark = lm;
        matchedHN = true;
        break;
      }
    }

    if (!matchedHN) {
      // Vague post without specific street/ward -> PIN DIRECTLY TO HAUI CS1
      pinnedToHaUI++;
      const isCS2 = combined.includes('cs2') || combined.includes('tây tựu');
      const targetCampus = isCS2 ? 'CS2' : 'CS1';
      const targetCoords = isCS2 ? HAUI_CS2 : HAUI_CS1;

      const d1 = calcDistance(targetCoords.lat, targetCoords.lng, HAUI_CS1.lat, HAUI_CS1.lng);
      const d2 = calcDistance(targetCoords.lat, targetCoords.lng, HAUI_CS2.lat, HAUI_CS2.lng);
      const d3 = calcDistance(targetCoords.lat, targetCoords.lng, HAUI_CS3.lat, HAUI_CS3.lng);

      data.vi_tri = {
        lat: targetCoords.lat,
        lng: targetCoords.lng,
        vi_tri_xap_xi: true,
        khoang_cach_cs1_km: d1,
        khoang_cach_cs2_km: d2,
        khoang_cach_cs3_km: d3,
        co_so_gan_nhat: targetCampus,
        thoi_gian_di_xe_phut: 1
      };
      data.thong_tin.dia_chi = `Khuôn viên Đại học Công nghiệp Hà Nội (${targetCampus}) - Vị trí trỏ về trường do bài đăng Facebook không ghi địa chỉ cụ thể`;
    } else {
      updatedSpecific++;
      const d1 = calcDistance(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng);
      const d2 = calcDistance(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng);
      const d3 = calcDistance(lat, lng, HAUI_CS3.lat, HAUI_CS3.lng);
      const nearest = d1 <= d2 ? "CS1" : "CS2";
      const minDist = nearest === "CS1" ? d1 : d2;

      data.vi_tri = {
        lat,
        lng,
        vi_tri_xap_xi: false,
        khoang_cach_cs1_km: d1,
        khoang_cach_cs2_km: d2,
        khoang_cach_cs3_km: d3,
        co_so_gan_nhat: nearest,
        thoi_gian_di_xe_phut: Math.max(1, Math.round(minDist * 3.5))
      };
    }
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

console.log(`\n🎉 HOÀN TẤT ĐIỀU CHỈNH TỌA ĐỘ BẢN ĐỒ TOÀN BỘ ${files.length} PHÒNG TRỌ:`);
console.log(`- Phòng có địa chỉ cụ thể được ghim chuẩn xác (0 jitter): ${updatedSpecific}`);
console.log(`- Bài đăng FB không ghi rõ địa chỉ được trỏ trực tiếp về cổng HaUI (vi_tri_xap_xi: true): ${pinnedToHaUI}`);
