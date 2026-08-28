const fs = require('fs');
const path = require('path');

try {
    const sourceHtmlPath = 'C:\\Users\\ADMIN\\OneDrive\\Desktop\\Ngan Ha\\standalone-celestial-menu (2)\\index2.html';
    const htmlContent = fs.readFileSync(sourceHtmlPath, 'utf8');

    // 1. Trích xuất Module Script
    const moduleMatch = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/i);
    if (!moduleMatch) {
        throw new Error("Không tìm thấy thẻ <script type=\"module\"> trong index2.html");
    }

    let jsCode = moduleMatch[1].trim();

    // 2. Vá các câu lệnh import CDN để không phụ thuộc vào importmap của index.html
    jsCode = jsCode.replace(/import\s+\*\s+as\s+THREE\s+from\s+["']three["']/g, 'import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js"');
    jsCode = jsCode.replace(/import\s+\{\s*SVGLoader\s*\}\s+from\s+["']three\/addons\/loaders\/SVGLoader\.js["']/g, 'import { SVGLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/SVGLoader.js"');
    jsCode = jsCode.replace(/import\s+\{\s*OrbitControls\s*\}\s+from\s+["']three\/addons\/controls\/OrbitControls\.js["']/g, 'import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"');

    // Cập nhật đường dẫn import local trỏ về thư mục src của flipmenu
    jsCode = jsCode.replace(/from\s+["']\.\/src\/camera-angle-rig\.js["']/g, 'from "./src/camera-angle-rig.js"');
    jsCode = jsCode.replace(/from\s+["']\.\/src\/celestial-planet\.js["']/g, 'from "./src/celestial-planet.js"');

    // 3. Vá các đường dẫn hình ảnh texture (public/...)
    jsCode = jsCode.replace(/(["'])public\//g, '$1standalone-celestial-menu (2)/public/');

    // 4. Vá các ID DOM tránh xung đột (Prefix cel-)
    const idsToPrefix = [
        'galaxy-canvas',
        'scene-celestial',
        'category-a11y',
        'cartButton',
        'cartBadge',
        'serviceSheet',
        'sheetKicker',
        'sheetTitle',
        'serviceContent',
        'focusCategoryRail',
        'iconPreviewPanel',
        'cartNotification',
        'cartDrawer',
        'closeCart',
        'cartItems',
        'cartSubtotal',
        'mobilePrev',
        'mobileNext',
        'layoutDragHandles',
        'layoutEditor',
        'layoutCategorySelect',
        'layoutXInput',
        'layoutYInput',
        'layoutZInput',
        'layoutScaleInput',
        'layoutSaveButton',
        'layoutResetButton',
        'layoutCopyButton',
        'layoutEditorStatus'
    ];

    idsToPrefix.forEach(id => {
        // getElementById
        const regexGetId = new RegExp(`getElementById\\(\\s*(['"])${id}\\1\\s*\\)`, 'g');
        jsCode = jsCode.replace(regexGetId, (match, quote) => `getElementById(${quote}cel-${id}${quote})`);

        // querySelector
        const regexQuery = new RegExp(`querySelector\\(\\s*(['"])#${id}\\1\\s*\\)`, 'g');
        jsCode = jsCode.replace(regexQuery, (match, quote) => `querySelector(${quote}#cel-${id}${quote})`);

        // querySelectorAll
        const regexQueryAll = new RegExp(`querySelectorAll\\(\\s*(['"])#${id}\\1\\s*\\)`, 'g');
        jsCode = jsCode.replace(regexQueryAll, (match, quote) => `querySelectorAll(${quote}#cel-${id}${quote})`);

        // el.id = "..."
        const regexElId = new RegExp(`\\.id\\s*=\\s*(['"])${id}\\1`, 'g');
        jsCode = jsCode.replace(regexElId, (match, quote) => `.id = ${quote}cel-${id}${quote}`);
    });

    // 5. Đóng gói thành Class
    // Tách các import đặt lên đầu file, phần logic còn lại nằm trong _runLegacyEngine
    const importRegex = /import\s+[^;]+;/g;
    let imports = [];
    let cleanJsCode = jsCode.replace(importRegex, (match) => {
        imports.push(match);
        return '';
    });

    const finalJsContent = `// === CELESTIAL ENGINE GENERATED FROM index2.html (v56) ===
${imports.join('\n')}

export class CelestialEngine {
    constructor(containerSelector) {
        this.containerSelector = containerSelector;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this._runLegacyEngine();
    }

    _runLegacyEngine() {
        const containerSelector = this.containerSelector;
        // Toàn bộ logic gốc được bọc lại
        ${cleanJsCode}
    }
}
`;

    fs.writeFileSync('CelestialEngine.js', finalJsContent);
    console.log("Nâng cấp và đóng gói CelestialEngine.js thành công!");

} catch (e) {
    console.error("Lỗi trong quá trình trích xuất:", e);
}
