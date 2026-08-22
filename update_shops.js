const fs = require('fs');

const path = '/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking/src/data/DiscoveryData.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. I need a place to eat
if (data['I need a place to eat']) {
  const cards = data['I need a place to eat'].sections.find(s => s.label === 'BY MOMENT').cards;
  if (cards && cards.length >= 4) {
    cards[0].title = 'I have 30 minutes: Phở Hòa Pasteur';
    cards[0].description = 'Look for focused everyday dishes. Phở Hòa is a historic institution that delivers a quintessential bowl of Phở in minutes.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Pho+Hoa+Pasteur+Ho+Chi+Minh+City';

    cards[1].title = 'Local, but comfortable: Quán Bụi';
    cards[1].description = 'Local does not mean uncomfortable. Quán Bụi offers authentic Vietnamese family-style dining in a beautifully designed, air-conditioned space.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Quan+Bui+Ho+Chi+Minh+City';

    cards[2].title = 'Eating alone: Bánh Mì Huỳnh Hoa';
    cards[2].description = 'The most famous, heavily-stuffed Bánh Mì in the city. Perfect for a quick, legendary solo bite.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=Banh+Mi+Huynh+Hoa';

    cards[3].title = 'The noisy version: Ốc Đào';
    cards[3].description = 'Choose somewhere where dinner shares space with the street. Ốc Đào is famous for its vibrant seafood culture and bustling local energy.';
    cards[3].map_url = 'https://www.google.com/maps/search/?api=1&query=Oc+Dao+Nguyen+Trai';
  }
}

// 2. I want to sit somewhere quiet
if (data['I want to sit somewhere quiet']) {
  const cards = data['I want to sit somewhere quiet'].sections.find(s => s.label === 'CHOOSE YOUR QUIET').cards;
  if (cards && cards.length >= 3) {
    cards[0].title = 'Courtyard cafes: Padma de Fleur';
    cards[0].description = 'A hidden florist-cafe where you can sit among wild arrangements in absolute tranquility.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Padma+de+Fleur';
    
    cards[1].title = 'Upper floors: Okkio Caffe (Le Loi)';
    cards[1].description = 'Nostalgic red-brick architecture hidden above the bustling street, perfect for reading or working.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Okkio+Caffe+Le+Loi';
    
    cards[2].title = 'Hotel lounges: The Library (Park Hyatt)';
    cards[2].description = 'Elegant, timeless, and perfectly quiet. The ideal spot for an unhurried afternoon tea.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=The+Library+Park+Hyatt+Saigon';
  }
}

// 3. I have 2 hours to kill
if (data['I have 2 hours to kill']) {
  const cards = data['I have 2 hours to kill'].sections.find(s => s.label === 'BY LOCATION').cards;
  if (cards && cards.length >= 3) {
    cards[0].title = 'Read & Coffee: Saigon Book Street';
    cards[0].description = 'A pedestrian-only street lined with bookstores and cafes, shaded by mature trees right next to the Post Office.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Nguyen+Van+Binh+Book+Street';
    
    cards[1].title = 'Museum: Fine Arts Museum';
    cards[1].description = 'Stunning French colonial architecture mixed with Vietnamese art collections. Quiet and profoundly atmospheric.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Ho+Chi+Minh+City+Museum+of+Fine+Arts';
    
    cards[2].title = 'Recovery: Oria Spa';
    cards[2].description = 'A deep tissue massage or a quick foot reflexology session to reset your body before the next flight or meeting.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=Oria+Spa+Ho+Chi+Minh+City';
  }
}

