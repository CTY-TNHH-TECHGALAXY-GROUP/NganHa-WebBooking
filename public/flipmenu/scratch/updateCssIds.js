const fs = require('fs');

try {
    let css = fs.readFileSync('celestial-style.css', 'utf8');

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
        // Tìm và thay thế dạng selector #ID (không đi liền sau bằng chữ cái/số để tránh trùng lặp một phần của ID khác)
        const regex = new RegExp(`#${id}(?!\\w)`, 'g');
        css = css.replace(regex, () => {
            replaceCount++;
            return `#cel-${id}`;
        });
    });

    fs.writeFileSync('celestial-style.css', css);
    console.log(`Cập nhật ID trong celestial-style.css thành công! Đã thay thế ${replaceCount} chỗ.`);

} catch (e) {
    console.error("Lỗi cập nhật celestial-style.css:", e);
}
