const fs = require('fs');

try {
    const sourceHtmlPath = 'C:\\Users\\ADMIN\\OneDrive\\Desktop\\Ngan Ha\\standalone-celestial-menu (2)\\index2.html';
    const htmlContent = fs.readFileSync(sourceHtmlPath, 'utf8');

    // 1. Trích xuất CSS từ thẻ <style> của index2.html
    // Thẻ style đầu tiên thường chứa CSS của Celestial
    const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/i);
    if (!styleMatch) {
        throw new Error("Không tìm thấy thẻ <style> trong index2.html");
    }

    let cssContent = styleMatch[1].trim();

    // 2. Vá các Selector ID trong CSS sang tiền tố cel-
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
        // Tìm selector ID dạng #ID trong CSS
        // Dùng regex bắt #ID đứng trước dấu cách, dấu phẩy, dấu hai chấm, hoặc dấu mở ngoặc {
        const regex = new RegExp(`#${id}(?![\\w-])`, 'g');
        cssContent = cssContent.replace(regex, `#cel-${id}`);
    });

    // 3. Ghi ra file celestial-style.css
    fs.writeFileSync('celestial-style.css', cssContent);
    console.log("Trích xuất và vá CSS thành công!");

    // 4. Nhúng file CSS này vào index.html (nếu chưa nhúng)
    let mainHtml = fs.readFileSync('index.html', 'utf8');
    
    // Kiểm tra xem đã có link celestial-style.css chưa
    if (!mainHtml.includes('celestial-style.css')) {
        // Chèn vào ngay dưới link style.css
        mainHtml = mainHtml.replace(
            '<link rel="stylesheet" href="style.css">',
            '<link rel="stylesheet" href="style.css">\n  <link rel="stylesheet" href="celestial-style.css">'
        );
        fs.writeFileSync('index.html', mainHtml);
        console.log("Đã nhúng celestial-style.css vào index.html!");
    } else {
        console.log("celestial-style.css đã được nhúng từ trước.");
    }

} catch(e) {
    console.error("Lỗi trích xuất CSS:", e);
}
