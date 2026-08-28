const fs = require('fs');

try {
    let content = fs.readFileSync('FlipMenu.js', 'utf8');

    // Tìm và thay thế logic bên trong selectBookMode
    const oldCodeStart = "function selectBookMode(mode, clickX = 3) {";
    
    // Do cấu trúc của selectBookMode có chứa setTimeout, ta thay thế cả khối
    const newCode = `function selectBookMode(mode, clickX = 3) {
      if (state.stage !== -1) return;
      
      // Khởi động trạng thái xuyên qua sách
      if(state.isFlyingThrough) return;
      state.isFlyingThrough = true;
      isTransitioningBook = true;

      // Ẩn 2 nút bấm chuyển trang
      const btnPrev = document.getElementById('btn-prev');
      const btnNext = document.getElementById('btn-next');
      if(btnPrev) { btnPrev.style.pointerEvents = 'none'; btnPrev.style.opacity = '0'; }
      if(btnNext) { btnNext.style.pointerEvents = 'none'; btnNext.style.opacity = '0'; }

      // Khóa tương tác chuột
      document.body.style.pointerEvents = 'none';

      // Lao thẳng camera xuyên thủng giấy bằng GSAP
      window.gsap.to(camTargetPos, { 
          z: -5,
          x: 0,
          y: 0,
          duration: 1.5, 
          ease: 'power2.inOut',
          onComplete: () => {
               // Phát sự kiện ra ngoài (báo cho AppManager tải Celestial v56)
               if(typeof MENU_CONFIG !== 'undefined' && MENU_CONFIG.onItemSelected) {
                   MENU_CONFIG.onItemSelected("all");
               }
          }
      });
    }`;

    // Replace old function with new one using regex.
    // The old function ends with `updateHover();\n      }, 1000);\n    }`
    const regex = /function selectBookMode\(mode, clickX = 3\) \{[\s\S]*?updateHover\(\);\s*\}, 1000\);\s*\}/;
    
    if (regex.test(content)) {
        content = content.replace(regex, newCode);
        fs.writeFileSync('FlipMenu.js', content);
        console.log("Fixed selectBookMode successfully.");
    } else {
        console.log("Could not find selectBookMode pattern.");
    }

} catch(e) {
    console.error(e);
}
