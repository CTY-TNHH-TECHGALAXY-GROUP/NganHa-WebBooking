const fs = require('fs');

try {
    ['FlipMenu.js', 'CelestialEngine.js'].forEach(file => {
        let c = fs.readFileSync(file, 'utf8');
        c = c.replace(/\.\.\/public\//g, 'standalone-celestial-menu/public/');
        fs.writeFileSync(file, c);
    });
    console.log('Fixed URLs in both JS files.');
} catch(e) {
    console.error(e);
}
