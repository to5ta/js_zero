#!/usr/bin/env node
/**
 * Download the project's assets listed in src/assets/assets.json.
 *
 * Node-only replacement for `python scripts/assets.py --download` so that
 * a plain `npm install && npm run assets` is enough to get the game running.
 * scripts/assets.py is still the tool for --analyze and --upload (needs paramiko).
 *
 * The remote URL of an asset is its sha256, so every download is verified.
 *
 *   node scripts/assets.mjs            download missing assets
 *   node scripts/assets.mjs --force    re-download everything
 *   node scripts/assets.mjs --check    verify local files, download nothing
 *   node scripts/assets.mjs --dry-run  only print what would happen
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'src', 'assets', 'assets.json');
const BASE_URL = 'staib.dev';
const CONCURRENCY = 4;

const args = new Set(process.argv.slice(2));
const force = args.has('--force') || args.has('-f');
const checkOnly = args.has('--check');
const dryRun = args.has('--dry-run');

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', OFF = '\x1b[0m';
const ok = (m) => console.log(`${GREEN}  ok${OFF}   ${m}`);
const skip = (m) => console.log(`${DIM}  skip${OFF} ${m}`);
const warn = (m) => console.log(`${YELLOW}  warn${OFF} ${m}`);
const fail = (m) => console.log(`${RED}  fail${OFF} ${m}`);

async function sha256(path) {
  const hash = createHash('sha256');
  hash.update(await readFile(path));
  return hash.digest('hex');
}

/** The expected sha256 is the last path segment of the remote URL. */
function expectedHash(subUrl) {
  const candidate = subUrl.split('/').pop() ?? '';
  return /^[0-9a-f]{64}$/.test(candidate) ? candidate : null;
}

async function localState(path, expected) {
  try {
    const { size } = await stat(path);
    if (size === 0) return { present: true, valid: false, reason: 'empty file' };
    if (!expected) return { present: true, valid: true, reason: 'no hash in manifest' };
    const actual = await sha256(path);
    return actual === expected
      ? { present: true, valid: true }
      : { present: true, valid: false, reason: `sha256 mismatch (${actual.slice(0, 12)}…)` };
  } catch {
    return { present: false, valid: false };
  }
}

async function download(url, dest, expected) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length === 0) throw new Error('empty response');
  if (expected) {
    const actual = createHash('sha256').update(body).digest('hex');
    if (actual !== expected) throw new Error(`sha256 mismatch: got ${actual.slice(0, 12)}…`);
  }
  // write to a temp file first so an interrupted run leaves no half asset behind
  const tmp = `${dest}.part`;
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(tmp, body);
  await rename(tmp, dest).catch(async (e) => { await rm(tmp, { force: true }); throw e; });
  return body.length;
}

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MiB`;

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(MANIFEST, 'utf8')).assets;
  } catch (e) {
    fail(`cannot read asset manifest ${MANIFEST}: ${e.message}`);
    process.exit(1);
  }

  const entries = Object.entries(manifest ?? {});
  if (entries.length === 0) {
    fail('asset manifest contains no assets');
    process.exit(1);
  }

  const mode = checkOnly ? 'checking' : dryRun ? 'dry run for' : 'downloading';
  console.log(`${mode} ${entries.length} assets from https://${BASE_URL}/\n`);

  const counts = { ok: 0, skipped: 0, failed: 0 };
  let bytes = 0;
  const queue = [...entries];

  const worker = async () => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      const [relPath, subUrl] = entry;
      const dest = join(ROOT, relPath);
      const expected = expectedHash(subUrl);
      if (!expected) warn(`${relPath} — no sha256 in manifest URL, cannot verify`);

      const state = await localState(dest, expected);

      if (state.present && state.valid && !force) {
        skip(`${relPath} ${DIM}(already present, verified)${OFF}`);
        counts.skipped++;
        continue;
      }
      if (state.present && !state.valid) warn(`${relPath} — ${state.reason}, re-downloading`);

      if (checkOnly) {
        if (!state.present) fail(`${relPath} — missing`);
        counts.failed++;
        continue;
      }
      if (dryRun) {
        console.log(`  would download https://${BASE_URL}/${subUrl} -> ${relPath}`);
        counts.ok++;
        continue;
      }

      try {
        const size = await download(`https://${BASE_URL}/${subUrl}`, dest, expected);
        bytes += size;
        ok(`${relPath} ${DIM}(${mib(size)})${OFF}`);
        counts.ok++;
      } catch (e) {
        fail(`${relPath} — ${e.message}`);
        counts.failed++;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, entries.length) }, worker));

  const parts = checkOnly
    ? [`${counts.skipped} up to date`, `${counts.failed} missing or corrupt`]
    : [`${counts.ok} downloaded`, `${counts.skipped} up to date`];
  if (bytes) parts.push(mib(bytes));
  const tail = checkOnly ? '' : `, ${counts.failed} failed`;
  console.log(`\n${counts.failed ? RED : GREEN}${parts.join(', ')}${tail}${OFF}`);

  if (counts.failed) {
    console.log(`\nRetry with: ${DIM}node scripts/assets.mjs --force${OFF}`);
    process.exit(1);
  }
}

await main();
