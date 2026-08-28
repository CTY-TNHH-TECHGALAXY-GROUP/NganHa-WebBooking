const fs = require('fs');
try {
    let js = fs.readFileSync('CelestialEngine.js', 'utf8');
    
    // Cập nhật đường dẫn ảnh từ "public/..." hoặc 'public/...' sang đường dẫn root đúng
    let newJs = js.replace(/(["'])public\//g, '$1standalone-celestial-menu/public/');
    
    if (js !== newJs) {
        fs.writeFileSync('CelestialEngine.js', newJs);
        console.log('Fixed texture and image paths inside CelestialEngine.js');
    } else {
        console.log('No modifications needed or already fixed.');
    }
} catch (e) {
    console.error(e);
}
