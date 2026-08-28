const fs = require('fs');

try {
    let js = fs.readFileSync('CelestialEngine.js', 'utf8');

    // Danh sách các ID cần đổi tên
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

    let replaceCount = 0;

    idsToPrefix.forEach(id => {
        // Mẫu 1: getElementById('id') hoặc getElementById("id")
        const regexGetId = new RegExp(`getElementById\\(\\s*(['"])${id}\\1\\s*\\)`, 'g');
        js = js.replace(regexGetId, (match, quote) => {
            replaceCount++;
            return `getElementById(${quote}cel-${id}${quote})`;
        });

        // Mẫu 2: querySelector('#id') hoặc querySelector("#id")
        const regexQuery = new RegExp(`querySelector\\(\\s*(['"])#${id}\\1\\s*\\)`, 'g');
        js = js.replace(regexQuery, (match, quote) => {
            replaceCount++;
            return `querySelector(${quote}#cel-${id}${quote})`;
        });

        // Mẫu 3: querySelectorAll('#id')
        const regexQueryAll = new RegExp(`querySelectorAll\\(\\s*(['"])#${id}\\1\\s*\\)`, 'g');
        js = js.replace(regexQueryAll, (match, quote) => {
            replaceCount++;
            return `querySelectorAll(${quote}#cel-${id}${quote})`;
        });

        // Mẫu 4: classList hoặc các chuỗi ID thô trong các trường hợp đặc biệt (nhưng phải cẩn thận tránh replace nhầm từ thông thường)
        // Ví dụ: trong code có thể có document.querySelector('.mobile-arrow') nhưng ID thì bắt đầu bằng #.
        // Có trường hợp nào nó gán el.id = 'layoutEditor' không?
        // Ta bắt mẫu el.id = 'layoutEditor' hoặc el.id = "layoutEditor"
        const regexElId = new RegExp(`\\.id\\s*=\\s*(['"])${id}\\1`, 'g');
        js = js.replace(regexElId, (match, quote) => {
            replaceCount++;
            return `.id = ${quote}cel-${id}${quote}`;
        });
    });

    fs.writeFileSync('CelestialEngine.js', js);
    console.log(`Cập nhật ID trong CelestialEngine.js thành công! Đã thay thế ${replaceCount} chỗ.`);

} catch (e) {
    console.error("Lỗi cập nhật CelestialEngine.js:", e);
}
