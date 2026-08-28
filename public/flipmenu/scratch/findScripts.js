const fs = require('fs');
const html = fs.readFileSync('index2.html', 'utf8');
const regex = /<script\s+[^>]*src=["'](.*?)["']/gi;
let m;
let found = false;
while ((m = regex.exec(html)) !== null) {
    console.log('Script tag found:', m[1]);
    found = true;
}
if (!found) {
    // Check for inline importmap
    const imap = html.match(/<script type=["']importmap["']>([\s\S]*?)<\/script>/i);
    if (imap) console.log('Importmap found:\n', imap[1]);
    else {
        // check for import * as THREE
        const imp = html.match(/import\s+\*\s+as\s+THREE/i);
        if (imp) console.log('import * as THREE found!');
        else console.log('KHONG TIM THAY GI CA!');
    }
}
