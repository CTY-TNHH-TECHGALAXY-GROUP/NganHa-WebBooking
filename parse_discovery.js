const fs = require('fs');
const path = require('path');

const demoDir = '/Users/charlotte/Downloads/oria-discovery-demo';
const files = ['eat.html', 'quiet.html', 'two-hours.html', 'local.html', 'walk.html', 'buy.html'];
const data = {};

for (const file of files) {
    const html = fs.readFileSync(path.join(demoDir, file), 'utf8');
    
    const getMatch = (regex) => {
        const match = html.match(regex);
        return match ? match[1].trim() : '';
    };

    const title = getMatch(/<h1>(.*?)<\/h1>/);
    const eyebrow = getMatch(/<div class="eyebrow">(.*?)<\/div>/);
    const intro = getMatch(/<h1>.*?<\/h1>\s*<p>(.*?)<\/p>/s);
    const imgMatch = html.match(/<section class="cover">\s*<img src="(.*?)"/);
    const image = imgMatch ? imgMatch[1].replace('assets/', '/images/discovery/') : '';
    const lede = getMatch(/<p class="lede">(.*?)<\/p>/s);
    
    let quote = null;
    const quoteMatch = html.match(/<blockquote class="quote">(.*?)(?:<small>(.*?)<\/small>)?<\/blockquote>/s);
    if (quoteMatch) {
        quote = {
            text: quoteMatch[1].trim(),
            small: quoteMatch[2] ? quoteMatch[2].trim() : ''
        };
    }

    const sections = [];
    const sectionRegex = /<section class="section">(.*?)<\/section>/gs;
    let secMatch;
    while ((secMatch = sectionRegex.exec(html)) !== null) {
        const secHtml = secMatch[1];
        
        const secLabelMatch = secHtml.match(/<div class="section-label">(.*?)<\/div>/);
        const label = secLabelMatch ? secLabelMatch[1].trim() : '';
        
        const h2Match = secHtml.match(/<h2>(.*?)<\/h2>/);
        const heading = h2Match ? h2Match[1].trim() : '';

        let innerHtml = secHtml.replace(/<div class="section-label">.*?<\/div>\s*<div>/, '');
        innerHtml = innerHtml.replace(/<\/div>\s*$/, '');
        innerHtml = innerHtml.replace(/<h2>.*?<\/h2>/, '');
        
        const cards = [];
        const cardsRegex = /<div class="card">(.*?)<\/div>/gs;
        let cardMatch;
        while ((cardMatch = cardsRegex.exec(innerHtml)) !== null) {
            const cHtml = cardMatch[1];
            const cTitle = (cHtml.match(/<b>(.*?)<\/b>/) || [])[1] || '';
            const cDesc = (cHtml.match(/<p>(.*?)<\/p>/) || [])[1] || '';
            const cMap = (cHtml.match(/<a class="maplink" .*?href="(.*?)".*?>/) || [])[1] || '';
            cards.push({ title: cTitle, description: cDesc, map_url: cMap });
        }
        
        innerHtml = innerHtml.replace(/<div class="cards">.*?<\/div>\s*<\/div>/s, '');
        innerHtml = innerHtml.replace(/<div class="cards">.*?<\/div>\s*$/s, '');
        
        sections.push({ label, heading, bodyHTML: innerHtml.trim(), cards });
    }
    
    const slug = title.replace('.', '').trim();
    data[slug] = { eyebrow, title, image, intro, lede, sections, quote };
}

fs.writeFileSync('/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking/src/data/DiscoveryData.json', JSON.stringify(data, null, 2));
console.log('Parsed and saved to DiscoveryData.json');
