// === CELESTIAL ENGINE GENERATED FROM index2.html (v56) ===
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { SVGLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/SVGLoader.js";
import { createCelestialPlanetCore, createSpatialOrbitRings } from "./src/celestial-planet.js";
import { createCameraAngleRig } from "./src/camera-angle-rig.js";

export class CelestialEngine {
    constructor(containerSelector) {
        this.containerSelector = containerSelector;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this._runLegacyEngine();
    }

    _runLegacyEngine() {
        const containerSelector = this.containerSelector;
        // Toàn bộ logic gốc được bọc lại
        
      
      
      

      const urlParams = new URLSearchParams(window.location.search);
      const layoutEditorEnabled = urlParams.has("layoutEdit") || urlParams.get("mode") === "layout-edit";
      const LAYOUT_STORAGE_KEY = "nganha-celestial-layout-overrides-safe-cinematic-3d-ellipse-v56";
      const PERFORMANCE = {
        maxPixelRatio: 1.15,
        targetFrameMs: 1000 / 42,
        reducedMotionFrameMs: 1000 / 24,
      };

      function hashSeed(input) {
        let hash = 2166136261;
        for (let i = 0; i < input.length; i++) {
          hash ^= input.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
      }

      function createSeededRandom(seedInput) {
        let seed = hashSeed(seedInput) || 1;
        return () => {
          seed += 0x6D2B79F5;
          let value = seed;
          value = Math.imul(value ^ (value >>> 15), value | 1);
          value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
          return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
      }

      const random = createSeededRandom("nganha-celestial-safe-cinematic-v61");

      function cappedPixelRatio() {
        return Math.min(window.devicePixelRatio || 1, PERFORMANCE.maxPixelRatio);
      }

      const GOLD = {
        shadow: new THREE.Color("#7d5422"),
        bronze: new THREE.Color("#9d7136"),
        main: new THREE.Color("#d1a65b"),
        highlight: new THREE.Color("#f1dfb0"),
        bright: new THREE.Color("#fff0bd"),
      };

      const uploadedCategoryIcons = {
        body: "standalone-celestial-menu%20(2)/public/category-icons-svg/body-massage.svg",
        foot: "standalone-celestial-menu%20(2)/public/category-icons-svg/foot-massage.svg",
        ear: "standalone-celestial-menu%20(2)/public/category-icons-svg/ear-care.svg",
        hair: "standalone-celestial-menu%20(2)/public/category-icons-svg/hair-wash.svg",
        facial: "standalone-celestial-menu%20(2)/public/category-icons-svg/facial-care.svg",
        nail: "standalone-celestial-menu%20(2)/public/category-icons-svg/nail-care.svg",
        heel: "standalone-celestial-menu%20(2)/public/category-icons-svg/heel-care.svg",
      };

      const SERVICE_CLIP_WINDOW = { start: 10, end: 15 };
      const serviceClip = (src, poster, alt) => ({
        type: "video",
        src,
        poster,
        alt,
        start: SERVICE_CLIP_WINDOW.start,
        end: SERVICE_CLIP_WINDOW.end,
      });

      const categories = [
        {
          id: "body-massage",
          name: "Body Massage",
          shortName: "Body",
          subtitle: "Thư giãn toàn thân",
          icon: { src: uploadedCategoryIcons.body, alt: "Body Massage", mode: "original", fit: "contain", scale: 0.88, offsetY: -0.04, removeBackground: true },
          tags: ["body-care", "relaxation", "therapy"],
          size: 2.06,
          position: {
            largeDesktop: { x: -1.5, y: 0.1, z: 1.2, scale: 0.96, rx: -0.08, ry: 0.24, rz: -0.04 },
            desktop: { x: -1.36, y: 0.08, z: 1.0, scale: 0.9, rx: -0.07, ry: 0.2, rz: -0.035 },
            laptop: { x: -1.1, y: 0.06, z: 0.8, scale: 0.8, rx: -0.06, ry: 0.16, rz: -0.028 },
            tabletLandscape: { x: -0.86, y: 0.04, z: 0.6, scale: 0.7, rx: -0.05, ry: 0.12, rz: -0.02 },
            tabletPortrait: { x: -0.5, y: 0.7, z: 0.36, scale: 0.62, rx: -0.04, ry: 0.1, rz: -0.014 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "lotus", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/add-more.webp", alt: "Lotus", mode: "gold-mask", scale: 0.84 }, angle: 18, distance: 1.45, size: 0.28, orbitSpeed: 0.16 },
            { id: "hand", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/aroma-oil.png", alt: "Aroma oil", mode: "gold-mask", scale: 0.8 }, angle: 182, distance: 1.65, size: 0.25, orbitSpeed: 0.12 },
            { id: "oil", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/coconut-oil.png", alt: "Coconut oil", mode: "gold-mask", scale: 0.74 }, angle: 318, distance: 1.5, size: 0.23, orbitSpeed: 0.14 },
          ],
          services: [
            { id: "body-60", name: "Massage Body 60'", description: "Nhịp lực êm, dầu thơm nhẹ, phù hợp phục hồi sau ngày dài.", duration: 60, price: 450000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/thai.png", alt: "Massage Body", mode: "original", fit: "cover" }, badge: "Được chọn nhiều" },
            { id: "hot-stone-90", name: "Đá nóng thư giãn 90'", description: "Nhiệt đá ấm và thao tác chậm giúp thả lỏng vùng cổ vai gáy.", duration: 90, price: 690000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/hotstone.png", alt: "Hot stone", mode: "original", fit: "cover" } },
          ],
        },
        {
          id: "ear-care",
          name: "Ráy Tai",
          subtitle: "Êm sạch tinh tế",
          icon: { src: uploadedCategoryIcons.ear, alt: "Ráy Tai", mode: "original", fit: "contain", scale: 0.82, removeBackground: true },
          tags: ["relaxation", "therapy"],
          size: 1.9,
          position: {
            largeDesktop: { x: 0.7, y: 0.92, z: 0.3, scale: 0.66, rx: 0.03, ry: -0.06, rz: 0.014 },
            desktop: { x: 0.6, y: 0.84, z: 0.24, scale: 0.62, rx: 0.028, ry: -0.055, rz: 0.012 },
            laptop: { x: 0.46, y: 0.72, z: 0.16, scale: 0.56, rx: 0.024, ry: -0.045, rz: 0.01 },
            tabletLandscape: { x: 0.36, y: 0.62, z: 0.06, scale: 0.5, rx: 0.02, ry: -0.035, rz: 0.008 },
            tabletPortrait: { x: 0.56, y: 0.68, z: -0.24, scale: 0.52, rx: 0.018, ry: -0.025, rz: 0.008 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "leaf", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/earclean.webp", alt: "Ear care", mode: "gold-mask", scale: 0.7 }, angle: 24, distance: 0.95, size: 0.18, orbitSpeed: 0.22 },
            { id: "tool", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/add-more.webp", alt: "Care", mode: "gold-mask", scale: 0.7 }, angle: 248, distance: 0.82, size: 0.16, orbitSpeed: 0.18 },
          ],
          services: [
            { id: "ear-clean", name: "Lấy ráy tai thư giãn", description: "Làm sạch nhẹ nhàng, kết hợp massage vùng tai và thái dương.", duration: 30, price: 180000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/ear-clean.png", alt: "Ear clean", mode: "original", fit: "cover" } },
          ],
        },
        {
          id: "hair-wash",
          name: "Gội Đầu",
          subtitle: "Dưỡng da đầu",
          icon: { src: uploadedCategoryIcons.hair, alt: "Gội Đầu", mode: "original", fit: "contain", scale: 0.82, removeBackground: true },
          tags: ["hair-care", "relaxation"],
          size: 1.98,
          position: {
            largeDesktop: { x: 1.56, y: 0.36, z: -0.16, scale: 0.68, rx: -0.06, ry: -0.24, rz: 0.04 },
            desktop: { x: 1.4, y: 0.32, z: -0.18, scale: 0.64, rx: -0.055, ry: -0.2, rz: 0.035 },
            laptop: { x: 1.14, y: 0.28, z: -0.18, scale: 0.56, rx: -0.045, ry: -0.16, rz: 0.028 },
            tabletLandscape: { x: 0.9, y: 0.24, z: -0.14, scale: 0.5, rx: -0.038, ry: -0.12, rz: 0.02 },
            tabletPortrait: { x: -0.56, y: 0.04, z: 0.18, scale: 0.54, rx: -0.03, ry: -0.08, rz: 0.012 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "comb", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/haircut.webp", alt: "Comb", mode: "gold-mask", scale: 0.78 }, angle: 168, distance: 1.45, size: 0.24, orbitSpeed: 0.14 },
            { id: "shampoo", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/hair-wash.png", alt: "Shampoo", mode: "gold-mask", scale: 0.76 }, angle: 322, distance: 1.42, size: 0.23, orbitSpeed: 0.15 },
            { id: "lotus", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/add-more.webp", alt: "Lotus", mode: "gold-mask", scale: 0.82 }, angle: 8, distance: 1.6, size: 0.25, orbitSpeed: 0.12 },
          ],
          services: [
            { id: "herbal-wash", name: "Gội đầu thảo mộc", description: "Gội, xả, massage đầu cổ vai gáy với hương thảo mộc dịu.", duration: 45, price: 260000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/hair-wash.png", alt: "Herbal hair wash", mode: "original", fit: "cover" }, badge: "Mới" },
            { id: "premium-scalp", name: "Dưỡng da đầu premium", description: "Làm sạch da đầu và dưỡng tóc chuyên sâu cho cảm giác nhẹ tênh.", duration: 60, price: 380000, image: { src: "standalone-celestial-menu%20(2)/public/images/hair-wash.png", alt: "Scalp care", mode: "original", fit: "cover" } },
          ],
        },
        {
          id: "foot-care",
          name: "Chăm Sóc Chân",
          subtitle: "Ấm và nhẹ",
          icon: { src: uploadedCategoryIcons.foot, alt: "Chăm Sóc Chân", mode: "original", fit: "contain", scale: 0.84, removeBackground: true },
          tags: ["body-care", "therapy"],
          size: 1.96,
          position: {
            largeDesktop: { x: -0.7, y: -0.86, z: 0.7, scale: 0.78, rx: 0.04, ry: 0.08, rz: 0.02 },
            desktop: { x: -0.6, y: -0.78, z: 0.6, scale: 0.72, rx: 0.036, ry: 0.07, rz: 0.018 },
            laptop: { x: -0.48, y: -0.68, z: 0.46, scale: 0.64, rx: 0.03, ry: 0.06, rz: 0.014 },
            tabletLandscape: { x: -0.36, y: -0.58, z: 0.34, scale: 0.56, rx: 0.025, ry: 0.05, rz: 0.01 },
            tabletPortrait: { x: 0.52, y: 0.02, z: -0.1, scale: 0.56, rx: 0.022, ry: 0.06, rz: 0.01 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "bowl", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/foot-massage.png", alt: "Foot bowl", mode: "gold-mask", scale: 0.72 }, angle: 204, distance: 1.08, size: 0.2, orbitSpeed: 0.17 },
            { id: "leaf", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/add-more.webp", alt: "Leaf", mode: "gold-mask", scale: 0.78 }, angle: 348, distance: 1.05, size: 0.18, orbitSpeed: 0.14 },
          ],
          services: [
            { id: "foot-reflex", name: "Ấn huyệt bàn chân", description: "Tập trung lòng bàn chân, bắp chân, giúp giảm mỏi khi di chuyển nhiều.", duration: 45, price: 280000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/foot-massage.png", alt: "Foot massage", mode: "original", fit: "cover" } },
          ],
        },
        {
          id: "facial-care",
          name: "Chăm Sóc Da Mặt",
          shortName: "Da Mặt",
          subtitle: "Sáng và dịu",
          icon: { src: uploadedCategoryIcons.facial, alt: "Chăm Sóc Da Mặt", mode: "original", fit: "contain", scale: 0.82, removeBackground: true },
          tags: ["skin-care", "relaxation"],
          size: 2.0,
          position: {
            largeDesktop: { x: 0.5, y: -0.6, z: 0.18, scale: 0.68, rx: 0.04, ry: -0.03, rz: -0.01 },
            desktop: { x: 0.44, y: -0.54, z: 0.14, scale: 0.62, rx: 0.036, ry: -0.028, rz: -0.008 },
            laptop: { x: 0.34, y: -0.48, z: 0.06, scale: 0.56, rx: 0.03, ry: -0.022, rz: -0.006 },
            tabletLandscape: { x: 0.26, y: -0.42, z: 0.0, scale: 0.5, rx: 0.026, ry: -0.018, rz: -0.004 },
            tabletPortrait: { x: -0.52, y: -0.48, z: 0.32, scale: 0.58, rx: 0.03, ry: -0.015, rz: -0.004 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "mask", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/facial.png", alt: "Mask", mode: "gold-mask", scale: 0.74 }, angle: 42, distance: 1.35, size: 0.22, orbitSpeed: 0.15 },
            { id: "cream", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/coconut-oil.png", alt: "Cream", mode: "gold-mask", scale: 0.7 }, angle: 186, distance: 1.48, size: 0.23, orbitSpeed: 0.13 },
          ],
          services: [
            { id: "facial-ritual", name: "Facial Ritual", description: "Làm sạch, massage nâng cơ nhẹ và cấp ẩm cho làn da mệt mỏi.", duration: 60, price: 520000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/facial.png", alt: "Facial ritual", mode: "original", fit: "cover" }, badge: "Signature" },
          ],
        },
        {
          id: "nail-care",
          name: "Chăm Sóc Móng",
          shortName: "Móng",
          subtitle: "Gọn và sạch",
          icon: { src: uploadedCategoryIcons.nail, alt: "Chăm Sóc Móng", mode: "original", fit: "contain", scale: 0.84, removeBackground: true },
          tags: ["body-care", "therapy"],
          size: 1.44,
          position: {
            largeDesktop: { x: -0.04, y: -1.06, z: -0.06, scale: 0.52, rx: 0.025, ry: -0.07, rz: -0.03 },
            desktop: { x: -0.02, y: -0.94, z: -0.08, scale: 0.48, rx: 0.022, ry: -0.06, rz: -0.025 },
            laptop: { x: 0.0, y: -0.8, z: -0.08, scale: 0.44, rx: 0.02, ry: -0.05, rz: -0.02 },
            tabletLandscape: { x: 0.0, y: -0.68, z: -0.06, scale: 0.42, rx: 0.016, ry: -0.035, rz: -0.012 },
            tabletPortrait: { x: -0.54, y: -0.88, z: -0.08, scale: 0.5, rx: 0.016, ry: -0.04, rz: -0.008 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "spark", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/add-more.webp", alt: "Spark", mode: "gold-mask", scale: 0.72 }, angle: 20, distance: 1.0, size: 0.18, orbitSpeed: 0.17 },
            { id: "care", icon: { src: uploadedCategoryIcons.heel, alt: "Heel care", mode: "gold-mask", scale: 0.64 }, angle: 222, distance: 0.92, size: 0.17, orbitSpeed: 0.14 },
          ],
          services: [
            { id: "nail-refresh", name: "Chăm sóc móng chân", description: "Làm sạch, tỉa gọn và dưỡng nhẹ vùng móng chân.", duration: 35, price: 220000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/foot-massage.png", alt: "Nail care", mode: "original", fit: "cover" } },
          ],
        },
        {
          id: "heel-care",
          name: "Chăm Sóc Gót",
          shortName: "Gót",
          subtitle: "Mềm và sáng",
          icon: { src: uploadedCategoryIcons.heel, alt: "Chăm Sóc Gót", mode: "original", fit: "contain", scale: 0.84, removeBackground: true },
          tags: ["body-care", "therapy"],
          size: 1.94,
          position: {
            largeDesktop: { x: 1.42, y: -0.34, z: -0.18, scale: 0.54, rx: -0.03, ry: -0.1, rz: -0.016 },
            desktop: { x: 1.3, y: -0.32, z: -0.18, scale: 0.5, rx: -0.028, ry: -0.088, rz: -0.014 },
            laptop: { x: 1.06, y: -0.3, z: -0.16, scale: 0.46, rx: -0.024, ry: -0.074, rz: -0.012 },
            tabletLandscape: { x: 0.82, y: -0.28, z: -0.12, scale: 0.42, rx: -0.02, ry: -0.06, rz: -0.01 },
            tabletPortrait: { x: 0.54, y: -0.5, z: -0.18, scale: 0.5, rx: -0.018, ry: -0.06, rz: -0.01 },
            mobile: { x: 0, y: 0.06, z: 0.2, scale: 0.62, ry: 0 },
          },
          satellites: [
            { id: "brush", icon: { src: "standalone-celestial-menu%20(2)/public/images/services/aroma-oil.png", alt: "Heel brush", mode: "gold-mask", scale: 0.72 }, angle: 8, distance: 1.12, size: 0.2, orbitSpeed: 0.18 },
            { id: "lotus", icon: { src: "standalone-celestial-menu%20(2)/public/assets/icons/add-more.webp", alt: "Lotus", mode: "gold-mask", scale: 0.78 }, angle: 312, distance: 1.08, size: 0.2, orbitSpeed: 0.14 },
          ],
          services: [
            { id: "heel-softening", name: "Dưỡng gót chân", description: "Làm mềm vùng gót, chăm sóc da khô và hoàn thiện cảm giác nhẹ chân.", duration: 40, price: 260000, image: { src: "standalone-celestial-menu%20(2)/public/images/services/foot-massage.png", alt: "Heel care", mode: "original", fit: "cover" } },
          ],
        },
      ];

      const categoryIcon3DDefaults = {
        mode: "embossed",
        scale: 0.305,
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0.02,
        depth: 0.034,
        bevelSize: 0.0045,
        bevelThickness: 0.006,
        bevelSegments: 5,
        curveSegments: 18,
        color: "#FFE998",
        metalness: 0.72,
        roughness: 0.2,
        emissiveIntensity: 0.16,
        glowOpacity: 0.18,
        shadowOpacity: 0.82,
      };

      const categoryIconPose = {
        "body-massage": { offsetX: 0, offsetY: 0, scale: 0.31, rotation: [-0.06, 0.08, -0.01] },
        "hair-wash": { offsetX: 0, offsetY: 0, scale: 0.31, rotation: [-0.04, -0.1, 0.025] },
        "facial-care": { offsetX: 0, offsetY: 0, scale: 0.315, rotation: [-0.04, 0.06, -0.018] },
        "foot-care": { offsetX: 0, offsetY: 0, scale: 0.3, rotation: [-0.05, 0.08, 0.018] },
        "heel-care": { offsetX: 0, offsetY: 0, scale: 0.295, rotation: [-0.035, -0.08, -0.02] },
        "ear-care": { offsetX: 0, offsetY: 0, scale: 0.285, rotation: [-0.02, -0.04, 0.014] },
        "nail-care": { offsetX: 0, offsetY: 0, scale: 0.292, rotation: [-0.04, 0.06, -0.024] },
      };

      categories.forEach((category) => {
        category.icon3D = {
          ...categoryIcon3DDefaults,
          ...(categoryIconPose[category.id] || {}),
          ...(category.icon3D || {}),
        };
      });

      const categoryLabelLayout = {
        "body-massage": { x: 0.46, y: -0.12, scale: 0.86 },
        "hair-wash": { x: -0.24, y: -0.54, scale: 0.78 },
        "facial-care": { x: 0.0, y: -0.5, scale: 0.82 },
        "foot-care": { x: -0.36, y: -0.18, scale: 0.72 },
        "heel-care": { x: 0.36, y: -0.06, scale: 0.66 },
        "ear-care": { x: 0.0, y: -0.22, scale: 0.58, distantOpacity: 0.56 },
        "nail-care": { x: 0.22, y: -0.16, scale: 0.58, distantOpacity: 0.68 },
      };

      const state = {
        stage: "categories",
        experienceId: "luxury-spa",
        categoryId: null,
        serviceId: null,
        mobileIndex: 0,
        cart: [],
        cartOpen: false,
        noticeTimer: null,
        serviceVideoModalTimer: null,
        serviceVideoObserver: null,
        focusStartedAt: 0,
        focusDuration: 1280,
        serviceRevealAt: 0,
        selectedFromId: null,
      };

      const BOOK_NOW_CONFIG = { route: "/booking", openMode: "new-window" };
      const CART_DUPLICATE_MODE = "increase-quantity";

      function loadLayoutOverrides() {
        try {
          const parsed = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || "{}");
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
          return {};
        }
      }

      let layoutOverrides = loadLayoutOverrides();

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function initGalaxyBackground() {
        const galaxyCanvas = document.getElementById("cel-galaxy-canvas");
        const ctx = galaxyCanvas.getContext("2d");
        let width = 0;
        let height = 0;
        let shootingStars = [];
        let galaxyStars = [];
        let animationFrame = 0;
        let lastShotAt = 0;

        function makeGalaxyStar() {
          const depth = random();
          const roll = random();
          return {
            x: random() * width,
            y: random() * height,
            radius: depth * 1.5 + 0.3,
            baseAlpha: depth * 0.6 + 0.3,
            twinkleSpeed: random() * 0.02 + 0.005,
            twinklePhase: random() * Math.PI * 2,
            hue: roll < 0.18 ? 'gold' : roll < 0.28 ? 'amber' : 'white',
            drift: (random() - 0.5) * 0.02,
          };
        }

        function resizeGalaxy() {
          const dpr = cappedPixelRatio();
          width = window.innerWidth;
          height = window.innerHeight;
          galaxyCanvas.width = Math.floor(width * dpr);
          galaxyCanvas.height = Math.floor(height * dpr);
          galaxyCanvas.style.width = `${width}px`;
          galaxyCanvas.style.height = `${height}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const starCount = Math.max(140, Math.floor((width * height) / 5200));
          galaxyStars = Array.from({ length: starCount }, makeGalaxyStar);
        }

        function spawnShootingStar() {
          const startX = random() * width * 0.6 + width * 0.2;
          const startY = random() * height * 0.2;
          const angle = Math.PI / 4 + (random() - 0.5) * 0.3;
          shootingStars.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * 9,
            vy: Math.sin(angle) * 9,
            life: 1,
            length: random() * 80 + 60,
            gold: random() < 0.5
          });
        }

        function drawGalaxyStars(time) {
          for (const star of galaxyStars) {
            star.x += star.drift;
            if (star.x < 0) star.x = width;
            if (star.x > width) star.x = 0;

            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.35 + 0.65;
            const alpha = Math.min(1, star.baseAlpha * twinkle);
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = star.hue === 'gold'
              ? `rgba(240, 210, 150, ${alpha})`
              : star.hue === 'amber'
              ? `rgba(224, 170, 110, ${alpha})`
              : `rgba(255, 248, 235, ${alpha})`;
            ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
            ctx.shadowColor = star.hue === 'gold' ? 'rgba(240,210,150,0.85)' : star.hue === 'amber' ? 'rgba(224,170,110,0.8)' : 'rgba(255,248,235,0.6)';
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }

        function drawGalaxyCore() {
          const cx = width * 0.5, cy = height * 0.28;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.38);
          grad.addColorStop(0, 'rgba(230,190,120,0.14)');
          grad.addColorStop(0.45, 'rgba(160,105,55,0.08)');
          grad.addColorStop(1, 'rgba(160,105,55,0)');
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        function drawShootingStars() {
          shootingStars.forEach((star) => {
            const grad = ctx.createLinearGradient(
              star.x,
              star.y,
              star.x - star.vx * (star.length / 9),
              star.y - star.vy * (star.length / 9)
            );
            const c = star.gold ? '240,205,140' : '255,240,215';
            grad.addColorStop(0, `rgba(${c},${star.life})`);
            grad.addColorStop(1, `rgba(${c},0)`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - star.vx * (star.length / 9), star.y - star.vy * (star.length / 9));
            ctx.stroke();

            star.x += star.vx;
            star.y += star.vy;
            star.life -= 0.02;
          });
          shootingStars = shootingStars.filter((star) => star.life > 0 && star.x < width + 100 && star.y < height + 100);
        }

        function loop(time) {
          ctx.clearRect(0, 0, width, height);
          drawGalaxyCore();
          drawGalaxyStars(time * 0.06);
          if (!prefersReducedMotion && time - lastShotAt > 3200) {
            lastShotAt = time;
            if (random() < 0.6) spawnShootingStar();
          }
          drawShootingStars();
          animationFrame = requestAnimationFrame(loop);
        }

        resizeGalaxy();
        window.addEventListener("resize", resizeGalaxy);
        animationFrame = requestAnimationFrame(loop);
        return {
          resize: resizeGalaxy,
          destroy() {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", resizeGalaxy);
          },
        };
      }

      const galaxyBackground = initGalaxyBackground();
      const canvas = document.getElementById("cel-scene-celestial");
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(cappedPixelRatio());
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const cameraAngleRig = createCameraAngleRig(THREE, canvas, {
        prefersReducedMotion: () => prefersReducedMotion,
        isLayoutEditing: () => layoutEditorEnabled,
      });

      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = new THREE.FogExp2("#01040a", 0.027);

      const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0.1, 8.5);

      const root = new THREE.Group();
      root.position.x = 0.8; // Shift galaxy slightly to the right to balance the layout
      root.position.y = 0.4; // Shift galaxy upwards
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
      let lastRenderAt = 0;
      let resizeFrame = 0;
      let resizeRebuildTimer = 0;
      const forceRenderWhenHidden = urlParams.has("capture") || navigator.webdriver;
      const cameraVelocity = new THREE.Vector3();
      const cameraLook = new THREE.Vector3(0, 0, 0);
      const cameraLookVelocity = new THREE.Vector3();
      const overviewCamera = {
        position: new THREE.Vector3(0, 0, 7.8),
        look: new THREE.Vector3(0, 0, 0),
      };
      const scratchTarget = new THREE.Vector3();
      const scratchWorldQuaternion = new THREE.Quaternion();
      const scratchInverseQuaternion = new THREE.Quaternion();
      const collisionCamera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 100);
      const overviewTargetCache = new Map();
      const ellipseLayoutCache = new Map();
      const hiddenTarget = new THREE.Vector3(0, -8, -6);
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
        { from: "facial-care", to: "heel-care", arc: -0.2, depth: -0.18, opacity: 0.18 },
        { from: "facial-care", to: "nail-care", arc: 0.18, depth: -0.12, opacity: 0.15 },
      ];
      const layoutEditor = {
        enabled: layoutEditorEnabled,
        selectedId: categories[0]?.id || null,
        dragging: false,
        pointerId: null,
        captureElement: null,
        dragPlane: new THREE.Plane(),
        dragOffset: new THREE.Vector3(),
        dragPoint: new THREE.Vector3(),
      };

      const ambient = new THREE.AmbientLight("#b7a37d", 0.075);
      scene.add(ambient);

      const hemi = new THREE.HemisphereLight("#7e97bf", "#211409", 0.18);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight("#f0d0a0", 2.55);
      keyLight.position.set(-6.6, 5.8, 5.2);
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
      rimLight.position.set(-2.6, -3.8, 3.0);
      scene.add(rimLight);

      const coolBackLight = new THREE.DirectionalLight("#7f99bd", 0.38);
      coolBackLight.position.set(6.5, 3.4, -5.4);
      scene.add(coolBackLight);

      const goldKicker = new THREE.PointLight("#d8a552", 0.12, 7.5);
      goldKicker.position.set(3.6, -1.9, 3.4);
      scene.add(goldKicker);

      const faceLight = new THREE.PointLight("#f4d6a0", 0.13, 8);
      faceLight.position.set(-2.2, 1.4, 3.0);
      scene.add(faceLight);

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
            const grain = (random() - 0.5) * 18;
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
        const texture = new THREE.CanvasTexture(c);
        texture.flipY = false;
        texture.premultiplyAlpha = false;
        texture.repeat.y = -1;
        texture.offset.y = 1;
        texture.colorSpace = THREE.SRGBColorSpace;
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
        face: new THREE.MeshPhysicalMaterial({ color: "#111315", map: stoneTexture, roughness: 0.78, metalness: 0.18, clearcoat: 0.22, clearcoatRoughness: 0.62, sheen: 0.18 }),
        face2: new THREE.MeshPhysicalMaterial({ color: "#090c11", roughness: 0.5, metalness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.38 }),
        line: new THREE.LineBasicMaterial({ color: "#d1ad68", transparent: true, opacity: 0.14 }),
        glassAura: new THREE.MeshBasicMaterial({ color: "#172237", transparent: true, opacity: 0.18, depthWrite: false }),
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
        const texture = new THREE.CanvasTexture(c);
        texture.flipY = false;
        texture.premultiplyAlpha = false;
        texture.repeat.y = -1;
        texture.offset.y = 1;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      function loadTexture(asset) {
        return new Promise((resolve) => {
          textureLoader.load(
            asset.src,
            (texture) => {
              texture.flipY = false;
              texture.premultiplyAlpha = false;
              texture.repeat.y = -1;
              texture.offset.y = 1;
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

      function isSvgAsset(asset) {
        return typeof asset?.src === "string" && asset.src.toLowerCase().split("?")[0].endsWith(".svg");
      }

      function createGoldIconMaterial(texture, asset) {
        const modeIndex = { "gold-mask": 0, "gold-duotone": 1, original: 2, monochrome: 3, cover: 2 }[asset.mode || "gold-mask"] ?? 0;
        return new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            uMap: { value: texture },
            uMode: { value: modeIndex },
            uOpacity: { value: asset.opacity ?? 0.9 },
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
        const requestedFontSize = options.fontSize || 44;
        c.width = requestedFontSize >= 120 ? 1792 : 768;
        c.height = requestedFontSize >= 120 ? 768 : 256;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = options.color || "#d8c298";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,.68)";
        ctx.shadowBlur = 5;
        const fontSize = requestedFontSize;
        ctx.font = `500 ${fontSize}px Abramo, "EB Garamond", Georgia, serif`;
        const arr = Array.isArray(lines) ? lines : [lines];
        const lineHeight = fontSize * 1.04;
        const hasCount = Boolean(options.count);
        const start = c.height / 2 - ((arr.length - 1) * lineHeight) / 2 - (hasCount ? fontSize * 0.24 : 0);
        const tracking = options.tracking ?? fontSize * 0.025;
        function drawTrackedText(line, x, y) {
          const chars = Array.from(line);
          const width = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + tracking * Math.max(0, chars.length - 1);
          let cursor = x - width / 2;
          chars.forEach((char) => {
            const charWidth = ctx.measureText(char).width;
            ctx.fillText(char, cursor + charWidth / 2, y);
            cursor += charWidth + tracking;
          });
        }
        arr.forEach((line, idx) => drawTrackedText(line, c.width / 2, start + idx * lineHeight));
        if (hasCount) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = options.countColor || "#a99672";
          ctx.font = `400 ${Math.round(fontSize * 0.46)}px Abramo, "EB Garamond", Georgia, serif`;
          drawTrackedText(options.count, c.width / 2, start + arr.length * lineHeight + 24);
        }
        const texture = new THREE.CanvasTexture(c);
        texture.flipY = false;
        texture.premultiplyAlpha = false;
        texture.repeat.y = -1;
        texture.offset.y = 1;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        return texture;
      }

      function makeLabelPlane(text, size, y, count) {
        const parts = splitTitle(text).slice(0, 2);
        const texture = makeTextTexture(parts, { fontSize: 150, color: "#f6e7ba", countColor: "#d8b974", tracking: 1.6 });
        const group = new THREE.Group();
        const glowMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });
        glowMaterial.userData.isLabelGlow = true;
        const labelWidth = size * Math.min(1.92, 1.02 + text.length * 0.052);
        const labelHeight = size * 0.76;
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(labelWidth * 1.04, labelHeight * 1.05), glowMaterial);
        glow.scale.setScalar(1.045);
        glow.position.z = -0.002;
        glow.renderOrder = 8;
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(labelWidth, labelHeight), material);
        mesh.renderOrder = 9;
        group.add(glow, mesh);
        group.position.set(0, y, 0.116);
        group.userData.textMaterials = [material, glowMaterial];
        group.userData.labelWidth = labelWidth;
        group.userData.labelHeight = labelHeight;
        group.userData.isBillboardLabel = true;
        return group;
      }

      const orbitLetterTextureCache = new Map();

      function makeOrbitLetterTexture(char) {
        const cacheKey = `orbit-letter:${char}`;
        if (orbitLetterTextureCache.has(cacheKey)) return orbitLetterTextureCache.get(cacheKey);
        const c = document.createElement("canvas");
        c.width = 192;
        c.height = 192;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `600 112px Abramo, "EB Garamond", Georgia, serif`;
        ctx.shadowColor = "rgba(255, 233, 152, 0.46)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#fff1c3";
        ctx.fillText(char, c.width / 2, c.height / 2 - 3);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#d5a65a";
        ctx.fillText(char, c.width / 2 + 3, c.height / 2 + 7);
        const texture = new THREE.CanvasTexture(c);
        texture.flipY = false;
        texture.premultiplyAlpha = false;
        texture.repeat.y = -1;
        texture.offset.y = 1;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        orbitLetterTextureCache.set(cacheKey, texture);
        return texture;
      }

      function makeOrbitingLabel(text, size, categoryId) {
        const group = new THREE.Group();
        const chars = Array.from(text);
        const visibleCount = chars.filter((char) => char !== " ").length;
        const arcSpan = Math.min(Math.PI * 0.92, Math.max(Math.PI * 0.48, chars.length * 0.12));
        const wrapRadius = size * (chars.length > 12 ? 0.86 : 0.76);
        const letterWidth = size * (chars.length > 12 ? 0.135 : 0.155);
        const letterHeight = size * 0.24;
        const materials = [];
        let visibleIndex = 0;

        chars.forEach((char, index) => {
          if (char === " ") return;
          const t = chars.length === 1 ? 0.5 : index / Math.max(1, chars.length - 1);
          const theta = -arcSpan / 2 + t * arcSpan;
          const texture = makeOrbitLetterTexture(char);
          const depth = Math.abs(Math.sin(theta));
          const centerWeight = Math.max(0, Math.cos(theta));

          const glowMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.1 + centerWeight * 0.04,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          });
          glowMaterial.userData.isOrbitTextGlow = true;
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.78 + centerWeight * 0.18,
            depthWrite: false,
            depthTest: false,
          });
          material.userData.isOrbitTextMain = true;

          const charGroup = new THREE.Group();
          const glow = new THREE.Mesh(new THREE.PlaneGeometry(letterWidth * 1.12, letterHeight * 1.12), glowMaterial);
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(letterWidth, letterHeight), material);
          mesh.renderOrder = 17;
          glow.renderOrder = 16;
          charGroup.add(glow, mesh);
          charGroup.position.set(
            Math.sin(theta) * wrapRadius,
            -size * 0.035 + Math.cos(theta * 1.35) * size * 0.028,
            -depth * size * 0.2
          );
          charGroup.rotation.y = -theta * 0.76;
          charGroup.rotation.z = theta * 0.08;
          const sideScale = 0.72 + centerWeight * 0.34;
          charGroup.scale.setScalar(sideScale);
          charGroup.userData.baseScale = sideScale;
          charGroup.userData.letterIndex = visibleIndex;
          charGroup.userData.isOrbitTextLetter = true;
          group.add(charGroup);
          materials.push(material, glowMaterial);
          visibleIndex += 1;
        });

        const seed = categoryId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
        group.userData.isOrbitingLabel = true;
        group.userData.textMaterials = materials;
        group.userData.orbitAngle = ((seed % 360) / 180) * Math.PI;
        group.userData.orbitSpeed = 0.05 + (seed % 5) * 0.006;
        group.userData.orbitRadius = size * 0.74;
        group.userData.orbitScaleY = 0.36;
        group.userData.orbitScaleZ = 0.18;
        group.userData.baseScale = 1;
        group.userData.distantOpacity = categoryId === "ear-care" || categoryId === "nail-care" ? 0.76 : 1;
        group.userData.visibleLetterCount = visibleCount;
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

      function makeLightStreakRings(radius, categoryId = "body-massage") {
        return createSpatialOrbitRings({ THREE, categoryId, radius });
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
          pts.push(new THREE.Vector3(Math.cos(a) * d, Math.sin(a * 1.08) * d * 0.62, 0.108 + i * 0.009));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);
        pts.forEach((p, index) => {
          const star = new THREE.Mesh(new THREE.SphereGeometry(radius * (index === 0 ? 0.022 : 0.015), 16, 10), index % 2 ? dimStarMat.clone() : starMat.clone());
          star.position.copy(p);
          star.userData.isConstellationStar = true;
          group.add(star);
          const starGlow = new THREE.Mesh(new THREE.CircleGeometry(radius * (index === 0 ? 0.052 : 0.036), 24), new THREE.MeshBasicMaterial({
            color: "#f1dfb0",
            transparent: true,
            opacity: index === 0 ? 0.14 : 0.08,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }));
          starGlow.position.set(p.x, p.y, p.z - 0.004);
          starGlow.userData.isConstellationGlow = true;
          group.add(starGlow);
        });
        return group;
      }

      const MEDALLION_FRONT_FACE_Z = 0.074;

      function makeMedallionCore(radius, depth, opacity = 1, categoryId = "body-massage") {
        return createCelestialPlanetCore({ THREE, categoryId, radius, opacity });
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
        const count = isMobile ? 700 : 2200;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const layer = random();
          const depth = layer < 0.68 ? -14 - random() * 22 : -3.4 - random() * 10;
          const x = (random() - 0.5) * (layer < 0.68 ? 26 : 18);
          const y = (random() - 0.5) * (layer < 0.68 ? 14 : 10.5);
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = depth;
          const warm = random() > 0.78;
          const color = new THREE.Color(warm ? "#f0d29a" : "#abc9f5");
          const titleClear = Math.abs(x) < 2.55 && y > 1.0 && y < 2.1;
          const dimMask = titleClear ? 0.16 : 1;
          const dim = (layer < 0.68 ? 0.18 + random() * 0.44 : 0.34 + random() * 0.86) * dimMask;
          colors[i * 3] = color.r * dim;
          colors[i * 3 + 1] = color.g * dim;
          colors[i * 3 + 2] = color.b * dim;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: isMobile ? 0.016 : 0.012, vertexColors: true, transparent: true, opacity: 0.96, depthWrite: false });
        const stars = new THREE.Points(geo, mat);
        scene.add(stars);
        return stars;
      }

      function makeMilkyWayBand() {
        const isMobile = responsiveKey() === "mobile";
        const group = new THREE.Group();
        const layerConfigs = [
          { count: isMobile ? 380 : 1050, z: -19, spread: 1.0, size: isMobile ? 0.014 : 0.01, opacity: 0.5 },
          { count: isMobile ? 220 : 620, z: -10, spread: 0.66, size: isMobile ? 0.02 : 0.016, opacity: 0.62 },
          { count: isMobile ? 60 : 160, z: -4.6, spread: 0.34, size: isMobile ? 0.03 : 0.024, opacity: 0.76 },
        ];

        layerConfigs.forEach((config, layerIndex) => {
          const positions = new Float32Array(config.count * 3);
          const colors = new Float32Array(config.count * 3);
          for (let i = 0; i < config.count; i++) {
            const t = random();
            const diagonalX = (t - 0.5) * 18.8;
            const bandY = 1.48 - t * 2.72 + Math.sin(t * Math.PI * 2.4) * 0.34;
            const jitter = (random() - 0.5) * config.spread;
            const fineJitter = (random() - 0.5) * config.spread * 2.1;
            positions[i * 3] = diagonalX + fineJitter;
            positions[i * 3 + 1] = bandY + jitter;
            positions[i * 3 + 2] = config.z - random() * 5.5;

            const warmDust = random() > 0.38;
            const color = new THREE.Color(warmDust ? "#e7bf78" : "#d8e5ff");
            const coreBoost = 1 - Math.min(1, Math.abs(jitter) / Math.max(0.001, config.spread));
            const dim = 0.22 + random() * 0.64 + coreBoost * 0.42;
            colors[i * 3] = color.r * dim;
            colors[i * 3 + 1] = color.g * dim;
            colors[i * 3 + 2] = color.b * dim;
          }

          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          const mat = new THREE.PointsMaterial({
            size: config.size,
            vertexColors: true,
            transparent: true,
            opacity: config.opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          const layer = new THREE.Points(geo, mat);
          layer.userData.depthLayer = layerIndex;
          group.add(layer);
        });

        scene.add(group);
        return group;
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
              float band = smoothstep(0.04, 0.78, 1.0 - abs(vUv.y - 0.45) * 2.0);
              float milky = smoothstep(0.26, 0.0, abs((vUv.y - 0.68) - (vUv.x - 0.12) * -0.32));
              float core = smoothstep(0.08, 0.0, abs((vUv.y - 0.64) - (vUv.x - 0.2) * -0.28));
              float horizon = smoothstep(0.0, 0.34, 1.0 - abs(vUv.y - 0.1) * 3.2);
              vec3 col = mix(vec3(0.005, 0.022, 0.05), vec3(0.045, 0.08, 0.15), n);
              col += vec3(0.16, 0.12, 0.052) * milky * (0.5 + n * 0.74);
              col += vec3(0.22, 0.16, 0.075) * core * (0.35 + n * 0.5);
              col += vec3(0.055, 0.036, 0.11) * smoothstep(0.52, 0.92, n);
              col += vec3(0.11, 0.075, 0.034) * horizon * (0.16 + n * 0.24);
              gl_FragColor = vec4(col, band * n * 0.68 + milky * 0.54 + core * 0.22 + horizon * 0.08);
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
          [-3.7, 1.75, -1.1, 0.12], [-1.85, 1.12, -0.9, 0.07], [1.74, 1.05, -1.2, 0.07],
          [2.25, 0.6, -0.8, 0.1], [-3.0, -0.58, -0.7, 0.09], [-0.9, -0.86, -0.9, 0.07],
          [3.1, -0.84, -0.7, 0.08], [-3.36, 0.22, -1.0, 0.055], [3.6, 1.8, -1.2, 0.05],
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

      function makeSoftDustTexture() {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext("2d");
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, "rgba(255,232,170,0.36)");
        gradient.addColorStop(0.34, "rgba(220,150,76,0.13)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(c);
        texture.flipY = false;
        texture.premultiplyAlpha = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      function makeForegroundDepthLayer() {
        const group = new THREE.Group();
        const dustTexture = makeSoftDustTexture();
        const dustSpecs = [
          [-3.45, -1.5, 1.55, 1.16, 0.18],
          [-2.34, -1.38, 1.28, 0.74, 0.11],
          [0.14, -1.82, 1.42, 1.26, 0.11],
          [2.52, -1.34, 1.18, 0.7, 0.08],
        ];
        dustSpecs.forEach(([x, y, z, size, opacity], index) => {
          const dust = new THREE.Sprite(new THREE.SpriteMaterial({
            map: dustTexture,
            color: index === 0 ? "#f0c577" : "#c7894a",
            transparent: true,
            opacity,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          }));
          dust.position.set(x, y, z);
          dust.scale.set(size, size, 1);
          dust.userData.basePosition = dust.position.clone();
          dust.userData.baseOpacity = opacity;
          dust.userData.phase = index * 1.14;
          group.add(dust);
        });

        const arcMaterial = new THREE.MeshBasicMaterial({
          color: "#e8c176",
          transparent: true,
          opacity: 0.13,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const arc = new THREE.Mesh(
          new THREE.RingGeometry(2.7, 2.715, 192, 1, Math.PI * 0.74, Math.PI * 0.68),
          arcMaterial
        );
        arc.position.set(-3.15, -1.36, 1.34);
        arc.rotation.set(-0.12, 0.1, -0.23);
        arc.scale.set(1.24, 0.44, 1);
        arc.userData.basePosition = arc.position.clone();
        arc.userData.baseOpacity = 0.13;
        arc.userData.phase = 2.7;
        group.add(arc);

        scene.add(group);
        return group;
      }

      const stars = makeStars();
      const milkyWayStars = makeMilkyWayBand();
      const nebula = makeNebula();
      const horizon = makeHorizon();
      const starGlints = makeStarGlints();
      const foregroundDepth = makeForegroundDepthLayer();
      stars.visible = false;
      milkyWayStars.visible = false;
      nebula.visible = false;
      horizon.visible = false;

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
        const override = layoutEditorEnabled ? layoutOverrides?.[key]?.[category.id] : null;
        const layout = override ? { ...base, ...override } : base;
        return layoutEditorEnabled ? layout : addPlanetBreathingRoom(layout, key);
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
        return `${key}:${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}:${layoutEditorEnabled ? "edit" : "view"}`;
      }

      function categoryLabelWorldSize(category) {
        return {
          width: category.size * Math.min(1.92, 1.02 + category.name.length * 0.052),
          height: category.size * 0.76,
          offsetY: -(category.size / 2) * 1.15,
        };
      }

      const ellipseArcOrder = [
        "body-massage",
        "foot-care",
        "nail-care",
        "facial-care",
        "heel-care",
        "hair-wash",
        "ear-care",
      ];

      const planetLayoutConfigs = {
        "body-massage": {
          orbitT: 0.515,
          positionOffset: [0.46, 0.12, 0.28],
          scale: 1.02,
          rotation: [-0.1, 0.34, -0.06],
          ringTilt: [-0.36, 0.08, -0.22],
          labelOffset: [0.16, -0.02, 0.05],
          visualPriority: "primary",
        },
        "foot-care": {
          orbitT: 0.724,
          positionOffset: [0.16, 0.52, -0.34],
          scale: 0.9,
          rotation: [0.06, 0.16, 0.03],
          ringTilt: [0.18, -0.2, 0.18],
          labelOffset: [-0.08, -0.02, 0.04],
          visualPriority: "secondary",
        },
        "ear-care": {
          orbitT: 0.232,
          positionOffset: [0.26, -0.36, 0.86],
          scale: 0.76,
          rotation: [0.02, -0.08, 0.01],
          ringTilt: [-0.2, 0.18, 0.08],
          labelOffset: [0, -0.05, 0.03],
          visualPriority: "secondary",
        },
        "hair-wash": {
          orbitT: 0.115,
          positionOffset: [0.34, -0.14, 0.1],
          scale: 0.62,
          rotation: [-0.1, -0.32, 0.05],
          ringTilt: [-0.45, -0.2, 0.26],
          labelOffset: [0, -0.02, 0.02],
          visualPriority: "supporting",
        },
        "facial-care": {
          orbitT: 0.992,
          positionOffset: [-1.18, 0.22, -0.5],
          scale: 0.62,
          rotation: [0.06, -0.04, -0.02],
          ringTilt: [0.12, 0.28, -0.16],
          labelOffset: [0, -0.04, 0.02],
          visualPriority: "supporting",
        },
        "heel-care": {
          orbitT: 0.92,
          positionOffset: [0.04, -0.08, -1.22],
          scale: 0.54,
          rotation: [-0.04, -0.12, -0.02],
          ringTilt: [-0.1, -0.34, 0.2],
          labelOffset: [0.02, -0.02, 0.02],
          visualPriority: "supporting",
        },
        "nail-care": {
          orbitT: 0.318,
          positionOffset: [-0.04, -0.32, -1.34],
          scale: 0.85,
          rotation: [0.03, -0.09, -0.04],
          ringTilt: [0.08, 0.26, -0.2],
          labelOffset: [0, -0.04, 0.02],
          visualPriority: "supporting",
        },
      };

      function ellipseOptionsForKey(key) {
        if (key === "mobile") {
          return { centerX: -0.04, centerY: -0.1, radiusX: 2.08, radiusY: 1.28, depthAmplitude: 0.78, depthPhase: 0.74, scaleMultiplier: 0.48 };
        }
        if (key === "tabletPortrait") {
          return { centerX: -0.06, centerY: -0.12, radiusX: 2.48, radiusY: 1.5, depthAmplitude: 0.96, depthPhase: 0.74, scaleMultiplier: 0.56 };
        }
        if (key === "tabletLandscape") {
          return { centerX: -0.06, centerY: -0.18, radiusX: 3.18, radiusY: 1.86, depthAmplitude: 1.22, depthPhase: 0.76, scaleMultiplier: 0.66 };
        }
        if (key === "laptop") {
          return { centerX: -0.08, centerY: -0.2, radiusX: 3.72, radiusY: 2.12, depthAmplitude: 1.46, depthPhase: 0.78, scaleMultiplier: 0.74 };
        }
        return { centerX: -0.08, centerY: -0.2, radiusX: 4.08, radiusY: 2.28, depthAmplitude: 1.68, depthPhase: 0.78, scaleMultiplier: key === "largeDesktop" ? 0.9 : 0.84 };
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
          labelOffset: [0, 0, 0],
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
          const target = new THREE.Vector3(p.x + offsetX, p.y + offsetY, p.z + offsetZ + (config.zBias || 0));
          group.userData.layoutConfig = config;
          group.userData.ellipseTarget = new THREE.Vector3(p.x, p.y, p.z);
          group.userData.ellipseScale = scale;
          group.userData.target.set(target.x, target.y, target.z);
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
        const ellipseLayout = layoutEditor.enabled ? new Map() : ellipseLayoutForKey(key);
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

      function setCollisionCameraForBounds(bounds, key) {
        const stateForCamera = perspectiveCameraStateForBounds(bounds, key);
        collisionCamera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
        collisionCamera.fov = camera.fov;
        collisionCamera.near = camera.near;
        collisionCamera.far = camera.far;
        collisionCamera.position.copy(stateForCamera.position);
        collisionCamera.lookAt(stateForCamera.look);
        collisionCamera.updateProjectionMatrix();
        collisionCamera.updateMatrixWorld(true);
      }

      function projectedScreenMetrics(item) {
        const width = Math.max(1, window.innerWidth);
        const height = Math.max(1, window.innerHeight);
        const center = item.position.clone();
        const ndc = center.clone().project(collisionCamera);
        const px = (ndc.x * 0.5 + 0.5) * width;
        const py = (-ndc.y * 0.5 + 0.5) * height;
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(collisionCamera.matrixWorld, 0);
        const cameraUp = new THREE.Vector3().setFromMatrixColumn(collisionCamera.matrixWorld, 1);
        const planetRadiusWorld = worldRadiusFor(item.category, { ...item.layout, scale: item.scale });
        const label = categoryLabelWorldSize(item.category);
        const labelHalfWidthWorld = (label.width * item.scale) / 2;
        const labelHeightWorld = label.height * item.scale;
        const planetEdge = center.clone().add(cameraRight.clone().multiplyScalar(planetRadiusWorld)).project(collisionCamera);
        const labelEdge = center.clone().add(cameraRight.clone().multiplyScalar(labelHalfWidthWorld)).project(collisionCamera);
        const labelBottom = center.clone()
          .add(cameraUp.clone().multiplyScalar(label.offsetY * item.scale - labelHeightWorld / 2))
          .project(collisionCamera);
        const planetRadiusPx = Math.abs(planetEdge.x - ndc.x) * width * 0.5;
        const labelHalfWidthPx = Math.abs(labelEdge.x - ndc.x) * width * 0.5;
        const labelDropPx = Math.abs(labelBottom.y - ndc.y) * height * 0.5;
        const screenRadius = Math.max(planetRadiusPx, labelHalfWidthPx * 0.95) + labelDropPx * 0.26;
        return { x: px, y: py, radius: screenRadius };
      }

      function worldUnitsPerPixelAt(point) {
        const distance = Math.max(0.1, collisionCamera.position.distanceTo(point));
        const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(collisionCamera.fov) / 2) * distance;
        return visibleHeight / Math.max(1, window.innerHeight);
      }

      function relaxOverviewCollisions(items, key, iterations = 12) {
        const gapByKey = {
          largeDesktop: 58,
          desktop: 54,
          laptop: 46,
          tabletLandscape: 40,
          tabletPortrait: 34,
          mobile: 28,
        };
        const minGapPx = gapByKey[key] || 48;
        const safe = safeWorldBounds(key);
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(collisionCamera.matrixWorld, 0);
        const cameraUp = new THREE.Vector3().setFromMatrixColumn(collisionCamera.matrixWorld, 1);

        for (let pass = 0; pass < iterations; pass++) {
          let moved = false;
          const metrics = items.map(projectedScreenMetrics);
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              const a = metrics[i];
              const b = metrics[j];
              let dx = b.x - a.x;
              let dy = b.y - a.y;
              let dist = Math.hypot(dx, dy);
              if (dist < 0.001) {
                dx = (j - i) * 0.01 + 0.01;
                dy = 0.01;
                dist = Math.hypot(dx, dy);
              }
              const minDist = a.radius + b.radius + minGapPx;
              if (dist >= minDist) continue;

              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              const worldPerPixel = (worldUnitsPerPixelAt(items[i].position) + worldUnitsPerPixelAt(items[j].position)) * 0.5;
              const pushWorld = overlap * worldPerPixel * 0.54;
              const weightA = items[i].scale > items[j].scale ? 0.42 : 0.58;
              const weightB = 1 - weightA;
              const pushVector = cameraRight.clone().multiplyScalar(nx * pushWorld).add(cameraUp.clone().multiplyScalar(-ny * pushWorld));
              items[i].position.addScaledVector(pushVector, -weightA);
              items[j].position.addScaledVector(pushVector, weightB);
              moved = true;
            }
          }
          items.forEach((item) => {
            item.position.x = THREE.MathUtils.clamp(item.position.x, safe.minX, safe.maxX);
            item.position.y = THREE.MathUtils.clamp(item.position.y, safe.minY, safe.maxY);
          });
          if (!moved) break;
        }
      }

      function resolveOverviewTargets(key) {
        if (layoutEditor.enabled) {
          return new Map(initialOverviewTargets(key).map((item) => [item.category.id, item]));
        }
        const cacheKey = overviewCacheKey(key);
        if (overviewTargetCache.has(cacheKey)) return overviewTargetCache.get(cacheKey);

        const items = initialOverviewTargets(key);
        const resolved = new Map(items.map((item) => [item.category.id, item]));
        overviewTargetCache.set(cacheKey, resolved);
        return resolved;
      }

      function calculateCategoryUniverseBounds(key = responsiveKey()) {
        if (!layoutEditor.enabled && !activeFocusMode()) {
          const ellipseLayout = ellipseLayoutForKey(key);
          if (ellipseLayout.ellipseParams) {
            const padding = key === "mobile" ? 1.22 : key === "tabletPortrait" ? 1.16 : key === "tabletLandscape" ? 1.16 : key === "laptop" ? 1.18 : 1.2;
            return boundsFromEllipse(ellipseLayout.ellipseParams, padding);
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
        if (key === "laptop" || window.innerHeight < 760) return 2;
        return 3;
      }

      function servicePanelReady() {
        return !state.serviceRevealAt || performance.now() >= (state.serviceRevealAt - 50);
      }

      function focusCategorySlot(index, total, key) {
        const t = total <= 1 ? 0.5 : index / (total - 1);
        if (key === "mobile") {
          return {
            x: 0.98,
            y: 1.34 - t * 1.98,
            z: 1.18,
            diameter: 0.4,
          };
        }
        if (key === "tabletPortrait" || key === "tabletLandscape") {
          return {
            x: 1.62,
            y: 1.5 - t * 2.88,
            z: 1.16,
            diameter: 0.52,
          };
        }
        return {
          x: 2.05,
          y: 1.58 - t * 3.16,
          z: 1.18,
          diameter: 0.6,
        };
      }

      function updateTargets() {
        const key = responsiveKey();
        const selectedId = state.categoryId;
        const focusMode = activeFocusMode();
        const focusNav = categories.filter((category) => category.id !== selectedId);
        const overviewTargets = !focusMode ? resolveOverviewTargets(key) : null;
        if (!(layoutEditor.enabled && layoutEditor.dragging)) {
          fitPerspectiveCameraToBounds(calculateCategoryUniverseBounds(key), key);
        }
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

          if (overviewTargets) {
            const resolved = overviewTargets.get(category.id);
            if (resolved) {
              x = resolved.position.x;
              y = resolved.position.y;
              z = resolved.position.z;
              scale = resolved.scale;
              group.userData.layoutConfig = resolved.config;
              group.userData.targetRotation = resolved.config?.rotation || [base.rx || 0, base.ry || 0, base.rz || 0];
              group.userData.targetRingTilt = resolved.config?.ringTilt || [0, 0, 0];
              group.userData.visualPriority = resolved.config?.visualPriority || "supporting";
            }
          }

          if (key === "mobile" && !focusMode && !overviewTargets) {
            const index = categories.findIndex((item) => item.id === category.id);
            const total = categories.length;
            const rawOffset = ((index - state.mobileIndex + total + Math.floor(total / 2)) % total) - Math.floor(total / 2);
            if (Math.abs(rawOffset) <= 1) {
              x = rawOffset * 0.92;
              y = 0.06;
              z = rawOffset === 0 ? 0.22 : -0.28;
              scale = rawOffset === 0 ? 0.66 : 0.4;
              opacity = rawOffset === 0 ? 1 : 0.34;
            } else {
              hiddenTarget.set(rawOffset < 0 ? -2.8 : 2.8, -0.1, -3.8);
              x = hiddenTarget.x;
              y = hiddenTarget.y;
              z = hiddenTarget.z;
              scale = 0.34;
              opacity = 0;
            }
          }

          if (focusMode) {
            if (selected) {
              if (key === "mobile") {
                x = -0.62;
                y = 1.36;
                z = 1.92;
                scale = Math.min(1.0, base.scale * 1.22);
              } else if (key === "tabletPortrait" || key === "tabletLandscape") {
                x = -2.38;
                y = 0.78;
                z = 1.86;
                scale = Math.max(0.9, base.scale * 1.16);
              } else {
                x = -3.05;
                y = 0.38;
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
              opacity = matches ? 0.64 : 0.28;
            }
          }

          group.userData.target.set(x, y, z);
          group.userData.targetScale = scale;
          group.userData.targetOpacity = opacity;
          if (!group.userData.hasInitialLayout) {
            group.position.copy(group.userData.target);
            group.scale.setScalar(scale);
            group.userData.opacity = opacity;
            group.userData.hasInitialLayout = true;
          }
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
        const visible = !focusMode && !layoutEditor.enabled;
        orbitalSystem.group.visible = visible;
        if (!visible || !orbitalSystem.curve) return;
        if (orbitalSystem.params?.key !== key) buildOrbitalSystem();
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
        const visible = !focusMode && !layoutEditor.enabled;
        connectionTrails.visible = visible;
        if (!visible) return;
        milkyWayStreams.forEach((stream) => updateMilkyWayStreamGeometry(stream, elapsed));
      }

      function layoutEditorElements() {
        return {
          panel: document.getElementById("cel-layoutEditor"),
          select: document.getElementById("cel-layoutCategorySelect"),
          x: document.getElementById("cel-layoutXInput"),
          y: document.getElementById("cel-layoutYInput"),
          z: document.getElementById("cel-layoutZInput"),
          scale: document.getElementById("cel-layoutScaleInput"),
          save: document.getElementById("cel-layoutSaveButton"),
          reset: document.getElementById("cel-layoutResetButton"),
          copy: document.getElementById("cel-layoutCopyButton"),
          status: document.getElementById("cel-layoutEditorStatus"),
        };
      }

      function setLayoutEditorStatus(message) {
        const { status } = layoutEditorElements();
        if (status) status.textContent = message;
      }

      function selectedLayoutCategory() {
        return categories.find((category) => category.id === layoutEditor.selectedId) || categories[0];
      }

      function ensureLayoutOverride(category, key = responsiveKey()) {
        if (!layoutOverrides[key]) layoutOverrides[key] = {};
        if (!layoutOverrides[key][category.id]) {
          const layout = layoutFor(category, key);
          layoutOverrides[key][category.id] = {
            x: Number(layout.x.toFixed(3)),
            y: Number(layout.y.toFixed(3)),
            z: Number(layout.z.toFixed(3)),
            scale: Number(layout.scale.toFixed(3)),
            rx: layout.rx || 0,
            ry: layout.ry || 0,
            rz: layout.rz || 0,
          };
        }
        return layoutOverrides[key][category.id];
      }

      function copyLayoutJson(message = "Copied layout JSON") {
        const text = JSON.stringify(layoutOverrides, null, 2);
        window.__celestialLayoutOverrides = layoutOverrides;
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => setLayoutEditorStatus(message))
            .catch(() => setLayoutEditorStatus("Saved. JSON is available at window.__celestialLayoutOverrides"));
        } else {
          setLayoutEditorStatus("Saved. JSON is available at window.__celestialLayoutOverrides");
        }
      }

      async function saveLayoutOverrides(message = "Saved layout locally") {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutOverrides));
        copyLayoutJson(`${message} + copied JSON`);
        try {
          const response = await fetch("http://127.0.0.1:8772/save-layout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              savedAt: new Date().toISOString(),
              viewport: responsiveKey(),
              overrides: layoutOverrides,
            }),
          });
          if (response.ok) {
            setLayoutEditorStatus("Saved to layout-overrides.saved.json");
          }
        } catch {
          setLayoutEditorStatus("Saved locally. Start layout-save-server.js for file save.");
        }
      }

      function syncLayoutEditorPanel() {
        if (!layoutEditor.enabled) return;
        const els = layoutEditorElements();
        if (!els.panel) return;
        els.panel.classList.add("visible");

        if (!els.select.dataset.ready) {
          els.select.innerHTML = categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join("");
          els.select.dataset.ready = "1";
        }

        const category = selectedLayoutCategory();
        const key = responsiveKey();
        const layout = layoutFor(category, key);
        els.select.value = category.id;
        els.x.value = layout.x.toFixed(2);
        els.y.value = layout.y.toFixed(2);
        els.z.value = layout.z.toFixed(2);
        els.scale.value = layout.scale.toFixed(2);
      }

      function applyLayoutEditorInputs() {
        const category = selectedLayoutCategory();
        if (!category) return;
        const els = layoutEditorElements();
        const key = responsiveKey();
        const override = ensureLayoutOverride(category, key);
        const bounds = safeWorldBounds(key);
        override.x = Number(THREE.MathUtils.clamp(Number(els.x.value) || 0, bounds.minX, bounds.maxX).toFixed(3));
        override.y = Number(THREE.MathUtils.clamp(Number(els.y.value) || 0, bounds.minY, bounds.maxY).toFixed(3));
        override.z = Number((Number(els.z.value) || 0).toFixed(3));
        override.scale = Number(Math.max(0.1, Number(els.scale.value) || 0.1).toFixed(3));
        updateTargets();
        syncLayoutEditorPanel();
      }

      function updateEditorPointer(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }

      function worldToScreen(world) {
        const projected = world.clone().project(camera);
        if (!window.debugProjectedZ) {
          console.log("CELESTIAL TỌA ĐỘ MỤC TIÊU z:", projected.z, "x:", projected.x, "y:", projected.y, "camera:", camera.position, "look:", cameraLook);
          window.debugProjectedZ = true;
        }
        return {
          x: (projected.x * 0.5 + 0.5) * window.innerWidth,
          y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
          z: projected.z,
        };
      }

      function projectedCategoryRadius(category, group) {
        const center = group.getWorldPosition(new THREE.Vector3());
        const rim = group.localToWorld(new THREE.Vector3(category.size * 0.76, 0, 0));
        const a = worldToScreen(center);
        const b = worldToScreen(rim);
        return Math.hypot(a.x - b.x, a.y - b.y);
      }

      function pickLayoutCategoryFromScreen(event) {
        let best = null;
        medallions.forEach((group, id) => {
          const category = group.userData.category;
          const center = worldToScreen(group.getWorldPosition(new THREE.Vector3()));
          if (center.z < -1 || center.z > 1) return;
          const radius = projectedCategoryRadius(category, group);
          const hitRadius = THREE.MathUtils.clamp(radius * 1.65, 54, 230);
          const distance = Math.hypot(event.clientX - center.x, event.clientY - center.y);
          if (distance <= hitRadius && (!best || distance < best.distance)) {
            best = { id, distance };
          }
        });
        return best?.id || null;
      }

      function ensureLayoutDragHandles() {
        const layer = document.getElementById("cel-layoutDragHandles");
        if (!layoutEditor.enabled || !layer || layer.dataset.ready) return;
        layer.innerHTML = categories.map((category) => `
          <button
            class="layout-drag-handle"
            type="button"
            data-layout-handle="${category.id}"
            data-label="${category.shortName || category.name}"
            aria-label="Kéo ${category.name}"
          ></button>
        `).join("");
        layer.dataset.ready = "1";
        layer.querySelectorAll("[data-layout-handle]").forEach((handle) => {
          handle.addEventListener("pointerdown", (event) => {
            beginLayoutDrag(event, handle.dataset.layoutHandle, handle);
          });
        });
      }

      function updateLayoutDragHandles() {
        if (!layoutEditor.enabled) return;
        const layer = document.getElementById("cel-layoutDragHandles");
        if (!layer) return;
        layer.classList.toggle("visible", !activeFocusMode());
        if (activeFocusMode()) return;
        ensureLayoutDragHandles();
        medallions.forEach((group, id) => {
          const handle = layer.querySelector(`[data-layout-handle="${id}"]`);
          if (!handle) return;
          const category = group.userData.category;
          const center = worldToScreen(group.getWorldPosition(new THREE.Vector3()));
          const radius = THREE.MathUtils.clamp(projectedCategoryRadius(category, group) * 2.05, 72, 260);
          const visible = center.z >= -1 && center.z <= 1 && group.userData.opacity > 0.08;
          handle.hidden = !visible;
          handle.style.width = `${radius}px`;
          handle.style.height = `${radius}px`;
          handle.style.transform = `translate(${center.x}px, ${center.y}px) translate(-50%, -50%)`;
          handle.classList.toggle("is-selected", id === layoutEditor.selectedId);
          handle.classList.toggle("is-dragging", id === layoutEditor.selectedId && layoutEditor.dragging);
        });
      }

      function beginLayoutDrag(event, forcedId = null, captureElement = null) {
        if (!layoutEditor.enabled || activeFocusMode() || event.button !== 0) return;
        if (event.target.closest?.(".layout-editor")) return;
        updateEditorPointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(clickable, false);
        const hitId = forcedId || pickLayoutCategoryFromScreen(event) || hits[0]?.object?.userData?.categoryId || null;
        if (!hitId) return;

        const group = medallions.get(hitId);
        if (!group) return;
        event.preventDefault();
        event.stopPropagation();
        layoutEditor.selectedId = hitId;
        layoutEditor.dragging = true;
        layoutEditor.pointerId = event.pointerId;
        layoutEditor.captureElement = captureElement || canvas;
        layoutEditor.captureElement.setPointerCapture?.(event.pointerId);

        const normal = new THREE.Vector3();
        camera.getWorldDirection(normal);
        layoutEditor.dragPlane.setFromNormalAndCoplanarPoint(normal, group.userData.target);
        if (raycaster.ray.intersectPlane(layoutEditor.dragPlane, layoutEditor.dragPoint)) {
          layoutEditor.dragOffset.copy(group.userData.target).sub(layoutEditor.dragPoint);
        } else {
          layoutEditor.dragOffset.set(0, 0, 0);
        }
        ensureLayoutOverride(group.userData.category);
        syncLayoutEditorPanel();
        updateLayoutDragHandles();
        setLayoutEditorStatus(`Dragging ${group.userData.category.name}`);
      }

      function moveLayoutDrag(event) {
        if (!layoutEditor.enabled || !layoutEditor.dragging || event.pointerId !== layoutEditor.pointerId) return;
        event.preventDefault();
        updateEditorPointer(event);
        raycaster.setFromCamera(pointer, camera);
        if (!raycaster.ray.intersectPlane(layoutEditor.dragPlane, layoutEditor.dragPoint)) return;
        const category = selectedLayoutCategory();
        const group = medallions.get(category.id);
        const key = responsiveKey();
        const bounds = safeWorldBounds(key);
        const next = layoutEditor.dragPoint.clone().add(layoutEditor.dragOffset);
        const override = ensureLayoutOverride(category, key);
        override.x = Number(THREE.MathUtils.clamp(next.x, bounds.minX, bounds.maxX).toFixed(3));
        override.y = Number(THREE.MathUtils.clamp(next.y, bounds.minY, bounds.maxY).toFixed(3));
        updateTargets();
        if (group) {
          group.position.copy(group.userData.target);
          group.userData.velocity.set(0, 0, 0);
        }
        syncLayoutEditorPanel();
      }

      function endLayoutDrag(event) {
        if (!layoutEditor.enabled || event.pointerId !== layoutEditor.pointerId) return;
        layoutEditor.dragging = false;
        layoutEditor.pointerId = null;
        layoutEditor.captureElement?.releasePointerCapture?.(event.pointerId);
        layoutEditor.captureElement = null;
        updateTargets();
        updateLayoutDragHandles();
        setLayoutEditorStatus("Position updated. Press Save to keep it.");
      }

      function initLayoutEditor() {
        if (!layoutEditor.enabled) return;
        const els = layoutEditorElements();
        els.select.addEventListener("change", () => {
          layoutEditor.selectedId = els.select.value;
          ensureLayoutOverride(selectedLayoutCategory());
          syncLayoutEditorPanel();
          updateLayoutDragHandles();
        });
        [els.x, els.y, els.z, els.scale].forEach((input) => {
          input.addEventListener("change", applyLayoutEditorInputs);
          input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") applyLayoutEditorInputs();
          });
        });
        els.save.addEventListener("click", () => saveLayoutOverrides());
        els.copy.addEventListener("click", () => copyLayoutJson());
        els.reset.addEventListener("click", () => {
          delete layoutOverrides[responsiveKey()];
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutOverrides));
          updateTargets();
          syncLayoutEditorPanel();
          setLayoutEditorStatus("Reset current viewport layout");
        });
        canvas.addEventListener("pointerdown", beginLayoutDrag);
        window.addEventListener("pointermove", moveLayoutDrag);
        window.addEventListener("pointerup", endLayoutDrag);
        ensureLayoutDragHandles();
        updateLayoutDragHandles();
        syncLayoutEditorPanel();
        setLayoutEditorStatus(`Editing ${responsiveKey()} layout`);
      }

      function applyOpacity(group, opacity) {
        group.traverse((child) => {
          if (!child.material) return;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            mat.transparent = true;
            if (mat.uniforms?.uOpacity) {
              if (mat.userData.baseUniformOpacity == null) mat.userData.baseUniformOpacity = mat.uniforms.uOpacity.value;
              mat.uniforms.uOpacity.value = mat.userData.baseUniformOpacity * opacity;
            }
            else {
              if (mat.userData.baseOpacity == null) mat.userData.baseOpacity = mat.opacity;
              const factor = child.userData.isRimGlint ? 0.55 : 1;
              mat.opacity = mat.userData.baseOpacity * opacity * factor;
            }
          });
        });
      }

      function buildUI() {
        renderServices();
        renderFocusRail();
        renderA11yList();
        renderIconPreviewPanel();
      }

      function renderIconPreviewPanel() {
        const panel = document.getElementById("cel-iconPreviewPanel");
        if (!panel) return;
        const enabled = new URLSearchParams(window.location.search).get("iconPreview") === "1";
        panel.hidden = !enabled;
        if (!enabled) return;
        panel.innerHTML = `
          <h2>SVG 3D Icon Preview</h2>
          <div class="icon-preview-grid">
            ${categories.map((category) => `
              <article class="icon-preview-item">
                <img src="${category.icon.src}" alt="${category.name}" />
                <div>
                  <strong>${category.name}</strong>
                  <code>${JSON.stringify(category.icon3D, null, 2)}</code>
                </div>
              </article>
            `).join("")}
          </div>
        `;
      }

      function renderFocusRail() {
        const rail = document.getElementById("cel-focusCategoryRail");
        const current = selectedCategory();
        const visible = activeFocusMode() && current && servicePanelReady();
        rail.classList.toggle("visible", Boolean(visible));
        if (!visible) {
          rail.innerHTML = "";
          return;
        }

        rail.innerHTML = categories
          .filter((category) => category.id !== current.id)
          .map((category) => `
            <button class="focus-category-button" type="button" data-focus-category="${category.id}" aria-label="Xem ${category.name}">
              <span class="focus-category-orb" aria-hidden="true">
                <img src="${category.icon.src}" alt="" loading="lazy" />
              </span>
              <span class="focus-category-label">${category.shortName || category.name}</span>
            </button>
          `)
          .join("");

        rail.querySelectorAll("[data-focus-category]").forEach((button) => {
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            selectCategory(button.dataset.focusCategory);
          });
        });
      }

      function renderA11yList() {
        const list = document.getElementById("cel-category-a11y");
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

      function currentLang() {
        const lang = (document.documentElement.lang || navigator.language || "vi").slice(0, 2).toLowerCase();
        if (lang === "zh") return "cn";
        if (lang === "ko") return "kr";
        if (["vi", "en", "cn", "jp", "kr"].includes(lang)) return lang;
        return "vi";
      }

      function normalizeCategoryKey(value) {
        return String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
      }

      const categoryAliasMap = {
        body: "body-massage",
        "body massage": "body-massage",
        foot: "foot-care",
        "foot massage": "foot-care",
        facial: "facial-care",
        "facial care": "facial-care",
        "cham soc mat": "facial-care",
        "hair wash": "hair-wash",
        "goi dau": "hair-wash",
        "ear clean": "ear-care",
        "ear care": "ear-care",
        "ray tai": "ear-care",
        "heel skin shave": "heel-care",
        "heel care": "heel-care",
        "cham soc got": "heel-care",
        "manicure and pedicure": "nail-care",
        nails: "nail-care",
        nail: "nail-care",
        mong: "nail-care",
        barber: "hair-wash",
        premium: "body-massage",
        additional: "body-massage",
      };

      function categoryIdForService(service) {
        const key = normalizeCategoryKey(service.cat || service.category || service.categoryId || "");
        if (categoryAliasMap[key]) return categoryAliasMap[key];

        const byName = categories.find((category) => {
          const categoryKeys = [
            category.id,
            category.name,
            category.shortName,
            category.subtitle,
          ].map(normalizeCategoryKey);
          return categoryKeys.some((categoryKey) => categoryKey && (categoryKey === key || categoryKey.includes(key) || key.includes(categoryKey)));
        });
        return byName?.id || null;
      }

      function serviceName(service) {
        const lang = currentLang();
        return service.names?.[lang] || service.names?.vi || service.names?.en || service.name || service.id;
      }

      function serviceDescription(service) {
        const lang = currentLang();
        return service.descriptions?.[lang] || service.descriptions?.vi || service.descriptions?.en || service.description || "";
      }

      function defaultServiceClipSrc(service) {
        // Removed hardcoded video fallback — return null so services without
        // uploaded media will show images instead of broken /videos/spa-bg-*.mp4
        return null;
      }

      function serviceMediaFromSource(service, fallbackImage, alt) {
        // Priority 1: media_url / media_type from DB (admin uploaded via /admin/services)
        if (service.media_type === "video" && service.media_url) {
          return {
            type: "video",
            src: service.media_url,
            poster: service.img || service.poster || service.thumbnail || fallbackImage,
            alt,
            start: 0,
            end: 9999,
          };
        }
        if (service.media_url) {
          return {
            type: "image",
            src: service.media_url,
            poster: service.media_url,
            alt,
            start: 0,
            end: 0,
          };
        }

        // Priority 2: legacy media/video objects (for backward compat with fallback data)
        const media = service.media && typeof service.media === "object" ? service.media : null;
        const videoObject = service.video && typeof service.video === "object" ? service.video : null;
        const videoSrc =
          media?.type === "video" ? media.src :
          videoObject?.src ||
          (typeof service.video === "string" ? service.video : "") ||
          service.videoSrc ||
          service.videoUrl ||
          service.clipSrc ||
          service.mediaVideo ||
          null; // No hardcoded fallback

        if (!videoSrc) {
          return {
            type: "image",
            src: fallbackImage,
            poster: fallbackImage,
            alt,
            start: SERVICE_CLIP_WINDOW.start,
            end: SERVICE_CLIP_WINDOW.end,
          };
        }

        return {
          type: "video",
          src: videoSrc,
          poster: media?.poster || videoObject?.poster || service.poster || service.thumbnail || service.thumb || fallbackImage,
          alt: media?.alt || videoObject?.alt || alt,
          start: Number.isFinite(Number(media?.start ?? videoObject?.start ?? service.clipStart))
            ? Number(media?.start ?? videoObject?.start ?? service.clipStart)
            : SERVICE_CLIP_WINDOW.start,
          end: Number.isFinite(Number(media?.end ?? videoObject?.end ?? service.clipEnd))
            ? Number(media?.end ?? videoObject?.end ?? service.clipEnd)
            : SERVICE_CLIP_WINDOW.end,
        };
      }

      function toGalaxyService(service) {
        const name = serviceName(service);
        const imageSrc = service.img || service.image || service.thumbnail || service.poster || "https://placehold.co/360x220?text=Ngan+Ha+Spa";
        return {
          id: service.id,
          name,
          description: serviceDescription(service),
          duration: Number(service.timeValue || service.duration || 0),
          price: Number(service.priceVND || service.price || 0),
          image: {
            src: imageSrc,
            alt: name,
            mode: "original",
            fit: "cover",
          },
          media: serviceMediaFromSource(service, imageSrc, name),
          sourceService: service,
        };
      }

      function toBookingService(category, service) {
        if (service.sourceService) return service.sourceService;
        const imageSrc = service.image?.src || "https://placehold.co/360x220?text=Ngan+Ha+Spa";
        return {
          id: service.id,
          cat: category.name || category.id,
          names: { vi: service.name, en: service.name },
          descriptions: { vi: service.description || "", en: service.description || "" },
          img: imageSrc,
          media: service.media || serviceMediaFromSource(service, imageSrc, service.name),
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
        const payload = toBookingService(category, service);
        window.parent?.postMessage({ type, service: payload, ...extra }, "*");
      }

      async function hydrateServicesFromApi() {
        try {
          const response = await fetch("/api/services", { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const services = await response.json();
          if (!Array.isArray(services) || services.length === 0) return;

          const grouped = new Map();
          services
            .filter((service) => service && service.ACTIVE !== false && (!service.menuType || service.menuType === "standard"))
            .forEach((service) => {
              const categoryId = categoryIdForService(service);
              if (!categoryId) return;
              if (!grouped.has(categoryId)) grouped.set(categoryId, []);
              grouped.get(categoryId).push(toGalaxyService(service));
            });

          if (grouped.size === 0) return;
          categories.forEach((category) => {
            const apiServices = grouped.get(category.id);
            if (apiServices?.length) category.services = apiServices;
          });
          console.log("CELESTIAL: Đã đồng bộ dịch vụ từ /api/services");
        } catch (error) {
          console.warn("CELESTIAL: Không tải được /api/services, dùng dịch vụ mẫu.", error);
        }
      }

      function buildBookingUrl(categoryId, serviceId) {
        const params = new URLSearchParams({ experienceId: state.experienceId, categoryId, serviceId });
        return `${BOOK_NOW_CONFIG.route}?${params.toString()}`;
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
        const notification = document.getElementById("cel-cartNotification");
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
            postBookingAction("flipmenu:add-service-to-cart", category, service, {
              sourceRect: sourceRectFromElement(sourceElement),
              selectedCount: cartCount(),
            });
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
          postBookingAction("flipmenu:add-service-to-cart", category, service, {
            sourceRect: sourceRectFromElement(sourceElement),
            selectedCount: cartCount(),
          });
        }
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

      function localizedCartText(key) {
        const copy = {
          empty: {
            vi: "Chưa chọn dịch vụ",
            en: "No selected service",
            cn: "尚未选择服务",
            jp: "サービスが選択されていません",
            kr: "선택된 서비스가 없습니다",
          },
          place: {
            vi: "Đặt lịch",
            en: "Place order",
            cn: "提交订单",
            jp: "予約へ進む",
            kr: "예약하기",
          },
        };
        const lang = currentLang();
        return copy[key]?.[lang] || copy[key]?.en || "";
      }

      function renderCart() {
        const button = document.getElementById("cel-cartButton");
        const badge = document.getElementById("cel-cartBadge");
        const drawer = document.getElementById("cel-cartDrawer");
        const list = document.getElementById("cel-cartItems");
        const subtotal = document.getElementById("cel-cartSubtotal");
        const placeOrder = document.getElementById("cel-placeOrderButton");
        const count = cartCount();
        if (button) {
          button.classList.toggle("has-items", count > 0);
          button.setAttribute("aria-label", `Giỏ hàng, ${count} dịch vụ`);
        }
        if (badge) badge.textContent = String(count);
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
              </article>
            `).join("")
          : `<div class="detail-box">${localizedCartText("empty")}</div>`;
        if (placeOrder) {
          placeOrder.textContent = localizedCartText("place");
          placeOrder.disabled = count === 0;
          placeOrder.classList.toggle("is-disabled", count === 0);
        }
      }

      function escapeAttribute(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      function renderServiceMedia(item) {
        const image = item.image || {};
        const media = item.media || serviceMediaFromSource(item, image.src, image.alt || item.name);
        const src = media.src || image.src || "https://placehold.co/360x220?text=Ngan+Ha+Spa";
        const poster = media.poster || image.src || src;
        const alt = media.alt || image.alt || item.name || "Ngan Ha Spa service";
        if (media.type !== "video" || !src) {
          return `<img class="service-card-media" src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" onerror="this.style.opacity=.25" />`;
        }

        const start = Number.isFinite(Number(media.start)) ? Number(media.start) : SERVICE_CLIP_WINDOW.start;
        const end = Number.isFinite(Number(media.end)) ? Number(media.end) : SERVICE_CLIP_WINDOW.end;
        return `
          <video
            class="service-card-media service-card-video"
            src="${escapeAttribute(src)}"
            poster="${escapeAttribute(poster)}"
            muted
            playsinline
            preload="metadata"
            data-clip-start="${escapeAttribute(start)}"
            data-clip-end="${escapeAttribute(end)}"
            data-full-src="${escapeAttribute(src)}"
            data-full-poster="${escapeAttribute(poster)}"
            data-full-label="${escapeAttribute(alt)}"
            aria-label="${escapeAttribute(alt)}"
          ></video>
        `;
      }

      function resetServiceClipObserver() {
        if (state.serviceVideoObserver) {
          state.serviceVideoObserver.disconnect();
          state.serviceVideoObserver = null;
        }
      }

      function pauseServiceClipVideos(root = document) {
        root.querySelectorAll?.(".service-card-video").forEach((video) => video.pause());
      }

      function seekVideoIntoClip(video) {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        const requestedStart = Number(video.dataset.clipStart || SERVICE_CLIP_WINDOW.start);
        const requestedEnd = Number(video.dataset.clipEnd || SERVICE_CLIP_WINDOW.end);
        const start = Math.min(Math.max(0, requestedStart), Math.max(0, video.duration - 0.25));
        const end = Math.min(Math.max(start + 0.5, requestedEnd), video.duration);
        video.dataset.clipStart = String(start);
        video.dataset.clipEnd = String(end);
        if (video.currentTime < start || video.currentTime >= end || Math.abs(video.currentTime - start) > 6) {
          video.currentTime = start;
        }
      }

      function setupServiceClipVideos(root) {
        resetServiceClipObserver();
        const videos = Array.from(root.querySelectorAll(".service-card-video"));
        if (!videos.length) return;

        videos.forEach((video) => {
          const replaceBrokenVideo = () => {
            const image = document.createElement("img");
            image.className = "service-card-media";
            image.src = video.poster || "https://placehold.co/360x220?text=SPA";
            image.alt = video.getAttribute("aria-label") || "Ngan Ha Spa service";
            video.replaceWith(image);
          };
          video.addEventListener("loadedmetadata", () => seekVideoIntoClip(video), { once: true });
          video.addEventListener("timeupdate", () => {
            const end = Number(video.dataset.clipEnd || SERVICE_CLIP_WINDOW.end);
            const start = Number(video.dataset.clipStart || SERVICE_CLIP_WINDOW.start);
            if (Number.isFinite(end) && video.currentTime >= end) {
              video.currentTime = Number.isFinite(start) ? start : 0;
              if (!prefersReducedMotion) video.play().catch(() => undefined);
            }
          });
          video.addEventListener("ended", () => {
            seekVideoIntoClip(video);
            if (!prefersReducedMotion) video.play().catch(() => undefined);
          });
          video.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openServiceVideoModal(video);
          });
          video.addEventListener("error", replaceBrokenVideo, { once: true });
        });

        if (prefersReducedMotion) {
          pauseServiceClipVideos(root);
          return;
        }

        if (!("IntersectionObserver" in window)) {
          videos.forEach((video) => {
            seekVideoIntoClip(video);
            video.play().catch(() => undefined);
          });
          return;
        }

        const scrollRoot = document.getElementById("cel-serviceContent") || null;
        state.serviceVideoObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target;
              if (!(video instanceof HTMLVideoElement)) return;
              if (entry.isIntersecting) {
                seekVideoIntoClip(video);
                video.play().catch(() => undefined);
              } else {
                video.pause();
              }
            });
          },
          { root: scrollRoot, threshold: 0.45 }
        );
        videos.forEach((video) => state.serviceVideoObserver.observe(video));
      }

      function ensureServiceVideoModal() {
        let overlay = document.getElementById("cel-serviceVideoModal");
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.id = "cel-serviceVideoModal";
        overlay.className = "service-video-modal";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
          <div class="service-video-modal__backdrop" data-video-modal-close></div>
          <section class="service-video-modal__stage" role="dialog" aria-modal="true" aria-label="Service video">
            <button class="service-video-modal__close" type="button" data-video-modal-close aria-label="Close video">×</button>
            <video class="service-video-modal__video" controls playsinline preload="metadata"></video>
          </section>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll("[data-video-modal-close]").forEach((button) => {
          button.addEventListener("click", () => closeServiceVideoModal());
        });
        overlay.querySelector(".service-video-modal__video").addEventListener("ended", () => {
          window.clearTimeout(state.serviceVideoModalTimer);
          state.serviceVideoModalTimer = window.setTimeout(() => closeServiceVideoModal(), 260);
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && overlay.classList.contains("visible")) closeServiceVideoModal();
        });

        return overlay;
      }

      function openServiceVideoModal(sourceVideo) {
        const overlay = ensureServiceVideoModal();
        const modalVideo = overlay.querySelector(".service-video-modal__video");
        const src = sourceVideo.dataset.fullSrc || sourceVideo.currentSrc || sourceVideo.src;
        if (!src) return;

        window.clearTimeout(state.serviceVideoModalTimer);
        pauseServiceClipVideos();
        modalVideo.pause();
        modalVideo.src = src;
        modalVideo.poster = sourceVideo.dataset.fullPoster || sourceVideo.poster || "";
        modalVideo.currentTime = 0;
        modalVideo.setAttribute("aria-label", sourceVideo.dataset.fullLabel || sourceVideo.getAttribute("aria-label") || "Service video");
        overlay.classList.remove("closing");
        overlay.classList.add("visible");
        overlay.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => {
          modalVideo.play().catch(() => undefined);
        });
      }

      function resumeVisibleServiceClips() {
        if (prefersReducedMotion) return;
        document.querySelectorAll(".service-card-video").forEach((video) => {
          if (!(video instanceof HTMLVideoElement)) return;
          const rect = video.getBoundingClientRect();
          const visible = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
          if (!visible) return;
          seekVideoIntoClip(video);
          video.play().catch(() => undefined);
        });
      }

      function closeServiceVideoModal() {
        const overlay = document.getElementById("cel-serviceVideoModal");
        if (!overlay || !overlay.classList.contains("visible")) return;
        const modalVideo = overlay.querySelector(".service-video-modal__video");
        window.clearTimeout(state.serviceVideoModalTimer);
        overlay.classList.add("closing");
        modalVideo.pause();
        window.setTimeout(() => {
          overlay.classList.remove("visible", "closing");
          overlay.setAttribute("aria-hidden", "true");
          modalVideo.removeAttribute("src");
          modalVideo.load();
          resumeVisibleServiceClips();
        }, prefersReducedMotion ? 20 : 240);
      }

      function toggleCartDrawer(forceOpen) {
        state.cartOpen = typeof forceOpen === "boolean" ? forceOpen : !state.cartOpen;
        renderCart();
      }

      function transitionPanel(nextStage, updateState) {
        const sheet = document.getElementById("cel-serviceSheet");
        sheet.classList.add("switching");
        window.clearTimeout(state.panelTimer);
        state.panelTimer = window.setTimeout(
          () => {
            if (updateState) updateState();
            state.stage = nextStage;
            buildUI();
            requestAnimationFrame(() => {
              document.getElementById("cel-serviceSheet").classList.remove("switching");
            });
          },
          prefersReducedMotion ? 40 : 220
        );
      }

      function renderServices() {
        try {
          resetServiceClipObserver();
          const category = selectedCategory();
          const service = selectedService();
          const visible = activeFocusMode() && category;
          const sheet = document.getElementById("cel-serviceSheet");
          sheet.classList.toggle("visible", Boolean(visible));
        if (!visible) pauseServiceClipVideos(sheet);
        if (!category) return;

        document.getElementById("cel-sheetKicker").textContent = "Danh mục";
        document.getElementById("cel-sheetTitle").textContent = category.name;

        const content = document.getElementById("cel-serviceContent");
        if (state.stage === "services") {
          // Group services by name (same name, different durations)
          const serviceGroups = [];
          const groupMap = new Map();
          category.services.forEach((item) => {
            // Use sourceService.names.en for grouping (consistent key across languages)
            const groupKey = (item.sourceService?.names?.en || item.name || item.id).trim().toLowerCase();
            if (!groupMap.has(groupKey)) {
              const group = { key: groupKey, items: [] };
              groupMap.set(groupKey, group);
              serviceGroups.push(group);
            }
            groupMap.get(groupKey).items.push(item);
          });
          // Sort items within each group by duration
          serviceGroups.forEach((group) => group.items.sort((a, b) => a.duration - b.duration));

          content.innerHTML = serviceGroups.length
            ? serviceGroups
                .map((group, groupIdx) => {
                  const representative = group.items[0];
                  const hasVariants = group.items.length > 1;
                  // Total quantity across all variants in this group
                  const totalQty = group.items.reduce((sum, item) => sum + serviceQuantity(item.id), 0);

                  if (!hasVariants) {
                    // Single variant — render as before (no dropdown)
                    const item = representative;
                    const quantity = serviceQuantity(item.id);
                    return `
                      <article class="service-card ${quantity > 0 ? "is-selected" : ""}">
                        ${renderServiceMedia(item)}
                        <div>
                          <h3>${item.name}</h3>
                          <p>${item.description}</p>
                        </div>
                        <div class="service-price">
                          <span>${item.duration} phút</span>
                          <strong>${formatPrice(item.price)}</strong>
                        </div>
                        <div class="service-actions">
                          <button class="book-now-button" type="button" data-book-service="${item.id}">BOOK NOW</button>
                          ${quantity > 0 ? `
                            <div class="service-qty-control" aria-label="${item.name} đã chọn ${quantity}">
                              <button type="button" data-cart-dec="${item.id}" aria-label="Giảm ${item.name}">−</button>
                              <span>${quantity}</span>
                              <button type="button" data-cart-inc="${item.id}" aria-label="Tăng ${item.name}">+</button>
                            </div>
                          ` : `
                            <button class="add-cart-button" type="button" data-cart-inc="${item.id}" aria-label="Thêm ${item.name} vào giỏ hàng">
                              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M7 8h10l-.8 11H7.8L7 8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
                                <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                <path d="M18.5 6.5h3M20 5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>
                              </svg>
                            </button>
                          `}
                        </div>
                      </article>
                    `;
                  }

                  // Multiple variants — grouped card with dropdown
                  return `
                    <article class="service-card service-card--grouped ${totalQty > 0 ? "is-selected" : ""}" data-group-idx="${groupIdx}">
                      ${renderServiceMedia(representative)}
                      <div>
                        <h3>${representative.name}</h3>
                        <p>${representative.description}</p>
                      </div>
                      <div class="service-price service-price--grouped">
                        <div class="celestial-dropdown" data-group-idx="${groupIdx}">
                          <div class="celestial-dropdown-trigger">
                            <span class="celestial-dropdown-label">${group.items[0].duration} phút — ${formatPrice(group.items[0].price)}</span>
                            <svg class="celestial-dropdown-arrow" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                          </div>
                          <div class="celestial-dropdown-menu">
                            ${group.items.map((variant, vIdx) => `
                              <div class="celestial-dropdown-option ${vIdx === 0 ? "is-selected" : ""}" data-value="${variant.id}">
                                ${variant.duration} phút — ${formatPrice(variant.price)}
                              </div>
                            `).join("")}
                          </div>
                          <input type="hidden" class="variant-select" data-group-idx="${groupIdx}" value="${group.items[0].id}" />
                        </div>
                      </div>
                      <div class="service-actions">
                        <button class="book-now-button" type="button" data-book-group="${groupIdx}">BOOK NOW</button>
                        <button class="add-cart-button" type="button" data-cart-group="${groupIdx}" aria-label="Thêm ${representative.name} vào giỏ hàng">
                          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M7 8h10l-.8 11H7.8L7 8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
                            <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                            <path d="M18.5 6.5h3M20 5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>
                          </svg>
                        </button>
                      </div>
                    </article>
                  `;
                })
                .join("")
            : `<div class="detail-box">Danh mục này chưa có dịch vụ mẫu.</div>`;
          setupServiceClipVideos(content);

          // Event: Custom dropdown logic
          content.querySelectorAll(".celestial-dropdown").forEach((dropdown) => {
            const trigger = dropdown.querySelector(".celestial-dropdown-trigger");
            const label = dropdown.querySelector(".celestial-dropdown-label");
            const input = dropdown.querySelector(".variant-select");
            const options = dropdown.querySelectorAll(".celestial-dropdown-option");

            trigger.addEventListener("click", (e) => {
              e.stopPropagation();
              const isOpen = dropdown.classList.contains("is-open");
              content.querySelectorAll(".celestial-dropdown").forEach((d) => d.classList.remove("is-open"));
              if (!isOpen) {
                dropdown.classList.add("is-open");
                const closeHandler = () => {
                  dropdown.classList.remove("is-open");
                  document.removeEventListener("click", closeHandler);
                };
                document.addEventListener("click", closeHandler);
              }
            });

            options.forEach((opt) => {
              opt.addEventListener("click", (e) => {
                e.stopPropagation();
                options.forEach((o) => o.classList.remove("is-selected"));
                opt.classList.add("is-selected");
                label.textContent = opt.textContent.trim();
                input.value = opt.dataset.value;
                dropdown.classList.remove("is-open");
              });
            });
          });

          // Event: BOOK NOW for single-variant services
          content.querySelectorAll("[data-book-service]").forEach((button) => {
            button.addEventListener("click", () => {
              state.serviceId = button.dataset.bookService;
              const serviceToBook = category.services.find((item) => item.id === state.serviceId);
              if (serviceToBook) postBookingAction("flipmenu:book-now", category, serviceToBook);
            });
          });
          // Event: BOOK NOW for grouped services (reads dropdown selection)
          content.querySelectorAll("[data-book-group]").forEach((button) => {
            button.addEventListener("click", () => {
              const groupIdx = button.dataset.bookGroup;
              const select = content.querySelector(`.variant-select[data-group-idx="${groupIdx}"]`);
              const selectedId = select?.value;
              if (selectedId) {
                state.serviceId = selectedId;
                const serviceToBook = category.services.find((item) => item.id === selectedId);
                if (serviceToBook) postBookingAction("flipmenu:book-now", category, serviceToBook);
              }
            });
          });
          // Event: Add to cart for single-variant
          content.querySelectorAll("[data-cart-inc]").forEach((button) => {
            button.addEventListener("click", () => {
              const serviceToAdd = category.services.find((item) => item.id === button.dataset.cartInc);
              if (serviceToAdd) addToCart(category, serviceToAdd, button);
            });
          });
          // Event: Add to cart for grouped services (reads dropdown selection)
          content.querySelectorAll("[data-cart-group]").forEach((button) => {
            button.addEventListener("click", () => {
              const groupIdx = button.dataset.cartGroup;
              const select = content.querySelector(`.variant-select[data-group-idx="${groupIdx}"]`);
              const selectedId = select?.value;
              if (selectedId) {
                const serviceToAdd = category.services.find((item) => item.id === selectedId);
                if (serviceToAdd) addToCart(category, serviceToAdd, button);
              }
            });
          });
          content.querySelectorAll("[data-cart-dec]").forEach((button) => {
            button.addEventListener("click", () => {
              removeFromCart(button.dataset.cartDec);
            });
          });
          return;
        }
        } catch(err) {
          alert("LỖI NGHIÊM TRỌNG TRONG RENDERSERVICES: " + err.message + "\nLine: " + err.stack);
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
        if (state.stage === "categories") return false;
        window.clearTimeout(state.revealTimer);
        closeServiceVideoModal();
        resetServiceClipObserver();
        pauseServiceClipVideos();
        state.serviceRevealAt = 0;
        if (state.stage === "services") {
          state.stage = "categories";
          state.categoryId = null;
          state.serviceId = null;
          state.selectedFromId = null;
          state.focusStartedAt = 0;
        }
        buildUI();
        updateTargets();
        return true;
      }

      this.handleMenuBack = () => {
        const videoModal = document.getElementById("cel-serviceVideoModal");
        if (videoModal?.classList.contains("visible")) {
          closeServiceVideoModal();
          return true;
        }
        if (state.stage === "services") return goBack();
        return false;
      };

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

      function animate(now = performance.now()) {
        requestAnimationFrame(animate);
        if (document.hidden && !forceRenderWhenHidden) return;
        const frameMs = prefersReducedMotion ? PERFORMANCE.reducedMotionFrameMs : PERFORMANCE.targetFrameMs;
        if (!forceRenderWhenHidden && now - lastRenderAt < frameMs) return;
        lastRenderAt = now;
        const delta = Math.min(clock.getDelta(), 0.04);
        const elapsed = clock.elapsedTime;
        const damping = 1 - Math.pow(0.001, delta);
        const progress = easeOutCubic(focusProgress());
        const focusMode = activeFocusMode();
        const key = responsiveKey();
        const parallax = focusMode ? pointerParallax : lockedOverviewParallax;

        if (nebula.material.uniforms) nebula.material.uniforms.uTime.value = elapsed;
        if (horizon.material.uniforms) horizon.material.uniforms.uTime.value = elapsed;
        stars.rotation.y += prefersReducedMotion ? 0 : delta * (0.004 + progress * 0.008);
        stars.rotation.x = parallax.y * 0.018 - progress * 0.018;
        milkyWayStars.children.forEach((layer, index) => {
          const depthFactor = 0.35 + index * 0.34;
          layer.rotation.y = parallax.x * 0.018 * depthFactor + elapsed * 0.0012 * (index + 1);
          layer.rotation.x = parallax.y * 0.014 * depthFactor - progress * 0.012 * depthFactor;
          layer.position.x = parallax.x * 0.16 * depthFactor;
          layer.position.y = parallax.y * 0.1 * depthFactor;
        });
        starGlints.children.forEach((glint) => {
          const twinkle = 0.18 + Math.max(0, Math.sin(elapsed * 0.85 + glint.userData.phase)) * 0.28;
          glint.material.opacity = prefersReducedMotion ? 0.22 : twinkle;
          glint.rotation.z += prefersReducedMotion ? 0 : delta * 0.045;
        });
        foregroundDepth.children.forEach((item, index) => {
          const base = item.userData.basePosition;
          if (base) {
            item.position.x = base.x + parallax.x * (0.18 + index * 0.026);
            item.position.y = base.y + parallax.y * (0.12 + index * 0.018);
          }
          if (item.material) {
            const wave = prefersReducedMotion ? 0.4 : (Math.sin(elapsed * 0.42 + item.userData.phase) + 1) * 0.5;
            item.material.opacity = (item.userData.baseOpacity || 0.1) * (0.76 + wave * 0.28);
          }
          if (!prefersReducedMotion && item.rotation) item.rotation.z += delta * (index === foregroundDepth.children.length - 1 ? 0.008 : 0.003);
        });

        const layoutLocked = layoutEditor.enabled && !focusMode;
        updateOrbitalSystem(elapsed, key, focusMode);
        const cameraOrbit = focusMode && !prefersReducedMotion ? Math.sin(progress * Math.PI) * 0.5 : 0;
        let targetCam = focusMode
          ? new THREE.Vector3(
              key === "mobile" ? -0.08 + cameraOrbit * 0.16 : -0.18 + cameraOrbit * 0.62,
              key === "mobile" ? 0.46 : 0.58,
              key === "mobile" ? 5.0 : 5.28
            )
          : new THREE.Vector3(
              overviewCamera.position.x + parallax.x * (key === "mobile" ? 0.04 : 0.12),
              overviewCamera.position.y + parallax.y * (key === "mobile" ? 0.03 : 0.09),
              overviewCamera.position.z
            );
        let targetLook = focusMode
          ? new THREE.Vector3(key === "mobile" ? -0.34 : -1.08, key === "mobile" ? 1.18 : 1.18, 0.82)
          : new THREE.Vector3(
              overviewCamera.look.x + parallax.x * (key === "mobile" ? 0.05 : 0.16),
              overviewCamera.look.y + parallax.y * (key === "mobile" ? 0.04 : 0.12),
              0
            );
        cameraAngleRig.update(delta);
        const angledCamera = cameraAngleRig.apply(targetCam, targetLook, { focusMode, key });
        targetCam = angledCamera.camera;
        targetLook = angledCamera.look;

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
          const float = prefersReducedMotion || layoutLocked ? 0 : Math.sin(elapsed * 0.58 + category.size * 3.1) * 0.038;
          scratchTarget.copy(group.userData.target);
          scratchTarget.y += float;
          scratchTarget.z += hover ? 0.08 : 0;
          if (focusMode && selected) scratchTarget.z += Math.sin(progress * Math.PI) * 0.16;
          if (focusMode && selected) scratchTarget.z += Math.max(0, 1 - Math.abs(progress - 0.38) / 0.38) * 0.28;
          if (focusMode && !selected) scratchTarget.z -= Math.sin(progress * Math.PI) * 1.05;
          if (prefersReducedMotion || layoutLocked) group.position.copy(scratchTarget);
          else springVector(group.position, scratchTarget, group.userData.velocity, selected ? 46 : 34, selected ? 7.8 : 9.6, delta);

          const targetScale = group.userData.targetScale * (hover ? 1.035 : 1) + pulse;
          const nextScale = prefersReducedMotion || layoutLocked
            ? targetScale
            : springScalar(group.scale.x, targetScale, "scaleVelocity", group.userData, selected ? 42 : 32, selected ? 7.4 : 9, delta);
          group.scale.setScalar(Math.max(0.01, nextScale));

          const baseRot = layoutFor(category, key);
          const configuredRotation = group.userData.targetRotation || [baseRot.rx || 0, baseRot.ry || 0, baseRot.rz || 0];
          const selectedTilt = focusMode && selected ? 0.28 * progress : 0;
          const hiddenTilt = focusMode && !selected ? 0.18 * Math.sign(group.position.x || 1) * progress : 0;
          const focusPitch = focusMode && selected ? -0.16 * progress : 0;
          const desiredX = configuredRotation[0] * 0.55 + parallax.y * 0.038 + focusPitch;
          const desiredY = configuredRotation[1] * 0.48 + parallax.x * 0.052 + selectedTilt + hiddenTilt + (focusMode && selected ? Math.sin(elapsed * 0.42) * 0.022 : 0);
          group.rotation.x += (desiredX - group.rotation.x) * (prefersReducedMotion ? 1 : damping * 0.22);
          group.rotation.y += (desiredY - group.rotation.y) * (prefersReducedMotion ? 1 : damping * 0.22);
          const desiredZ = configuredRotation[2] * 0.7 + (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.18 + category.size) * 0.004) - (focusMode && selected ? 0.02 * progress : 0);
          group.rotation.z += (desiredZ - group.rotation.z) * (prefersReducedMotion ? 1 : damping * 0.2);
          group.traverse((child) => {
            if (child.userData?.isPlanetSurface) {
              child.rotation.y += prefersReducedMotion ? 0 : delta * (child.userData.rotationSpeed || 0.04) * (selected && focusMode ? 1.35 : 1);
              child.rotation.x += prefersReducedMotion ? 0 : delta * 0.006;
            }
            if (child.userData?.isPlanetAtmosphere) {
              child.rotation.y -= prefersReducedMotion ? 0 : delta * 0.018;
              child.scale.setScalar(1 + (hover ? 0.018 : 0) + (selected && focusMode ? 0.018 * progress : 0));
            }
            if (child.userData?.isPlanetInternalStars && child.material) {
              child.rotation.z += prefersReducedMotion ? 0 : delta * 0.018;
              child.rotation.y -= prefersReducedMotion ? 0 : delta * 0.012;
              const base = child.material.userData.baseOpacity ?? child.material.opacity;
              const shimmer = 0.82 + Math.max(0, Math.sin(elapsed * 1.45 + category.size * 2.1)) * 0.22;
              child.material.opacity = base * group.userData.opacity * shimmer;
            }
            if (child.userData?.isRimGlint) {
              child.rotation.z = -0.7 + (prefersReducedMotion ? 0 : elapsed * (selected && focusMode ? 0.52 : 0.22));
            }
            if (child.userData?.isConstellationGlow) {
              const shimmer = 0.08 + Math.max(0, Math.sin(elapsed * 1.2 + child.position.x * 7.0)) * 0.08;
              child.material.opacity = shimmer * group.userData.opacity;
              child.rotation.z -= prefersReducedMotion ? 0 : delta * 0.08;
            }
            if (child.userData?.isConstellationStar) {
              const scale = 1 + Math.max(0, Math.sin(elapsed * 1.4 + child.position.y * 6.0)) * 0.18;
              child.scale.setScalar(scale);
            }
          });

          const targetOpacity = group.userData.targetOpacity;
          group.userData.opacity += (targetOpacity - group.userData.opacity) * damping * 0.55;
          applyOpacity(group, group.userData.opacity);

          if (group.userData.primaryGlow) {
            const primaryActive = !focusMode || selected;
            const pulseAmount = prefersReducedMotion ? 0 : (Math.sin(elapsed * 2.1 + category.size) + 1) * 0.5;
            const glowOpacity = group.userData.opacity * (primaryActive ? 1 : 0.36);
            const glowScale = 1 + pulseAmount * 0.03 + (hover ? 0.06 : 0);
            const { softGlow, rimGlow } = group.userData.primaryGlow.userData;
            group.userData.primaryGlow.scale.setScalar(glowScale);
            softGlow.material.opacity = (0.055 + pulseAmount * 0.07 + (hover ? 0.06 : 0)) * glowOpacity;
            rimGlow.material.opacity = (0.14 + pulseAmount * 0.16 + (hover ? 0.18 : 0)) * glowOpacity;
          }

          if (group.userData.focusHalos) {
            group.userData.focusHalos.forEach((halo) => {
              const wave = (progress + halo.userData.delay) % 1;
              const active = focusMode && selected && progress > 0.05;
              halo.scale.setScalar(active ? 1 + wave * 0.42 : 1);
              halo.material.opacity = active ? (1 - wave) * 0.3 * group.userData.opacity : 0;
            });
          }

          if (group.userData.label) {
            const label = group.userData.label;
            const labelLift = focusMode && selected ? 0.28 * progress : 0;
            const baseLabelScale = label.userData.baseScale || 1;
            const labelScale = baseLabelScale * (focusMode && selected ? 1.16 : hover ? 1.08 : 1);
            if (label.userData.isOrbitingLabel) {
              label.userData.orbitAngle += prefersReducedMotion ? 0 : delta * (label.userData.orbitSpeed || 0.05) * (hover ? 1.8 : 1);
              const angle = label.userData.orbitAngle;
              const r = label.userData.orbitRadius || category.size * 0.72;
              const orbitY = label.userData.orbitScaleY || 0.36;
              const orbitZ = label.userData.orbitScaleZ || 0.18;
              const targetX = Math.cos(angle) * r;
              const targetY = Math.sin(angle) * r * orbitY - category.size * 0.06;
              const targetZ = (label.userData.baseZ || 0.116) + labelLift + Math.sin(angle) * r * orbitZ;
              label.position.x += (targetX - label.position.x) * (prefersReducedMotion ? 1 : damping * 0.52);
              label.position.y += (targetY - label.position.y) * (prefersReducedMotion ? 1 : damping * 0.52);
              label.position.z += (targetZ - label.position.z) * (prefersReducedMotion ? 1 : damping * 0.52);
              label.rotation.set(-group.rotation.x * 0.62, -group.rotation.y * 0.62, -group.rotation.z * 0.55);
            } else {
              const labelTargetZ = (label.userData.baseZ || 0.116) + labelLift;
              label.position.z += (labelTargetZ - label.position.z) * (prefersReducedMotion ? 1 : damping * 0.45);
              if (label.userData.isBillboardLabel) {
                group.getWorldQuaternion(scratchWorldQuaternion);
                scratchInverseQuaternion.copy(scratchWorldQuaternion).invert();
                label.quaternion.copy(scratchInverseQuaternion.multiply(camera.quaternion));
              } else {
                label.rotation.set(-group.rotation.x * 0.7, -group.rotation.y * 0.7, -group.rotation.z * 0.55);
              }
            }
            const distToCamera = camera.position.distanceTo(group.position);
            const perspectiveCompensation = THREE.MathUtils.clamp(distToCamera / 8.5, 0.85, 1.6);
            const minReadableScale = 0.82;
            const finalLabelScale = Math.max(labelScale * perspectiveCompensation, minReadableScale);
            label.scale.lerp(new THREE.Vector3(finalLabelScale, finalLabelScale, finalLabelScale), prefersReducedMotion ? 1 : damping * 0.45);
            const distantOpacity = hover || selected ? 1 : (group.userData.label.userData.distantOpacity || 1);
            const labelOpacity = Math.min(1, group.userData.opacity * distantOpacity * (focusMode && selected ? 1.24 : 1));
            if (group.userData.label.userData.textMaterials) {
              group.userData.label.userData.textMaterials.forEach((mat) => {
                const glowText = Boolean(mat.userData?.isOrbitTextGlow || mat.userData?.isLabelGlow);
                mat.opacity = labelOpacity * (glowText ? (focusMode && selected ? 0.16 : 0.1) : 1);
              });
            }
            if (label.userData.isOrbitingLabel) {
              label.children.forEach((letter) => {
                if (!letter.userData?.isOrbitTextLetter) return;
                const shimmer = prefersReducedMotion ? 1 : 1 + Math.max(0, Math.sin(elapsed * 1.7 + letter.userData.letterIndex * 0.42)) * 0.045;
                letter.scale.setScalar((letter.userData.baseScale || 1) * shimmer);
              });
            }
          }

          if (group.userData.categoryIcon) {
            const iconLift = (hover ? 0.018 : 0) + (focusMode && selected ? 0.035 * progress : 0);
            const iconScale = 1 + (hover ? 0.035 : 0) + (focusMode && selected ? 0.055 * progress : 0);
            const baseIconZ = group.userData.categoryIcon.userData.baseZ ?? 0.19;
            group.userData.categoryIcon.position.z += (baseIconZ + iconLift - group.userData.categoryIcon.position.z) * (prefersReducedMotion ? 1 : damping * 0.42);
            group.userData.categoryIcon.scale.lerp(new THREE.Vector3(iconScale, iconScale, iconScale), prefersReducedMotion ? 1 : damping * 0.38);
          }

          if (group.userData.lightStreakRings) {
            const ringGroup = group.userData.lightStreakRings;
            const ringTilt = group.userData.targetRingTilt || [0, 0, 0];
            const priority = group.userData.visualPriority || "supporting";
            const priorityBoost = priority === "primary" ? 1.44 : priority === "secondary" ? 1.18 : 0.82;
            ringGroup.rotation.x += (ringTilt[0] + (focusMode && selected ? -0.025 : 0) - ringGroup.rotation.x) * (prefersReducedMotion ? 1 : damping * 0.08);
            ringGroup.rotation.y += (ringTilt[1] - ringGroup.rotation.y) * (prefersReducedMotion ? 1 : damping * 0.08);
            ringGroup.rotation.z += prefersReducedMotion ? 0 : delta * (hover ? 0.055 : 0.022);
            ringGroup.traverse((child) => {
              if (child.userData?.isLightStreakRing && child.material) {
                if (child.userData.baseRotation) {
                  child.rotation.x = child.userData.baseRotation.x + ringTilt[0] * 0.18;
                  child.rotation.y = child.userData.baseRotation.y + ringTilt[1] * 0.18;
                  child.rotation.z = child.userData.baseRotation.z + ringTilt[2] + elapsed * (prefersReducedMotion ? 0 : child.userData.ringSpeed || 0.02);
                }
                const base = child.material.userData.streakOpacity ?? child.userData.streakOpacity ?? child.material.opacity;
                const wave = prefersReducedMotion ? 0.5 : (Math.sin(elapsed * 0.9 + child.geometry.id * 0.19) + 1) * 0.5;
                const focusBoost = focusMode && selected ? 1.22 : 1;
                child.material.opacity = base * group.userData.opacity * focusBoost * priorityBoost * (0.86 + wave * 0.24);
              }
              if (child.userData?.isOrbitBead && child.material) {
                const angle = child.userData.angle + elapsed * (prefersReducedMotion ? 0 : child.userData.speed || 0.1);
                const r = child.userData.orbitRadius;
                child.position.set(
                  Math.cos(angle) * r,
                  Math.sin(angle) * r * child.userData.orbitScaleY,
                  Math.sin(angle) * r * child.userData.orbitScaleZ
                );
                const base = child.material.userData.baseOpacity ?? child.material.opacity;
                child.material.opacity = base * group.userData.opacity * (focusMode && selected ? 1.16 : 0.9);
              }
            });
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
            const showSatellite = keyAllowsSatellites(key) && index < satelliteLimit() && (!focusMode || selected);
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

        updateConnectionTrails(elapsed, key, focusMode);
        updateHover();
        updateLayoutDragHandles();

        // Fake Click Guide Tracker: Project accurate 3D coordinate to 2D screen coordinate
        const fakeHand = document.getElementById("fakeClickGuide");
        if (fakeHand && medallions) {
          const celestialApp = document.getElementById("celestial-app");
          const celestialStyle = celestialApp ? window.getComputedStyle(celestialApp) : null;
          const celestialVisible = Boolean(celestialApp)
            && celestialStyle.display !== "none"
            && celestialStyle.visibility !== "hidden"
            && Number(celestialStyle.opacity || 0) > 0.2;
          const bodyPlanet = medallions.get("body-massage");
          if (celestialVisible && bodyPlanet && !focusMode && state.categoryId === null) {
            fakeHand.style.display = "block";
            const pos = new THREE.Vector3();
            bodyPlanet.getWorldPosition(pos);
            pos.project(camera);
            const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (pos.y * -0.5 + 0.5) * window.innerHeight;
            const guideSize = 56;
            const safePad = 18;
            const verticalOffset = Math.min(92, Math.max(46, window.innerHeight * 0.12));
            const guideX = Math.min(
              window.innerWidth - guideSize - safePad,
              Math.max(safePad, x - guideSize / 2)
            );
            const guideY = Math.min(
              window.innerHeight - guideSize - safePad,
              Math.max(safePad, y - guideSize - verticalOffset)
            );
            const isOffscreen = pos.z < -1 || pos.z > 1
              || x < -guideSize
              || x > window.innerWidth + guideSize
              || y < -guideSize
              || y > window.innerHeight + guideSize;
            fakeHand.style.display = isOffscreen ? "none" : "block";
            fakeHand.style.transform = `translate(${guideX}px, ${guideY}px) rotate(180deg)`;
            fakeHand.style.marginTop = Math.sin(elapsed * 5) * 8 + "px"; // Bounce effect
            
            // Đồng bộ nhịp thở (Fade) 100% với hào quang của ngôi sao
            const pulseWave = Math.sin(elapsed * 2.1 + bodyPlanet.userData.category.size); // Tần số -1 đến 1
            const normalizedPulse = (pulseWave + 1) * 0.5; // Đưa về 0 đến 1
            fakeHand.children[1].style.opacity = (0.4 + normalizedPulse * 0.5).toFixed(2); // Từ 0.4 đến 0.9
            const dropShadowSize = (4 + normalizedPulse * 8).toFixed(1); // Từ 4px đến 12px
            const dropShadowAlpha = (0.3 + normalizedPulse * 0.5).toFixed(2); // Từ 0.3 đến 0.8
            fakeHand.children[1].style.filter = `drop-shadow(0 0 ${dropShadowSize}px rgba(255, 215, 0, ${dropShadowAlpha}))`;
          } else {
            fakeHand.style.display = "none";
          }
        }

        renderer.render(scene, camera);
      }

      async function init() {
        console.log("CELESTIAL: Bắt đầu khởi tạo không gian 3D (init)...");
        try {
            await hydrateServicesFromApi();
            console.log("CELESTIAL: Đang tải dữ liệu mảng categories:", categories.length, "chòm sao");
            await Promise.all(categories.map(makeCategory));
            console.log("CELESTIAL: Đã tải xong kết cấu (Texture) cho tất cả chòm sao!");
            buildOrbitalSystem();
            buildConnectionTrails();
            buildUI();
            renderCart();
            updateTargets();
            initLayoutEditor();
            animate();
            console.log("CELESTIAL: Kích hoạt thành công động cơ hoạt họa (animate)!");
        } catch (error) {
            console.error("CELESTIAL ERROR BỊ TREO TRONG QUÁ TRÌNH INIT:", error);
        }
      }

      document.getElementById("cel-cartButton")?.addEventListener("click", () => toggleCartDrawer());
      document.getElementById("cel-closeCart").addEventListener("click", () => {
        state.cartOpen = false;
        renderCart();
      });
      document.getElementById("cel-placeOrderButton")?.addEventListener("click", () => {
        if (cartCount() === 0) return;
        window.parent?.postMessage({ type: "flipmenu:place-order" }, "*");
      });
      window.addEventListener("message", (event) => {
        if (event.data?.type === "flipmenu:toggle-cart") {
          toggleCartDrawer(event.data.open);
        }
      });
      document.getElementById("cel-mobilePrev").addEventListener("click", () => shiftMobileCategory(-1));
      document.getElementById("cel-mobileNext").addEventListener("click", () => shiftMobileCategory(1));

      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") goBack();
        if (event.key.toLowerCase() === "r") cameraAngleRig.reset();
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
        if (layoutEditor.enabled) {
          pointerParallax.set(0, 0);
          return;
        }
        if (!prefersReducedMotion) {
          pointerParallax.x += (pointer.x - pointerParallax.x) * 0.08;
          pointerParallax.y += (pointer.y - pointerParallax.y) * 0.08;
        }
      });

      window.addEventListener("pointerup", (event) => {
        // Only process clicks if celestial app is active
        const celestialApp = document.getElementById("celestial-app");
        if (celestialApp && celestialApp.style.display === "none") return;
        
        console.log("[DEBUG] Window pointerup triggered! Target:", event.target);
        
        if (event.clientX !== undefined) {
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
        if (layoutEditor.enabled) {
          return;
        }
        if (cameraAngleRig.shouldSuppressClick()) {
          console.log("[DEBUG] Action suppressed: cameraAngleRig thinks you are dragging");
          return;
        }
        
        console.log(`[DEBUG] Pointer coordinates: x=${pointer.x}, y=${pointer.y}`);
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(clickable, false);
        console.log("[DEBUG] Raycaster intersections:", intersects.length);

        const hitId = updateHover();
        
        if (hitId) {
          console.log("[DEBUG] Selecting category:", hitId);
          selectCategory(hitId);
          return;
        }
        
        // Only go back if we missed all planets and didn't click a UI button
        if (activeFocusMode()) {
           const isUI = event.target.closest('.hud') || event.target.closest('.layout-editor') || event.target.closest('.build-mark');
           if (!isUI) {
               goBack();
           }
        }
      });

      window.addEventListener("popstate", goBack);

      function applyViewportResize({ rebuild = false } = {}) {
        const width = Math.max(1, window.innerWidth);
        const height = Math.max(1, window.innerHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(cappedPixelRatio());
        renderer.setSize(width, height, false);
        galaxyBackground.resize();

        if (!rebuild) return;
        overviewTargetCache.clear();
        ellipseLayoutCache.clear();
        buildOrbitalSystem();
        buildConnectionTrails();
        updateTargets();
        syncLayoutEditorPanel();
      }

      window.addEventListener("resize", () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => applyViewportResize());
        window.clearTimeout(resizeRebuildTimer);
        resizeRebuildTimer = window.setTimeout(() => applyViewportResize({ rebuild: true }), 220);
      });

      if (new URLSearchParams(window.location.search).has("debug")) {
        window.__celestialScene = { scene, root, camera, medallions, categories, renderer };
      }
      init();
    }
}
