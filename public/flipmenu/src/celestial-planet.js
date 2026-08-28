const planetTextureCache = new Map();

export const CELESTIAL_PLANET_PRESETS = {
  "body-massage": {
    face: "#111315",
    atmosphere: "#6e5938",
    rim: "#FFE998",
    vein: "#57370D",
    metalness: 0.18,
    roughness: 0.72,
    clearcoat: 0.28,
    bump: 0.028,
    ringTilt: [-0.64, 0.18, -0.16],
    ringColor: "#FFE998",
    ringShadow: "#57370D",
  },
  "hair-wash": {
    face: "#07161b",
    atmosphere: "#2a4b5a",
    rim: "#FFE998",
    vein: "#3b2c13",
    metalness: 0.24,
    roughness: 0.48,
    clearcoat: 0.42,
    bump: 0.018,
    ringTilt: [-0.58, -0.26, 0.14],
    ringColor: "#f5c977",
    ringShadow: "#57370D",
  },
  "facial-care": {
    face: "#171513",
    atmosphere: "#8e7a56",
    rim: "#fff3bd",
    vein: "#60420f",
    metalness: 0.14,
    roughness: 0.5,
    clearcoat: 0.55,
    bump: 0.012,
    ringTilt: [-0.72, 0.04, -0.08],
    ringColor: "#fff0bd",
    ringShadow: "#57370D",
  },
  "ear-care": {
    face: "#17100b",
    atmosphere: "#9c6b2d",
    rim: "#FFE998",
    vein: "#57370D",
    metalness: 0.2,
    roughness: 0.56,
    clearcoat: 0.34,
    bump: 0.02,
    ringTilt: [-0.7, -0.08, 0.22],
    ringColor: "#FFE998",
    ringShadow: "#57370D",
  },
  "foot-care": {
    face: "#121210",
    atmosphere: "#806234",
    rim: "#FFE998",
    vein: "#57370D",
    metalness: 0.22,
    roughness: 0.64,
    clearcoat: 0.24,
    bump: 0.026,
    ringTilt: [-0.66, 0.2, 0.18],
    ringColor: "#f5c977",
    ringShadow: "#57370D",
  },
  "nail-care": {
    face: "#101114",
    atmosphere: "#7a5e34",
    rim: "#FFE998",
    vein: "#57370D",
    metalness: 0.3,
    roughness: 0.48,
    clearcoat: 0.34,
    bump: 0.018,
    ringTilt: [-0.62, -0.16, -0.24],
    ringColor: "#FFE998",
    ringShadow: "#57370D",
  },
  "heel-care": {
    face: "#12110f",
    atmosphere: "#75552b",
    rim: "#FFE998",
    vein: "#57370D",
    metalness: 0.18,
    roughness: 0.68,
    clearcoat: 0.22,
    bump: 0.026,
    ringTilt: [-0.74, 0.14, 0.16],
    ringColor: "#f5c977",
    ringShadow: "#57370D",
  },
};

function presetFor(categoryId) {
  return CELESTIAL_PLANET_PRESETS[categoryId] || CELESTIAL_PLANET_PRESETS["body-massage"];
}

function makePlanetTexture(THREE, categoryId, preset) {
  const cacheKey = `${categoryId}:${preset.face}:${preset.vein}`;
  if (planetTextureCache.has(cacheKey)) return planetTextureCache.get(cacheKey);

  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  const bg = ctx.createRadialGradient(166, 132, 18, 256, 256, 286);
  bg.addColorStop(0, "rgba(38, 44, 56, 0.86)");
  bg.addColorStop(0.36, preset.face);
  bg.addColorStop(1, "#020307");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  const image = ctx.getImageData(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const grain = (Math.random() - 0.5) * 8;
      const band = Math.sin(x * 0.01 + y * 0.014) * 1.4;
      image.data[i] = Math.max(0, Math.min(255, image.data[i] + grain + band));
      image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + grain * 0.75 + band * 0.45));
      image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + grain * 0.45));
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  planetTextureCache.set(cacheKey, texture);
  return texture;
}

function makeInternalStarField(THREE, radius, categoryId, opacity = 1) {
  const seed = categoryId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const count = Math.max(28, Math.round(radius * 82));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = (i * 12.9898 + seed * 0.37) % (Math.PI * 2);
    const r = radius * (0.1 + (((i * 31 + seed) % 83) / 100) * 0.68);
    const ySquash = 0.74 + ((i + seed) % 9) * 0.018;
    const z = radius * (0.16 + (((i * 17 + seed) % 52) / 100) * 0.38);
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a * 1.08) * r * ySquash;
    positions[i * 3 + 2] = z;

    const warm = (i + seed) % 4 !== 0;
    const color = new THREE.Color(warm ? "#FFE998" : "#d8e8ff");
    const dim = 0.52 + (((i * 19 + seed) % 41) / 100);
    colors[i * 3] = color.r * dim;
    colors[i * 3 + 1] = color.g * dim;
    colors[i * 3 + 2] = color.b * dim;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: Math.max(0.012, radius * 0.017),
    vertexColors: true,
    transparent: true,
    opacity: 0.92 * opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(geo, mat);
  stars.userData.isPlanetInternalStars = true;
  stars.userData.baseOpacity = 0.92 * opacity;
  return stars;
}

