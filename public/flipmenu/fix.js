const fs = require('fs');
let c = fs.readFileSync('FlipMenu.js', 'utf8');
c = c.replace('import { gsap } from "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";', '');
fs.writeFileSync('FlipMenu.js', c);
