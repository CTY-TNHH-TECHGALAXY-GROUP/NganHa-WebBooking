const fs = require('fs');
const files = ['CelestialEngine.js', 'FlipMenu.js'];
files.forEach(file => {
    try {
        let js = fs.readFileSync(file, 'utf8');
        // Thay thế thư mục có dấu cách
        js = js.replace(/standalone-celestial-menu \(2\)/g, 'standalone-celestial-menu%20(2)');
        fs.writeFileSync(file, js);
        console.log(`Đã sửa xong file: ${file}`);
    } catch (e) {
        console.log(`Bỏ qua file: ${file}`);
    }
});