function storeBaseOpacity(mesh, opacity) {
  if (!mesh.material) return;
  mesh.material.transparent = true;
  mesh.material.opacity = opacity;
  mesh.material.userData.baseOpacity = opacity;
}

export function createCelestialPlanetCore({ THREE, categoryId, radius, opacity = 1 }) {
  const preset = presetFor(categoryId);
  const group = new THREE.Group();
  const planetRadius = radius * 0.82;
  const texture = makePlanetTexture(THREE, categoryId, preset);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.18, 96),
    new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: 0.2 * opacity,
      depthWrite: false,
    })
  );
  shadow.position.set(radius * 0.24, -radius * 0.28, -planetRadius * 0.56);
  shadow.scale.set(1.18, 0.48, 1);
  shadow.userData.isPlanetShadow = true;
  storeBaseOpacity(shadow, 0.2 * opacity);
  group.add(shadow);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius, 128, 96),
    new THREE.MeshPhysicalMaterial({
      color: preset.face,
      map: texture,
      bumpMap: texture,
      bumpScale: preset.bump * 0.42,
      transparent: true,
      opacity: 0.46 * opacity,
      metalness: Math.min(0.62, preset.metalness + 0.08),
      roughness: Math.max(0.12, preset.roughness - 0.2),
      clearcoat: Math.min(1, preset.clearcoat + 0.26),
      clearcoatRoughness: 0.16,
      reflectivity: 0.96,
      sheen: 0.28,
      sheenColor: new THREE.Color("#f6ecbf"),
      emissive: "#020307",
      emissiveIntensity: 0.025,
      iridescence: 0.12,
      iridescenceIOR: 1.3,
      transmission: 0.18,
      thickness: 1.2,
      depthWrite: false,
    })
  );
  planet.castShadow = true;
  planet.receiveShadow = true;
  planet.userData.isMedallionFace = true;
  planet.userData.isPlanetSurface = true;
  planet.userData.rotationSpeed = 0.045 + (categoryId.length % 5) * 0.009;
  storeBaseOpacity(planet, 0.46 * opacity);
  group.add(planet);

  const internalStars = makeInternalStarField(THREE, planetRadius, categoryId, opacity);
  group.add(internalStars);
  group.userData.internalStars = internalStars;

  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius * 0.92, 80, 48),
    new THREE.MeshPhysicalMaterial({
      color: "#f9f0c8",
      transparent: true,
      opacity: 0.08 * opacity,
      metalness: 0.0,
      roughness: 0.2,
      clearcoat: 0.6,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );
  highlight.position.set(-planetRadius * 0.3, planetRadius * 0.24, planetRadius * 0.52);
  highlight.userData.isPlanetHighlight = true;
  group.add(highlight);

  const nightShade = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius * 1.006, 96, 48),
    new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: 0.14 * opacity,
      depthWrite: false,
      blending: THREE.MultiplyBlending,
    })
  );
  nightShade.position.set(planetRadius * 0.16, -planetRadius * 0.08, planetRadius * 0.04);
  nightShade.userData.isPlanetShade = true;
  storeBaseOpacity(nightShade, 0.12 * opacity);
  group.add(nightShade);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius * 1.09, 96, 48),
    new THREE.MeshBasicMaterial({
      color: preset.atmosphere,
      transparent: true,
      opacity: 0.08 * opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  );
  atmosphere.userData.isPlanetAtmosphere = true;
  storeBaseOpacity(atmosphere, 0.08 * opacity);
  group.add(atmosphere);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(planetRadius * 1.02, radius * 0.013, 18, 220),
    new THREE.MeshBasicMaterial({
      color: preset.rim,
      transparent: true,
      opacity: 0.48 * opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  rim.position.z = planetRadius * 0.02;
  rim.userData.isRimGlint = true;
  storeBaseOpacity(rim, 0.34 * opacity);
  group.add(rim);

  const clickTarget = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 48, 32),
    new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: 0.001,
      depthWrite: false,
    })
  );
  clickTarget.userData.isClickTarget = true;
  group.add(clickTarget);

  group.userData.frontFace = clickTarget;
  group.userData.frontFaceZ = planetRadius * 0.94;
  group.userData.planet = planet;
  group.userData.atmosphere = atmosphere;
  return group;
}

