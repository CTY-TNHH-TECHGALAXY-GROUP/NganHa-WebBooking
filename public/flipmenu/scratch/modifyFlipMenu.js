const fs = require('fs');

try {
    let c = fs.readFileSync('FlipMenu.js', 'utf8');

    // 1. Tắt hiệu ứng Thiên hà cũ
    c = c.replace('const showConstellation = state.stage !== -1;', 'const showConstellation = false; // TẮT HIỆU ỨNG CŨ');

    // 2. Định nghĩa Regex tìm hàm selectCategory
    // Hàm cũ trông như sau:
    // function selectCategory(id) {
    //   ... buildUI() ... updateTargets() ...
    // }
    // Thay vì dùng regex mạo hiểm, ta tìm chuỗi "function selectCategory(id) {"
    // và cắt bỏ nội dung của nó.

    const targetCode = `function selectCategory(id) {
        // Bắt đầu hiệu ứng bay xuyên sách
        if(state.isFlyingThrough) return;
        state.isFlyingThrough = true;
        
        // Disable document scrolling/interaction if needed
        document.body.style.pointerEvents = 'none';

        // Camera lao tới xuyên qua sách
        // Dùng camTargetPos để vòng lặp animate() nội bộ tự động đưa camera tiến lên
        window.gsap.to(camTargetPos, { 
            z: -5,  // Tiến qua mặt Z=0
            x: 0, 
            y: 0, 
            duration: 1.5, 
            ease: 'power2.inOut',
            onComplete: () => {
                 // Phát sự kiện ra ngoài báo hiệu xong hiệu ứng xuyên
                 if(MENU_CONFIG && MENU_CONFIG.onItemSelected) {
                     MENU_CONFIG.onItemSelected(id);
                 }
            }
        });
      }`;

    // Regex match function selectCategory(id) { ... } (non-greedy)
    const regex = /function selectCategory\(id\) \{[\s\S]*?\}\s*,\s*prefersReducedMotion \? 90 : 990\);\s*\}/;

    // NẾu không tìm thấy, thử regex nới lỏng hơn
    if (regex.test(c)) {
        c = c.replace(regex, targetCode);
    } else {
        // Dự phòng: Có thể hàm đã bị thay đổi cấu trúc hoặc không match
        // Thay vì replace toàn bộ khối, ta thay thế thân hàm
        c = c.replace(/function selectCategory\(id\) \{[\s\S]*?buildUI\(\);\s*\},\s*prefersReducedMotion\s*\?\s*90\s*:\s*990\);\s*\}/, targetCode);
    }

    // Để vòng lặp animate() không ghi đè vị trí camera khi đang bay xuyên qua:
    // Chỉnh sửa logic cập nhật camera trong animate()
    c = c.replace(
        /if \(state\.stage === -1 \|\| isTransitioningBook\) \{([\s\S]*?)targetCam\.copy\(camTargetPos\);/g,
        `if ((state.stage === -1 || isTransitioningBook) && !state.isFlyingThrough) {$1targetCam.copy(camTargetPos);`
    );
    // Khi đang bay, ta vẫn phải để camera update
    c = c.replace(
        /targetCam\.copy\(camTargetPos\);/g,
        `targetCam.copy(camTargetPos);\n        if(state.isFlyingThrough) {\n            targetCam.x = camTargetPos.x;\n            targetCam.y = camTargetPos.y;\n            targetCam.z = camTargetPos.z;\n        }`
    )


    fs.writeFileSync('FlipMenu.js', c);
    console.log("Xong bước inject Fly-Through!");
} catch (e) {
    console.error(e);
}
