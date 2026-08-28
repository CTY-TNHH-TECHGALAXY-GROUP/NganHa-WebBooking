const fs = require('fs');
const path = require('path');

try {
    const filePath = 'C:\\Users\\ADMIN\\OneDrive\\Desktop\\Ngan Ha\\standalone-celestial-menu (2)\\index2.html';
    const html = fs.readFileSync(filePath, 'utf8');
    
    // Tìm Importmap
    const importmapMatch = html.match(/<script type="importmap">([\s\S]*?)<\/script>/i);
    if (importmapMatch) {
        console.log('=== IMPORTMAP ===');
        console.log(importmapMatch[1].trim());
    } else {
        console.log('=== NO IMPORTMAP FOUND ===');
    }

    // Tìm Module Script (in ra 1000 ký tự đầu)
    const moduleMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/i);
    if (moduleMatch) {
        console.log('\n=== MODULE SCRIPT (START) ===');
        console.log(moduleMatch[1].trim().substring(0, 1000));
    } else {
        console.log('=== NO MODULE SCRIPT FOUND ===');
    }
} catch (e) {
    console.error(e);
}
