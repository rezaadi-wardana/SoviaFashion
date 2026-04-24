const requestBody = {
  origin_latitude: -6.736375,
  origin_longitude: 110.724068,
  destination_latitude: -6.2088,
  destination_longitude: 106.8456,
  couriers: 'jne,jnt,sicepat,anteraja,ninja,lion,pos',
  items: [
    {
      name: 'Fashion Package',
      value: 100000,
      weight: 300,
      quantity: 1
    }
  ]
};

async function testBiteship() {
  const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
    method: 'POST',
    headers: {
      'Authorization': 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU292aWEgRmFzaGlvbiIsInVzZXJJZCI6IjY5ZWI1MzZmMDNlZWJhNGViOTM1YTMzZSIsImlhdCI6MTc3NzAzMDczOX0.M1MEkMCyZP4lCzjHeIREgD3Smv3kldL2O1JFWXWNTSI',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data.pricing, null, 2));
}

testBiteship().catch(console.error);