// 4. Take me somewhere local
if (data['Take me somewhere local']) {
  const cards = data['Take me somewhere local'].sections.find(s => s.label === 'CHOOSE A LAYER').cards;
  if (cards && cards.length >= 4) {
    cards[0].title = 'See the city wake up: Tân Định Market';
    cards[0].description = 'Go early. Markets are infrastructure before they are sightseeing: food arrives, shops prepare, breakfast happens.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Tan+Dinh+Market';
    
    cards[1].title = 'Neighbourhood life: Nguyen Thien Thuat Apartments';
    cards[1].description = 'One of the oldest apartment complexes in the city. A vertical village buzzing with street food and daily life.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Nguyen+Thien+Thuat+Apartments';
    
    cards[2].title = 'Another cultural layer: Hào Sĩ Phường';
    cards[2].description = 'A hundred-year-old alley showcasing how Chinese-Vietnamese history, architecture, and residential life overlap.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=Hao+Si+Phuong+Alley';
    
    cards[3].title = 'Unexpectedly slow: Bình Quới Village';
    cards[3].description = 'Challenges the idea that HCMC must always feel dense. A lush, green oasis mimicking the Mekong Delta.';
    cards[3].map_url = 'https://www.google.com/maps/search/?api=1&query=Binh+Quoi+Village';
  }
}

// 5. I want to walk around
if (data['I want to walk around']) {
  const cards = data['I want to walk around'].sections.find(s => s.label === 'ROUTES').cards;
  if (cards && cards.length >= 4) {
    cards[0].title = 'River wind: Bạch Đằng Wharf Park';
    cards[0].description = 'A wide, paved promenade along the Saigon River. Best at sunset when the city lights up and the breeze rolls in.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=Bach+Dang+Wharf+Park';
    
    cards[1].title = 'Tree canopy: Turtle Lake to Independence Palace';
    cards[1].description = 'District 3 works because of its massive heritage trees. Walk down Pham Ngoc Thach under a tunnel of green.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Turtle+Lake+Ho+Chi+Minh+City';
    
    cards[2].title = 'Historical density: Đồng Khởi Street';
    cards[2].description = 'From the Opera House to the river. The colonial and modern layers of the city compressed into a single avenue.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=Dong+Khoi+Street+Ho+Chi+Minh+City';
    
    cards[3].title = 'Boutique & Art: Thảo Điền (District 2)';
    cards[3].description = 'Villas turned into concept stores, art galleries, and craft bakeries. A highly walkable expat enclave.';
    cards[3].map_url = 'https://www.google.com/maps/search/?api=1&query=Xuan+Thuy+Thao+Dien';
  }
}

// 6. I need to buy something
if (data['I need to buy something']) {
  const cards = data['I need to buy something'].sections.find(s => s.label === 'BY PURPOSE').cards;
  if (cards && cards.length >= 4) {
    cards[0].title = 'Local Craft & Design: L\'Usine';
    cards[0].description = 'A curated lifestyle store featuring high-quality Vietnamese fashion, homewares, and contemporary souvenirs.';
    cards[0].map_url = 'https://www.google.com/maps/search/?api=1&query=L+Usine+Dong+Khoi';
    
    cards[1].title = 'Chocolate & Gifts: Maison Marou';
    cards[1].description = 'Award-winning Vietnamese bean-to-bar chocolate. The packaging itself is a piece of art, perfect for gifting.';
    cards[1].map_url = 'https://www.google.com/maps/search/?api=1&query=Maison+Marou+Saigon';
    
    cards[2].title = 'Market Experience: Bến Thành Market';
    cards[2].description = 'The ultimate sensory overload. Go for the architecture and the food court, but remember to bargain hard for goods.';
    cards[2].map_url = 'https://www.google.com/maps/search/?api=1&query=Ben+Thanh+Market';
    
    cards[3].title = 'Ceramics & Home: Authentique Home';
    cards[3].description = 'Beautiful, hand-crafted Vietnamese pottery, ceramics, and textiles that elevate traditional techniques.';
    cards[3].map_url = 'https://www.google.com/maps/search/?api=1&query=Authentique+Home+Ho+Chi+Minh+City';
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Updated DiscoveryData.json with specific shop names and maps.');
