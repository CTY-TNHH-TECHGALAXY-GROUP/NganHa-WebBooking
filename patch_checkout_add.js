const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/app/[lang]/new-user/[menuType]/checkout/page.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

tsx = tsx.replace(
  "addToCart(customizingService, {",
  "addToCart(customizingService, 1, {"
);

fs.writeFileSync(tsxPath, tsx);
console.log("Fixed addToCart parameter order");
