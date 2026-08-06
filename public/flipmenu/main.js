    import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { createCelestialPlanetCore, createSpatialOrbitRings } from "./src/celestial-planet.js";

    function random() {
      return Math.random();
    }

    // GLOBAL ERROR CATCHER FOR DEBUGGING
    window.addEventListener('error', function(e) {
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.width = '100vw';
      errorDiv.style.padding = '20px';
      errorDiv.style.background = 'rgba(255, 0, 0, 0.9)';
      errorDiv.style.color = 'white';
      errorDiv.style.zIndex = '999999';
      errorDiv.style.fontFamily = 'monospace';
      errorDiv.style.fontSize = '16px';
      errorDiv.style.pointerEvents = 'none';
      errorDiv.innerHTML = `<b>LỖI JAVASCRIPT:</b><br>${e.message}<br>File: ${e.filename}<br>Line: ${e.lineno}:${e.colno}`;
      document.body.appendChild(errorDiv);
    });
    window.addEventListener('unhandledrejection', function(e) {
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '100px';
      errorDiv.style.left = '0';
      errorDiv.style.width = '100vw';
      errorDiv.style.padding = '20px';
      errorDiv.style.background = 'rgba(255, 100, 0, 0.9)';
      errorDiv.style.color = 'white';
      errorDiv.style.zIndex = '999999';
      errorDiv.style.fontFamily = 'monospace';
      errorDiv.style.fontSize = '16px';
      errorDiv.style.pointerEvents = 'none';
      errorDiv.innerHTML = `<b>LỖI PROMISE (Bất đồng bộ):</b><br>${e.reason}`;
      document.body.appendChild(errorDiv);
    });


    // ==========================================
    // ⚙️ BOOK SETTINGS (THÔNG SỐ CÀI ĐẶT SÁCH) ⚙️
    // ==========================================
    const PAGE_SPACING = 0.012;   // Độ dày của mỗi trang giấy
    // ==========================================
    // 🔧 CẤU HÌNH SÁCH MENU (THAY ĐỔI TẠI ĐÂY)
    // ==========================================
    const MENU_CONFIG = {
      // Số lượng trang sách (độ dày của sách). Lưu ý: Nên là số chẵn.
      // 42 trang nghĩa là 1 trang bìa trước, 1 trang bìa sau, và 40 trang ruột.
      // Số lượng trang sách (Độ dày của sách). Lưu ý: Nên là số chẵn.
      // 42 trang nghĩa là 1 trang bìa trước, 1 trang bìa sau, và 40 trang ruột.
      totalPages: 42,
      
      // Các hình ảnh hiển thị ở trang "Hình ảnh phòng Spa" (Trang bên phải)
      roomImagesPage: 21, // Trang số 21
      roomImages: [
        '../public/images/services/thai.png',
        '../public/images/services/hotstone.png',
        '../public/images/services/aroma-oil.png'
      ],
      
      // Các hình ảnh hiển thị ở trang "Hình ảnh đồ nghề" (Trang bên phải)
      toolsImagesPage: 22, // Trang số 22
      toolsImages: [
        '../public/images/services/facial.png',
        '../public/images/services/coconut-oil.png',
        '../public/images/services/ear-clean.png'
      ]
    };
    
    const FAKE_THICKNESS = MENU_CONFIG.totalPages;
    const BOOK_ARCH_AMOUNT = 0.25; // Độ cong vòm của trang sách

    const PAGE_BG_IMAGES = [
      'cover1.png', // 0: Front Cover Outside
      '',           // 1: Page 1 Front
      '',           // 2: Page 1 Back
      '',           // 3: Page 2 Front
      '',           // 4: Page 2 Back
      'cover2.png'  // 5: Back Cover Outside
    ];
    // ==========================================

    const GOLD = {
      shadow: new THREE.Color("#7d5422"),
      bronze: new THREE.Color("#9d7136"),
      main: new THREE.Color("#d1a65b"),
      highlight: new THREE.Color("#f1dfb0"),
      bright: new THREE.Color("#fff0bd"),
    };

    function configureCanvasTexture(texture) {
      texture.flipY = false;
      texture.premultiplyAlpha = false;
      texture.repeat.y = -1;
      texture.offset.y = 1;
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    const categoryIcons = {
      body: "/category-icons-svg/body-massage.svg",
      foot: "/category-icons-svg/foot-massage.svg",
      hair: "/category-icons-svg/hair-wash.svg",
      facial: "/category-icons-svg/facial-care.svg",
      heel: "/category-icons-svg/heel-care.svg",
      ear: "/category-icons-svg/ear-care.svg",
      nail: "/category-icons-svg/nail-care.svg",
    };

    const categories = [
        {
          id: "body-massage",
          name: "Body Massage",
          shortName: "Body",
          subtitle: "Thư giãn toàn thân",
          icon: { src: categoryIcons.body, alt: "Body Massage", mode: "original", fit: "contain", scale: 0.88, offsetY: -0.04, removeBackground: true },
          tags: ["body-care", "relaxation", "therapy"],
          size: 2.06,
          position: {
            largeDesktop: { x: -1.64, y: -0.1, z: 1.34, scale: 0.98, rx: -0.1, ry: 0.32, rz: -0.052 },
            desktop: { x: -1.5, y: -0.12, z: 1.18, scale: 0.92, rx: -0.096, ry: 0.28, rz: -0.046 },
            laptop: { x: -1.26, y: -0.16, z: 0.92, scale: 0.82, rx: -0.082, ry: 0.22, rz: -0.034 },
            tabletLandscape: { x: -1.0, y: -0.18, z: 0.72, scale: 0.72, rx: -0.068, ry: 0.16, rz: -0.024 },
            tabletPortrait: { x: -0.58, y: 0.74, z: 0.38, scale: 0.62, rx: -0.052, ry: 0.12, rz: -0.016 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "lotus", icon: { src: "/assets/icons/add-more.webp", alt: "Lotus", mode: "gold-mask", scale: 0.84 }, angle: 18, distance: 1.45, size: 0.28, orbitSpeed: 0.16 },
            { id: "hand", icon: { src: "/images/services/aroma-oil.png", alt: "Aroma oil", mode: "gold-mask", scale: 0.8 }, angle: 182, distance: 1.65, size: 0.25, orbitSpeed: 0.12 },
            { id: "oil", icon: { src: "/images/services/coconut-oil.png", alt: "Coconut oil", mode: "gold-mask", scale: 0.74 }, angle: 318, distance: 1.5, size: 0.23, orbitSpeed: 0.14 },
          ],
                    services: [
            { id: "body-aroma-60", name: "Massage Aroma Thư Giãn", description: "Liệu trình tinh dầu nhẹ nhàng giúp cơ thể thả lỏng và phục hồi năng lượng.", duration: 60, price: 520000, image: { src: "/images/services/aroma-oil.png", alt: "Massage aroma", mode: "original", fit: "cover", focalPointY: 45 }, badge: "Signature" },
            { id: "body-deep-90", name: "Massage Body Chuyên Sâu", description: "Tập trung vùng cổ, vai, lưng với lực trị liệu chậm và chắc.", duration: 90, price: 780000, image: { src: "/images/body-treatment-full.png", alt: "Massage body", mode: "original", fit: "cover" } }
          ],
        },
        {
          id: "ear-care",
          name: "Ráy Tai",
          subtitle: "Êm sạch tinh tế",
          icon: { src: categoryIcons.ear, alt: "Ráy Tai", mode: "original", fit: "contain", scale: 0.82, removeBackground: true },
          tags: ["relaxation", "therapy"],
          size: 1.9,
          position: {
            largeDesktop: { x: 0.12, y: 0.58, z: 0.36, scale: 0.72, rx: 0.04, ry: -0.08, rz: 0.018 },
            desktop: { x: 0.08, y: 0.52, z: 0.3, scale: 0.68, rx: 0.036, ry: -0.07, rz: 0.016 },
            laptop: { x: 0.02, y: 0.46, z: 0.2, scale: 0.62, rx: 0.032, ry: -0.055, rz: 0.014 },
            tabletLandscape: { x: -0.04, y: 0.42, z: 0.08, scale: 0.56, rx: 0.028, ry: -0.04, rz: 0.012 },
            tabletPortrait: { x: 0.6, y: 0.68, z: -0.28, scale: 0.54, rx: 0.025, ry: -0.025, rz: 0.012 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "leaf", icon: { src: "/assets/icons/earclean.webp", alt: "Ear care", mode: "gold-mask", scale: 0.7 }, angle: 24, distance: 0.95, size: 0.18, orbitSpeed: 0.22 },
            { id: "tool", icon: { src: "/assets/icons/add-more.webp", alt: "Care", mode: "gold-mask", scale: 0.7 }, angle: 248, distance: 0.82, size: 0.16, orbitSpeed: 0.18 },
          ],
                    services: [
            { id: "ear-clean-soft", name: "Ráy Tai Êm Dịu", description: "Chăm sóc tai bằng kỹ thuật nhẹ, sạch và thư giãn.", duration: 35, price: 280000, image: { src: "/images/services/ear-clean.png", alt: "Ráy tai", mode: "original", fit: "cover" } }
          ],
        },
        {
          id: "hair-wash",
          name: "Gội Đầu",
          subtitle: "Dưỡng da đầu",
          icon: { src: categoryIcons.hair, alt: "Gội Đầu", mode: "original", fit: "contain", scale: 0.82, removeBackground: true },
          tags: ["hair-care", "relaxation"],
          size: 1.48,
          position: {
            largeDesktop: { x: 1.42, y: 0.52, z: -0.22, scale: 0.72, rx: -0.1, ry: -0.32, rz: 0.06 },
            desktop: { x: 1.3, y: 0.48, z: -0.24, scale: 0.66, rx: -0.09, ry: -0.28, rz: 0.052 },
            laptop: { x: 1.08, y: 0.44, z: -0.24, scale: 0.6, rx: -0.07, ry: -0.22, rz: 0.038 },
            tabletLandscape: { x: 0.9, y: 0.42, z: -0.18, scale: 0.54, rx: -0.052, ry: -0.16, rz: 0.026 },
            tabletPortrait: { x: -0.58, y: 0.04, z: 0.2, scale: 0.58, rx: -0.038, ry: -0.09, rz: 0.014 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "comb", icon: { src: "/assets/icons/haircut.webp", alt: "Comb", mode: "gold-mask", scale: 0.78 }, angle: 168, distance: 1.45, size: 0.24, orbitSpeed: 0.14 },
            { id: "shampoo", icon: { src: "/images/services/hair-wash.png", alt: "Shampoo", mode: "gold-mask", scale: 0.76 }, angle: 322, distance: 1.42, size: 0.23, orbitSpeed: 0.15 },
            { id: "lotus", icon: { src: "/assets/icons/add-more.webp", alt: "Lotus", mode: "gold-mask", scale: 0.82 }, angle: 8, distance: 1.6, size: 0.25, orbitSpeed: 0.12 },
          ],
                    services: [
            { id: "scalp-herbal-70", name: "Gội Đầu Dưỡng Sinh", description: "Làm sạch da đầu, massage cổ vai gáy và ủ thảo mộc.", duration: 70, price: 490000, image: { src: "/images/services/hair-wash.png", alt: "Gội đầu dưỡng sinh", mode: "original", fit: "cover", focalPointY: 38 }, badge: "Signature" },
            { id: "scalp-premium-90", name: "Gội Đầu Premium", description: "Trọn gói chăm sóc da đầu, cổ vai gáy và thư giãn mắt.", duration: 90, price: 690000, image: { src: "/images/hair-wash.png", alt: "Gội đầu premium", mode: "original", fit: "cover" } }
          ],
        },
        {
          id: "foot-care",
          name: "Chăm Sóc Chân",
          subtitle: "Ấm và nhẹ",
          icon: { src: categoryIcons.foot, alt: "Chăm Sóc Chân", mode: "original", fit: "contain", scale: 0.84, removeBackground: true },
          tags: ["body-care", "therapy"],
          size: 1.96,
          position: {
            largeDesktop: { x: -0.56, y: -1.04, z: 0.78, scale: 0.86, rx: 0.05, ry: 0.1, rz: 0.03 },
            desktop: { x: -0.48, y: -0.94, z: 0.7, scale: 0.8, rx: 0.046, ry: 0.09, rz: 0.024 },
            laptop: { x: -0.38, y: -0.82, z: 0.56, scale: 0.7, rx: 0.038, ry: 0.075, rz: 0.018 },
            tabletLandscape: { x: -0.28, y: -0.72, z: 0.42, scale: 0.62, rx: 0.032, ry: 0.06, rz: 0.012 },
            tabletPortrait: { x: 0.54, y: 0.02, z: -0.12, scale: 0.6, rx: 0.028, ry: 0.075, rz: 0.012 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "bowl", icon: { src: "/images/services/foot-massage.png", alt: "Foot bowl", mode: "gold-mask", scale: 0.72 }, angle: 204, distance: 1.08, size: 0.2, orbitSpeed: 0.17 },
            { id: "leaf", icon: { src: "/assets/icons/add-more.webp", alt: "Leaf", mode: "gold-mask", scale: 0.78 }, angle: 348, distance: 1.05, size: 0.18, orbitSpeed: 0.14 },
          ],
                    services: [
            { id: "foot-herbal-45", name: "Ngâm Chân Thảo Mộc", description: "Ngâm thảo mộc ấm, massage huyệt bàn chân và chăm sóc gót.", duration: 45, price: 360000, image: { src: "/images/services/foot-massage.png", alt: "Ngâm chân", mode: "original", fit: "cover" } }
          ],
        },
        {
          id: "facial-care",
          name: "Chăm Sóc Da Mặt",
          shortName: "Da Mặt",
          subtitle: "Sáng và dịu",
          icon: { src: categoryIcons.facial, alt: "Chăm Sóc Da Mặt", mode: "original", fit: "contain", scale: 0.82, removeBackground: true },
          tags: ["skin-care", "relaxation"],
          size: 1.5,
          position: {
            largeDesktop: { x: 0.62, y: -0.74, z: 0.12, scale: 0.7, rx: 0.06, ry: -0.04, rz: -0.012 },
            desktop: { x: 0.54, y: -0.68, z: 0.08, scale: 0.66, rx: 0.056, ry: -0.038, rz: -0.01 },
            laptop: { x: 0.42, y: -0.6, z: 0.0, scale: 0.58, rx: 0.048, ry: -0.03, rz: -0.008 },
            tabletLandscape: { x: 0.32, y: -0.54, z: -0.04, scale: 0.52, rx: 0.04, ry: -0.026, rz: -0.006 },
            tabletPortrait: { x: -0.54, y: -0.5, z: 0.36, scale: 0.62, rx: 0.038, ry: -0.018, rz: -0.006 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "mask", icon: { src: "/images/services/facial.png", alt: "Mask", mode: "gold-mask", scale: 0.74 }, angle: 42, distance: 1.35, size: 0.22, orbitSpeed: 0.15 },
            { id: "cream", icon: { src: "/images/services/coconut-oil.png", alt: "Cream", mode: "gold-mask", scale: 0.7 }, angle: 186, distance: 1.48, size: 0.23, orbitSpeed: 0.13 },
          ],
                    services: [
            { id: "facial-glow-60", name: "Facial Glow Cấp Ẩm", description: "Làm sạch sâu, massage nâng cơ nhẹ và khóa ẩm dịu da.", duration: 60, price: 560000, image: { src: "/images/services/facial.png", alt: "Facial glow", mode: "original", fit: "cover" }, badge: "Signature" },
            { id: "facial-premium-90", name: "Chăm Sóc Da Premium", description: "Liệu trình da mặt cao cấp với mặt nạ và tinh chất phục hồi.", duration: 90, price: 860000, image: { src: "/images/facial.png", alt: "Chăm sóc da premium", mode: "original", fit: "cover", focalPointY: 42 } }
          ],
        },
        {
          id: "nail-care",
          name: "Chăm Sóc Móng",
          shortName: "Móng",
          subtitle: "Gọn và sạch",
          icon: { src: categoryIcons.nail, alt: "Chăm Sóc Móng", mode: "original", fit: "contain", scale: 0.84, removeBackground: true },
          tags: ["body-care", "therapy"],
          size: 1.44,
          position: {
            largeDesktop: { x: 0.16, y: -1.24, z: -0.1, scale: 0.54, rx: 0.03, ry: -0.09, rz: -0.04 },
            desktop: { x: 0.12, y: -1.1, z: -0.12, scale: 0.5, rx: 0.028, ry: -0.08, rz: -0.032 },
            laptop: { x: 0.06, y: -0.94, z: -0.12, scale: 0.46, rx: 0.024, ry: -0.06, rz: -0.024 },
            tabletLandscape: { x: 0.02, y: -0.78, z: -0.1, scale: 0.44, rx: 0.02, ry: -0.04, rz: -0.014 },
            tabletPortrait: { x: -0.56, y: -0.92, z: -0.1, scale: 0.54, rx: 0.02, ry: -0.045, rz: -0.008 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "spark", icon: { src: "/assets/icons/add-more.webp", alt: "Spark", mode: "gold-mask", scale: 0.72 }, angle: 20, distance: 1.0, size: 0.18, orbitSpeed: 0.17 },
            { id: "care", icon: { src: categoryIcons.heel, alt: "Heel care", mode: "gold-mask", scale: 0.64 }, angle: 222, distance: 0.92, size: 0.17, orbitSpeed: 0.14 },
          ],
                    services: [
            { id: "nail-refresh", name: "Chăm Sóc Móng", description: "Làm sạch, tỉa gọn và dưỡng nhẹ vùng móng tay/chân.", duration: 35, price: 220000, image: { src: "/images/services/foot-massage.png", alt: "Chăm sóc móng", mode: "original", fit: "cover" } }
          ],
        },
        {
          id: "heel-care",
          name: "Chăm Sóc Gót",
          shortName: "Gót",
          subtitle: "Mềm và sáng",
          icon: { src: categoryIcons.heel, alt: "Chăm Sóc Gót", mode: "original", fit: "contain", scale: 0.84, removeBackground: true },
          tags: ["body-care", "therapy"],
          size: 1.44,
          position: {
            largeDesktop: { x: 1.46, y: -0.46, z: -0.24, scale: 0.58, rx: -0.04, ry: -0.12, rz: -0.02 },
            desktop: { x: 1.36, y: -0.44, z: -0.24, scale: 0.54, rx: -0.036, ry: -0.105, rz: -0.018 },
            laptop: { x: 1.14, y: -0.42, z: -0.22, scale: 0.5, rx: -0.032, ry: -0.09, rz: -0.016 },
            tabletLandscape: { x: 0.86, y: -0.4, z: -0.16, scale: 0.46, rx: -0.028, ry: -0.07, rz: -0.012 },
            tabletPortrait: { x: 0.56, y: -0.52, z: -0.22, scale: 0.54, rx: -0.024, ry: -0.075, rz: -0.012 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "brush", icon: { src: "/images/services/aroma-oil.png", alt: "Heel brush", mode: "gold-mask", scale: 0.72 }, angle: 8, distance: 1.12, size: 0.2, orbitSpeed: 0.18 },
            { id: "lotus", icon: { src: "/assets/icons/add-more.webp", alt: "Lotus", mode: "gold-mask", scale: 0.78 }, angle: 312, distance: 1.08, size: 0.2, orbitSpeed: 0.14 },
          ],
                    services: [
            { id: "heel-softening", name: "Dưỡng Gót Chân", description: "Làm mềm vùng gót, chăm sóc da khô và hoàn thiện cảm giác nhẹ chân.", duration: 40, price: 260000, image: { src: "/images/services/foot-massage.png", alt: "Dưỡng gót", mode: "original", fit: "cover" } }
          ],
        },
      ];


    // --- BOOK LOGIC ---
    let bookGroup;
    const leaves = [];
    let currentLeafIndex = 0;
    const PAGE_W = 6;
    const PAGE_H = 9;

    const photoMeshes = [];
    let activePhotoStack = null;

    function createPhotoStack(parentLeaf, imageUrls, type) {
      const stackGroup = new THREE.Group();
      stackGroup.position.set(PAGE_W / 2, 0.05, 0);
      stackGroup.rotation.x = -Math.PI / 2;

      imageUrls.forEach((url, idx) => {
        const tex = textureLoader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        const imgGeo = new THREE.PlaneGeometry(3, 4);
        const imgMat = new THREE.MeshStandardMaterial({
          map: tex, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide
        });
        const imgMesh = new THREE.Mesh(imgGeo, imgMat);
        imgMesh.position.z = idx * 0.02;
        imgMesh.rotation.z = (Math.random() - 0.5) * 0.2;

        imgMesh.userData = {
          isPhoto: true,
          baseZ: idx * 0.02,
          baseRotZ: imgMesh.rotation.z,
          type: type,
          url: url,
          idx: idx,
          total: imageUrls.length,
          targetPos: new THREE.Vector3(0, 0, idx * 0.02),
          targetRotZ: imgMesh.rotation.z
        };

        stackGroup.add(imgMesh);
        photoMeshes.push(imgMesh);
      });

      parentLeaf.add(stackGroup);
      parentLeaf.userData.photoStack = stackGroup;
    }

    function scatterPhotoStack(stack) {
      stack.userData.isScattered = true;
      activePhotoStack = stack;
      stack.children.forEach(mesh => {
        const ud = mesh.userData;
        let targetX = 0, targetY = 0, targetRot = 0;
        if (ud.idx === 1) { targetX = -1.8; targetY = -0.6; targetRot = 0.3; }
        if (ud.idx === 2) { targetX = 1.8; targetY = -0.6; targetRot = -0.3; }

        ud.targetPos.set(targetX, targetY, ud.baseZ + 0.3);
        ud.targetRotZ = targetRot;
      });
    }

    function resetPhotoStack(stack) {
      stack.userData.isScattered = false;
      activePhotoStack = null;
      stack.children.forEach(mesh => {
        const ud = mesh.userData;
        ud.targetPos.set(0, 0, ud.baseZ);
        ud.targetRotZ = ud.baseRotZ;
      });
    }

    let isPhotoFocusMode = false;
    function tiltCameraForPhotos() {
      isPhotoFocusMode = true;
      camTargetPos.set(3, 4, 10);
      camTargetLookAt.set(3, 0, 0);
    }
    function resetCameraFromPhotos() {
      isPhotoFocusMode = false;
      camTargetPos.set(0, 5, 20);
      camTargetLookAt.set(0, 0, 0);
    }

    const BOOK_TILT = Math.PI / 4;
    const bookTargetRot = new THREE.Vector3();
    const bookTargetPos = new THREE.Vector3();
    const camTargetPos = new THREE.Vector3(0, 5, 22);
    const camTargetLookAt = new THREE.Vector3(0, 0, 0);
    let pageTextures = [];
    let isTransitioningBook = false;
    let camCurrentLookAt = new THREE.Vector3(0, 0, 0);
    let softMenuBackActive = false;
    let softBookCloseCameraTarget = null;
    let softBookCloseLookTarget = null;
    let bookNavTimer = 0;
    let bookBackTimer = 0;
    const BOOK_NAV_STATE = Object.freeze({
      CLOSED_BOOK: "closedBook",
      OPENING_BOOK: "openingBook",
      OPEN_BOOK: "openBook",
      ENTERING_GALAXY: "enteringGalaxy",
      GALAXY: "galaxy",
      RETURNING_TO_BOOK: "returningToBook",
      CLOSING_BOOK: "closingBook",
    });
    let bookNavState = BOOK_NAV_STATE.CLOSED_BOOK;

    function setBookNavState(nextState) {
      bookNavState = nextState;
      document.body.dataset.bookNavState = nextState;
    }

    function clearBookUiTimers() {
      window.clearTimeout(bookNavTimer);
      window.clearTimeout(bookBackTimer);
      bookNavTimer = 0;
      bookBackTimer = 0;
    }

    function removeBookExitArtifacts({ resetOpacity = true } = {}) {
      const app = document.getElementById("app");
      if (!app) return;
      app.classList.remove(
        "fly-away",
        "book-exit",
        "zoom-out",
        "scene-exit",
        "is-leaving",
        "is-exiting"
      );
      app.style.transform = "translate3d(0, 0, 0) scale(1)";
      app.style.visibility = "visible";
      app.style.filter = "";
      if (resetOpacity) app.style.opacity = "1";
    }

    function drawLotus(ctx, x, y, scale, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(-15, 0, -15, -10);
      ctx.quadraticCurveTo(-5, -15, 0, -5);
      ctx.quadraticCurveTo(5, -15, 15, -10);
      ctx.quadraticCurveTo(15, 0, 0, 10);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(-8, 5, -8, -5);
      ctx.quadraticCurveTo(0, -10, 0, -5);
      ctx.quadraticCurveTo(0, -10, 8, -5);
      ctx.quadraticCurveTo(8, 5, 0, 10);
      ctx.stroke();
      ctx.restore();
    }
    function createPageTexture(pageIndex) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1365; // ~3:4 ratio
      const ctx = canvas.getContext('2d');

      const isCover = pageIndex === 0 || pageIndex === 1;

      // Background
      ctx.fillStyle = isCover ? '#1A1A1A' : '#FCF8F2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle border
      ctx.strokeStyle = isCover ? 'rgba(215, 180, 106, 0.6)' : 'rgba(215, 180, 106, 0.3)';
      ctx.lineWidth = isCover ? 6 : 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      if (isCover) {
        drawLotus(ctx, canvas.width / 2, 120, 3, 'rgba(215, 180, 106, 1)');
        ctx.fillStyle = '#E5C07B';
        ctx.textAlign = 'center';

        if (pageIndex === 0) {
          ctx.font = 'italic 80px "Cormorant Garamond", serif';
          ctx.fillText('ORIA SPA', canvas.width / 2, 500);
          ctx.font = '30px Inter, sans-serif';
          ctx.fillText('Welcome to tranquility', canvas.width / 2, 600);

          const btnW = 340; const btnH = 72;
          const btnX = canvas.width / 2 - btnW / 2; const btnY = 850;
          const grad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
          grad.addColorStop(0, '#F2DCA5'); grad.addColorStop(0.5, '#CCA453'); grad.addColorStop(1, '#A87C31');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(btnX, btnY, btnW, btnH, 36);
          ctx.fill();
          ctx.strokeStyle = '#6A5020'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(btnX + 5, btnY + 5, btnW - 10, btnH - 10, 31);
          ctx.stroke();
          ctx.fillStyle = '#1A1A1A';
          ctx.font = '500 24px Inter, sans-serif';
          ctx.fillText('MỞ SÁCH', canvas.width / 2, btnY + 44);
        } else {
          ctx.font = 'italic 60px "Cormorant Garamond", serif';
          ctx.fillText('Thank You', canvas.width / 2, 450);
          ctx.font = '30px Inter, sans-serif';
          ctx.fillText('We hope to see you soon.', canvas.width / 2, 550);
        }
      } else {
        ctx.fillStyle = '#0B1221';
        ctx.textAlign = 'center';
        
        if (pageIndex === 2) {
          ctx.font = 'italic 70px "Cormorant Garamond", serif';
          ctx.fillText('STANDARD', canvas.width / 2, 300);
          ctx.font = '30px Inter, sans-serif';
          ctx.fillStyle = '#444';
          ctx.fillText("Experience our in-spa treatments.", canvas.width / 2, 450);
          ctx.fillText("Relax your mind and body.", canvas.width / 2, 500);
        } else if (pageIndex === 3) {
          ctx.font = 'italic 40px "Cormorant Garamond", serif';
          ctx.fillText('[ Không gian Spa ]', canvas.width / 2, 800);
          
          // Tải ảnh ngầm và vẽ đè lên trang sách khi tải xong
          const img = new Image();
          img.onload = () => {
            const size = 550;
            // Vẽ ảnh bo tròn góc (nếu cần) hoặc vẽ vuông
            ctx.drawImage(img, canvas.width / 2 - size / 2, 180, size, size);
            if (canvas.textureRef) canvas.textureRef.needsUpdate = true; // Báo sách lật cập nhật lại mực in
          };
          img.src = '/flipmenu/public/images/about-spa.png';

        } else if (pageIndex === 4) {
          ctx.font = 'italic 70px "Cormorant Garamond", serif';
          ctx.fillText('HOMESPA', canvas.width / 2, 300);
          ctx.font = '30px Inter, sans-serif';
          ctx.fillStyle = '#444';
          ctx.fillText("Premium spa at your place.", canvas.width / 2, 450);
          ctx.fillText("We bring relaxation to you.", canvas.width / 2, 500);
        } else if (pageIndex === 5) {
          ctx.font = 'italic 40px "Cormorant Garamond", serif';
          ctx.fillText('[ Thảo mộc & Đồ nghề ]', canvas.width / 2, 800);
          
          // Tải ảnh ngầm và vẽ đè lên trang sách khi tải xong
          const img = new Image();
          img.onload = () => {
            const size = 500;
            ctx.drawImage(img, canvas.width / 2 - size / 2, 220, size, size);
            if (canvas.textureRef) canvas.textureRef.needsUpdate = true; // Báo sách lật cập nhật lại mực in
          };
          img.src = '/flipmenu/public/images/services/hotstone.png';
        }
      }

      if (pageIndex >= 2 && pageIndex <= 5) {
        ctx.font = '24px Inter, sans-serif';
        ctx.fillStyle = '#999';
        const isLeft = (pageIndex % 2 === 0);
        ctx.fillText((pageIndex - 1).toString(), isLeft ? 100 : canvas.width - 100, canvas.height - 80);
      }


      // Images removed to keep the canvas styling

      const tex = configureCanvasTexture(new THREE.CanvasTexture(canvas));
      canvas.textureRef = tex;
      tex.anisotropy = 16;
      return tex;
    }
    function createLeaf(frontTex, backTex, leafIndex, isCover = false) {
      const thickness = isCover ? 0.06 : PAGE_SPACING * 0.9;
      const widthSegment = 40; // Allow cover to bend too
      const geo = new THREE.BoxGeometry(PAGE_W, PAGE_H, thickness, widthSegment, 1, 1);

      const edgeMat = new THREE.MeshStandardMaterial({ color: isCover ? 0x1a1a1a : 0xF0E6CC });
      const coverMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.1 });

      let matFront = new THREE.MeshStandardMaterial({
        map: frontTex, roughness: 0.5, metalness: 0.02, emissive: 0x000000, emissiveIntensity: 0
      });
      let matBack = new THREE.MeshStandardMaterial({
        map: backTex, roughness: 0.5, metalness: 0.02, emissive: 0x000000, emissiveIntensity: 0
      });

      if (isCover && leafIndex === 0) {
        matBack = coverMat; // Inside front cover is dark
      }
      if (isCover && leafIndex > 0) {
        matFront = coverMat; // Inside back cover is dark
      }

      // Do not flip backTex; BoxGeometry already maps -Z face correctly when page is rotated

      // BoxGeometry faces: 0:Right, 1:Left, 2:Top, 3:Bottom, 4:Front(Z), 5:Back(-Z)
      const materials = [edgeMat, edgeMat, edgeMat, edgeMat, matFront, matBack];

      const mesh = new THREE.Mesh(geo, materials);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.rotation.x = -Math.PI / 2; // Lay flat on XZ plane

      // Offset pivot so the left edge of the mesh is at X=0 (the spine)
      mesh.position.x = PAGE_W / 2;

      const group = new THREE.Group();
      group.add(mesh);

      // Stack them to avoid Z-fighting


      group.userData = {
        geo: geo,
        angle: 0,
        targetAngle: 0,
        baseY: group.position.y,
        origPos: geo.attributes.position.clone(),
        isCover: isCover
      };

      return group;
    }
    function turnPage(direction) {
      const middleIndex = Math.floor(FAKE_THICKNESS / 2);
      const REAL_LEAVES_MAX = middleIndex + 2;

      if (direction === 1 && currentLeafIndex < REAL_LEAVES_MAX) {
        if (bookNavState === BOOK_NAV_STATE.CLOSED_BOOK) {
          setBookNavState(BOOK_NAV_STATE.OPENING_BOOK);
        }
        leaves[currentLeafIndex].userData.targetAngle = Math.PI;
        currentLeafIndex++;
        setBookNavState(BOOK_NAV_STATE.OPEN_BOOK);
        setBookNavVisible(true);
        setBookBackVisible(true);
      } else if (direction === -1) {
        if (currentLeafIndex === middleIndex) {
          // Close book animation
          for (let i = 0; i < middleIndex; i++) {
            leaves[i].userData.targetAngle = 0;
          }
          currentLeafIndex = 0;
          setBookNavState(BOOK_NAV_STATE.CLOSED_BOOK);
          setBookNavVisible(false);
          setBookBackVisible(false);
        } else if (currentLeafIndex > middleIndex) {
          currentLeafIndex--;
          leaves[currentLeafIndex].userData.targetAngle = 0;
          setBookNavState(BOOK_NAV_STATE.OPEN_BOOK);
          setBookBackVisible(true);
        }
      }
    }

    function buildBook() {
      bookGroup = new THREE.Group();
      bookGroup.position.set(0, -0.5, 0);
      bookGroup.rotation.x = BOOK_TILT;
      scene.add(bookGroup);

      // Spine - realistic half-cylinder curve
      const spineGeo = new THREE.CylinderGeometry(0.3, 0.3, PAGE_H, 32, 1, false, 0, Math.PI);
      const spineMat = new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.8, metalness: 0.1, emissive: 0x050505, side: THREE.DoubleSide
      });
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.rotation.x = Math.PI / 2; // Lay cylinder along Z axis
      spine.rotation.y = Math.PI; // Face downward
      spine.position.y = 0; // Centered
      bookGroup.add(spine);

      // Gold bands on spine
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xb8893f, metalness: 1, roughness: 0.3, emissive: 0x221100, side: THREE.DoubleSide
      });
      for (let bz = -3.5; bz <= 3.5; bz += 1.75) {
        const bandGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32, 1, false, 0, Math.PI);
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.x = Math.PI / 2;
        band.rotation.y = Math.PI;
        band.position.set(0, 0, bz);
        bookGroup.add(band);
      }

      for (let i = 0; i < 8; i++) {
        pageTextures.push(createPageTexture(i));
      }

      // Total thickness is ~0.6. Center pages around Y=0.
      let currentY = -0.30;
      const middleIndex = Math.floor(FAKE_THICKNESS / 2);
      for (let i = 0; i < FAKE_THICKNESS; i++) {
        let frontTex, backTex;
        let isCover = false;

        if (i === 0) {
          isCover = true;
          frontTex = pageTextures[0]; // Front Cover
          backTex = pageTextures[6]; // Dummy inside
        } else if (i === FAKE_THICKNESS - 1) {
          isCover = true;
          frontTex = pageTextures[7]; // Dummy inside
          backTex = pageTextures[1]; // Back Cover
        } else if (i === middleIndex - 1) { // Left-side page when open
          frontTex = pageTextures[6]; // Dummy
          backTex = pageTextures[2]; // Standard Menu (Left)
        } else if (i === middleIndex) { // Right-side page when open
          frontTex = pageTextures[3]; // Room Image (Right)
          backTex = pageTextures[4]; // Home Spa (Left when turned)
        } else if (i === middleIndex + 1) { // Next right-side page
          frontTex = pageTextures[5]; // Tools Image (Right)
          backTex = pageTextures[7]; // Dummy
        } else {
          frontTex = pageTextures[6]; // Dummy Inner
          backTex = pageTextures[7];
        }

        const leaf = createLeaf(frontTex, backTex, i, isCover);

        const thickness = isCover ? 0.06 : PAGE_SPACING;
        currentY += thickness;
        leaf.position.y = currentY;
        leaf.userData.baseY = currentY;

        if (i === MENU_CONFIG.roomImagesPage) {
          createPhotoStack(leaf, MENU_CONFIG.roomImages, 'standard-room');
          leaf.userData.hasPhotoStack = true;
        } else if (i === MENU_CONFIG.toolsImagesPage) {
          createPhotoStack(leaf, MENU_CONFIG.toolsImages, 'homespa-tools');
          leaf.userData.hasPhotoStack = true;
        }

        leaves.push(leaf);
        bookGroup.add(leaf);
      }
    }

    function setBookNavVisible(isVisible, delay = 0) {
      window.clearTimeout(bookNavTimer);
      bookNavTimer = window.setTimeout(() => {
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        [btnPrev, btnNext].forEach((button) => {
          if (!button) return;
          button.style.opacity = isVisible ? '1' : '0';
          button.style.pointerEvents = isVisible ? 'auto' : 'none';
        });
        bookNavTimer = 0;
      }, delay);
    }

    function setBookBackVisible(isVisible, delay = 0) {
      window.clearTimeout(bookBackTimer);
      bookBackTimer = window.setTimeout(() => {
        const button = document.getElementById('btn-back-book');
        if (!button) return;
        button.style.display = isVisible ? 'block' : 'none';
        button.style.opacity = isVisible ? '1' : '0';
        button.style.pointerEvents = isVisible ? 'auto' : 'none';
        button.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
        button.tabIndex = isVisible ? 0 : -1;
        bookBackTimer = 0;
      }, delay);
    }

    function resetOuterBookScene() {
      removeBookExitArtifacts();
      state.isFlyingThrough = false;
      softBookCloseCameraTarget = null;
      softBookCloseLookTarget = null;
      if (!bookGroup) return;
      bookGroup.visible = true;
      bookTargetPos.set(0, -0.5, 0);
      bookTargetRot.set(BOOK_TILT, 0, 0);
      bookGroup.position.copy(bookTargetPos);
      bookGroup.rotation.set(BOOK_TILT, 0, 0);
    }

    function cancelGalaxyLifecycle() {
      window.clearTimeout(state.revealTimer);
      state.serviceRevealAt = 0;
      state.cartOpen = false;
      state.isFlyingThrough = false;
      document.body.style.cursor = "default";
    }

    function openBookToMiddle() {
      if (bookNavState === BOOK_NAV_STATE.OPENING_BOOK || bookNavState === BOOK_NAV_STATE.OPEN_BOOK) return;
      setBookNavState(BOOK_NAV_STATE.OPENING_BOOK);
      removeBookExitArtifacts();
      const middleIndex = Math.floor(FAKE_THICKNESS / 2);
      for (let i = 0; i < middleIndex; i++) {
        leaves[i].userData.targetAngle = Math.PI - 0.05;
      }
      currentLeafIndex = middleIndex;
      setBookBackVisible(true, 420);
      setTimeout(() => {
        if (bookNavState !== BOOK_NAV_STATE.OPENING_BOOK) return;
        setBookNavVisible(true);
        setBookNavState(BOOK_NAV_STATE.OPEN_BOOK);
      }, 500);
    }

    function bookAppearsOpen() {
      const middleIndex = Math.floor(FAKE_THICKNESS / 2);
      return bookNavState === BOOK_NAV_STATE.OPEN_BOOK
        || currentLeafIndex >= middleIndex
        || leaves.some((leaf) => (leaf.userData.angle || leaf.userData.targetAngle || 0) > 0.5);
    }

    function softOpenBookView() {
      const rk = typeof responsiveKey === 'function' ? responsiveKey() : 'desktop';
      return {
        cam: new THREE.Vector3(0, rk === 'mobile' ? 4.9 : 4.35, rk === 'mobile' ? 21.5 : 11.4),
        look: new THREE.Vector3(0, -0.12, 0),
      };
    }

    function softClosedCoverView() {
      const rk = typeof responsiveKey === 'function' ? responsiveKey() : 'desktop';
      const viewportHeight = window.innerHeight || 720;
      const isCompactHeight = viewportHeight < 760;
      const desiredZ = rk === 'mobile'
        ? 25.5
        : rk === 'tabletPortrait'
          ? 17.2
          : isCompactHeight
            ? 16.4
            : 15.8;
      const extraZ = rk === 'mobile' ? 10 : rk === 'tabletPortrait' ? 5 : 0;
      return {
        actualCam: new THREE.Vector3(3, rk === 'mobile' ? 5.05 : 4.82, desiredZ),
        actualLook: new THREE.Vector3(3, -0.04, 0),
        baseCam: new THREE.Vector3(0, rk === 'mobile' ? 5.05 : 4.82, desiredZ - extraZ),
        baseLook: new THREE.Vector3(0, -0.04, 0),
      };
    }

    function prepareSoftGalaxyReturn() {
      cancelGalaxyLifecycle();
      clearBookUiTimers();
      resetOuterBookScene();
      setBookNavState(BOOK_NAV_STATE.RETURNING_TO_BOOK);
      const middleIndex = Math.floor(FAKE_THICKNESS / 2);
      currentLeafIndex = Math.max(currentLeafIndex, middleIndex);
      leaves.forEach((leaf, index) => {
        const targetAngle = index < currentLeafIndex ? Math.PI - 0.05 : 0;
        leaf.userData.targetAngle = targetAngle;
        leaf.userData.angle = targetAngle;
        leaf.rotation.z = targetAngle;
        leaf.position.y = targetAngle > Math.PI / 2 ? leaf.userData.baseY : -leaf.userData.baseY;
      });
      state.stage = -1;
      pointer.set(0, 0);
      pointerParallax.set(0, 0);
      const view = softOpenBookView();
      camTargetPos.copy(view.cam);
      camera.position.copy(view.cam);
      camTargetLookAt.copy(view.look);
      camCurrentLookAt.copy(view.look);
      camera.lookAt(camCurrentLookAt);
      isTransitioningBook = true;
      softMenuBackActive = true;
      setBookNavVisible(false);
      setBookBackVisible(false);
    }

    function finishSoftGalaxyReturn() {
      if (bookNavState === BOOK_NAV_STATE.CLOSING_BOOK || bookNavState === BOOK_NAV_STATE.CLOSED_BOOK) return;
      softMenuBackActive = false;
      softBookCloseCameraTarget = null;
      softBookCloseLookTarget = null;
      isTransitioningBook = false;
      state.isFlyingThrough = false;
      removeBookExitArtifacts();
      setBookNavState(BOOK_NAV_STATE.OPEN_BOOK);
      document.body.style.pointerEvents = "auto";
      setBookNavVisible(currentLeafIndex !== 0, 80);
      setBookBackVisible(currentLeafIndex !== 0, 80);
    }

    function closeBookToCover() {
      return new Promise((resolve) => {
        if (bookNavState === BOOK_NAV_STATE.CLOSED_BOOK) {
          resolve();
          return;
        }
        if (isTransitioningBook) {
          window.setTimeout(resolve, prefersReducedMotion ? 40 : 220);
          return;
        }

        cancelGalaxyLifecycle();
        clearBookUiTimers();
        resetOuterBookScene();
        setBookNavState(BOOK_NAV_STATE.CLOSING_BOOK);
        const coverView = softClosedCoverView();
        softBookCloseCameraTarget = coverView.actualCam;
        softBookCloseLookTarget = coverView.actualLook;
        isTransitioningBook = true;
        softMenuBackActive = true;
        state.stage = -1;
        document.body.style.pointerEvents = "none";
        setBookNavVisible(false);
        setBookBackVisible(false);

        if (activePhotoStack) {
          resetPhotoStack(activePhotoStack);
          activePhotoStack = null;
        }
        isPhotoFocusMode = false;

        leaves.forEach((leaf) => {
          leaf.userData.targetAngle = 0;
        });
        currentLeafIndex = 0;
        bookGroup.visible = true;
        bookTargetPos.set(0, -0.5, 0);
        bookTargetRot.set(BOOK_TILT, 0, 0);
        camTargetPos.copy(coverView.baseCam);
        camTargetLookAt.copy(coverView.baseLook);
        pointer.set(0, 0);
        pointerParallax.set(0, 0);

        window.setTimeout(() => {
          softMenuBackActive = false;
          softBookCloseCameraTarget = null;
          softBookCloseLookTarget = null;
          isTransitioningBook = false;
          removeBookExitArtifacts();
          setBookNavState(BOOK_NAV_STATE.CLOSED_BOOK);
          document.body.style.pointerEvents = "auto";
          resolve();
        }, prefersReducedMotion ? 40 : 1580);
      });
    }

    function selectBookMode(mode, clickX = 3) {
      if (state.stage !== -1) return;
      setBookNavState(BOOK_NAV_STATE.ENTERING_GALAXY);
      isTransitioningBook = true;
      setBookNavVisible(false);

      const targetX = clickX > 0 ? 3 : -3;
      camTargetPos.set(targetX, 0.65, 5.8);
      camTargetLookAt.set(targetX * 0.36, -0.1, 0);

      setTimeout(() => {
        bookGroup.visible = false;

        camTargetPos.set(0, 5, 20);
        camTargetLookAt.set(0, 0, 0);

        state.stage = "categories";
        setBookNavState(BOOK_NAV_STATE.GALAXY);
        updateTargets();

        isTransitioningBook = false;
        document.querySelector('.hud').style.display = 'block';
        setBookBackVisible(true, 50);

        updateHover();
      }, prefersReducedMotion ? 80 : 760);
    }

    const state = {
      stage: -1,
      experienceId: "luxury-spa",
      categoryId: null,
      serviceId: null,
      mobileIndex: 0,
      cart: [],
      cartOpen: false,
      noticeTimer: null,
      focusStartedAt: 0,
      focusDuration: 1280,
      serviceRevealAt: 0,
      selectedFromId: null,
    };

    const BOOK_NOW_CONFIG = { route: "/booking", openMode: "new-window" };
    const CART_DUPLICATE_MODE = "increase-quantity";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const embeddedBookShell = new URLSearchParams(window.location.search).get("shell") === "book";
    const canvas = document.getElementById("scene");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (embeddedBookShell) renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    if (embeddedBookShell) {
      scene.background = null;
      scene.fog = new THREE.FogExp2("#120d08", 0.018);
    } else {
      scene.background = new THREE.Color("#01040a");
      scene.fog = new THREE.FogExp2("#01040a", 0.027);
    }

    const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.1, 8.5);

    const root = new THREE.Group();
    scene.add(root);

    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 10),
      new THREE.ShadowMaterial({ color: "#000000", opacity: 0.08, transparent: true })
    );
    shadowCatcher.position.set(0, 0, -2.8);
    shadowCatcher.receiveShadow = true;
    shadowCatcher.renderOrder = -3;
    scene.add(shadowCatcher);

    const textureLoader = new THREE.TextureLoader();
    const svgLoader = new SVGLoader();
    const svgDataCache = new Map();
    const svgGeometryCache = new Map();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(99, 99);
    const pointerParallax = new THREE.Vector2();
    const lockedOverviewParallax = new THREE.Vector2(0, 0);
    const medallions = new Map();
    const clickable = [];
    const clock = new THREE.Clock();
    const cameraVelocity = new THREE.Vector3();
    const cameraLook = new THREE.Vector3(0, 0, 0);
    const cameraLookVelocity = new THREE.Vector3();
    const overviewCamera = {
      position: new THREE.Vector3(0, 0, 7.8),
      look: new THREE.Vector3(0, 0, 0),
    };
    const scratchTarget = new THREE.Vector3();
    const hiddenTarget = new THREE.Vector3(0, -8, -6);
    const overviewTargetCache = new Map();
    const ellipseLayoutCache = new Map();
    const connectionTrails = new THREE.Group();
    connectionTrails.visible = false;
    connectionTrails.renderOrder = 0;
    root.add(connectionTrails);
    const milkyWayStreams = [];
    const orbitalSystem = {
      group: new THREE.Group(),
      curve: null,
      params: null,
      baseLine: null,
      trails: [],
      particles: null,
    };
    orbitalSystem.group.visible = false;
    orbitalSystem.group.renderOrder = -1;
    root.add(orbitalSystem.group);
    const connectionTrailSpecs = [
      { from: "body-massage", to: "ear-care", arc: 0.46, depth: -0.22, opacity: 0.2 },
      { from: "ear-care", to: "hair-wash", arc: 0.28, depth: -0.28, opacity: 0.18 },
      { from: "ear-care", to: "facial-care", arc: -0.34, depth: -0.12, opacity: 0.2 },
      { from: "body-massage", to: "foot-care", arc: -0.42, depth: -0.1, opacity: 0.18 },
      { from: "foot-care", to: "facial-care", arc: 0.2, depth: -0.16, opacity: 0.22 },
      { from: "facial-care", to: "relaxation-package", arc: -0.2, depth: -0.18, opacity: 0.18 },
      { from: "body-massage", to: "relaxation-package", arc: 0.18, depth: -0.12, opacity: 0.15 },
    ];

    const ambient = new THREE.AmbientLight("#b7a37d", 0.5);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight("#7e97bf", "#211409", 0.6);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight("#f0d0a0", 2.4);
    keyLight.position.set(-5.4, 6.8, 6.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight("#c58a45", 0.24, 9);
    rimLight.position.set(-1.2, -4.4, 3.2);
    scene.add(rimLight);

    const coolBackLight = new THREE.DirectionalLight("#7f99bd", 0.34);
    coolBackLight.position.set(6.5, 3.4, -5.4);
    scene.add(coolBackLight);

    const goldKicker = new THREE.PointLight("#d8a552", 0.18, 7.5);
    goldKicker.position.set(3.6, -1.9, 3.4);
    scene.add(goldKicker);

    function makeStoneTexture() {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      const img = ctx.createImageData(c.width, c.height);
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const wave = Math.sin(x * 0.035 + y * 0.014) * 5 + Math.sin((x + y) * 0.018) * 4;
          const grain = (Math.random() - 0.5) * 18;
          const v = Math.max(14, Math.min(42, 26 + wave + grain));
          img.data[i] = v;
          img.data[i + 1] = v + 3;
          img.data[i + 2] = v + 7;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const vignette = ctx.createRadialGradient(256, 230, 40, 256, 256, 260);
      vignette.addColorStop(0, "rgba(255,255,255,0.05)");
      vignette.addColorStop(0.55, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.34)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 512, 512);
      const texture = configureCanvasTexture(new THREE.CanvasTexture(c));
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      return texture;
    }

    const stoneTexture = makeStoneTexture();

    const materials = {
      gold: new THREE.MeshPhysicalMaterial({ color: "#b8893f", roughness: 0.34, metalness: 0.92, clearcoat: 0.18, clearcoatRoughness: 0.32, reflectivity: 0.42 }),
      goldWarm: new THREE.MeshPhysicalMaterial({ color: "#d7b06a", roughness: 0.32, metalness: 0.9, clearcoat: 0.2, clearcoatRoughness: 0.3, reflectivity: 0.46 }),
      goldShadow: new THREE.MeshPhysicalMaterial({ color: "#5d3a18", roughness: 0.48, metalness: 0.86, clearcoat: 0.08, clearcoatRoughness: 0.44 }),
      goldDim: new THREE.MeshStandardMaterial({ color: "#d1ad68", roughness: 0.36, metalness: 0.82, emissive: "#1c1004", emissiveIntensity: 0.04, transparent: true }),
      face: new THREE.MeshPhysicalMaterial({ color: "#171b1f", map: stoneTexture, roughness: 0.78, metalness: 0.18, clearcoat: 0.22, clearcoatRoughness: 0.62, sheen: 0.18 }),
      face2: new THREE.MeshPhysicalMaterial({ color: "#090c11", roughness: 0.5, metalness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.38 }),
      line: new THREE.LineBasicMaterial({ color: "#d1ad68", transparent: true, opacity: 0.14 }),
    };

    function responsiveKey() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 680) return "mobile";
      if (w <= 920 && h > w) return "tabletPortrait";
      if (w <= 1180) return h < w ? "tabletLandscape" : "tabletPortrait";
      if (w <= 1279) return "laptop";
      if (w >= 1600) return "largeDesktop";
      return "desktop";
    }

    function createPlaceholderTexture(label) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 256, 256);
      const bg = ctx.createRadialGradient(128, 118, 20, 128, 128, 120);
      bg.addColorStop(0, "#20242a");
      bg.addColorStop(1, "#080b10");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(128, 128, 112, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(182,150,93,0.44)";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.ellipse(128, 122, 32, 72, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(88, 136, 28, 62, -0.72, 0, Math.PI * 2);
      ctx.ellipse(168, 136, 28, 62, 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "500 18px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "rgba(214,192,146,.58)";
      ctx.textAlign = "center";
      ctx.fillText(label.slice(0, 10), 128, 226);
      const texture = configureCanvasTexture(new THREE.CanvasTexture(c));
      return texture;
    }

    function loadTexture(asset) {
      return new Promise((resolve) => {
        textureLoader.load(
          asset.src,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 4;
            resolve(texture);
          },
          undefined,
          () => {
            console.warn("[Celestial demo] Failed to load asset:", asset.src);
            resolve(createPlaceholderTexture(asset.alt || "asset"));
          }
        );
      });
    }

    function createGoldIconMaterial(texture, asset) {
      const modeIndex = { "gold-mask": 0, "gold-duotone": 1, original: 2, monochrome: 3, cover: 2 }[asset.mode || "gold-mask"] ?? 0;
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: texture },
          uMode: { value: modeIndex },
          uOpacity: { value: asset.opacity ?? 0.78 },
          uKeyBackground: { value: asset.removeBackground ? 1 : 0 },
          uShadow: { value: GOLD.shadow },
          uMain: { value: GOLD.main },
          uHighlight: { value: GOLD.highlight },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
        fragmentShader: `
            uniform sampler2D uMap;
            uniform int uMode;
            uniform float uOpacity;
            uniform float uKeyBackground;
            uniform vec3 uShadow;
            uniform vec3 uMain;
            uniform vec3 uHighlight;
            varying vec2 vUv;
            void main() {
              vec4 tex = texture2D(uMap, vUv);
              float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
              float chroma = max(max(tex.r, tex.g), tex.b);
              float alpha = tex.a;
              if (uKeyBackground > 0.5) {
                float keep = smoothstep(0.08, 0.24, max(lum, chroma));
                alpha *= keep;
              }
              if (uMode == 0) {
                alpha *= smoothstep(0.06, 0.42, max(alpha, 1.0 - lum));
              }
              if (alpha < 0.025) discard;
              vec3 gold = mix(uShadow, uMain, smoothstep(0.0, 0.64, vUv.y));
              gold = mix(gold, uHighlight, smoothstep(0.58, 1.0, vUv.y) * 0.72);
              vec3 color = gold;
              if (uMode == 1) color = mix(uShadow, uHighlight, lum);
              if (uMode == 2) color = tex.rgb;
              if (uMode == 3) color = vec3(lum);
              if (uKeyBackground > 0.5 && uMode == 2) {
                color = mix(min(tex.rgb * 1.55, vec3(1.0)), uHighlight, 0.2);
              }
              gl_FragColor = vec4(color, alpha * uOpacity);
            }
          `,
      });
    }

    function splitTitle(text) {
      if (text === "Body Massage") return ["Body", "Massage"];
      if (text === "Chăm Sóc Da Mặt") return ["Chăm Sóc", "Da Mặt"];
      if (text === "Liệu Trình Thư Giãn") return ["Liệu Trình", "Thư Giãn"];
      if (text === "Chăm Sóc Chân") return ["Chăm Sóc", "Chân"];
      return text.length > 12 ? text.split(" ") : [text];
    }

    function makeTextTexture(lines, options = {}) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = options.color || "#d8c298";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,.5)";
      ctx.shadowBlur = 4;
      const fontSize = options.fontSize || 44;
      ctx.font = `500 ${fontSize}px Abramo, "EB Garamond", Georgia, serif`;
      const arr = Array.isArray(lines) ? lines : [lines];
      const lineHeight = fontSize * 1.08;
      const hasCount = Boolean(options.count);
      const start = c.height / 2 - ((arr.length - 1) * lineHeight) / 2 - (hasCount ? 20 : 0);
      arr.forEach((line, idx) => ctx.fillText(line, c.width / 2, start + idx * lineHeight));
      if (hasCount) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = options.countColor || "#a99672";
        ctx.font = `400 ${Math.round(fontSize * 0.46)}px Abramo, "EB Garamond", Georgia, serif`;
        ctx.fillText(options.count, c.width / 2, start + arr.length * lineHeight + 24);
      }
      const texture = configureCanvasTexture(new THREE.CanvasTexture(c));
      return texture;
    }

    function makeLabelPlane(text, size, y, count) {
      const parts = splitTitle(text).slice(0, 2);
      const texture = makeTextTexture(parts, { fontSize: parts.length > 1 ? 41 : 48, count, color: "#f1dfb0", countColor: "#d1ad68" });
      const group = new THREE.Group();
      const glowMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.88, size * 0.52), glowMaterial);
      glow.scale.setScalar(1.045);
      glow.position.z = -0.002;
      glow.renderOrder = 8;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.84, size * 0.49), material);
      mesh.renderOrder = 9;
      group.add(glow, mesh);
      group.position.set(0, y, 0.116);
      group.userData.textMaterials = [material, glowMaterial];
      return group;
    }

    function makeOrbit(radius, scaleY) {
      const points = [];
      const start = Math.PI * 0.06;
      const end = Math.PI * 1.66;
      for (let i = 0; i <= 128; i++) {
        const a = start + (i / 128) * (end - start);
        points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * scaleY, -0.02));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, materials.line.clone());
      line.rotation.x = -0.18;
      return line;
    }

    function makeFocusHalo(radius, delay = 0) {
      const material = new THREE.MeshBasicMaterial({
        color: "#f5dea2",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(new THREE.RingGeometry(radius * 0.992, radius, 192), material);
      halo.position.z = 0.142 + delay * 0.01;
      halo.userData.delay = delay;
      return halo;
    }

    async function makeIconPlane(asset, width, height) {
      const texture = await loadTexture(asset);
      const image = texture.image || { width: 1, height: 1 };
      const aspect = image.width / Math.max(1, image.height);
      let w = width * (asset.scale ?? 1);
      let h = height * (asset.scale ?? 1);
      if ((asset.fit || "contain") !== "cover") {
        if (aspect > w / h) h = w / aspect;
        else w = h * aspect;
      }
      const material = createGoldIconMaterial(texture, asset);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      mesh.position.set(asset.offsetX || 0, asset.offsetY || 0, 0.108);
      mesh.rotation.z = ((asset.rotation || 0) * Math.PI) / 180;
      return mesh;
    }

    function makeConstellationPattern(radius, seed = 1) {
      const group = new THREE.Group();
      const starMat = new THREE.MeshBasicMaterial({
        color: "#f1dfb0",
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      });
      const dimStarMat = new THREE.MeshBasicMaterial({
        color: "#b8893f",
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      });
      const lineMat = new THREE.LineBasicMaterial({
        color: "#c99c6a",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
      const count = 5 + (seed % 3);
      const pts = [];
      for (let i = 0; i < count; i++) {
        const a = -Math.PI * 0.72 + i * (Math.PI * 1.42 / Math.max(1, count - 1)) + Math.sin(seed * 9.7 + i) * 0.18;
        const d = radius * (0.22 + ((i * 37 + seed * 11) % 44) / 100);
        pts.push(new THREE.Vector3(Math.cos(a) * d, Math.sin(a * 1.08) * d * 0.62, 0.092 + i * 0.001));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);
      pts.forEach((p, index) => {
        const star = new THREE.Mesh(new THREE.CircleGeometry(radius * (index === 0 ? 0.018 : 0.013), 18), index % 2 ? dimStarMat.clone() : starMat.clone());
        star.position.copy(p);
        star.userData.isConstellationStar = true;
        group.add(star);
      });
      return group;
    }

    
    const MEDALLION_FRONT_FACE_Z = 0.074;
    function makeMedallionCore(radius, depth, opacity = 1, categoryId = "body-massage") {
        return createCelestialPlanetCore({ THREE, categoryId, radius, opacity });
      }
    
    
    async function loadSvgData(src) {
        if (svgDataCache.has(src)) return svgDataCache.get(src);
        const promise = svgLoader.loadAsync(src).catch((error) => {
          console.warn("[Celestial demo] Failed to load SVG icon:", src, error);
          throw error;
        });
        svgDataCache.set(src, promise);
        return promise;
      }
    function normalizeSvgGeometries(geometries, targetSize) {
        const box = new THREE.Box3();
        geometries.forEach((geometry) => {
          geometry.computeBoundingBox();
          if (geometry.boundingBox) box.union(geometry.boundingBox);
        });

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const maxDimension = Math.max(size.x, size.y);
        if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
          throw new Error("SVG geometry has an invalid bounding box");
        }

        const fitScale = targetSize / maxDimension;
        geometries.forEach((geometry) => {
          geometry.translate(-center.x, -center.y, -center.z);
          geometry.scale(fitScale, -fitScale, fitScale);
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
        });
      }
    async function createSvgIconGeometries(src, options) {
        const cacheKey = [
          src,
          options.targetSize,
          options.depth,
          options.bevelSize,
          options.bevelThickness,
          options.bevelSegments,
          options.curveSegments,
        ].join("|");
        if (svgGeometryCache.has(cacheKey)) {
          return svgGeometryCache.get(cacheKey).map((geometry) => geometry.clone());
        }

        const svgData = await loadSvgData(src);
        const geometries = [];
        svgData.paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);
          shapes.forEach((shape) => {
            geometries.push(new THREE.ExtrudeGeometry(shape, {
              depth: options.depth,
              bevelEnabled: true,
              bevelThickness: options.bevelThickness,
              bevelSize: options.bevelSize,
              bevelSegments: options.bevelSegments,
              curveSegments: options.curveSegments ?? 18,
            }));
          });
        });

        if (!geometries.length) throw new Error("SVG contains no drawable shapes");
        normalizeSvgGeometries(geometries, options.targetSize);
        svgGeometryCache.set(cacheKey, geometries.map((geometry) => geometry.clone()));
        return geometries;
      }
    function makeNeutralEngravedFallback(targetSize = 0.22) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
          color: "#11161a",
          metalness: 0.08,
          roughness: 0.82,
          transparent: true,
          opacity: 0.72,
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(targetSize * 0.28, targetSize * 0.34, 48), mat);
        ring.receiveShadow = true;
        ring.position.z = 0.078;
        group.add(ring);
        const petalMat = new THREE.MeshStandardMaterial({
          color: "#2a241a",
          metalness: 0.28,
          roughness: 0.68,
          transparent: true,
          opacity: 0.5,
        });
        for (let i = 0; i < 5; i++) {
          const petal = new THREE.Mesh(new THREE.CircleGeometry(targetSize * 0.045, 20), petalMat);
          const a = -Math.PI * 0.5 + (i - 2) * 0.34;
          petal.scale.set(0.7, 1.8, 1);
          petal.position.set(Math.cos(a) * targetSize * 0.08, Math.sin(a) * targetSize * 0.06, 0.086);
          petal.rotation.z = a;
          group.add(petal);
        }
        return group;
      }

    async function makeSvgMedallionIcon(asset, config = {}) {
        const mode = config.mode || "embossed";
        const targetSize = config.targetSize || 0.34;
        const depth = config.depth ?? (mode === "engraved" ? 0.008 : 0.016);
        const bevelSize = config.bevelSize ?? (mode === "engraved" ? 0.0016 : 0.003);
        const bevelThickness = config.bevelThickness ?? (mode === "engraved" ? 0.002 : 0.004);
        const group = new THREE.Group();
        group.userData.isSvgMedallionIcon = true;
        group.userData.mode = mode;

        try {
          const geometries = await createSvgIconGeometries(asset.src, {
            targetSize,
            depth,
            bevelSize,
            bevelThickness,
            bevelSegments: config.bevelSegments ?? 2,
            curveSegments: config.curveSegments ?? 18,
          });

          const material = mode === "engraved"
            ? new THREE.MeshStandardMaterial({
                color: config.color || "#101010",
                metalness: config.metalness ?? 0.1,
                roughness: config.roughness ?? 0.78,
              })
            : new THREE.MeshPhysicalMaterial({
                color: config.color || "#FFE998",
                metalness: config.metalness ?? 0.72,
                roughness: config.roughness ?? 0.2,
                clearcoat: config.clearcoat ?? 0.34,
                clearcoatRoughness: config.clearcoatRoughness ?? 0.18,
                reflectivity: config.reflectivity ?? 0.48,
                emissive: config.emissive || "#57370D",
                emissiveIntensity: config.emissiveIntensity ?? 0.16,
                side: THREE.DoubleSide,
              });

          if (mode !== "engraved") {
            const shadowMaterial = new THREE.MeshStandardMaterial({
              color: config.shadowColor || "#57370D",
              metalness: 0.42,
              roughness: 0.46,
              transparent: true,
              opacity: config.shadowOpacity ?? 0.82,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            geometries.forEach((geometry) => {
              const shadowMesh = new THREE.Mesh(geometry.clone(), shadowMaterial);
              shadowMesh.userData.isCategoryIconShadow = true;
              shadowMesh.position.set(0.018, -0.02, -depth * 0.64);
              shadowMesh.scale.setScalar(1.012);
              shadowMesh.castShadow = false;
              shadowMesh.receiveShadow = false;
              group.add(shadowMesh);
            });
          }

          geometries.forEach((geometry) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = config.castShadow ?? true;
            mesh.receiveShadow = config.receiveShadow ?? (mode === "engraved");
            mesh.position.z = mode === "engraved" ? -depth * 0.58 : 0;
            group.add(mesh);
          });

          if (mode !== "engraved") {
            const highlightMaterial = new THREE.MeshBasicMaterial({
              color: config.highlightColor || "#fff7c8",
              transparent: true,
              opacity: config.highlightOpacity ?? 0.16,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            geometries.forEach((geometry) => {
              const highlightMesh = new THREE.Mesh(geometry.clone(), highlightMaterial);
              highlightMesh.userData.isCategoryIconHighlight = true;
              highlightMesh.position.set(-0.004, 0.006, depth * 0.18);
              highlightMesh.scale.setScalar(1.006);
              highlightMesh.castShadow = false;
              highlightMesh.receiveShadow = false;
              group.add(highlightMesh);
            });

            const glowMaterial = new THREE.MeshBasicMaterial({
              color: config.glowColor || "#FFE998",
              transparent: true,
              opacity: config.glowOpacity ?? 0.18,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            geometries.forEach((geometry) => {
              const glowMesh = new THREE.Mesh(geometry.clone(), glowMaterial);
              glowMesh.userData.isCategoryIconGlow = true;
              glowMesh.scale.setScalar(1.012);
              glowMesh.position.z = depth * 0.08;
              glowMesh.castShadow = false;
              glowMesh.receiveShadow = false;
              group.add(glowMesh);
            });
          }

          if (mode === "engraved") {
            const highlight = new THREE.Group();
            const highlightMaterial = new THREE.MeshStandardMaterial({
              color: "#927448",
              metalness: 0.56,
              roughness: 0.56,
              transparent: true,
              opacity: 0.26,
            });
            geometries.forEach((geometry) => {
              const mesh = new THREE.Mesh(geometry.clone(), highlightMaterial);
              mesh.scale.setScalar(1.006);
              mesh.position.set(-0.002, 0.002, 0.002);
              mesh.receiveShadow = true;
              highlight.add(mesh);
            });
            group.add(highlight);
          }
        }
        catch (error) {
          console.warn("[Celestial demo] Rendering neutral SVG fallback:", asset.src, error);
          group.add(makeNeutralEngravedFallback(targetSize));
        }

        group.position.set(config.offsetX || 0, config.offsetY || 0, config.offsetZ || 0);
        if (config.rotation) group.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
        return group;
      }
    async function makeIconBadge(asset, badgeRadius, iconWidth, iconHeight, options = {}) {
        const group = new THREE.Group();
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(badgeRadius * 1.12, 96),
          new THREE.MeshBasicMaterial({
            color: "#000000",
            transparent: true,
            opacity: options.shadowOpacity ?? 0.24,
            depthWrite: false,
          })
        );
        shadow.position.set(badgeRadius * 0.04, -badgeRadius * 0.06, -0.018);
        group.add(shadow);

        const metal = new THREE.Mesh(
          new THREE.CircleGeometry(badgeRadius, 128),
          new THREE.MeshBasicMaterial({
            color: "#a47a3d",
            transparent: true,
            opacity: options.metalOpacity ?? 0.18,
            depthWrite: false,
          })
        );
        metal.position.z = 0;
        group.add(metal);

        const highlight = new THREE.Mesh(
          new THREE.CircleGeometry(badgeRadius * 0.82, 96),
          new THREE.MeshBasicMaterial({
            color: "#fff0bd",
            transparent: true,
            opacity: options.highlightOpacity ?? 0.06,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        highlight.position.set(0, 0, 0.01);
        highlight.scale.set(0.78, 0.78, 1);
        group.add(highlight);

        const rim = new THREE.Mesh(new THREE.RingGeometry(badgeRadius * 0.94, badgeRadius, 128), materials.goldWarm.clone());
        rim.position.z = 0.02;
        rim.material.opacity = options.rimOpacity ?? 0.42;
        rim.userData.isRimGlint = true;
        group.add(rim);

        const icon = isSvgAsset(asset)
          ? await makeSvgMedallionIcon(asset, {
              mode: options.mode || "engraved",
              targetSize: Math.min(iconWidth, iconHeight) * 0.52,
              offsetZ: 0.052,
              depth: 0.006,
              bevelSize: 0.0012,
              bevelThickness: 0.0016,
              color: "#2a2117",
              metalness: 0.18,
              roughness: 0.76,
              castShadow: false,
              receiveShadow: true,
            })
          : makeNeutralEngravedFallback(Math.min(iconWidth, iconHeight) * 0.62);
        icon.position.z = isSvgAsset(asset) ? icon.position.z : 0.06;
        icon.userData.isForwardIcon = true;
        group.add(icon);

        group.userData.iconHighlight = highlight;
        group.userData.iconRim = rim;
        return group;
      }
    function isSvgAsset(asset) {
        return typeof asset?.src === "string" && asset.src.toLowerCase().split("?")[0].endsWith(".svg");
      }
    function makePrimaryNodeGlow(radius) {
        const group = new THREE.Group();
        const softGlow = new THREE.Mesh(
          new THREE.CircleGeometry(radius * 1.16, 192),
          new THREE.MeshBasicMaterial({
            color: "#d4af37",
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        softGlow.position.z = 0.086;
        softGlow.userData.isPrimaryGlow = true;

        const rimGlow = new THREE.Mesh(
          new THREE.RingGeometry(radius * 0.915, radius * 0.965, 192),
          new THREE.MeshBasicMaterial({
            color: "#d4af37",
            transparent: true,
            opacity: 0.24,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        rimGlow.position.z = 0.108;
        rimGlow.userData.isPrimaryGlow = true;

        group.add(softGlow, rimGlow);
        group.userData.softGlow = softGlow;
        group.userData.rimGlow = rimGlow;
        return group;
      }
    function makeLightStreakRings(radius, categoryId = "body-massage") {
        return createSpatialOrbitRings({ THREE, categoryId, radius });
      }


    async function makeSatellite(item) {
        const group = new THREE.Group();
        group.userData.item = item;
        const core = makeMedallionCore(item.size, 0.07, 0.72);
        group.add(core);
        const badge = await makeIconBadge(item.icon, item.size * 0.36, item.size * 1.02, item.size * 1.02, {
          metalOpacity: 0.12,
          highlightOpacity: 0.04,
          rimOpacity: 0.34,
          shadowOpacity: 0.14,
        });
        badge.position.z = 0.13;
        group.add(badge);
        return group;
      }

    async function makeCategory(category) {
        const group = new THREE.Group();
        group.userData.category = category;
        group.userData.current = new THREE.Vector3();
        group.userData.target = new THREE.Vector3();
        group.userData.opacity = 1;
        group.userData.targetOpacity = 1;
        group.userData.baseScale = 1;
        group.userData.targetScale = 1;
        group.userData.velocity = new THREE.Vector3();
        group.userData.scaleVelocity = 0;
        group.userData.rotationVelocity = new THREE.Vector3();
        group.userData.hover = false;
        group.userData.satellites = [];
        group.userData.orbits = [];

        const radius = category.size / 2;
        const core = makeMedallionCore(radius, 0.2, 1, category.id);
        group.add(core);
        const planetFrontZ = core.userData.frontFaceZ || MEDALLION_FRONT_FACE_Z;

        const primaryGlow = makePrimaryNodeGlow(radius);
        group.add(primaryGlow);
        group.userData.primaryGlow = primaryGlow;

        const iconY = 0;
        const iconConfig = category.icon3D || {};
        const icon = isSvgAsset(category.icon)
          ? await makeSvgMedallionIcon(category.icon, {
              mode: iconConfig.mode || "embossed",
              targetSize: category.size * (iconConfig.scale || 0.28),
              offsetX: iconConfig.offsetX || 0,
              offsetY: iconY + (iconConfig.offsetY || 0),
              offsetZ: planetFrontZ + (iconConfig.offsetZ ?? category.size * 0.075),
              depth: iconConfig.depth ?? 0.016,
              bevelSize: iconConfig.bevelSize ?? 0.003,
              bevelThickness: iconConfig.bevelThickness ?? 0.004,
              bevelSegments: iconConfig.bevelSegments ?? 5,
              curveSegments: iconConfig.curveSegments ?? 18,
              color: iconConfig.color || "#FFE998",
              metalness: iconConfig.metalness ?? 0.66,
              roughness: iconConfig.roughness ?? 0.26,
              emissive: iconConfig.emissive || "#57370D",
              emissiveIntensity: iconConfig.emissiveIntensity ?? 0.4,
              glowColor: iconConfig.glowColor || "#FFE998",
              glowOpacity: iconConfig.glowOpacity ?? 0.36,
              highlightOpacity: iconConfig.highlightOpacity ?? 0.16,
              shadowColor: iconConfig.shadowColor || "#57370D",
              shadowOpacity: iconConfig.shadowOpacity ?? 0.72,
              castShadow: true,
              receiveShadow: false,
            })
          : await makeIconPlane(category.icon, category.size * 0.52, category.size * 0.38);
        if (!isSvgAsset(category.icon)) {
          icon.position.y = iconY;
          icon.position.z = planetFrontZ + category.size * 0.1;
          icon.material.depthTest = false;
        }
        icon.renderOrder = 12;
        icon.userData.isCategoryIcon = true;
        icon.userData.baseZ = icon.position.z;
        group.add(icon);
        group.userData.categoryIcon = icon;

        const label = makeLabelPlane(category.name, category.size, -radius * 1.15);
        const labelOffset = planetLayoutConfigFor(category, "desktop").labelOffset || [0, 0, 0];
        label.position.x += labelOffset[0] || 0;
        label.position.y += labelOffset[1] || 0;
        label.position.z = planetFrontZ + category.size * 0.1;
        label.position.z += labelOffset[2] || 0;
        label.userData.baseZ = label.position.z;
        label.userData.baseScale = 1;
        label.userData.distantOpacity = category.id === "ear-care" || category.id === "nail-care" ? 0.86 : 1;
        group.add(label);
        group.userData.label = label;
        group.userData.planetCore = core;

        const focusHalo = makeFocusHalo(radius * 1.06, 0);
        const focusHaloOuter = makeFocusHalo(radius * 1.13, 0.35);
        group.add(focusHalo, focusHaloOuter);
        group.userData.focusHalos = [focusHalo, focusHaloOuter];

        const lightStreakRings = makeLightStreakRings(category.size * 0.58, category.id);
        group.add(lightStreakRings);
        group.userData.lightStreakRings = lightStreakRings;

        clickable.push(core.userData.frontFace);
        core.userData.frontFace.userData.categoryId = category.id;
        root.add(group);
        medallions.set(category.id, group);
        return group;
      }

    function makeStars() {
      const isMobile = responsiveKey() === "mobile";
      const count = isMobile ? 760 : 2200;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 11.5;
        positions[i * 3 + 2] = -4 - Math.random() * 24;
        const warm = Math.random() > 0.86;
        const color = new THREE.Color(warm ? "#e8c789" : "#9fb9dc");
        const dim = 0.22 + Math.random() * 0.56;
        colors[i * 3] = color.r * dim;
        colors[i * 3 + 1] = color.g * dim;
        colors[i * 3 + 2] = color.b * dim;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({ size: isMobile ? 0.014 : 0.01, vertexColors: true, transparent: true, opacity: 0.76, depthWrite: false });
      const stars = new THREE.Points(geo, mat);
      scene.add(stars);
      return stars;
    }

    function makeNebula() {
      const geo = new THREE.PlaneGeometry(18, 10, 1, 1);
      const mat = new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        transparent: true,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy / vec2(9.0, 5.0), 0.0, 1.0);
            }
          `,
        fragmentShader: `
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              float a = hash(i);
              float b = hash(i + vec2(1., 0.));
              float c = hash(i + vec2(0., 1.));
              float d = hash(i + vec2(1., 1.));
              vec2 u = f * f * (3. - 2. * f);
              return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
            }
            void main() {
              vec2 p = vUv * 3.2 + vec2(uTime * 0.008, -uTime * 0.004);
              float n = noise(p) * 0.55 + noise(p * 2.1) * 0.28 + noise(p * 4.0) * 0.14;
              float band = smoothstep(0.08, 0.72, 1.0 - abs(vUv.y - 0.45) * 2.0);
              float horizon = smoothstep(0.0, 0.34, 1.0 - abs(vUv.y - 0.1) * 3.2);
              vec3 col = mix(vec3(0.005, 0.022, 0.05), vec3(0.045, 0.08, 0.15), n);
              col += vec3(0.04, 0.024, 0.08) * smoothstep(0.54, 0.94, n);
              col += vec3(0.18, 0.115, 0.045) * horizon * (0.25 + n * 0.35);
              gl_FragColor = vec4(col, band * n * 0.48 + horizon * 0.18);
            }
          `,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = -10;
      scene.add(mesh);
      return mesh;
    }

    function makeHorizon() {
      const geo = new THREE.PlaneGeometry(18, 10, 1, 1);
      const mat = new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        transparent: true,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy / vec2(9.0, 5.0), 0.0, 1.0);
            }
          `,
        fragmentShader: `
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            float line(float y, float w) { return smoothstep(w, 0.0, abs(vUv.y - y)); }
            void main() {
              float glow = smoothstep(0.0, 0.5, vUv.y) * smoothstep(0.42, 0.12, vUv.y);
              float drift = sin((vUv.x * 16.0) + uTime * 0.28) * 0.003;
              float water = line(0.115 + drift, 0.004) + line(0.095 - drift, 0.0025) * 0.55;
              float islands = smoothstep(0.25, 0.0, abs(vUv.y - 0.13)) * smoothstep(0.94, 0.28, abs(vUv.x - 0.5));
              vec3 gold = vec3(0.76, 0.48, 0.19);
              vec3 blue = vec3(0.02, 0.05, 0.1);
              vec3 col = mix(blue, gold, water * 0.9 + glow * 0.26);
              float alpha = glow * 0.22 + water * 0.32 + islands * 0.04;
              gl_FragColor = vec4(col, alpha);
            }
          `,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = -8;
      scene.add(mesh);
      return mesh;
    }

    function makeStarGlints() {
      const group = new THREE.Group();
      const points = [
        [-3.7, 1.75, -1.1, 0.12], [-1.15, 1.34, -0.9, 0.08], [1.0, 1.18, -1.2, 0.07],
        [2.25, 0.6, -0.8, 0.1], [-3.0, -0.58, -0.7, 0.09], [-0.9, -0.86, -0.9, 0.07],
        [3.1, -0.84, -0.7, 0.08], [0.15, 1.92, -1.1, 0.06], [3.6, 1.8, -1.2, 0.05],
      ];
      points.forEach(([x, y, z, size], index) => {
        const material = new THREE.LineBasicMaterial({
          color: index % 3 === 0 ? "#f1dfb0" : "#b8893f",
          transparent: true,
          opacity: 0.34,
          blending: THREE.AdditiveBlending,
        });
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0),
          new THREE.Vector3(0, -size * 0.62, 0), new THREE.Vector3(0, size * 0.62, 0),
        ]);
        const glint = new THREE.LineSegments(geo, material);
        glint.position.set(x, y, z);
        glint.userData.phase = index * 0.73;
        group.add(glint);
      });
      scene.add(group);
      return group;
    }

    const stars = makeStars();
    const nebula = makeNebula();
    const horizon = makeHorizon();
    const starGlints = makeStarGlints();

    function categoryMatches() {
      return true;
    }

    function activeFocusMode() {
      return state.stage === "services";
    }

    function focusProgress(now = performance.now()) {
      if (!activeFocusMode() || !state.focusStartedAt) return activeFocusMode() ? 1 : 0;
      return Math.min(1, Math.max(0, (now - state.focusStartedAt) / state.focusDuration));
    }

    function safeWorldBounds(key) {
      const bounds = {
        largeDesktop: { minX: -4.2, maxX: 4.2, minY: -2.95, maxY: 2.75 },
        desktop: { minX: -3.95, maxX: 3.95, minY: -2.72, maxY: 2.54 },
        laptop: { minX: -3.35, maxX: 3.35, minY: -2.38, maxY: 2.24 },
        tabletLandscape: { minX: -2.62, maxX: 2.62, minY: -1.9, maxY: 1.82 },
        tabletPortrait: { minX: -2.15, maxX: 2.15, minY: -1.78, maxY: 1.72 },
        mobile: { minX: -2.32, maxX: 2.32, minY: -1.72, maxY: 1.72 },
      };
      return bounds[key] || bounds.desktop;
      }

      function clampLayoutToSafeZone(layout, key) {
      const bounds = safeWorldBounds(key);
      return {
        ...layout,
        x: THREE.MathUtils.clamp(layout.x, bounds.minX, bounds.maxX),
        y: THREE.MathUtils.clamp(layout.y, bounds.minY, bounds.maxY),
      };
    }

    function addPlanetBreathingRoom(layout, key) {
      const spacing = {
        largeDesktop: { x: 1.06, y: 1.04 },
        desktop: { x: 1.05, y: 1.035 },
        laptop: { x: 1.04, y: 1.03 },
        tabletLandscape: { x: 1.03, y: 1.025 },
        tabletPortrait: { x: 1.04, y: 1.04 },
        mobile: { x: 1, y: 1 },
      }[key] || { x: 1.04, y: 1.03 };
      return {
        ...layout,
        x: layout.x * spacing.x,
        y: layout.y * spacing.y,
      };
    }

    function rawLayoutFor(category, key) {
      const base = category.position[key] || category.position.desktop || category.position.largeDesktop;
      return addPlanetBreathingRoom(base, key);
    }

    function layoutFor(category, key) {
      return clampLayoutToSafeZone(rawLayoutFor(category, key), key);
    }

    function worldRadiusFor(category, layout) {
      const cropFactor = category.id === "body-massage" || category.id === "hair-wash" || category.id === "facial-care" ? 1.18 : 1.08;
      return category.size * cropFactor * layout.scale * 1.035;
    }

    function safePaddingFactor(key) {
      if (key === "mobile") return 1.08;
      if (key === "tabletPortrait") return 1.14;
      if (key === "tabletLandscape") return 1.18;
      if (key === "laptop") return 1.2;
      return 1.24;
    }

    function minOverviewDistance(key) {
      if (key === "mobile") return 3.35;
      if (key === "tabletPortrait") return 3.85;
      if (key === "tabletLandscape") return 4.05;
      if (key === "laptop") return 4.24;
      if (key === "largeDesktop") return 4.34;
      return 4.3;
    }

    function overviewCacheKey(key) {
      return `${key}:${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`;
    }

    function categoryLabelWorldSize(category) {
      return {
        width: category.size * Math.min(1.92, 1.02 + category.name.length * 0.052),
        height: category.size * 0.76,
        offsetY: -(category.size / 2) * 1.15,
      };
    }

    const planetLayoutConfigs = {
      "body-massage": {
        orbitT: 0.515,
        positionOffset: [0.46, 0.12, 0.28],
        scale: 1.2,
        rotation: [-0.1, 0.34, -0.06],
        ringTilt: [-0.36, 0.08, -0.22],
        visualPriority: "primary",
      },
      "foot-care": {
        orbitT: 0.724,
        positionOffset: [0.16, 0.52, -0.34],
        scale: 0.98,
        rotation: [0.06, 0.16, 0.03],
        ringTilt: [0.18, -0.2, 0.18],
        visualPriority: "secondary",
      },
      "ear-care": {
        orbitT: 0.232,
        positionOffset: [0.26, -0.36, 0.86],
        scale: 0.88,
        rotation: [0.02, -0.08, 0.01],
        ringTilt: [-0.2, 0.18, 0.08],
        visualPriority: "secondary",
      },
      "hair-wash": {
        orbitT: 0.115,
        positionOffset: [0.34, -0.14, 0.1],
        scale: 0.74,
        rotation: [-0.1, -0.32, 0.05],
        ringTilt: [-0.45, -0.2, 0.26],
        visualPriority: "supporting",
      },
      "facial-care": {
        orbitT: 0.992,
        positionOffset: [-1.18, 0.22, -0.5],
        scale: 0.72,
        rotation: [0.06, -0.04, -0.02],
        ringTilt: [0.12, 0.28, -0.16],
        visualPriority: "supporting",
      },
      "relaxation-package": {
        orbitT: 0.92,
        positionOffset: [0.04, -0.08, -1.22],
        scale: 0.62,
        rotation: [-0.04, -0.12, -0.02],
        ringTilt: [-0.1, -0.34, 0.2],
        visualPriority: "supporting",
      },
    };

    function ellipseOptionsForKey(key) {
      if (key === "mobile") {
        return { centerX: -0.04, centerY: -0.1, radiusX: 1.9, radiusY: 1.2, depthAmplitude: 0.72, depthPhase: 0.74, scaleMultiplier: 0.56 };
      }
      if (key === "tabletPortrait") {
        return { centerX: -0.06, centerY: -0.12, radiusX: 2.24, radiusY: 1.4, depthAmplitude: 0.9, depthPhase: 0.74, scaleMultiplier: 0.66 };
      }
      if (key === "tabletLandscape") {
        return { centerX: -0.06, centerY: -0.18, radiusX: 2.86, radiusY: 1.72, depthAmplitude: 1.14, depthPhase: 0.76, scaleMultiplier: 0.78 };
      }
      if (key === "laptop") {
        return { centerX: -0.08, centerY: -0.2, radiusX: 3.36, radiusY: 1.96, depthAmplitude: 1.34, depthPhase: 0.78, scaleMultiplier: 0.88 };
      }
      return { centerX: -0.08, centerY: -0.2, radiusX: 3.56, radiusY: 2.04, depthAmplitude: 1.5, depthPhase: 0.78, scaleMultiplier: key === "largeDesktop" ? 1.08 : 1.0 };
    }

    function createCinematicEllipseCurve({
      centerX = 0,
      centerY = 0,
      radiusX = 4.3,
      radiusY = 2.5,
      depthAmplitude = 1.5,
      depthPhase = 0.78,
    } = {}) {
      const points = [];
      const count = 168;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const wobble = 1 + Math.sin(t * 3.0 + 0.54) * 0.035 + Math.cos(t * 5.0 - 0.2) * 0.018;
        const x = centerX + Math.cos(t) * radiusX * wobble;
        const y = centerY + Math.sin(t) * radiusY * (1 + Math.cos(t * 2.0) * 0.035);
        const z = -Math.sin(t + depthPhase) * depthAmplitude + Math.sin(t * 2.0 - 0.35) * 0.16;
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.42);
    }

    function planetLayoutConfigFor(category, key) {
      const base = planetLayoutConfigs[category.id] || {
        orbitT: 0,
        positionOffset: [0, 0, 0],
        scale: 0.66,
        rotation: [0, 0, 0],
        ringTilt: [0, 0, 0],
        visualPriority: "supporting",
      };
      const compact = key === "mobile" || key === "tabletPortrait";
      const offsetMultiplier = compact ? (key === "mobile" ? 0.44 : 0.58) : key === "tabletLandscape" ? 0.72 : key === "laptop" ? 0.84 : 1;
      return {
        ...base,
        positionOffset: base.positionOffset.map((value) => value * offsetMultiplier),
      };
    }

    function layoutCategoriesOnEllipse(categoryGroups, options = {}) {
      const groups = categoryGroups.filter(Boolean);
      if (!groups.length) return new Map();
      const key = responsiveKey();
      const curve = createCinematicEllipseCurve(options);
      const resolved = new Map();
      groups.forEach((group) => {
        const category = group.userData.category;
        const config = planetLayoutConfigFor(category, key);
        const p = curve.getPointAt(config.orbitT);
        const [offsetX, offsetY, offsetZ] = config.positionOffset;
        const scale = config.scale * (options.scaleMultiplier || 1);
        const target = new THREE.Vector3(p.x + offsetX, p.y + offsetY, p.z + offsetZ);
        group.userData.layoutConfig = config;
        group.userData.ellipseTarget = new THREE.Vector3(p.x, p.y, p.z);
        group.userData.ellipseScale = scale;
        resolved.set(category.id, { position: target, scale, config });
      });
      resolved.ellipseParams = options;
      resolved.curve = curve;
      return resolved;
    }

    function ellipseLayoutForKey(key) {
      const cacheKey = `${key}:${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`;
      if (ellipseLayoutCache.has(cacheKey)) return ellipseLayoutCache.get(cacheKey);
      const groups = categories.map((category) => medallions.get(category.id)).filter(Boolean);
      const resolved = layoutCategoriesOnEllipse(groups, ellipseOptionsForKey(key));
      ellipseLayoutCache.set(cacheKey, resolved);
      return resolved;
    }

    function initialOverviewTargets(key) {
      const ellipseLayout = ellipseLayoutForKey(key);
      return categories.map((category) => {
        const base = layoutFor(category, key);
        const ellipse = ellipseLayout.get(category.id);
        const position = ellipse?.position || new THREE.Vector3(base.x * 0.96, base.y * 0.98 - 0.02, base.z);
        const scale = ellipse?.scale || base.scale * 0.94;
        return {
          category,
          layout: base,
          position: position.clone(),
          scale,
          config: ellipse?.config || planetLayoutConfigFor(category, key),
        };
      });
    }

    function boundsFromOverviewItems(items) {
      const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      items.forEach((item) => {
        const r = worldRadiusFor(item.category, { ...item.layout, scale: item.scale });
        const label = categoryLabelWorldSize(item.category);
        const labelHalfWidth = (label.width * item.scale) / 2;
        const labelBottom = item.position.y + label.offsetY * item.scale - (label.height * item.scale) / 2;
        bounds.minX = Math.min(bounds.minX, item.position.x - Math.max(r, labelHalfWidth));
        bounds.maxX = Math.max(bounds.maxX, item.position.x + Math.max(r, labelHalfWidth));
        bounds.minY = Math.min(bounds.minY, labelBottom, item.position.y - r * 0.92);
        bounds.maxY = Math.max(bounds.maxY, item.position.y + r * 0.92);
      });
      return bounds;
    }

    function boundsFromEllipse(params, paddingFactor = 1.25) {
      return {
        minX: params.centerX - params.radiusX * paddingFactor,
        maxX: params.centerX + params.radiusX * paddingFactor,
        minY: params.centerY - params.radiusY * paddingFactor,
        maxY: params.centerY + params.radiusY * paddingFactor,
      };
    }

    function perspectiveCameraStateForBounds(bounds, key = responsiveKey()) {
      const width = Math.max(0.1, bounds.maxX - bounds.minX);
      const height = Math.max(0.1, bounds.maxY - bounds.minY);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2 - (key === "mobile" ? 0.02 : 0.05);
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const padding = safePaddingFactor(key);
      const fitHeightDistance = (height * padding) / (2 * Math.tan(fov / 2));
      const fitWidthDistance = (width * padding) / (2 * Math.tan(fov / 2) * aspect);
  const overviewSizeBoost = key === "mobile" ? 0.96 : 0.92;
      const distance = Math.max(fitHeightDistance, fitWidthDistance, minOverviewDistance(key)) * overviewSizeBoost;
      return {
        position: new THREE.Vector3(centerX, centerY, distance),
        look: new THREE.Vector3(centerX, centerY, 0),
      };
    }

    function resolveOverviewTargets(key) {
      const cacheKey = overviewCacheKey(key);
      if (overviewTargetCache.has(cacheKey)) return overviewTargetCache.get(cacheKey);
      const items = initialOverviewTargets(key);
      const resolved = new Map(items.map((item) => [item.category.id, item]));
      overviewTargetCache.set(cacheKey, resolved);
      return resolved;
    }

    function calculateCategoryUniverseBounds(key = responsiveKey()) {
      if (!activeFocusMode()) {
        const ellipseLayout = ellipseLayoutForKey(key);
        if (ellipseLayout.ellipseParams) {
          const padding = key === "mobile" ? 1.22 : key === "tabletPortrait" ? 1.16 : key === "tabletLandscape" ? 1.16 : key === "laptop" ? 1.18 : 1.2;
          const ellipseBounds = boundsFromEllipse(ellipseLayout.ellipseParams, padding);
          const itemBounds = boundsFromOverviewItems(Array.from(resolveOverviewTargets(key).values()));
          return {
            minX: Math.min(ellipseBounds.minX, itemBounds.minX),
            maxX: Math.max(ellipseBounds.maxX, itemBounds.maxX),
            minY: Math.min(ellipseBounds.minY, itemBounds.minY),
            maxY: Math.max(ellipseBounds.maxY, itemBounds.maxY),
          };
        }
      }
      return boundsFromOverviewItems(Array.from(resolveOverviewTargets(key).values()));
    }

    function fitPerspectiveCameraToBounds(bounds, key = responsiveKey()) {
      const next = perspectiveCameraStateForBounds(bounds, key);
      overviewCamera.position.copy(next.position);
      overviewCamera.look.copy(next.look);
    }

    function keyAllowsSatellites(key) {
      return key !== "mobile" && window.innerHeight >= 700;
    }

    function satelliteLimit() {
      const key = responsiveKey();
      if (key === "mobile") return 0;
      if (key === "tabletPortrait") return 1;
      if (key === "laptop" || window.innerHeight < 760) return 1;
      return 2;
    }

    function servicePanelReady() {
      return !state.serviceRevealAt || performance.now() >= state.serviceRevealAt;
    }

    function focusCategorySlot(index, total, key) {
      const t = total <= 1 ? 0.5 : index / (total - 1);
      const arc = Math.sin(t * Math.PI);
      if (key === "mobile") {
        return {
          x: -1.24 + t * 2.48,
          y: 2.18 + arc * 0.12,
          z: 1.08,
          diameter: 0.34,
        };
      }
      if (key === "tabletPortrait" || key === "tabletLandscape") {
        return {
          x: -1.28 + t * 3.56,
          y: 2.28 + arc * 0.18,
          z: 0.78,
          diameter: 0.34,
        };
      }
      return {
        x: -1.55 + t * 4.92,
        y: 2.32 + arc * 0.24,
        z: 0.7,
        diameter: 0.36,
      };
    }

    function updateTargets() {
      const key = responsiveKey();
      const selectedId = state.categoryId;
      const focusMode = activeFocusMode();
      const focusNav = categories.filter((category) => category.id !== selectedId);
      const overviewTargets = !focusMode ? resolveOverviewTargets(key) : null;
      fitPerspectiveCameraToBounds(calculateCategoryUniverseBounds(key), key);
      categories.forEach((category) => {
        const group = medallions.get(category.id);
        if (!group) return;
        const base = layoutFor(category, key);
        const matches = categoryMatches(category);
        const selected = selectedId === category.id;

        let x = base.x * 0.96;
        let y = base.y * 0.98 + (focusMode ? 0 : -0.02);
        let z = base.z;
        let scale = base.scale * 0.94;
        let opacity = matches ? 1 : 0.22;
        if (state.stage === -1) opacity = 0;

        if (overviewTargets) {
          const overview = overviewTargets.get(category.id);
          if (overview) {
            x = overview.position.x;
            y = overview.position.y;
            z = overview.position.z;
            scale = overview.scale;
            group.userData.layoutConfig = overview.config;
            group.userData.targetRotation = overview.config.rotation;
            group.userData.targetRingTilt = overview.config.ringTilt;
            group.userData.visualPriority = overview.config.visualPriority;
          }
        }

        if (focusMode) {
          group.userData.targetRotation = [base.rx || 0, base.ry || 0, base.rz || 0];
          group.userData.targetRingTilt = null;
          group.userData.visualPriority = selected ? "primary" : "supporting";
          if (selected) {
            if (key === "mobile") {
              x = -0.62;
              y = 1.36;
              z = 1.92;
              scale = Math.min(1.0, base.scale * 1.22);
            } else if (key === "tabletPortrait" || key === "tabletLandscape") {
              x = -2.28;
              y = 1.34;
              z = 1.86;
              scale = Math.max(0.9, base.scale * 1.16);
            } else {
              x = -3.28;
              y = 1.42;
              z = 2.08;
              scale = Math.max(1.02, base.scale * 1.18);
            }
            opacity = 1;
          } else {
            const slot = focusCategorySlot(focusNav.findIndex((item) => item.id === category.id), focusNav.length, key);
            x = slot.x;
            y = slot.y;
            z = slot.z;
            scale = slot.diameter / category.size;
            opacity = matches ? 0.58 : 0.26;
          }
        }

        group.userData.target.set(x, y, z);
        group.userData.targetScale = scale;
        group.userData.targetOpacity = opacity;
      });
    }

    function quadraticPoint(start, control, end, t, target) {
      const inv = 1 - t;
      target.copy(start).multiplyScalar(inv * inv);
      target.addScaledVector(control, 2 * inv * t);
      target.addScaledVector(end, t * t);
      return target;
    }

    function makeMilkyWayParticleMaterial() {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0.86 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
        },
        vertexShader: `
          uniform float uPixelRatio;
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float perspective = clamp(5.2 / max(0.5, -mvPosition.z), 0.55, 2.2);
            gl_PointSize = size * uPixelRatio * 220.0 * perspective;
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = clamp(perspective, 0.42, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec2 p = gl_PointCoord - vec2(0.5);
            float d = length(p);
            float alpha = smoothstep(0.5, 0.08, d) * uOpacity * vAlpha;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
      });
    }

    function makeOrbitParticleMaterial(baseOpacity = 0.76) {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: baseOpacity },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
        },
        vertexShader: `
          uniform float uPixelRatio;
          attribute float size;
          attribute float alpha;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vColor = color;
            vAlpha = alpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float perspective = clamp(5.4 / max(0.6, -mvPosition.z), 0.42, 2.1);
            gl_PointSize = size * uPixelRatio * 210.0 * perspective;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec2 p = gl_PointCoord - vec2(0.5);
            float d = length(p);
            float sparkle = smoothstep(0.5, 0.04, d);
            gl_FragColor = vec4(vColor, sparkle * vAlpha * uOpacity);
          }
        `,
      });
    }

    function buildOrbitalSystem() {
      orbitalSystem.group.clear();
      orbitalSystem.trails.length = 0;
      orbitalSystem.particles = null;
      const key = responsiveKey();
      const params = ellipseOptionsForKey(key);
      const curve = createCinematicEllipseCurve(params);
      orbitalSystem.params = { ...params, key };
      orbitalSystem.curve = curve;

      const basePoints = curve.getSpacedPoints(key === "mobile" ? 90 : 132);
      const baseGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
      const baseMat = new THREE.LineBasicMaterial({
        color: "#e8c176",
        transparent: true,
        opacity: key === "mobile" ? 0.14 : 0.2,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      });
      const baseLine = new THREE.LineLoop(baseGeo, baseMat);
      baseLine.frustumCulled = false;
      orbitalSystem.baseLine = baseLine;
      orbitalSystem.group.add(baseLine);

      const trailConfigs = [
        { phase: 0.08, length: 0.16, speed: 0.014, count: key === "mobile" ? 28 : 42, opacity: 0.72 },
        { phase: 0.58, length: 0.12, speed: 0.009, count: key === "mobile" ? 20 : 32, opacity: 0.4 },
      ];
      trailConfigs.forEach((config) => {
        const positions = new Float32Array(config.count * 3);
        const colors = new Float32Array(config.count * 3);
        const sizes = new Float32Array(config.count);
        const alphas = new Float32Array(config.count);
        for (let i = 0; i < config.count; i++) {
          const warm = new THREE.Color(i < 4 ? "#fff4bb" : "#eeb35e");
          colors[i * 3] = warm.r;
          colors[i * 3 + 1] = warm.g;
          colors[i * 3 + 2] = warm.b;
          sizes[i] = 0.014;
          alphas[i] = 0;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
        const points = new THREE.Points(geo, makeOrbitParticleMaterial(config.opacity));
        points.frustumCulled = false;
        points.userData.trailConfig = config;
        orbitalSystem.trails.push(points);
        orbitalSystem.group.add(points);
      });

      const particleCount = key === "mobile" ? 72 : key === "tabletPortrait" || key === "tabletLandscape" ? 140 : 240;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const alphas = new Float32Array(particleCount);
      const particleT = new Float32Array(particleCount);
      const particleNoise = new Float32Array(particleCount * 3);
      const emphasized = ["body-massage", "foot-care", "ear-care"].map((id) => planetLayoutConfigs[id].orbitT);
      for (let i = 0; i < particleCount; i++) {
        const nearHero = random() < 0.58;
        const anchor = emphasized[Math.floor(random() * emphasized.length)];
        particleT[i] = nearHero ? (anchor + (random() - 0.5) * 0.18 + 1) % 1 : random();
        particleNoise[i * 3] = (random() - 0.5) * 0.1;
        particleNoise[i * 3 + 1] = (random() - 0.5) * 0.08;
        particleNoise[i * 3 + 2] = (random() - 0.5) * 0.18;
        const color = new THREE.Color(random() > 0.22 ? "#eeb35e" : "#fff4bb");
        const dim = nearHero ? 0.78 + random() * 0.35 : 0.32 + random() * 0.42;
        colors[i * 3] = color.r * dim;
        colors[i * 3 + 1] = color.g * dim;
        colors[i * 3 + 2] = color.b * dim;
        sizes[i] = 0.006 + random() * (nearHero ? 0.018 : 0.012);
        alphas[i] = nearHero ? 0.64 + random() * 0.28 : 0.24 + random() * 0.34;
        const p = curve.getPointAt(particleT[i]);
        positions[i * 3] = p.x + particleNoise[i * 3];
        positions[i * 3 + 1] = p.y + particleNoise[i * 3 + 1];
        positions[i * 3 + 2] = p.z + particleNoise[i * 3 + 2];
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
      const particles = new THREE.Points(geo, makeOrbitParticleMaterial(key === "mobile" ? 0.5 : 0.72));
      particles.frustumCulled = false;
      particles.userData.particleT = particleT;
      particles.userData.particleNoise = particleNoise;
      particles.userData.baseSizes = sizes.slice();
      orbitalSystem.particles = particles;
      orbitalSystem.group.add(particles);
    }

    function updateOrbitalSystem(elapsed, key, focusMode) {
      const visible = !focusMode && state.stage !== -1;
      orbitalSystem.group.visible = visible;
      if (!visible) return;
      if (orbitalSystem.params?.key !== key) buildOrbitalSystem();
      if (!orbitalSystem.curve) return;
      const curve = orbitalSystem.curve;

      const parallax = focusMode ? pointerParallax : lockedOverviewParallax;
      orbitalSystem.group.position.x = parallax.x * (key === "mobile" ? 0.03 : 0.08);
      orbitalSystem.group.position.y = parallax.y * (key === "mobile" ? 0.02 : 0.05);

      orbitalSystem.trails.forEach((trail, trailIndex) => {
        const config = trail.userData.trailConfig;
        const positionAttr = trail.geometry.attributes.position;
        const sizeAttr = trail.geometry.attributes.size;
        const alphaAttr = trail.geometry.attributes.alpha;
        const head = (config.phase + elapsed * config.speed) % 1;
        for (let i = 0; i < positionAttr.count; i++) {
          const age = i / Math.max(1, positionAttr.count - 1);
          const t = (head - age * config.length + 1) % 1;
          const p = curve.getPointAt(t);
          const drift = Math.sin(elapsed * 0.32 + i * 0.57 + trailIndex) * 0.018;
          positionAttr.setXYZ(i, p.x, p.y + drift, p.z + Math.cos(i * 1.9) * 0.012);
          const fade = Math.pow(1 - age, 1.65);
          sizeAttr.array[i] = (0.01 + fade * 0.038) * (i < 3 ? 1.25 : 1);
          alphaAttr.array[i] = fade;
        }
        positionAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;
      });

      if (orbitalSystem.particles) {
        const positionAttr = orbitalSystem.particles.geometry.attributes.position;
        const sizeAttr = orbitalSystem.particles.geometry.attributes.size;
        const particleT = orbitalSystem.particles.userData.particleT;
        const noise = orbitalSystem.particles.userData.particleNoise;
        const baseSizes = orbitalSystem.particles.userData.baseSizes;
        const flow = prefersReducedMotion ? 0 : elapsed * 0.0035;
        for (let i = 0; i < positionAttr.count; i++) {
          const t = (particleT[i] + flow * (0.72 + (i % 7) * 0.035)) % 1;
          const p = curve.getPointAt(t);
          const shimmer = prefersReducedMotion ? 1 : 0.78 + Math.sin(elapsed * 1.5 + i * 0.91) * 0.22;
          positionAttr.setXYZ(
            i,
            p.x + noise[i * 3],
            p.y + noise[i * 3 + 1] + Math.sin(elapsed * 0.27 + i) * 0.008,
            p.z + noise[i * 3 + 2]
          );
          sizeAttr.array[i] = baseSizes[i] * shimmer;
        }
        positionAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      }
    }

    function makeMilkyWayConnection(pointA, pointB, {
      particleCount = 150,
      curveHeight = 0.35,
      colorCore = "#FFE998",
      colorDim = "#8a6d3b",
    } = {}) {
      const group = new THREE.Group();
      const mid = new THREE.Vector3()
        .addVectors(pointA, pointB)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, curveHeight, (random() - 0.5) * 0.4));
      const curve = new THREE.QuadraticBezierCurve3(pointA.clone(), mid, pointB.clone());

      const corePoints = curve.getPoints(44);
      const coreGeo = new THREE.BufferGeometry().setFromPoints(corePoints);
      const coreMat = new THREE.LineBasicMaterial({
        color: colorCore,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });
      coreMat.userData.baseOpacity = 0.12;
      const coreLine = new THREE.Line(coreGeo, coreMat);
      coreLine.frustumCulled = false;
      coreLine.renderOrder = 1;
      group.add(coreLine);

      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const particleT = new Float32Array(particleCount);
      const particleOffsets = new Float32Array(particleCount * 3);
      const colorCoreObj = new THREE.Color(colorCore);
      const colorDimObj = new THREE.Color(colorDim);

      for (let i = 0; i < particleCount; i++) {
        const u = random();
        const t = 0.5 + (u - 0.5) * (0.4 + random() * 0.6);
        const clampedT = THREE.MathUtils.clamp(t, 0, 1);
        const basePoint = curve.getPoint(clampedT);
        const spread = 0.09 * (1 - Math.abs(clampedT - 0.5) * 1.2);
        const ox = (random() - 0.5) * spread;
        const oy = (random() - 0.5) * spread * 0.6;
        const oz = (random() - 0.5) * spread;
        positions[i * 3] = basePoint.x + ox;
        positions[i * 3 + 1] = basePoint.y + oy;
        positions[i * 3 + 2] = basePoint.z + oz;
        particleT[i] = clampedT;
        particleOffsets[i * 3] = ox;
        particleOffsets[i * 3 + 1] = oy;
        particleOffsets[i * 3 + 2] = oz;
        const mixed = colorDimObj.clone().lerp(colorCoreObj, 0.34 + random() * 0.66);
        colors[i * 3] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
        sizes[i] = 0.012 + random() * 0.03;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      const points = new THREE.Points(geo, makeMilkyWayParticleMaterial());
      points.userData.isMilkyWayStream = true;
      points.frustumCulled = false;
      points.renderOrder = 2;
      group.add(points);

      group.userData.coreLine = coreLine;
      group.userData.points = points;
      group.userData.particleGeo = geo;
      group.userData.baseSizes = sizes.slice();
      group.userData.particleT = particleT;
      group.userData.particleOffsets = particleOffsets;
      group.userData.curveHeight = curveHeight;
      return group;
    }

    function buildConnectionTrails() {
      connectionTrails.clear();
      milkyWayStreams.length = 0;
      const key = responsiveKey();
      const particleCount = key === "mobile" ? 42 : key === "tabletPortrait" || key === "tabletLandscape" ? 78 : 120;
      connectionTrailSpecs.forEach((spec, index) => {
        const stream = makeMilkyWayConnection(new THREE.Vector3(), new THREE.Vector3(0.1, 0, 0), {
          particleCount,
          curveHeight: spec.arc,
          colorCore: "#FFE998",
          colorDim: index % 2 ? "#8a6d3b" : "#b18444",
        });
        stream.userData.spec = spec;
        stream.userData.phase = index * 0.73;
        connectionTrails.add(stream);
        milkyWayStreams.push(stream);
      });
    }

    function updateMilkyWayStreamGeometry(stream, elapsed) {
      const spec = stream.userData.spec;
      const a = medallions.get(spec.from);
      const b = medallions.get(spec.to);
      if (!a || !b) {
        stream.visible = false;
        return;
      }
      stream.visible = a.userData.opacity > 0.12 && b.userData.opacity > 0.12;
      if (!stream.visible) return;

      const start = new THREE.Vector3();
      const end = new THREE.Vector3();
      const control = new THREE.Vector3();
      const point = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const normal = new THREE.Vector3();

      const aRadius = (a.userData.category.size * a.scale.x) * 0.44;
      const bRadius = (b.userData.category.size * b.scale.x) * 0.44;
      dir.copy(b.position).sub(a.position);
      const len = Math.max(0.001, dir.length());
      dir.divideScalar(len);
      start.copy(a.position).addScaledVector(dir, aRadius);
      end.copy(b.position).addScaledVector(dir, -bRadius);
      normal.set(-dir.y, dir.x, 0).normalize();
      control.copy(start).lerp(end, 0.5)
        .addScaledVector(normal, stream.userData.curveHeight || spec.arc || 0.24)
        .add(new THREE.Vector3(0, 0, spec.depth || 0));

      const coreAttr = stream.userData.coreLine.geometry.attributes.position;
      for (let i = 0; i < coreAttr.count; i++) {
        const t = i / Math.max(1, coreAttr.count - 1);
        quadraticPoint(start, control, end, t, point);
        const wave = Math.sin(t * Math.PI * 2 + elapsed * 0.38 + stream.userData.phase) * 0.01;
        coreAttr.setXYZ(i, point.x, point.y + wave, point.z - 0.006);
      }
      coreAttr.needsUpdate = true;
      stream.userData.coreLine.material.opacity = stream.userData.coreLine.material.userData.baseOpacity * (0.78 + Math.sin(elapsed * 0.72 + stream.userData.phase) * 0.18);

      const pointAttr = stream.userData.particleGeo.attributes.position;
      const sizeAttr = stream.userData.particleGeo.attributes.size;
      const baseSizes = stream.userData.baseSizes;
      const particleT = stream.userData.particleT;
      const offsets = stream.userData.particleOffsets;
      for (let i = 0; i < pointAttr.count; i++) {
        const flow = prefersReducedMotion ? 0 : elapsed * 0.014;
        const t = (particleT[i] + flow + stream.userData.phase * 0.01) % 1;
        const density = 1 - Math.abs(t - 0.5) * 1.18;
        quadraticPoint(start, control, end, t, point);
        const drift = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.7 + i * 0.37) * 0.012;
        pointAttr.setXYZ(
          i,
          point.x + offsets[i * 3] * (0.64 + density) + normal.x * drift,
          point.y + offsets[i * 3 + 1] * (0.64 + density) + normal.y * drift,
          point.z + offsets[i * 3 + 2] * (0.64 + density)
        );
        const twinkle = prefersReducedMotion ? 1 : 0.7 + Math.sin(elapsed * 2 + i * 12.9898) * 0.3;
        sizeAttr.array[i] = baseSizes[i] * twinkle;
      }
      pointAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }

    function updateConnectionTrails(elapsed, key, focusMode) {
      const visible = !focusMode && state.stage !== -1;
      connectionTrails.visible = visible;
      if (!visible) return;
      milkyWayStreams.forEach((stream) => updateMilkyWayStreamGeometry(stream, elapsed));
    }

    function applyOpacity(group, opacity) {
      group.traverse((child) => {
        if (!child.material) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.transparent = true;
          if (mat.uniforms?.uOpacity) mat.uniforms.uOpacity.value = opacity;
          else {
            if (mat.userData.baseOpacity == null) mat.userData.baseOpacity = mat.opacity;
            const factor = child.userData.isRimGlint ? 0.16 : 1;
            mat.opacity = mat.userData.baseOpacity * opacity * factor;
          }
        });
      });
    }

    function buildUI() {
      renderServices();
      renderA11yList();
    }

    function renderA11yList() {
      const list = document.getElementById("category-a11y");
      list.innerHTML = categories
        .map((category) => `<li><button type="button" data-category="${category.id}">${category.name}</button></li>`)
        .join("");
      list.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => selectCategory(button.dataset.category));
      });
    }

    function selectedCategory() {
      return categories.find((category) => category.id === state.categoryId) || null;
    }

    function selectedService() {
      const category = selectedCategory();
      return category?.services.find((service) => service.id === state.serviceId) || null;
    }

    function formatPrice(price) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);
    }

    function buildBookingUrl(categoryId, serviceId) {
      const params = new URLSearchParams({ experienceId: state.experienceId, categoryId, serviceId });
      return `${BOOK_NOW_CONFIG.route}?${params.toString()}`;
    }

    function toBookingService(category, service) {
      const imageSrc = service.image?.src || "https://placehold.co/360x220?text=Ngan+Ha+Spa";
      return {
        id: service.id,
        cat: category.name || category.id,
        categoryId: category.id,
        names: { vi: service.name, en: service.name, cn: service.name, jp: service.name, kr: service.name },
        descriptions: {
          vi: service.description || "",
          en: service.description || "",
          cn: service.description || "",
          jp: service.description || "",
          kr: service.description || "",
        },
        img: imageSrc,
        media: { type: "image", url: imageSrc, alt: service.image?.alt || service.name },
        priceVND: Number(service.price || 0),
        priceUSD: Math.max(1, Math.round(Number(service.price || 0) / 25000)),
        timeValue: Number(service.duration || 0),
        timeDisplay: `${Number(service.duration || 0)} mins`,
        menuType: "standard",
      };
    }

    function sourceRectFromElement(element) {
      if (!element?.getBoundingClientRect) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }

    function postBookingAction(type, category, service, extra = {}) {
      if (!(window.parent && window.parent !== window)) return false;
      window.parent.postMessage({ type, service: toBookingService(category, service), ...extra }, "*");
      return true;
    }

    function openBookingPage(categoryId, serviceId) {
      const url = buildBookingUrl(categoryId, serviceId);
      if (BOOK_NOW_CONFIG.openMode === "new-window") {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) showNotice("Không thể mở trang đặt lịch. Vui lòng cho phép cửa sổ bật lên.");
        return;
      }
      window.location.assign(url);
    }

    function cartCount() {
      return state.cart.reduce((total, item) => total + item.quantity, 0);
    }

    function cartSubtotal() {
      return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    function serviceQuantity(serviceId) {
      return state.cart.find((item) => item.serviceId === serviceId)?.quantity || 0;
    }

    function showNotice(message) {
      if (embeddedBookShell || (window.parent && window.parent !== window)) return;
      const notification = document.getElementById("cartNotification");
      if (!notification) return;
      notification.textContent = message;
      notification.classList.add("visible");
      window.clearTimeout(state.noticeTimer);
      state.noticeTimer = window.setTimeout(() => notification.classList.remove("visible"), 2400);
    }

    function addToCart(category, service, sourceElement) {
      const existing = state.cart.find((item) => item.serviceId === service.id);
      if (existing) {
        if (CART_DUPLICATE_MODE === "prevent-duplicate") showNotice("Dịch vụ này đã có trong giỏ hàng.");
        else {
          existing.quantity += 1;
          showNotice(`Đã thêm dịch vụ · ${cartCount()} dịch vụ`);
        }
      } else {
        state.cart.push({
          serviceId: service.id,
          categoryId: category.id,
          name: service.name,
          duration: service.duration,
          price: service.price,
          image: service.image,
          quantity: 1,
        });
        showNotice(`Đã thêm dịch vụ · ${cartCount()} dịch vụ`);
      }
      postBookingAction("flipmenu:add-service-to-cart", category, service, {
        sourceRect: sourceRectFromElement(sourceElement),
        selectedCount: cartCount(),
      });
      renderCart();
      renderServices();
    }

    function removeFromCart(serviceId) {
      const existing = state.cart.find((item) => item.serviceId === serviceId);
      if (!existing) return;
      existing.quantity -= 1;
      if (existing.quantity <= 0) {
        state.cart = state.cart.filter((item) => item.serviceId !== serviceId);
      }
      window.parent?.postMessage({ type: "flipmenu:remove-service-from-cart", serviceId, selectedCount: cartCount() }, "*");
      renderCart();
      renderServices();
    }

    function renderCart() {
      const button = document.getElementById("cartButton");
      const badge = document.getElementById("cartBadge");
      const drawer = document.getElementById("cartDrawer");
      const list = document.getElementById("cartItems");
      const subtotal = document.getElementById("cartSubtotal");
      const count = cartCount();
      button.classList.toggle("has-items", count > 0);
      button.setAttribute("aria-label", `Giỏ hàng, ${count} dịch vụ`);
      badge.textContent = String(count);
      drawer.classList.toggle("visible", state.cartOpen);
      subtotal.textContent = formatPrice(cartSubtotal());
      list.innerHTML = state.cart.length
        ? state.cart.map((item) => `
              <article>
                <img src="${item.image.src}" alt="${item.image.alt}" loading="lazy" />
                <div>
                  <strong>${item.name}</strong>
                  <p>${item.duration} phút · ${formatPrice(item.price)} · SL ${item.quantity}</p>
                </div>
                <button class="cart-remove-button" type="button" data-cart-remove="${item.serviceId}" aria-label="Xóa ${item.name} khỏi giỏ hàng">×</button>
              </article>
            `).join("")
        : `<div class="detail-box">Giỏ hàng chưa có dịch vụ.</div>`;
      list.querySelectorAll("[data-cart-remove]").forEach((button) => {
        button.addEventListener("click", () => removeFromCart(button.dataset.cartRemove));
      });
    }

    function transitionPanel(nextStage, updateState) {
      const sheet = document.getElementById("serviceSheet");
      sheet.classList.add("switching");
      window.clearTimeout(state.panelTimer);
      state.panelTimer = window.setTimeout(
        () => {
          if (updateState) updateState();
          state.stage = nextStage;
          buildUI();
          requestAnimationFrame(() => {
            document.getElementById("serviceSheet").classList.remove("switching");
          });
        },
        prefersReducedMotion ? 40 : 220
      );
    }

    function renderServices() {
      const category = selectedCategory();
      const service = selectedService();
      const visible = activeFocusMode() && category && servicePanelReady();
      const sheet = document.getElementById("serviceSheet");
      sheet.classList.toggle("visible", Boolean(visible));
      if (!category) return;

      document.getElementById("sheetKicker").textContent = "Danh mục";
      document.getElementById("sheetTitle").textContent = category.name;

      const content = document.getElementById("serviceContent");
      if (state.stage === "services") {
        content.innerHTML = category.services.length
          ? category.services
            .map(
              (item) => {
                const quantity = serviceQuantity(item.id);
                return `
                    <article class="service-card ${quantity > 0 ? "is-selected" : ""}">
                      <img src="${item.image.src}" alt="${item.image.alt}" loading="lazy" onerror="this.style.opacity=.25" />
                      <div>
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <div class="meta">
                          <span>${item.duration} phút</span>
                          <span>${formatPrice(item.price)}</span>
                          ${item.badge ? `<span>${item.badge}</span>` : ""}
                        </div>
                        <div class="service-actions">
                          <button class="book-now-button" type="button" data-book-service="${item.id}">BOOK NOW</button>
                          ${quantity > 0 ? `
                            <div class="service-qty-control" aria-label="${item.name} đã chọn ${quantity}">
                              <button type="button" data-cart-dec="${item.id}" aria-label="Giảm ${item.name}">−</button>
                              <span>${quantity}</span>
                              <button type="button" data-cart-service="${item.id}" aria-label="Tăng ${item.name}">+</button>
                            </div>
                          ` : `
                            <button class="add-cart-button" type="button" data-cart-service="${item.id}" aria-label="Thêm ${item.name} vào giỏ hàng">
                            <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none">
                              <path d="M7 8h10l-.8 11H7.8L7 8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
                              <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                            </svg>
                          </button>
                          `}
                        </div>
                      </div>
                    </article>
                  `;
              }
            )
            .join("")
          : `<div class="detail-box">Danh mục này chưa có dịch vụ mẫu.</div>`;
        content.querySelectorAll("[data-book-service]").forEach((button) => {
          button.addEventListener("click", () => {
            state.serviceId = button.dataset.bookService;
            const serviceToBook = category.services.find((item) => item.id === state.serviceId);
            if (!serviceToBook) return;
            const posted = postBookingAction("flipmenu:book-now", category, serviceToBook, {
              sourceRect: sourceRectFromElement(button),
            });
            if (!posted) openBookingPage(category.id, state.serviceId);
          });
        });
        content.querySelectorAll("[data-cart-service]").forEach((button) => {
          button.addEventListener("click", () => {
            const serviceToAdd = category.services.find((item) => item.id === button.dataset.cartService);
            if (serviceToAdd) addToCart(category, serviceToAdd, button);
          });
        });
        content.querySelectorAll("[data-cart-dec]").forEach((button) => {
          button.addEventListener("click", () => {
            removeFromCart(button.dataset.cartDec);
          });
        });
        return;
      }
    }

    function selectCategory(id) {
      const category = categories.find((item) => item.id === id);
      if (!category || !categoryMatches(category)) return;
      if (state.categoryId === id && activeFocusMode()) return;
      state.mobileIndex = Math.max(0, categories.findIndex((item) => item.id === id));
      window.clearTimeout(state.revealTimer);
      state.selectedFromId = state.categoryId;
      state.categoryId = id;
      state.serviceId = null;
      state.stage = "services";
      state.focusStartedAt = performance.now();
      state.serviceRevealAt = state.focusStartedAt + (prefersReducedMotion ? 80 : 980);
      buildUI();
      updateTargets();
      state.revealTimer = window.setTimeout(() => {
        buildUI();
      }, prefersReducedMotion ? 90 : 990);
    }

    function goBack() {
      if (state.stage === "categories") {
        prepareSoftGalaxyReturn();
        window.setTimeout(() => {
          document.querySelector('.hud').style.display = 'none';
          finishSoftGalaxyReturn();
        }, prefersReducedMotion ? 40 : 920);
        return;
      }
      if (state.stage === -1) return;
      window.clearTimeout(state.revealTimer);
      state.serviceRevealAt = 0;
      if (state.stage === "services") state.stage = "categories";
      buildUI();
      updateTargets();
    }

    function shiftMobileCategory(direction) {
      if (responsiveKey() !== "mobile" || activeFocusMode()) return;
      state.mobileIndex = (state.mobileIndex + direction + categories.length) % categories.length;
      updateTargets();
    }

    function resetBooking() {
      state.stage = "categories";
      state.categoryId = null;
      state.serviceId = null;
      state.focusStartedAt = 0;
      state.serviceRevealAt = 0;
      window.clearTimeout(state.revealTimer);
      buildUI();
      updateTargets();
    }

    function updateHover() {
      if (state.stage === -1) {
        document.body.style.cursor = "default";
        return null;
      }
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickable, false);
      const hitId = hits[0]?.object?.userData?.categoryId || null;
      document.body.style.cursor = hitId && state.stage !== "experience" ? "pointer" : "default";
      medallions.forEach((group, id) => {
        group.userData.hover = id === hitId && state.stage !== "experience";
      });
      return hitId;
    }

    function springVector(current, target, velocity, stiffness, damping, delta) {
      velocity.x += (target.x - current.x) * stiffness * delta;
      velocity.y += (target.y - current.y) * stiffness * delta;
      velocity.z += (target.z - current.z) * stiffness * delta;
      velocity.multiplyScalar(Math.max(0, 1 - damping * delta));
      current.addScaledVector(velocity, delta);
    }

    function springScalar(current, target, velocityKey, holder, stiffness, damping, delta) {
      holder[velocityKey] += (target - current) * stiffness * delta;
      holder[velocityKey] *= Math.max(0, 1 - damping * delta);
      return current + holder[velocityKey] * delta;
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function focusSatelliteAngle(index, total) {
      const layouts = {
        1: [24],
        2: [-54, 72],
        3: [-62, 34, 132],
        4: [-82, -12, 58, 138],
      };
      const angles = layouts[total] || Array.from({ length: total }, (_, i) => -70 + (i * 190) / Math.max(1, total - 1));
      return ((angles[index] ?? 0) * Math.PI) / 180;
    }

    function animate() {
      requestAnimationFrame(animate);
      if (document.hidden) return;

      // Tự động ẩn/hiện bầu trời sao và Constellation khi mở sách
      const showConstellation = state.stage !== -1;
      if (typeof stars !== 'undefined') stars.visible = showConstellation;
      if (typeof nebula !== 'undefined') nebula.visible = showConstellation;
      if (typeof horizon !== 'undefined') horizon.visible = showConstellation;
      if (typeof starGlints !== 'undefined') starGlints.visible = showConstellation;
      medallions.forEach(group => {
        group.visible = showConstellation;
      });

      const delta = Math.min(clock.getDelta(), 0.04);
      const elapsed = clock.elapsedTime;
      const damping = 1 - Math.pow(0.001, delta);
      const progress = easeOutCubic(focusProgress());

      if (nebula.material.uniforms) nebula.material.uniforms.uTime.value = elapsed;
      if (horizon.material.uniforms) horizon.material.uniforms.uTime.value = elapsed;
      stars.rotation.y += prefersReducedMotion ? 0 : delta * (0.006 + progress * 0.012);
      stars.rotation.x = pointerParallax.y * 0.018 - progress * 0.018;
      starGlints.children.forEach((glint) => {
        const twinkle = 0.18 + Math.max(0, Math.sin(elapsed * 0.85 + glint.userData.phase)) * 0.28;
        glint.material.opacity = prefersReducedMotion ? 0.22 : twinkle;
        glint.rotation.z += prefersReducedMotion ? 0 : delta * 0.045;
      });

      const focusMode = activeFocusMode();
      const key = responsiveKey();
      updateOrbitalSystem(elapsed, key, focusMode);
      updateConnectionTrails(elapsed, key, focusMode);
      const cameraOrbit = focusMode && !prefersReducedMotion ? Math.sin(progress * Math.PI) * 0.5 : 0;
      const targetCam = focusMode
        ? new THREE.Vector3(
          key === "mobile" ? -0.18 + cameraOrbit * 0.16 : -0.42 + cameraOrbit,
          key === "mobile" ? 0.46 : 0.58,
          key === "mobile" ? 5.0 : 5.12
        )
        : new THREE.Vector3(
          overviewCamera.position.x + pointerParallax.x * (key === "mobile" ? 0.04 : 0.12),
          overviewCamera.position.y + pointerParallax.y * (key === "mobile" ? 0.03 : 0.09),
          overviewCamera.position.z
        );
      const targetLook = focusMode
        ? new THREE.Vector3(key === "mobile" ? -0.54 : -1.72, key === "mobile" ? 1.2 : 1.28, 0.82)
        : new THREE.Vector3(
          overviewCamera.look.x + pointerParallax.x * (key === "mobile" ? 0.05 : 0.16),
          overviewCamera.look.y + pointerParallax.y * (key === "mobile" ? 0.04 : 0.12),
          0
        );


      if (state.stage === -1 || isTransitioningBook) {
        let targetCenterX = 0;
        if (typeof currentLeafIndex !== 'undefined') {
          if (currentLeafIndex === 0) targetCenterX = 3;
          else if (currentLeafIndex === 3) targetCenterX = -3;
        }

        if (softBookCloseCameraTarget && softBookCloseLookTarget) {
          targetCam.copy(softBookCloseCameraTarget);
          targetLook.copy(softBookCloseLookTarget);
        } else {
          const pointerX = softMenuBackActive ? 0 : pointer.x;
          const pointerY = softMenuBackActive ? 0 : pointer.y;
          targetCam.copy(camTargetPos);
          targetCam.x += targetCenterX + pointerX * 2;
          targetCam.y += pointerY * 1;

          targetLook.copy(camTargetLookAt);
          targetLook.x += targetCenterX;
        }

        if (typeof responsiveKey === 'function') {
          const rk = responsiveKey();
          if (rk === 'mobile') targetCam.z += 10;
          else if (rk === 'tabletPortrait') targetCam.z += 5;
        }
      }
      // --- MOVED BOOK ANIMATION LOGIC ---
      if (state.stage === -1 || isTransitioningBook) {
        if (!state.cartOpen && !softMenuBackActive) {
          bookTargetRot.y = pointer.x * 0.15;
          bookTargetRot.x = BOOK_TILT + pointer.y * 0.15;
        }
        bookGroup.rotation.x += (bookTargetRot.x - bookGroup.rotation.x) * 0.1;
        bookGroup.rotation.y += (bookTargetRot.y - bookGroup.rotation.y) * 0.1;
        bookGroup.rotation.z += (bookTargetRot.z - bookGroup.rotation.z) * 0.1;

        bookGroup.position.x += (bookTargetPos.x - bookGroup.position.x) * 0.1;
        bookGroup.position.y += (bookTargetPos.y - bookGroup.position.y) * 0.1;
        bookGroup.position.z += (bookTargetPos.z - bookGroup.position.z) * 0.1;

        for (let i = 0; i < leaves.length; i++) {
          const leaf = leaves[i];
          // Original old book logic
          const ud = leaf.userData;
          const targetAngle = ud.targetAngle !== undefined ? ud.targetAngle : (currentLeafIndex > i ? Math.PI : 0);
          const currentAngle = THREE.MathUtils.lerp(ud.angle || 0, targetAngle, 0.08);
          ud.angle = currentAngle;
          leaf.rotation.z = currentAngle; // CRITICAL: Rotate the group to preserve normal vectors and textures!

          const isFlipped = currentAngle > Math.PI / 2;
          leaf.position.y = isFlipped ? ud.baseY : -ud.baseY;

          if (ud.hasPhotoStack && ud.photoStack) {
            const isTopRight = (currentLeafIndex === ud.leafIndex);
            const isTopLeft = (currentLeafIndex - 1 === ud.leafIndex);
            
            let isVisible = false;
            // Nếu trang nằm bên phải và chưa bị lật qua trái
            if (!isFlipped && isTopRight) isVisible = true;
            // Nếu trang nằm bên trái (đã lật) và là trang trên cùng bên trái
            if (isFlipped && isTopLeft) isVisible = true;
            
            ud.photoStack.visible = isVisible;
            ud.photoStack.children.forEach(c => c.visible = isVisible);
          }

          const isFlipping = currentAngle > 0.01 && currentAngle < (Math.PI - 0.01);

          leaf.children.forEach(mesh => {
            if (!ud || !ud.geo) return;
            const origPos = ud.origPos;
            const pos = ud.geo.attributes.position;

            for (let j = 0; j < pos.count; j++) {
              const origX = origPos.getX(j);
              const origY = origPos.getY(j);
              const origZ = origPos.getZ(j); // Local thickness

              const normX = (origX + PAGE_W / 2) / PAGE_W; // 0 at spine, 1 at edge
              const normY = (origY + PAGE_H / 2) / PAGE_H; // 0 at bottom, 1 at top

              let bendZ = 0;
              let offsetX = 0;

              // Removed bending effect since this is a hard cover book

              pos.setX(j, origX + offsetX);
              pos.setZ(j, origZ + bendZ);
              // origY is unchanged
            }
            pos.needsUpdate = true;
            ud.geo.computeVertexNormals();
          });

        }
      }


      if (prefersReducedMotion) {
        camera.position.copy(targetCam);
        cameraLook.copy(targetLook);
      } else {
        springVector(camera.position, targetCam, cameraVelocity, 34, 8.5, delta);
        springVector(cameraLook, targetLook, cameraLookVelocity, 30, 8, delta);
      }
      camera.lookAt(cameraLook);

      medallions.forEach((group, id) => {
        const category = group.userData.category;
        const hover = group.userData.hover;
        const selected = state.categoryId === id;
        const pulse = selected && focusMode ? Math.sin(elapsed * 2.1) * 0.018 : 0;
        const float = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.58 + category.size * 3.1) * 0.038;
        scratchTarget.copy(group.userData.target);
        scratchTarget.y += float;
        scratchTarget.z += hover ? 0.08 : 0;
        if (focusMode && selected) scratchTarget.z += Math.sin(progress * Math.PI) * 0.16;
        if (focusMode && selected) scratchTarget.z += Math.max(0, 1 - Math.abs(progress - 0.38) / 0.38) * 0.28;
        if (focusMode && !selected) scratchTarget.z -= Math.sin(progress * Math.PI) * 1.05;
        if (prefersReducedMotion) group.position.copy(scratchTarget);
        else springVector(group.position, scratchTarget, group.userData.velocity, selected ? 46 : 34, selected ? 7.8 : 9.6, delta);

        const targetScale = group.userData.targetScale * (hover ? 1.035 : 1) + pulse;
        const nextScale = prefersReducedMotion
          ? targetScale
          : springScalar(group.scale.x, targetScale, "scaleVelocity", group.userData, selected ? 42 : 32, selected ? 7.4 : 9, delta);
        group.scale.setScalar(Math.max(0.01, nextScale));

        const baseRot = layoutFor(category, key);
        const configuredRotation = group.userData.targetRotation || [baseRot.rx || 0, baseRot.ry || 0, baseRot.rz || 0];
        const selectedTilt = focusMode && selected ? 0.28 * progress : 0;
        const hiddenTilt = focusMode && !selected ? 0.18 * Math.sign(group.position.x || 1) * progress : 0;
        const focusPitch = focusMode && selected ? -0.16 * progress : 0;
        const desiredX = configuredRotation[0] * 0.55 + pointerParallax.y * 0.038 + focusPitch;
        const desiredY = configuredRotation[1] * 0.48 + pointerParallax.x * 0.052 + selectedTilt + hiddenTilt + (focusMode && selected ? Math.sin(elapsed * 0.42) * 0.022 : 0);
        group.rotation.x += (desiredX - group.rotation.x) * (prefersReducedMotion ? 1 : damping * 0.22);
        group.rotation.y += (desiredY - group.rotation.y) * (prefersReducedMotion ? 1 : damping * 0.22);
        const desiredZ = configuredRotation[2] * 0.7 + (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.18 + category.size) * 0.004) - (focusMode && selected ? 0.02 * progress : 0);
        group.rotation.z += (desiredZ - group.rotation.z) * (prefersReducedMotion ? 1 : damping * 0.2);
        group.traverse((child) => {
          if (child.userData?.isRimGlint) {
            child.rotation.z = -0.7 + (prefersReducedMotion ? 0 : elapsed * (selected && focusMode ? 0.52 : 0.22));
          }
        });

        const targetOpacity = group.userData.targetOpacity;
        group.userData.opacity += (targetOpacity - group.userData.opacity) * damping * 0.55;
        applyOpacity(group, group.userData.opacity);

        if (group.userData.focusHalos) {
          group.userData.focusHalos.forEach((halo) => {
            const wave = (progress + halo.userData.delay) % 1;
            const active = focusMode && selected && progress > 0.05;
            halo.scale.setScalar(active ? 1 + wave * 0.42 : 1);
            halo.material.opacity = active ? (1 - wave) * 0.3 * group.userData.opacity : 0;
          });
        }

        if (group.userData.label) {
          const labelLift = focusMode && selected ? 0.26 * progress : 0;
          const labelScale = focusMode && selected ? 1.26 : 1;
          const labelTargetZ = 0.116 + labelLift;
          group.userData.label.position.z += (labelTargetZ - group.userData.label.position.z) * (prefersReducedMotion ? 1 : damping * 0.45);
          group.userData.label.scale.lerp(new THREE.Vector3(labelScale, labelScale, labelScale), prefersReducedMotion ? 1 : damping * 0.45);
          const labelOpacity = Math.min(1, group.userData.opacity * (focusMode && selected ? 1.24 : 1));
          if (group.userData.label.userData.textMaterials) {
            group.userData.label.userData.textMaterials[0].opacity = labelOpacity;
            group.userData.label.userData.textMaterials[1].opacity = labelOpacity * (focusMode && selected ? 0.14 : 0.08);
          }
        }

        const orbitRadius = category.size * (focusMode && selected ? 1.05 : 0.9);
        const orbitAngle = elapsed * (prefersReducedMotion ? 0 : 0.11 + (selected && focusMode ? 0.08 : 0)) + category.size;
        if (group.userData.orbitLight) {
          group.userData.orbitLight.position.set(Math.cos(orbitAngle) * orbitRadius, Math.sin(orbitAngle) * orbitRadius * 0.28, 0.035);
          group.userData.orbitLight.visible = !prefersReducedMotion && key !== "mobile";
        }

        group.userData.orbits.forEach((orbit) => {
          const orbitGlow = 0.08 + Math.max(0, Math.sin(elapsed * 0.6 + category.size)) * 0.035;
          orbit.material.opacity = (hover ? 0.18 : orbitGlow) * group.userData.opacity;
          orbit.rotation.z += prefersReducedMotion ? 0 : delta * (hover ? 0.026 : 0.01);
        });

        group.userData.satellites.forEach((satGroup, index) => {
          const showSatellite = keyAllowsSatellites(key) && index < satelliteLimit() && focusMode && selected;
          satGroup.visible = showSatellite;
          if (satGroup.userData.connection) satGroup.userData.connection.visible = showSatellite;
          if (!showSatellite) return;

          const sat = satGroup.userData.item;
          const total = group.userData.satellites.length;
          const baseAngle = (sat.angle * Math.PI) / 180;
          const spread = hover ? 1.05 : 1;
          const medallionRadius = category.size * 0.5;
          let distance = Math.max(sat.distance * spread, medallionRadius + sat.size + (key === "tabletPortrait" ? 0.34 : 0.42));
          let angle = baseAngle + (prefersReducedMotion ? 0 : elapsed * sat.orbitSpeed * (hover ? 0.62 : 0.42));
          let yScale = 0.46;

          if (focusMode && selected) {
            const focusSlot = focusSatelliteAngle(index, total);
            const naturalDrift = prefersReducedMotion ? 0 : Math.sin(elapsed * (0.44 + index * 0.07) + index) * 0.045;
            const clearDistance = medallionRadius + sat.size + (key === "mobile" ? 0.78 : 0.92);
            distance = Math.max(sat.distance * (1.76 + progress * 0.28), clearDistance);
            angle = focusSlot + naturalDrift;
            yScale = key === "mobile" ? 0.9 : 0.78;
          } else if (focusMode) {
            distance *= 1.02;
            angle = baseAngle + (index - (total - 1) / 2) * 0.22;
            yScale = 0.52;
          }

          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance * yScale + (sat.yOffset || 0);
          const z = 0.03 + (sat.zOffset || 0) + (selected && focusMode ? progress * 0.08 + index * 0.012 : 0);
          satGroup.position.lerp(new THREE.Vector3(x, y, z), prefersReducedMotion ? 1 : damping * 0.42);
          satGroup.rotation.z += prefersReducedMotion ? 0 : delta * 0.2;
          if (satGroup.userData.connection) {
            const attr = satGroup.userData.connection.geometry.attributes.position;
            attr.setXYZ(1, satGroup.position.x, satGroup.position.y, 0.04);
            attr.needsUpdate = true;
            satGroup.userData.connection.material.opacity = 0.1 * group.userData.opacity;
          }
        });
      });

      updateHover();

      photoMeshes.forEach(mesh => {
        if (mesh.userData.targetPos) {
          mesh.position.lerp(mesh.userData.targetPos, 0.12);
          mesh.rotation.z += (mesh.userData.targetRotZ - mesh.rotation.z) * 0.12;
        }
      });

      renderer.render(scene, camera);
    }

    async function init() {
      await Promise.all(categories.map(makeCategory));
      buildOrbitalSystem();
      buildConnectionTrails();
      buildBook();
      bookGroup.visible = true;
      bookTargetPos.set(0, -0.5, 0);
      state.stage = -1;
      updateTargets();
      camTargetPos.set(0, 5, 22);
      camera.position.set(0, 5, 22);
      camTargetLookAt.set(0, 0, 0);
      camCurrentLookAt.set(0, 0, 0);
      buildUI();
      document.querySelector('.hud').style.display = 'none';
      renderCart();
      animate();
    }

    document.getElementById("cartButton").addEventListener("click", () => {
      state.cartOpen = !state.cartOpen;
      renderCart();
    });
    document.getElementById("closeCart").addEventListener("click", () => {
      state.cartOpen = false;
      renderCart();
    });
    document.getElementById("mobilePrev").addEventListener("click", () => shiftMobileCategory(-1));
    document.getElementById("mobileNext").addEventListener("click", () => shiftMobileCategory(1));


    document.getElementById('btn-prev').addEventListener('click', () => turnPage(-1));
    document.getElementById('btn-next').addEventListener('click', () => turnPage(1));
    document.getElementById('btn-back-book').addEventListener('click', async () => {
      if (state.stage === "categories") {
        goBack();
        return;
      }
      if (state.stage !== -1) {
        goBack();
        return;
      }
      setBookBackVisible(false);
      await closeBookToCover();
      try { window.parent.postMessage({ type: 'flipmenu:book-returned' }, '*'); } catch(e) {}
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") goBack();
      if (event.key === "ArrowLeft") shiftMobileCategory(-1);
      if (event.key === "ArrowRight") shiftMobileCategory(1);
    });

    let touchStartX = 0;
    window.addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0]?.clientX || 0;
    }, { passive: true });
    window.addEventListener("touchend", (event) => {
      const endX = event.changedTouches[0]?.clientX || touchStartX;
      const deltaX = endX - touchStartX;
      if (Math.abs(deltaX) > 44) shiftMobileCategory(deltaX > 0 ? -1 : 1);
    }, { passive: true });

    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      if (!prefersReducedMotion) {
        pointerParallax.x += (pointer.x - pointerParallax.x) * 0.08;
        pointerParallax.y += (pointer.y - pointerParallax.y) * 0.08;
      }
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    function showLightbox(url) {
      if (!url) return;
      lightboxImg.src = url;
      lightbox.style.display = 'flex';
      setTimeout(() => {
        lightbox.classList.add('visible');
      }, 10);
    }

    function closeLightbox() {
      lightbox.classList.remove('visible');
      setTimeout(() => {
        lightbox.style.display = 'none';
        lightboxImg.src = '';
      }, 400);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    window.addEventListener("pointerup", (event) => {
      const app = document.getElementById("app");
      if (app && app.style.display === "none") return;

      if (event.clientX !== undefined) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }

      const targetElement = event.target instanceof Element ? event.target : null;
      const isCanvasClick = !targetElement || targetElement.id === "scene";
      if (targetElement && !isCanvasClick && targetElement.closest(".hud, #lightbox")) return;
      if (!isCanvasClick) return;

      if (state.stage === -1 && !isTransitioningBook) {
        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects(leaves, true);
        if (intersects.length > 0) {
          const clickX = intersects[0].point.x;

          if (activePhotoStack) {
            resetPhotoStack(activePhotoStack);
            resetCameraFromPhotos();
          }

          const bookIsOpen = bookAppearsOpen();
          if (!bookIsOpen) {
            openBookToMiddle();
          } else {
            selectBookMode('menu', clickX);
          }
        } else if (bookAppearsOpen()) {
          selectBookMode('menu', pointer.x >= 0 ? 3 : -3);
        }
        return;
      }
      const hitId = updateHover();
      if (hitId) {
        selectCategory(hitId);
        return;
      }
      if (activeFocusMode() && isCanvasClick) goBack();
    });

    window.addEventListener("popstate", goBack);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      overviewTargetCache.clear();
      ellipseLayoutCache.clear();
      buildOrbitalSystem();
      buildConnectionTrails();
      updateTargets();
    });

    init();
