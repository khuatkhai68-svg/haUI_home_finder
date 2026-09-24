async function checkPagination() {
  for (let p = 1; p <= 6; p++) {
    const url = p === 1 ? 'https://phongtro123.com/tinh-thanh/ha-nam' : `https://phongtro123.com/tinh-thanh/ha-nam?page=${p}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const links = [...new Set([...html.matchAll(/href="([^"]+-pr\d+\.html)"/g)].map(m => m[1]))];
    console.log(`Page ${p} (${url}): Status ${res.status} | Unique post links: ${links.length}`);
    if (links.length === 0) break;
  }
}

checkPagination();
