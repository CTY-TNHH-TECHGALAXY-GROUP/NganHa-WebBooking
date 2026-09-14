import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const input = resolve(process.env.HERO_INPUT || '/private/tmp/nganha-active-hero.mp4');
const outputDir = resolve(process.env.HERO_OUTPUT_DIR || '/private/tmp/nganha-hero-renditions');
const ffmpeg = process.env.HERO_FFMPEG || 'ffmpeg';

if (/^https?:\/\//i.test(process.env.HERO_INPUT || '')) {
  throw new Error('HERO_INPUT must be a local file; remote URLs are deliberately rejected');
}
if (!existsSync(input)) throw new Error(`hero input does not exist: ${input}`);
mkdirSync(outputDir, { recursive: true });

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const run = (args, label) => {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed (exit ${result.status})\n${result.stderr}`);
  return `${result.stdout || ''}${result.stderr || ''}`;
};

const version = run(['-version'], 'ffmpeg version').split('\n')[0];
const variants = [
  {
    name: 'mobile',
    width: 720,
    height: 404,
    output: resolve(outputDir, 'hero-mobile-720.mp4'),
    filter: 'scale=720:trunc(ow/a/2)*2',
    crf: '24',
  },
  {
    name: 'desktop',
    width: 1280,
    height: 720,
    output: resolve(outputDir, 'hero-desktop-1280.mp4'),
    filter: 'scale=1280:trunc(ow/a/2)*2',
    crf: '22',
  },
];

for (const variant of variants) {
  run([
    '-hide_banner', '-loglevel', 'error', '-y', '-i', input,
    '-map', '0:v:0', '-map', '0:a?', '-vf', variant.filter,
    '-c:v', 'libx264', '-preset', process.env.HERO_PRESET || 'slow',
    '-crf', variant.crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '128k', variant.output,
  ], `${variant.name} rendition`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  status: 'LOCAL_CANDIDATES_ONLY',
  encoder: { path: ffmpeg, version },
  input: { path: input, basename: basename(input), bytes: statSync(input).size, sha256: sha256(input) },
  variants: variants.map((variant) => ({
    name: variant.name,
    expectedDimensions: `${variant.width}x${variant.height}`,
    filter: variant.filter,
    crf: variant.crf,
    path: variant.output,
    bytes: statSync(variant.output).size,
    sha256: sha256(variant.output),
  })),
  externalActions: { uploaded: false, configUpdated: false, deployed: false },
};
const manifestPath = resolve(outputDir, 'manifest.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
