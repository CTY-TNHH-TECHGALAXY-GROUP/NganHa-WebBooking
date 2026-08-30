const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/app/[lang]/new-user/[menuType]/checkout/page.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

tsx = tsx.replace(
  "setCustomizingService(service);",
  "console.log('SETTING CUSTOMIZING SERVICE:', service.id);\n    setCustomizingService(service);"
);

fs.writeFileSync(tsxPath, tsx);
