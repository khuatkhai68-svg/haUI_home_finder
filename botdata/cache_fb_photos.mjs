import fs from 'fs';
import path from 'path';

const ROOM_DIR = path.resolve('alldata/room');
const PHOTOS_DIR = path.resolve('alldata/room/photos');

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

async function downloadPhoto(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    if (!res.ok) return false;
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (buffer.length < 5000) return false; // invalid/corrupt image
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  const files = fs.readdirSync(ROOM_DIR).filter(f => f.endsWith('.json') && f.startsWith('RM-FB-'));
  console.log(`Processing ${files.length} Facebook room JSON files...`);

  let totalDownloaded = 0;
  let roomsUpdated = 0;

  for (const f of files) {
    const filePath = path.join(ROOM_DIR, f);
    const room = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const roomId = room.ma_phong || f.replace('.json', '');

    if (!room.anh || !Array.isArray(room.anh) || room.anh.length === 0) continue;

    let modified = false;
    const newAnh = [];

    for (let i = 0; i < room.anh.length; i++) {
      const item = room.anh[i];
      const url = typeof item === 'string' ? item : item.url_goc;

      // Nếu đã là link local /photos/ thì giữ nguyên
      if (url.startsWith('/photos/')) {
        newAnh.push(item);
        continue;
      }

      // Nếu là link fbcdn.net, tải về lưu local
      if (url.includes('fbcdn.net') || url.includes('scontent')) {
        const destFileName = `${roomId}_photo_${i + 1}.jpg`;
        const destPath = path.join(PHOTOS_DIR, destFileName);

        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
          // Đã có sẵn file hợp lệ
          newAnh.push({ url_goc: `/photos/${destFileName}`, mo_ta: item.mo_ta || 'Ảnh thực tế bài đăng FB' });
          modified = true;
          continue;
        }

        const ok = await downloadPhoto(url, destPath);
        if (ok) {
          totalDownloaded++;
          newAnh.push({ url_goc: `/photos/${destFileName}`, mo_ta: item.mo_ta || 'Ảnh thực tế bài đăng FB' });
          modified = true;
        } else {
          // Nếu link FB này bị 403, giữ nguyên hoặc bỏ qua
          newAnh.push(item);
        }
      } else {
        newAnh.push(item);
      }
    }

    if (modified && newAnh.length > 0) {
      room.anh = newAnh;
      fs.writeFileSync(filePath, JSON.stringify(room, null, 2), 'utf-8');
      roomsUpdated++;
    }
  }

  console.log(`Finished: Downloaded ${totalDownloaded} photos, updated ${roomsUpdated} rooms.`);
}

main().catch(console.error);
