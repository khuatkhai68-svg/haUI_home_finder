import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/74cd9dc7-7ee9-4ef2-9dbb-976da09f3d21';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Capturing Map page (default)...');
  await page.goto('http://localhost:3333/map.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'map_3_campuses.png') });

  console.log('2. Clicking CS3 filter on Map page...');
  const cs3Btn = await page.$('button:has-text("CS3 (Hà Nam)")');
  if (cs3Btn) {
    await cs3Btn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'map_cs3_hanam_focus.png') });
  }

  console.log('3. Capturing Index page with CS3 toggle...');
  await page.goto('http://localhost:3333/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const indexCs3Btn = await page.$('.campus-toggle button:has-text("CS3")');
  if (indexCs3Btn) {
    await indexCs3Btn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'index_cs3_rooms.png') });

  console.log('4. Capturing Room detail of CS3...');
  await page.goto('http://localhost:3333/room-detail.html?id=PT123-HN-38853', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'room_detail_cs3.png') });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
