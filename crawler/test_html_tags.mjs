async function inspectHtml() {
  const url = 'https://phongtro123.com/cho-thue-phong-tro-tai-co-so-3-dai-hoc-cong-nghiep-pr711266.html';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  
  // Find lines with address, price, or image
  const lines = html.split('\n');
  console.log('--- Search for address ---');
  lines.filter(l => l.includes('Địa chỉ') || l.includes('address') || l.includes('location')).slice(0, 10).forEach(l => console.log(l.trim()));
  
  console.log('--- Search for price ---');
  lines.filter(l => l.includes('triệu/tháng') || l.includes('tr/tháng') || l.includes('price')).slice(0, 10).forEach(l => console.log(l.trim()));

  console.log('--- Search for images ---');
  lines.filter(l => l.includes('.jpg') || l.includes('.webp') || l.includes('.png')).slice(0, 8).forEach(l => console.log(l.trim()));
}

inspectHtml();
