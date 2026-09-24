async function test() {
  const res = await fetch('http://localhost:3333/api/rooms?nguon=facebook&limit=10');
  const data = await res.json();
  console.log(`Returned ${data.total} Facebook rooms. Showing first 5:`);
  data.data.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. [${r.id}] [${(r.price/1e6).toFixed(1)}tr] [${r.nearestCampus}] ${r.title}`);
    console.log(`   Link Facebook thật: ${r.url}`);
    console.log(`   Địa chỉ: ${r.address}`);
    console.log(`   Liên hệ: ${r.phone} (${r.owner})`);
  });
}
test();
