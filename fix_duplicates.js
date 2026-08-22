const fs = require('fs');

const path = '/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking/src/data/DiscoveryData.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 2. I want to sit somewhere quiet (Avoid duplicates with Padma de Fleur, Okkio, The Library)
if (data['I want to sit somewhere quiet']) {
  const cards = data['I want to sit somewhere quiet'].sections.find(s => s.label === 'CHOOSE YOUR QUIET').cards;
  if (cards && cards.length >= 3) {
    cards[0].title = 'Courtyard cafes: Oromia Coffee & Lounge';
    cards[0].description = 'Tucked deep in a District 3 alley. A lush, koi-pond garden cafe where the city noise completely fades away.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Oromia+Coffee+Lounge+Ho+Chi+Minh';
    
    cards[1].title = 'Upper floors: Mockingbird Cafe';
    cards[1].description = 'Hidden on the top floor of a vintage 19th-century apartment block on Ton That Dam. Perfect for watching the sunset in peace.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Mockingbird+Cafe+Ton+That+Dam';
    
    cards[2].title = 'Hotel lounges: Café des Beaux-Arts';
    cards[2].description = 'Located inside Hotel des Arts. A Parisian-style salon that is elegantly quiet, ideal for reading a book with high tea.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=Cafe+des+Beaux-Arts+Saigon';
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Fixed duplicates in DiscoveryData.json');
