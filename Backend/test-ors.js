const axios = require('axios');
async function test() {
  try {
    const start = { lat: 37.7749, lng: -122.4194 };
    const end = { lat: 37.8044, lng: -122.2712 };
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    console.log('Fetching', url);
    const resp = await axios.get(url);
    console.log('Success:', resp.data.routes?.length, 'routes');
    console.log('First route distance:', resp.data.routes[0].distance);
    console.log('Geometry type:', resp.data.routes[0].geometry.type);
  } catch(e) {
    console.error('Error status:', e.response?.status);
    console.error('Error data:', JSON.stringify(e.response?.data, null, 2));
  }
}
test();
