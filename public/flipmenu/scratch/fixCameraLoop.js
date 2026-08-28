const fs = require('fs');
try {
    let content = fs.readFileSync('FlipMenu.js', 'utf8');

    // Tìm và thay thế khối lệnh ở dòng 1908
    const oldBlockRegex = /if \(\(state\.stage === -1 \|\| isTransitioningBook\) && !state\.isFlyingThrough\) \{[\s\S]*?if\(state\.isFlyingThrough\) \{[\s\S]*?\}\s*targetCam\.x \+= targetCenterX \+ pointer\.x \* 2;\s*targetCam\.y \+= pointer\.y \* 1;[\s\S]*?targetLook\.copy\(camTargetLookAt\);\s*targetLook\.x \+= targetCenterX;[\s\S]*?\}\s*\}/;
    
    const newBlock = `if (state.stage === -1 || isTransitioningBook) {
        if (state.isFlyingThrough) {
            targetCam.copy(camTargetPos);
            targetLook.copy(camTargetLookAt);
        } else {
            let targetCenterX = 0;
            if (typeof currentLeafIndex !== 'undefined') {
                if (currentLeafIndex === 0) targetCenterX = 3;
                else if (currentLeafIndex === 3) targetCenterX = -3;
            }

            targetCam.copy(camTargetPos);
            targetCam.x += targetCenterX + pointer.x * 2;
            targetCam.y += pointer.y * 1;

            targetLook.copy(camTargetLookAt);
            targetLook.x += targetCenterX;

            if (typeof responsiveKey === 'function') {
                const rk = responsiveKey();
                if (rk === 'mobile') targetCam.z += 10;
                else if (rk === 'tabletPortrait') targetCam.z += 5;
            }
        }
    }`;

    if(oldBlockRegex.test(content)) {
        content = content.replace(oldBlockRegex, newBlock);
        fs.writeFileSync('FlipMenu.js', content);
        console.log("Fixed camera loop override!");
    } else {
        console.log("Could not find the target block with Regex.");
    }
} catch(e) {
    console.error(e);
}
