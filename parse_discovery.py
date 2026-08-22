import os
from bs4 import BeautifulSoup
import json

demo_dir = '/Users/charlotte/Downloads/oria-discovery-demo'
files = ['eat.html', 'quiet.html', 'two-hours.html', 'local.html', 'walk.html', 'buy.html']
data = {}

for f in files:
    with open(os.path.join(demo_dir, f), 'r') as file:
        soup = BeautifulSoup(file.read(), 'html.parser')
        
        # Cover
        cover = soup.find(class_='cover')
        img_src = cover.find('img')['src'] if cover.find('img') else ''
        cover_copy = cover.find(class_='cover-copy')
        eyebrow = cover_copy.find(class_='eyebrow').text if cover_copy.find(class_='eyebrow') else ''
        title = cover_copy.find('h1').text if cover_copy.find('h1') else ''
        intro = cover_copy.find('p').text if cover_copy.find('p') else ''
        
        # Article
        article = soup.find(class_='article')
        lede = article.find(class_='lede').text if article.find(class_='lede') else ''
        
        # Quote
        quote_tag = article.find(class_='quote')
        if quote_tag:
            quote_text = quote_tag.contents[0] if isinstance(quote_tag.contents[0], str) else quote_tag.text
            quote_small = quote_tag.find('small').text if quote_tag.find('small') else ''
            quote = {'text': str(quote_text).strip(), 'small': quote_small}
        else:
            quote = None

        # Sections
        sections = []
        for sec in article.find_all(class_='section'):
            label = sec.find(class_='section-label').text if sec.find(class_='section-label') else ''
            content_div = sec.find('div', class_=False) or sec.find_all('div')[-1]
            h2 = content_div.find('h2').text if content_div.find('h2') else ''
            
            # extract all paragraphs and ul/ol that are direct children of content_div but not cards
            body_elements = []
            for child in content_div.children:
                if child.name in ['p', 'ul', 'ol', 'div'] and 'cards' not in child.get('class', []) and child.name != 'h2':
                    body_elements.append(str(child))
            
            # cards
            cards_container = content_div.find(class_='cards')
            cards = []
            if cards_container:
                for card in cards_container.find_all(class_='card'):
                    c_title = card.find('b').text if card.find('b') else ''
                    c_desc = card.find('p').text if card.find('p') else ''
                    map_url = card.find('a', class_='maplink')['href'] if card.find('a', class_='maplink') else ''
                    cards.append({'title': c_title, 'description': c_desc, 'map_url': map_url})
                    
            sections.append({
                'label': label,
                'heading': h2,
                'bodyHTML': ''.join(body_elements).strip(),
                'cards': cards
            })
            
        slug = title.replace('.', '').strip()
        
        data[slug] = {
            'eyebrow': eyebrow,
            'title': title,
            'image': img_src,
            'intro': intro,
            'lede': lede,
            'sections': sections,
            'quote': quote
        }

with open('/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking/src/data/DiscoveryData.json', 'w') as out:
    json.dump(data, out, indent=2, ensure_ascii=False)

print("Parsed and saved to DiscoveryData.json")
