const fs = require('fs');
try {
    let js = fs.readFileSync('CelestialEngine.js', 'utf8');
    js = js.replace(/from\s+["']\.\/standalone-celestial-menu\/camera-angle-rig\.js["']/g, 'from "./standalone-celestial-menu/src/camera-angle-rig.js"');
    js = js.replace(/from\s+["']\.\/standalone-celestial-menu\/celestial-planet\.js["']/g, 'from "./standalone-celestial-menu/src/celestial-planet.js"');
    
    // Đề phòng trường hợp trước đó chưa thay thế thành công, ta bắt luôn mẫu "./camera..." gốc:
    js = js.replace(/from\s+["']\.\/camera-angle-rig\.js["']/g, 'from "./standalone-celestial-menu/src/camera-angle-rig.js"');
    js = js.replace(/from\s+["']\.\/celestial-planet\.js["']/g, 'from "./standalone-celestial-menu/src/celestial-planet.js"');

    fs.writeFileSync('CelestialEngine.js', js);
    console.log('Fixed imports to point to /src/');
} catch(e) {
    console.error(e);
}
