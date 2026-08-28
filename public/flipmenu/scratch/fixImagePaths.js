const fs = require('fs');
try {
    let filesToFix = [
        'CelestialEngine.js',
        'standalone-celestial-menu/src/camera-angle-rig.js',
        'standalone-celestial-menu/src/celestial-planet.js'
    ];

    filesToFix.forEach(file => {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            // Cập nhật đường dẫn tương đối ../public thành standalone-celestial-menu/public
            let newContent = content.replace(/\.\.\/public\//g, 'standalone-celestial-menu/public/');
            // Cập nhật nếu có ./public/
            newContent = newContent.replace(/\.\/public\//g, 'standalone-celestial-menu/public/');
            
            if (content !== newContent) {
                fs.writeFileSync(file, newContent);
                console.log(`Updated image paths in ${file}`);
            } else {
                console.log(`No image paths needed update in ${file}`);
            }
        } else {
            console.log(`File not found: ${file}`);
        }
    });

} catch(e) {
    console.error(e);
}
