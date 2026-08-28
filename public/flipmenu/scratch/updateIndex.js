const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');
    let ui = fs.readFileSync('celestial-ui.html', 'utf8');
    let css = fs.readFileSync('celestial-style.css', 'utf8');

    // Giải quyết xung đột ID: Đổi #scene của celestial thành #scene-celestial
    ui = ui.replace('id="scene"', 'id="scene-celestial"');
    ui = ui.replace('id="app"', 'id="celestial-app" style="display:none; position:fixed; inset:0; z-index:10; opacity:0; transition:opacity 1.5s ease;"');

    // Chèn CSS vào Head
    if (!html.includes('celestial-style.css')) {
        html = html.replace('</head>', '<style>\n' + css + '\n</style>\n</head>');
    }

    // Chèn UI vào body
    if (!html.includes('id="celestial-app"')) {
        html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap/, ui + '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap');
    }

    // Cập nhật thẻ script khởi tạo
    const appLogic = `<script type="module">
    import { FlipMenu } from './FlipMenu.js';
    
    const bookCanvas = document.getElementById('scene');
    const celestialApp = document.getElementById('celestial-app');
    
    // Khởi tạo thư viện Menu 3D
    const myMenu = new FlipMenu('#scene', {
      totalPages: 42,
      useDefaultUI: true,
      onInit: () => console.log('Sách đã tải xong!'),
      onItemSelected: (categoryId) => {
        console.log('Bay xuyên qua sách vào danh mục:', categoryId);
        
        // 1. Kích hoạt hiệu ứng mờ sách
        bookCanvas.style.transition = 'opacity 1.5s ease';
        bookCanvas.style.opacity = '0';
        
        // 2. Hiện UI Thiên hà
        celestialApp.style.display = 'block';
        setTimeout(() => {
            celestialApp.style.opacity = '1';
        }, 100);

        // 3. Khởi tạo / Gọi Celestial Engine
        import('./CelestialEngine.js').then(module => {
            const engine = new module.CelestialEngine('#celestial-app');
            engine.init();
            
            // Xoá sách khỏi render để nhẹ máy
            setTimeout(() => {
                bookCanvas.style.display = 'none';
            }, 1500);
        }).catch(err => console.error("Lỗi tải Celestial:", err));
      }
    });
  </script>`;

    html = html.replace(/<script type="module">[\s\S]*?<\/script>/, appLogic);

    fs.writeFileSync('index.html', html);
    
    // Đổi ID trong CelestialEngine.js
    let engineJs = fs.readFileSync('CelestialEngine.js', 'utf8');
    engineJs = engineJs.replace(/getElementById\(['"]scene['"]\)/g, 'getElementById("scene-celestial")');
    fs.writeFileSync('CelestialEngine.js', engineJs);

    console.log("AppManager đã tích hợp thành công!");
} catch(e) {
    console.error(e);
}
