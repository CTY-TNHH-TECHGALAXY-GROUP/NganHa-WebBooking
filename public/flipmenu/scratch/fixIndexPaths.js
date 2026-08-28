const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');

    // Thay thế đường dẫn ảnh phòng và đồ nghề trong index.html
    let newContent = html.replace(/\.\.\/public\/images\//g, 'standalone-celestial-menu (2)/public/images/');
    // Nếu có ./public/
    newContent = newContent.replace(/\.\/public\/images\//g, 'standalone-celestial-menu (2)/public/images/');

    if (html !== newContent) {
        fs.writeFileSync('index.html', newContent);
        console.log("Đã cập nhật đường dẫn ảnh phòng/đồ nghề trong index.html thành công!");
    } else {
        console.log("Không tìm thấy đường dẫn ảnh cần cập nhật trong index.html.");
    }
} catch(e) {
    console.error("Lỗi cập nhật index.html:", e);
}
