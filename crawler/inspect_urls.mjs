import fs from 'fs';
import path from 'path';

const dir = 'alldata/room';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Inspecting URLs for ${files.length} rooms...`);

const urlTypes = {
  phongtro123: 0,
  fb_dummy: 0,
  fb_real: 0,
  other: 0,
  missing: 0
};

const samples = [];

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  const url = d.url_nguon || d.url || '';
  if (!url) {
    urlTypes.missing++;
  } else if (url.includes('phongtro123.com')) {
    urlTypes.phongtro123++;
  } else if (url.includes('facebook.com')) {
    // Check if real post id or generated timestamp
    if (url.match(/posts\/\d{10,18}\//)) {
      urlTypes.fb_real++;
    } else {
      urlTypes.fb_dummy++;
    }
    if (samples.length < 10) samples.push({ file: f, url });
  } else {
    urlTypes.other++;
  }
});

console.log('URL types breakdown:', urlTypes);
console.log('Sample FB URLs:', samples);
