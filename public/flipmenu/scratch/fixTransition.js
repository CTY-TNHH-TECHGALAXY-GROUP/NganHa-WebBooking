const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');

    // Tìm và thay thế đoạn điều khiển chuyển cảnh trong script module
    const targetScriptOld = `const bookCanvas = document.getElementById('scene');
    const celestialApp = document.getElementById('celestial-app');`;
    const targetScriptNew = `const flipApp = document.getElementById('app');
    const celestialApp = document.getElementById('celestial-app');`;
    
    html = html.replace(targetScriptOld, targetScriptNew);

    html = html.replace(/bookCanvas\.style\.transition = 'opacity 1\.5s ease';/g, "flipApp.style.transition = 'opacity 1.5s ease';");
    html = html.replace(/bookCanvas\.style\.opacity = '0';/g, "flipApp.style.opacity = '0';");
    html = html.replace(/bookCanvas\.style\.display = 'none';/g, "flipApp.style.display = 'none';");

    fs.writeFileSync('index.html', html);
    console.log('Fixed index.html transition logic.');
} catch (e) {
    console.error(e);
}
