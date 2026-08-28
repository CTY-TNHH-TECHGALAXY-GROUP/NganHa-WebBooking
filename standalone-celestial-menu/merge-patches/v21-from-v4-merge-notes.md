# V21 Changes To Merge Back Into V4

This project folder is currently untracked in git, so there is no reliable git commit diff for "V4 -> V21". Use this file as the merge package for the visual/background changes from the current V21 standalone demo.

Scope:
- Only applies to `standalone-celestial-menu/index.html`.
- Does not include changes to the main NganHa booking app.
- Keeps existing category selection, service list, cart, and rail behavior from the target version.

## 1. Add Galaxy Background Layers

Add `#galaxy-canvas` and `.galaxy-nebula` to the fixed background layer group:

```css
#app,
#scene,
#galaxy-canvas,
.galaxy-nebula {
  position: fixed;
  inset: 0;
}

.galaxy-nebula {
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 20% 25%, rgba(212, 175, 55, 0.1), transparent 60%),
    radial-gradient(ellipse 50% 45% at 80% 70%, rgba(90, 60, 140, 0.14), transparent 60%),
    radial-gradient(ellipse 70% 50% at 50% 100%, rgba(20, 25, 50, 0.5), transparent 70%),
    linear-gradient(180deg, #05060f 0%, #0b0e1e 60%, #05060f 100%);
}

#galaxy-canvas {
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

#scene {
  z-index: 1;
}
```

Insert these canvases before the existing Three.js `#scene` canvas:

```html
<div class="galaxy-nebula" aria-hidden="true"></div>
<canvas id="galaxy-canvas" aria-hidden="true"></canvas>
<canvas id="scene" aria-hidden="true"></canvas>
```

Do not copy any text from the reference background file, especially demo copy such as "Dải ngân hà của bạn".

## 2. Add Canvas Starfield Script

Add this after `prefersReducedMotion` is declared and before the Three.js renderer setup:

```js
function initGalaxyBackground() {
  const galaxyCanvas = document.getElementById("galaxy-canvas");
  const ctx = galaxyCanvas.getContext("2d");
  let width = 0;
  let height = 0;
  let shootingStars = [];
  let galaxyStars = [];
  let animationFrame = 0;
  let lastShotAt = 0;

  function makeGalaxyStar() {
    const depth = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: depth * 1.4 + 0.3,
      baseAlpha: depth * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.15 ? "gold" : "white",
      drift: (Math.random() - 0.5) * 0.02,
    };
  }

  function resizeGalaxy() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    galaxyCanvas.width = Math.floor(width * dpr);
    galaxyCanvas.height = Math.floor(height * dpr);
    galaxyCanvas.style.width = `${width}px`;
    galaxyCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const starCount = Math.max(220, Math.floor((width * height) / 2600));
    galaxyStars = Array.from({ length: starCount }, makeGalaxyStar);
  }

  function spawnShootingStar() {
    const startX = Math.random() * width * 0.6 + width * 0.2;
    const startY = Math.random() * height * 0.2;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * 9,
      vy: Math.sin(angle) * 9,
      life: 1,
      length: Math.random() * 80 + 60,
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
      ctx.fillStyle = star.hue === "gold"
        ? `rgba(240, 210, 150, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
      ctx.shadowColor = star.hue === "gold" ? "rgba(240,210,150,0.8)" : "rgba(255,255,255,0.6)";
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawShootingStars() {
    shootingStars.forEach((star) => {
      const grad = ctx.createLinearGradient(
        star.x,
        star.y,
        star.x - star.vx * (star.length / 9),
        star.y - star.vy * (star.length / 9)
      );
      grad.addColorStop(0, `rgba(255, 250, 220, ${star.life})`);
      grad.addColorStop(1, "rgba(255, 250, 220, 0)");

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
    drawGalaxyStars(time * 0.06);
    if (!prefersReducedMotion && time - lastShotAt > 3200) {
      lastShotAt = time;
      if (Math.random() < 0.6) spawnShootingStar();
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
```

## 3. Make Three.js Scene Transparent

Change the renderer from opaque to transparent:

```js
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});

renderer.setClearColor(0x000000, 0);
```

Use a transparent scene background:

```js
const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.FogExp2("#01040a", 0.027);
```

If V4 has old Three.js background objects, hide them so the new galaxy canvas shows through:

```js
stars.visible = false;
milkyWayStars.visible = false;
nebula.visible = false;
horizon.visible = false;
```

Keep small foreground glints if present:

```js
starGlints.visible = true;
```

## 4. Preserve V21 UI Fixes

These fixes should be kept when merging into V4:

- Remove service count text from medallions and right rail.
- Remove the white circular button/marker from category nodes.
- Keep category nodes as solid round circles with gold rim/orbit styling.
- Keep the focused-mode category rail vertical on the right.
- Ensure the right rail has `overflow-y: auto`, `overscroll-behavior: contain`, and mobile-safe bottom padding.
- Keep service rows transparent/blended, without heavy borders or highlighted buttons.
- Keep `BOOK NOW` visible in each service row.

## 5. Resize Hook

Inside the existing window resize handler, add:

```js
galaxyBackground.resize();
```

This is safe even though the galaxy background also has its own resize listener.

## 6. Current V21 Markers

The current standalone file marks the V21 state with:

```html
<div class="build-mark">embedded galaxy background v21</div>
```

You can remove or update this marker after merging.
