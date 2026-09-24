async function testScrapeHaNamDetail() {
  const url = 'https://phongtro123.com/cho-thue-phong-tro-tai-co-so-3-dai-hoc-cong-nghiep-pr711266.html';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  console.log(`URL: ${url} | Status: ${res.status}`);
  const html = await res.text();
  
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.trim().replace(/\s+/g, ' ');
  const address = html.match(/class="post-address"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.trim().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    || html.match(/Địa chỉ:\s*<\/span>([\s\S]*?)<\/span>/i)?.[1]?.trim().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  const price = html.match(/class="post-price"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.trim().replace(/<[^>]+>/g, '');
  const area = html.match(/class="post-acreage"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.trim().replace(/<[^>]+>/g, '');
  const desc = html.match(/class="section-content"[^>]*>([\s\S]*?)<\/div>/i)?.[1]?.trim().replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n');
  const photos = [...html.matchAll(/class="swiper-slide"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/gi)].map(m => m[1]);

  console.log('Title:', title);
  console.log('Address:', address);
  console.log('Price:', price);
  console.log('Area:', area);
  console.log('Photos count:', photos.length);
  console.log('Desc preview:', desc?.substring(0, 150));
}

testScrapeHaNamDetail();
