const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');

    // Tách phần chứa khối celestial-app ra để tránh thay thế nhầm vào khối app (của cuốn sách)
    const startIndex = html.indexOf('<div id="celestial-app"');
    const endIndex = html.indexOf('</script>', startIndex);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error("Không tìm thấy khối #celestial-app trong index.html");
    }

    let celestialPart = html.substring(startIndex, endIndex);

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

    // Thực hiện thay thế id="..." thành id="cel-..."
    idsToPrefix.forEach(id => {
        const regex = new RegExp(`id="${id}"`, 'g');
        celestialPart = celestialPart.replace(regex, `id="cel-${id}"`);
    });

    // Ghép lại vào html gốc
    html = html.substring(0, startIndex) + celestialPart + html.substring(endIndex);

    // Cập nhật lại phần CSS định vị z-index và position của scene-celestial trong thẻ style (đầu index.html)
    html = html.replace('#scene, #scene-celestial,', '#scene, #cel-scene-celestial,');
    html = html.replace('#scene, #scene-celestial { z-index: 1;', '#scene, #cel-scene-celestial { z-index: 1;');

    fs.writeFileSync('index.html', html);
    console.log("Cập nhật ID trong index.html thành công!");

} catch (e) {
    console.error("Lỗi cập nhật index.html:", e);
}
