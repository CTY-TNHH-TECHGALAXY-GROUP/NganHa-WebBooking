const fs = require('fs');
try {
    let content = fs.readFileSync('CelestialEngine.js', 'utf8');
    
    // Thay thế 'three' bằng URL tuyệt đối
    content = content.replace(/import\s+\*\s+as\s+THREE\s+from\s+["']three["'];/g, 'import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";');
    
    // Thay thế 'three/addons/...' bằng URL tuyệt đối (nếu có)
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+["']three\/addons\/([^"']+)["'];/g, 'import {$1} from "https://unpkg.com/three@0.160.0/examples/jsm/$2";');

    fs.writeFileSync('CelestialEngine.js', content);
    console.log("Fixed module imports in CelestialEngine.js");
} catch(e) {
    console.error(e);
}
