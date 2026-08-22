const fs = require('fs');

const path = '/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking/src/data/DiscoveryData.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (data['I need a place to eat']) {
  const cards = data['I need a place to eat'].sections.find(s => s.label === 'BY MOMENT').cards;
  if (cards && cards.length > 0) {
    cards[0].title = 'I have 30 minutes: Phở Việt Nam';
    cards[0].description = 'Look for focused everyday dishes. Phở Việt Nam serves an incredibly flavorful, authentic bowl of Phở in an impeccably clean and welcoming space.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Pho+Viet+Nam+Ho+Chi+Minh+City';
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Updated Phở Hòa to Phở Việt Nam in DiscoveryData.json');
