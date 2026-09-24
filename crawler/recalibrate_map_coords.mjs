import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOM_DIR = path.resolve(__dirname, '..', 'alldata', 'room');

// HaUI Campus coordinates
export const HAUI_CS1 = { lat: 21.05425, lng: 105.73504, name: "HaUI Cơ sở 1 (Minh Khai / Nhổn)" };
export const HAUI_CS2 = { lat: 21.07582, lng: 105.72996, name: "HaUI Cơ sở 2 (Tây Tựu)" };
export const HAUI_CS3 = { lat: 20.53994, lng: 105.89704, name: "HaUI Cơ sở 3 (Hà Nam)" };

export function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function recalibrateAll() {
  console.log("=================================================");
  console.log("RECALIBRATING ALL ROOMS FOR HAUI CS1, CS2, CS3");
  console.log("=================================================");

  const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json'));
  let count = 0;

  for (const f of files) {
    const fp = path.join(ROOM_DIR, f);
    try {
      const r = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      if (!r.vi_tri?.lat || !r.vi_tri?.lng) continue;

      const lat = r.vi_tri.lat;
      const lng = r.vi_tri.lng;

      const d1 = calcDistance(lat, lng, HAUI_CS1.lat, HAUI_CS1.lng);
      const d2 = calcDistance(lat, lng, HAUI_CS2.lat, HAUI_CS2.lng);
      const d3 = calcDistance(lat, lng, HAUI_CS3.lat, HAUI_CS3.lng);

      // Identify nearest campus
      let nearest = "CS1";
      let minDist = d1;
      if (d2 < minDist) { nearest = "CS2"; minDist = d2; }
      if (d3 < minDist) { nearest = "CS3"; minDist = d3; }

      const commuteMin = Math.max(3, Math.round(minDist * 2.8 + 2));

      r.vi_tri.khoang_cach_cs1_km = d1;
      r.vi_tri.khoang_cach_cs2_km = d2;
      r.vi_tri.khoang_cach_cs3_km = d3;
      r.vi_tri.co_so_gan_nhat = nearest;
      r.vi_tri.thoi_gian_di_xe_phut = commuteMin;

      fs.writeFileSync(fp, JSON.stringify(r, null, 2), 'utf-8');
      count++;
    } catch (e) {
      console.error(`Error in ${f}:`, e.message);
    }
  }

  console.log(`\nSuccessfully recalibrated all ${count} rooms with 3 HaUI campuses!`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  recalibrateAll();
}
