const fs = require('fs');

try {
    const htmlPath = 'standalone-celestial-menu/index.html';
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Extract CSS
    const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch && styleMatch[1]) {
        fs.writeFileSync('celestial-style.css', styleMatch[1].trim());
        console.log('Saved celestial-style.css');
    }

    // Extract JS
    // The script is inside <script type="module">...</script>
    const scriptMatch = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/);
    if (scriptMatch && scriptMatch[1]) {
        let jsContent = scriptMatch[1].trim();
        // Since it's a module, it might have imports. We just save it as is.
        // We will wrap it in an initialization function so we can call it when the Fly-Through finishes.

        // Find imports (if any) to put at the top
        const importRegex = /import [^;]+;/g;
        let imports = [];
        let cleanJsContent = jsContent.replace(importRegex, (match) => {
            imports.push(match);
            return ''; // remove from body
        });

        const engineCode = `
${imports.join('\n')}

export class CelestialEngine {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.isInitialized = false;
    }

    init() {
        if(this.isInitialized) return;
        this.isInitialized = true;
        
        // Wrap legacy global code in closure
        this._runLegacyEngine();
    }

    _runLegacyEngine() {
        ${cleanJsContent}
    }
}
`;
        fs.writeFileSync('CelestialEngine.js', engineCode);
        console.log('Saved CelestialEngine.js');
    }

    // Extract remaining UI (body elements without scripts)
    const bodyMatch = htmlContent.match(/<body>([\s\S]*?)<script/);
    if (bodyMatch && bodyMatch[1]) {
        fs.writeFileSync('celestial-ui.html', bodyMatch[1].trim());
        console.log('Saved celestial-ui.html');
    }

} catch (e) {
    console.error(e);
}
