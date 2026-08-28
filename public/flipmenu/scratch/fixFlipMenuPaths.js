const fs = require('fs');

try {
    let flipMenuJs = fs.readFileSync('FlipMenu.js', 'utf8');

    // Thay thế toàn bộ standalone-celestial-menu/public thành standalone-celestial-menu (2)/public
    // Đề phòng trường hợp có cả đường dẫn tương đối cũ ../public
    let newContent = flipMenuJs.replace(/standalone-celestial-menu\/public\//g, 'standalone-celestial-menu (2)/public/');
    newContent = newContent.replace(/\.\.\/public\//g, 'standalone-celestial-menu (2)/public/');

    if (flipMenuJs !== newContent) {
        fs.writeFileSync('FlipMenu.js', newContent);
        console.log("Đã cập nhật đường dẫn ảnh trong FlipMenu.js sang folder (2) thành công!");
    } else {
        console.log("Không tìm thấy đường dẫn cần cập nhật hoặc đã được cập nhật.");
    }
} catch(e) {
    console.error("Lỗi cập nhật FlipMenu.js:", e);
}
