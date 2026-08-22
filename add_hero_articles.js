const fs = require('fs');
const path = require('path');

const tsPath = '/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking/src/data/InsightfulArticles.ts';
let tsContent = fs.readFileSync(tsPath, 'utf8');

const newArticles = `
  'How Saigon Drinks Coffee': \`
    <p>In many parts of the world, coffee is fuel. You buy it, you drink it while walking, and you use it to get through the day. In Saigon, coffee is not a beverage you consume on the move—it is a destination.</p>
    <p>The city runs on a high-octane blend of Robusta beans, but the culture itself is remarkably slow. The traditional <em>phin</em> (drip filter) forces you to sit and wait. You cannot rush gravity. By the time the last drop falls, your heart rate has naturally slowed down.</p>
    
    <h3>The Geography of a Cafe</h3>
    <p>Where you sit dictates the experience:</p>
    <ul>
      <li><strong>Cà phê bệt (Flat on the ground):</strong> Sitting on cardboard at April 30th Park near the Cathedral. It’s communal, youthful, and completely open to the city.</li>
      <li><strong>Cà phê hẻm (Alley coffee):</strong> Hidden behind narrow alleys where the roar of motorbikes fades away. These are the living rooms of the neighborhood.</li>
      <li><strong>The balcony view:</strong> Heritage apartments turned into multi-story cafes where you can observe the chaos of the city from a peaceful vantage point.</li>
    </ul>

    <h3>How to drink it like a local</h3>
    <p>Do not order it to go. Take a small plastic stool, face the street—never the wall—and watch the city move. Order a <em>cà phê sữa đá</em> (iced milk coffee) or a <em>bạc xỉu</em> (more milk, less coffee) if you want a softer introduction.</p>
    <p style="margin-top:24px; font-style:italic;">Oria thought: A slow afternoon of coffee watching the street perfectly complements the deep relaxation you feel after a signature massage. Let the city entertain you while your body rests.</p>
  \`,
  'How to tell if a café is actually good for a slow afternoon': \`
    <p>Saigon has thousands of cafes, many designed solely to look good in photographs. But if you want a place to read, reflect, or simply decompress after a long walk (or a spa session), aesthetics are not enough.</p>
    
    <h3>The 4 rules of a "Slow Cafe"</h3>
    <p>Before you commit to spending two hours somewhere, look for these subtle signs:</p>
    <ul>
      <li><strong>The Acoustics:</strong> Are there soft furnishings? Hard concrete walls look modern but they bounce sound aggressively. A good slow cafe uses wood, fabric, and plants to absorb the noise.</li>
      <li><strong>The Ergonomics:</strong> Beware of backless stools or overly deep sofas that swallow you. Look for solid wooden chairs at a proper table height.</li>
      <li><strong>The Light:</strong> The best cafes for reading rely on indirect natural light or warm yellow lamps, not harsh fluorescent bulbs.</li>
      <li><strong>The Pace of the Staff:</strong> If the staff are rushing and the music is fast-paced EDM, the space wants you to consume and leave. A slow cafe plays jazz, lofi, or acoustic, signaling that you are welcome to linger.</li>
    </ul>

    <p style="margin-top:24px; font-style:italic;">Oria thought: At Oria Spa, we carefully engineer our lighting, scent, and sound to bring your heart rate down. When you leave, seek out a cafe that respects that same sensory balance.</p>
  \`,
  'After a massage: what feels better than a heavy meal?': \`
    <p>A deep-tissue massage or a traditional Vietnamese therapy session shifts your body into a parasympathetic state—your heart rate slows, your muscles loosen, and your digestion rests.</p>
    <p>The worst thing you can do immediately after is shock your system with a heavy, greasy, or overly spicy meal.</p>
    
    <h3>What to eat to prolong the Zen</h3>
    <p>Vietnamese cuisine is uniquely equipped for post-wellness dining because of its emphasis on balance (Yin and Yang) and broths.</p>
    <ul>
      <li><strong>A clear bowl of Phở:</strong> Opt for chicken (Phở Gà) rather than beef. The warm, ginger-infused broth hydrates the body and aids the lymphatic system in flushing toxins released during your massage.</li>
      <li><strong>Gỏi Cuốn (Fresh Spring Rolls):</strong> Wrapped in rice paper with herbs, shrimp, and lean pork. It’s entirely fresh, uncooked, and requires minimal digestive effort.</li>
      <li><strong>Chè Hạt Sen (Lotus Seed Soup):</strong> A lightly sweetened traditional dessert. Lotus seeds are used in Vietnamese medicine to calm the nerves and promote deep sleep.</li>
    </ul>

    <p style="margin-top:24px; font-style:italic;">Oria thought: We serve warm herbal tea after your treatment precisely to keep your internal temperature balanced. Carry that philosophy into your dinner choice.</p>
  \`,
  'District 1 is not a single neighbourhood': \`
    <p>To a first-time visitor, "District 1" is a single destination. In reality, it is a mosaic of micro-neighborhoods, each with completely different rules, speeds, and architectures.</p>
    <p>If you treat it as one place, you might end up in the wrong area for the mood you want.</p>
    
    <h3>The Four Layers of D1</h3>
    <ul>
      <li><strong>The French & Financial Strip (Đồng Khởi / Nguyễn Huệ):</strong> Wide boulevards, luxury hotels, and colonial landmarks. It feels grand, international, and slightly formal.</li>
      <li><strong>The Japanese Quarter (Lê Thánh Tôn):</strong> A dense maze of narrow, winding alleys filled with hidden izakayas, ramen shops, and speakeasy bars. It feels secretive and nocturnal.</li>
      <li><strong>The Da Kao Ward (North of D1):</strong> Leafy streets, old villas, and a much slower pace. This is where old Saigon money lived. It is full of quiet cafes, galleries, and a distinctly residential calm.</li>
      <li><strong>The Backpacker District (Bùi Viện):</strong> Neon lights, loud music, and chaotic energy. Go here if you want sensory overload; avoid it if you want to relax.</li>
    </ul>

    <p style="margin-top:24px; font-style:italic;">Oria thought: Knowing these layers helps you curate your day. Start in Da Kao for a quiet morning, move to Đồng Khởi for the afternoon, visit Oria for recovery, and slip into the Japanese Quarter for a discreet evening drink.</p>
  \`,
`;

// Insert the new articles into the insightfulArticles object
tsContent = tsContent.replace(
  /export const insightfulArticles: Record<string, string> = {/,
  'export const insightfulArticles: Record<string, string> = {\n' + newArticles
);

fs.writeFileSync(tsPath, tsContent);
console.log('Added 4 new articles to InsightfulArticles.ts');
