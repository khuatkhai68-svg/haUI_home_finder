import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\df4e8b92-431c-429f-a1df-45fc3ed7502d';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(dest);
        });
      } else {
        reject(new Error(`Status: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  const photoUrls = [
    'https://scontent.fhan12-1.fna.fbcdn.net/v/t39.30808-6/795485797_2593823294395811_3100301584818880941_n.jpg?stp=dst-jpg_tt6&cstp=mx1534x2048&ctp=s590x590&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=aXBDwkfZ_5gQ7kNvwE29BWW&_nc_oc=AdreEaJJkOsqdVh716MSDvgVWjsmeQknAds4m9hLck1WAKBR0wcoesr0SKQ_4gKXrcM&_nc_zt=23&_nc_ht=scontent.fhan12-1.fna&_nc_gid=d6fdH1cDclReqmW2iwH1tg&_nc_ss=7820f&oh=00_AQL_CMsKyBDU_lQT_vjjlr0zOMVIZmyUm2ES3PpPKiGAHQ&oe=6AB6D2DD',
    'https://scontent.fhan12-1.fna.fbcdn.net/v/t39.30808-6/813650734_2593823341062473_3895164282342926130_n.jpg?stp=dst-jpg_tt6&cstp=mx1536x2048&ctp=s590x590&_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=D3vKnW8PPREQ7kNvwGnrKsh&_nc_oc=Adp1eh_7y-b0jWom_kp-yEFDdVoFXKdllBxId4_zW92Rzw0nrnbFhzadBQjMVQEvO1I&_nc_zt=23&_nc_ht=scontent.fhan12-1.fna&_nc_gid=d6fdH1cDclReqmW2iwH1tg&_nc_ss=7820f&oh=00_AQLDcd7c-s2aKsGAEL6DPkxqT5OVTNvjNTR0i7s0VpuweQ&oe=6AB6F416',
    'https://scontent.fhan12-1.fna.fbcdn.net/v/t39.30808-6/813546465_2593823434395797_5902392314504675199_n.jpg?stp=dst-jpg_tt6&cstp=mx1560x1982&ctp=s590x590&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=PMiEAz8ysKUQ7kNvwEUdQHI&_nc_oc=AdoaKw2kO1gq5NomCbovWbWSIS9Cz0xeAKRxHgvOVZjtRRt52Eu7QhLY7451sy9lefA&_nc_zt=23&_nc_ht=scontent.fhan12-1.fna&_nc_gid=d6fdH1cDclReqmW2iwH1tg&_nc_ss=7820f&oh=00_AQKCzULuo9OtU3gyAO1vmsIuIOpx-0Y7LIYY9c3LcbfQEg&oe=6AB70841'
  ];

  for (let i = 0; i < photoUrls.length; i++) {
    const filename = `fb_real_room_photo_${i+1}.jpg`;
    const localPath = path.join(screenshotsDir, filename);
    const artPath = path.join(artifactDir, filename);
    await download(photoUrls[i], localPath);
    fs.copyFileSync(localPath, artPath);
    console.log(`Đã tải ảnh phòng gốc sắc nét: ${filename}`);
  }
}

run().catch(console.error);
