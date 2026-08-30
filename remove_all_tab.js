const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/app/[lang]/new-user/[menuType]/checkout/page.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

// Find the "all" button in the picker
const allButtonRegex = /<button[^>]*>\s*<img[^>]*\/>\s*<span>\{t\('all', lang\)\}<\/span>\s*<\/button>/g;
tsx = tsx.replace(allButtonRegex, '');

// Also search for the fallback without img if it exists
const allButtonRegex2 = /<button[^>]*className=\{`\$\{styles\.pickerTab\}[^>]*\}[^>]*onClick=\{[^}]*setActiveCategory\('all'\)[^}]*\}[^>]*>.*?<\/button>/gs;
tsx = tsx.replace(allButtonRegex2, '');

fs.writeFileSync(tsxPath, tsx);
console.log("Removed ALL tab from Service Picker Modal");
