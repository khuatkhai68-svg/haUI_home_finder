async function inspectPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    console.log(`URL: ${url} | Status: ${res.status}`);
    const html = await res.text();
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    console.log(`Title: ${title}`);
    const links = [...html.matchAll(/href="([^"]+)"/g)]
      .map(m => m[1])
      .filter(l => (l.includes('-pr') || l.includes('cho-thue')) && l.endsWith('.html'));
    console.log(`Found ${links.length} rental post links:`);
    console.log(links.slice(0, 5));
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
  }
}

async function run() {
  await inspectPage('https://phongtro123.com/tinh-thanh/ha-nam');
  await inspectPage('https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem');
  await inspectPage('https://phongtro123.com/cho-thue-phong-tro-ha-noi');
}

run();
