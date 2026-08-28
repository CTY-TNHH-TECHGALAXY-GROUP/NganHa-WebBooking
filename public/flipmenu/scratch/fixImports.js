const fs = require('fs');
try {
    let js = fs.readFileSync('CelestialEngine.js', 'utf8');
    js = js.replace(/from\s+["']\.\/camera-angle-rig\.js["']/g, 'from "./standalone-celestial-menu/camera-angle-rig.js"');
    js = js.replace(/from\s+["']\.\/celestial-planet\.js["']/g, 'from "./standalone-celestial-menu/celestial-planet.js"');
    fs.writeFileSync('CelestialEngine.js', js);
    console.log('Fixed relative imports in CelestialEngine.js');
} catch(e) {
    console.error(e);
}
