import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Generates disposable QA candidates from the preserved local History
 * originals. This is intentionally not a storage writer: it never uploads,
 * edits CMS JSON, or changes the production rendition manifest. The report
 * separates local encoder proof from app/storage read-back, which stays
 * NOT_VERIFIED until the writer owner publishes and verifies these objects.
 */
const repository = path.resolve(new URL('..', import.meta.url).pathname);
const sourceDirectory = path.join(repository, 'public/images/history');
const outputDirectory = path.resolve(process.env.MEDIA_BUDGET_OUTPUT || '/private/tmp/nganha-ac-thumbnail-output');
const reportPath = path.resolve(
  process.env.MEDIA_BUDGET_REPORT || 'plans/pagespeed-remediation-20260913/remaining/agent-ac/thumbnail-budget-report.json',
);
const widths = [64, 128, 192];
const viewports = [390, 768, 1440];
const dprs = [1, 2, 3];
const thumbnailBoxCssPx = 96;
const budgetBytes = 15 * 1024;

const hash = value => createHash('sha256').update(value).digest('hex');
const hashFile = async file => hash(await readFile(file));

const sourceNames = (await readdir(sourceDirectory))
  .filter(name => /\.(?:png|jpe?g|webp)$/i.test(name))
  .sort();
assert.ok(sourceNames.length > 0, 'local History source inventory must not be empty');

const generated = [];
for (const sourceName of sourceNames) {
  const sourcePath = path.join(sourceDirectory, sourceName);
  const source = sharp(sourcePath);
  const sourceMetadata = await source.metadata();
  const sourceHash = await hashFile(sourcePath);
  for (const width of widths) {
    const outputPath = path.join(outputDirectory, `${sourceName.replace(/\.[^.]+$/, '')}-w${width}.webp`);
    await mkdir(outputDirectory, { recursive: true });
    await source.clone()
      .resize({ width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toFile(outputPath);
    const outputMetadata = await sharp(outputPath).metadata();
    const outputStat = await stat(outputPath);
    generated.push({
      sourceName,
      sourceHash,
      sourceWidth: sourceMetadata.width || null,
      sourceHeight: sourceMetadata.height || null,
      width,
      outputPath,
      outputHash: await hashFile(outputPath),
      bytes: outputStat.size,
      intrinsicWidth: outputMetadata.width || null,
      intrinsicHeight: outputMetadata.height || null,
      withinBudget: outputStat.size <= budgetBytes,
      noUpscale: (outputMetadata.width || 0) <= (sourceMetadata.width || 0),
    });
  }
}

const chooseCandidate = (sourceName, requiredWidth) => {
  const candidates = generated
    .filter(candidate => candidate.sourceName === sourceName)
    .sort((a, b) => a.width - b.width);
  const selected = candidates.find(candidate => candidate.intrinsicWidth >= requiredWidth)
    || candidates[candidates.length - 1];
  return selected ? {
    width: selected.width,
    intrinsicWidth: selected.intrinsicWidth,
    undersized: selected.intrinsicWidth < requiredWidth,
  } : null;
};

const matrix = viewports.flatMap(viewport => dprs.map(devicePixelRatio => ({
  viewport,
  devicePixelRatio,
  boxCssPx: thumbnailBoxCssPx,
  requiredWidth: thumbnailBoxCssPx * devicePixelRatio,
  candidates: sourceNames.map(sourceName => ({
    sourceName,
    selected: chooseCandidate(sourceName, thumbnailBoxCssPx * devicePixelRatio),
  })),
})));

const localFailures = generated.filter(candidate => !candidate.withinBudget || !candidate.noUpscale);
const report = {
  status: localFailures.length === 0 ? 'LOCAL_CANDIDATES_PASS_STORAGE_NOT_VERIFIED' : 'LOCAL_CANDIDATES_FAIL',
  generatedAt: new Date().toISOString(),
  testedSha: (await import('node:child_process')).execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim(),
  sourceDirectory,
  sourceCount: sourceNames.length,
  widths,
  budgetBytes,
  thumbnailBoxCssPx,
  viewportDprMatrix: matrix,
  candidates: generated,
  localFailures,
  storageReadback: {
    status: 'NOT_VERIFIED',
    reason: 'These outputs are disposable local QA candidates; no storage upload or CMS writer mutation was authorized for A/C.',
  },
  productionAppCurrentSrc: {
    status: 'NOT_VERIFIED',
    reason: 'The current persisted manifest exposes w320/w640/w960 in historical evidence, not a verified 64/128/192 app read-back.',
  },
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  reportPath,
  testedSha: report.testedSha,
  sourceCount: report.sourceCount,
  candidateCount: generated.length,
  localFailures: localFailures.length,
  storageReadback: report.storageReadback.status,
  productionAppCurrentSrc: report.productionAppCurrentSrc.status,
}, null, 2));

if (localFailures.length > 0) process.exitCode = 1;
