import * as cheerio from 'cheerio';

async function testFetch(url) {
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Check various selectors on phongtro123
    const postItems = $('.post-item, .post-listing > li, article.post-item');
    console.log('Found listing items:', postItems.length);

    postItems.slice(0, 5).each((i, el) => {
      const titleEl = $(el).find('.post-title a, h3 a, a.post-link').first();
      const title = titleEl.text().trim();
      let link = titleEl.attr('href') || $(el).find('a').first().attr('href') || '';
      if (link && !link.startsWith('http')) link = 'https://phongtro123.com' + link;
      const price = $(el).find('.post-price, .price').first().text().trim();
      const address = $(el).find('.post-location, .address').first().text().trim();
      const area = $(el).find('.post-acreage, .acreage').first().text().trim();
      console.log(`\n[${i + 1}] Title: ${title}`);
      console.log(`    Price: ${price} | Area: ${area} | Location: ${address}`);
      console.log(`    Link: ${link}`);
    });
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function run() {
  await testFetch('https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem');
  await testFetch('https://phongtro123.com/cho-thue-phong-tro-dai-hoc-cong-nghiep-ha-noi');
}

run();
