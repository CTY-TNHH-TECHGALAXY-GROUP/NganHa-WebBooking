const fs = require('fs');
const mainPath = 'c:/Users/ADMIN/OneDrive/Desktop/Ngan Ha/NganHa-WebBooking/public/flipmenu/main.js';
const celestialPath = 'c:/Users/ADMIN/OneDrive/Desktop/Ngan Ha/NganHa-WebBooking/public/flipmenu/CelestialEngine.js';

let mainJs = fs.readFileSync(mainPath, 'utf8');
let celestialJs = fs.readFileSync(celestialPath, 'utf8');

const startToken = "function normalizeCategoryKey(value)";
const endToken = "async function hydrateServicesFromApi() {";
const startIndex = celestialJs.indexOf(startToken);
const endIndexStart = celestialJs.indexOf(endToken, startIndex);
// Find the end of hydrateServicesFromApi
// We know it's around 35 lines. Let's just find the next function
const nextFunctionToken = "function buildBookingUrl";
const endIndexEnd = celestialJs.indexOf(nextFunctionToken, endIndexStart);

if (startIndex === -1 || endIndexStart === -1 || endIndexEnd === -1) {
    console.error("Tokens not found");
    process.exit(1);
}

const hydrationLogic = celestialJs.substring(startIndex, endIndexEnd);

const iconsToken = "const uploadedCategoryIcons = {";
const iconsEnd = "};";
const iconsStartIndex = celestialJs.indexOf(iconsToken);
const iconsEndIndex = celestialJs.indexOf(iconsEnd, iconsStartIndex) + iconsEnd.length;
const iconsLogic = celestialJs.substring(iconsStartIndex, iconsEndIndex);

const initStr = "async function init() {";
const initIdx = mainJs.indexOf(initStr);

mainJs = mainJs.replace("const categories = [", "let categories = [");

const toInsert = `
      function currentLang() { return new URLSearchParams(window.location.search).get('lang') || 'vi'; }
      ${iconsLogic}
      ${hydrationLogic}
`;

mainJs = mainJs.substring(0, initIdx) + toInsert + "\n      " + mainJs.substring(initIdx);
mainJs = mainJs.replace(initStr, initStr + "\n        await hydrateServicesFromApi();");

fs.writeFileSync(mainPath, mainJs);
console.log("main.js patched successfully!");
