async function testApi() {
  try {
    const res = await fetch('http://localhost:3333/api/rooms?limit=5');
    const data = await res.json();
    console.log('API /api/rooms total:', data.total);
    data.data.slice(0, 3).forEach((r, i) => {
      console.log(`${i + 1}. [${r.id}] [${(r.price/1e6).toFixed(1)}tr] [${r.nearestCampus}] ${r.title}`);
      console.log(`   Address: ${r.address}`);
      console.log(`   Amenities: ${r.amenities.join(', ')}`);
      console.log(`   Desc: ${r.desc.substring(0, 80)}...`);
    });

    const statRes = await fetch('http://localhost:3333/api/admin/stats');
    const stats = await statRes.json();
    console.log('API /api/admin/stats:', stats);
  } catch (err) {
    console.error('API Test Error:', err.message);
  }
}

testApi();