export function createSpatialOrbitRings({ THREE, categoryId, radius }) {
  const preset = presetFor(categoryId);
  const group = new THREE.Group();
  const tilt = preset.ringTilt;
  const ringRadius = radius * 1.05;

  function makeOrbitTube(ring, index) {
    const start = ring.start ?? 0;
    const end = ring.end ?? Math.PI * 2;
    const closed = Math.abs(end - start - Math.PI * 2) < 0.01;
    const points = [];
    const segments = closed ? 220 : 144;
    for (let i = 0; i <= segments; i++) {
      const a = start + (i / segments) * (end - start);
      points.push(new THREE.Vector3(
        Math.cos(a) * ring.radius,
        Math.sin(a) * ring.radius * (ring.scaleY ?? 0.42),
        Math.sin(a + (ring.zPhase || 0)) * radius * (ring.scaleZ ?? 0.12)
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points, closed);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segments, ring.tube, 8, closed),
      new THREE.MeshBasicMaterial({
        color: ring.color,
        transparent: true,
        opacity: ring.opacity,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mesh.rotation.set(tilt[0] + index * 0.05, tilt[1] - index * 0.035, tilt[2] + index * 0.07);
    mesh.userData.isLightStreakRing = true;
    mesh.userData.streakOpacity = ring.opacity;
    mesh.userData.ringSpeed = ring.speed;
    mesh.userData.baseRotation = mesh.rotation.clone();
    mesh.renderOrder = index === 1 ? 2 : 1;
    group.add(mesh);
  }

  const orbitPresets = {
    "body-massage": [
      { radius: ringRadius * 1.2, tube: radius * 0.014, opacity: 0.34, color: preset.ringColor, speed: 0.02, scaleY: 0.36, scaleZ: 0.16 },
    ],
    "hair-wash": [
      { radius: ringRadius * 1.05, tube: radius * 0.007, opacity: 0.24, color: "#bcd8d6", speed: -0.018, scaleY: 0.48, scaleZ: 0.22 },
      { radius: ringRadius * 1.22, tube: radius * 0.006, opacity: 0.18, color: preset.ringColor, speed: 0.026, scaleY: 0.32, scaleZ: 0.18, zPhase: 0.7 },
    ],
    "facial-care": [
      { radius: ringRadius * 1.15, tube: radius * 0.012, opacity: 0.2, color: "#fff0bd", speed: 0.014, scaleY: 0.44, scaleZ: 0.1 },
    ],
    "foot-care": [
      { radius: ringRadius * 1.1, tube: radius * 0.008, opacity: 0.26, color: preset.ringColor, speed: 0.03, scaleY: 0.42, scaleZ: 0.13 },
    ],
    "heel-care": [
      { radius: ringRadius * 1.18, tube: radius * 0.009, opacity: 0.28, color: preset.ringColor, speed: 0.018, scaleY: 0.38, scaleZ: 0.12, start: Math.PI * 0.12, end: Math.PI * 1.48 },
    ],
    "ear-care": [
      { radius: ringRadius * 1.08, tube: radius * 0.004, opacity: 0.12, color: "#fff1b7", speed: 0.022, scaleY: 0.5, scaleZ: 0.1 },
    ],
    "nail-care": [
      { radius: ringRadius * 1.12, tube: radius * 0.007, opacity: 0.22, color: preset.ringColor, speed: -0.024, scaleY: 0.4, scaleZ: 0.12 },
    ],
  };

  (orbitPresets[categoryId] || orbitPresets["body-massage"]).forEach(makeOrbitTube);

  const beadMaterial = new THREE.MeshBasicMaterial({
    color: preset.ringColor,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beadProfiles = {
    "body-massage": { count: 4, radius: 1.2, y: 0.36, z: 0.16, opacity: 0.46, speed: 0.08 },
    "hair-wash": { count: 2, radius: 1.22, y: 0.34, z: 0.2, opacity: 0.3, speed: 0.07 },
    "facial-care": { count: 2, radius: 1.12, y: 0.44, z: 0.1, opacity: 0.24, speed: 0.045 },
    "foot-care": { count: 3, radius: 1.1, y: 0.42, z: 0.12, opacity: 0.4, speed: 0.1 },
    "heel-care": { count: 1, radius: 1.18, y: 0.38, z: 0.12, opacity: 0.32, speed: 0.05 },
    "ear-care": { count: 2, radius: 1.08, y: 0.5, z: 0.1, opacity: 0.18, speed: 0.04 },
    "nail-care": { count: 2, radius: 1.12, y: 0.4, z: 0.12, opacity: 0.26, speed: 0.06 },
  };
  const beadProfile = beadProfiles[categoryId] || beadProfiles["body-massage"];
  for (let i = 0; i < beadProfile.count; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(radius * (0.012 + i * 0.0014), 16, 12), beadMaterial.clone());
    const angle = (i / Math.max(1, beadProfile.count)) * Math.PI * 2 + (categoryId.length % 4) * 0.32;
    bead.position.set(Math.cos(angle) * ringRadius * beadProfile.radius, Math.sin(angle) * ringRadius * beadProfile.y, Math.sin(angle) * radius * beadProfile.z);
    bead.userData.isOrbitBead = true;
    bead.userData.angle = angle;
    bead.userData.orbitRadius = ringRadius * beadProfile.radius;
    bead.userData.orbitScaleY = beadProfile.y;
    bead.userData.orbitScaleZ = beadProfile.z;
    bead.userData.speed = beadProfile.speed + i * 0.01;
    storeBaseOpacity(bead, beadProfile.opacity);
    group.add(bead);
  }

  group.userData.baseOpacity = 1;
  return group;
}
