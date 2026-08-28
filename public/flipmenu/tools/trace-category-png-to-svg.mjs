import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const sourceDir = fileURLToPath(new URL("../public/category-icons/", import.meta.url));
const outputDir = fileURLToPath(new URL("../public/category-icons-svg/", import.meta.url));

const icons = [
  ["body-massage", "body-massage.png"],
  ["foot-massage", "foot-massage.png"],
  ["ear-care", "ear-care.png"],
  ["hair-wash", "hair-wash.png"],
  ["facial-care", "facial-care.png"],
  ["nail-care", "nail-care.png"],
  ["heel-care", "heel-care.png"],
];

const SIZE = 256;
const ALPHA_THRESHOLD = 35;
const MIN_AREA = 3;
const SMOOTH_ITERATIONS = 2;

function key(x, y) {
  return `${x},${y}`;
}

function parseKey(value) {
  return value.split(",").map(Number);
}

function pushEdge(edgesByStart, x1, y1, x2, y2) {
  const start = key(x1, y1);
  const edge = { start, end: key(x2, y2), x1, y1, x2, y2 };
  if (!edgesByStart.has(start)) edgesByStart.set(start, []);
  edgesByStart.get(start).push(edge);
}

function isFilled(mask, x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE && mask[y * SIZE + x];
}

function simplify(points) {
  if (points.length <= 3) return points;
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    if (dx1 * dy2 !== dy1 * dx2) out.push(curr);
  }
  return out;
}

function smoothClosedPolygon(points, iterations = 1) {
  if (points.length <= 3) return points;
  let smoothed = points;
  for (let pass = 0; pass < iterations; pass++) {
    const next = [];
    for (let i = 0; i < smoothed.length; i++) {
      const current = smoothed[i];
      const following = smoothed[(i + 1) % smoothed.length];
      next.push([
        current[0] * 0.75 + following[0] * 0.25,
        current[1] * 0.75 + following[1] * 0.25,
      ]);
      next.push([
        current[0] * 0.25 + following[0] * 0.75,
        current[1] * 0.25 + following[1] * 0.75,
      ]);
    }
    smoothed = next;
  }
  return smoothed;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(area) / 2;
}

function traceMask(mask) {
  const edgesByStart = new Map();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!isFilled(mask, x, y)) continue;
      if (!isFilled(mask, x, y - 1)) pushEdge(edgesByStart, x, y, x + 1, y);
      if (!isFilled(mask, x + 1, y)) pushEdge(edgesByStart, x + 1, y, x + 1, y + 1);
      if (!isFilled(mask, x, y + 1)) pushEdge(edgesByStart, x + 1, y + 1, x, y + 1);
      if (!isFilled(mask, x - 1, y)) pushEdge(edgesByStart, x, y + 1, x, y);
    }
  }

  const paths = [];
  while (edgesByStart.size) {
    const firstStart = edgesByStart.keys().next().value;
    let currentKey = firstStart;
    const points = [parseKey(firstStart)];
    let guard = 0;

    while (guard++ < SIZE * SIZE * 8) {
      const bucket = edgesByStart.get(currentKey);
      if (!bucket || !bucket.length) break;
      const edge = bucket.pop();
      if (!bucket.length) edgesByStart.delete(currentKey);
      points.push([edge.x2, edge.y2]);
      currentKey = edge.end;
      if (currentKey === firstStart) break;
    }

    const clean = simplify(points.slice(0, -1));
    if (clean.length >= 3 && polygonArea(clean) >= MIN_AREA) {
      paths.push(smoothClosedPolygon(clean, SMOOTH_ITERATIONS));
    }
  }
  return paths;
}

function toPath(points) {
  const [first, ...rest] = points;
  const format = (value) => Number(value.toFixed(2));
  return `M ${format(first[0])} ${format(first[1])} ${rest.map(([x, y]) => `L ${format(x)} ${format(y)}`).join(" ")} Z`;
}

async function traceIcon(name, filename) {
  const input = path.join(sourceDir, filename);
  const { data } = await sharp(input)
    .resize(SIZE, SIZE, { fit: "contain" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const alpha = data[i * 4 + 3];
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const luminance = (r + g + b) / 3;
    mask[i] = alpha > ALPHA_THRESHOLD && luminance > 18 ? 1 : 0;
  }

  const paths = traceMask(mask);
  const d = paths.map(toPath).join(" ");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="${d}" fill="#FFE998" fill-rule="evenodd"/>
</svg>
`;
  await fs.writeFile(path.join(outputDir, `${name}.svg`), svg, "utf8");
  return { name, paths: paths.length };
}

await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const icon of icons) results.push(await traceIcon(...icon));
console.table(results);
console.log(`SVG icons written to ${path.relative(root, outputDir)}`);
