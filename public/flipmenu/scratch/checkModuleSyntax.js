const fs = require('fs');
const vm = require('vm');

function checkFile(filePath) {
    try {
        let js = fs.readFileSync(filePath, 'utf8');
        // Tạm thời comment import
        js = js.replace(/import\s+[^;]+/g, (m) => `// ${m}`);
        js = js.replace(/export\s+/g, '// export ');
        new vm.Script(js);
        console.log(`SYNTAX_CHECK for ${filePath}: OK`);
    } catch (e) {
        console.error(`SYNTAX_CHECK for ${filePath}: FAILED`, e);
    }
}

checkFile('src/camera-angle-rig.js');
checkFile('src/celestial-planet.js');
