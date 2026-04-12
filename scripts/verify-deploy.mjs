#!/usr/bin/env node
// ═══════════════════════════════════════════
// Deploy Verification — Local vs Live
// ═══════════════════════════════════════════
// Compares local public/ files against a deployed URL.
// Usage: node scripts/verify-deploy.mjs [URL]
// Default URL: https://game-night-scorer.web.app

import { createHash } from 'crypto';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BASE_URL = process.argv[2] || 'https://game-night-scorer.web.app';
const PUBLIC_DIR = join(process.cwd(), 'public');

// Skip files that differ between staging and production
const SKIP_FILES = new Set([
  'js/debug.js', // staging only
]);

// Binary file extensions to skip content comparison
const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf']);

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function walkDir(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath, base));
    } else {
      files.push(relative(base, fullPath));
    }
  }
  return files;
}

async function fetchRemote(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!resp.ok) return { status: resp.status, body: null };
    const buffer = Buffer.from(await resp.arrayBuffer());
    return { status: resp.status, body: buffer };
  } catch (e) {
    return { status: 0, body: null, error: e.message };
  }
}

async function main() {
  console.log(`\nVerifying local files against: ${BASE_URL}\n`);
  console.log('─'.repeat(60));

  const files = walkDir(PUBLIC_DIR);
  let matches = 0, mismatches = 0, missing = 0, skipped = 0;

  for (const file of files.sort()) {
    if (SKIP_FILES.has(file)) {
      console.log(`  [SKIP]     ${file} (staging only)`);
      skipped++;
      continue;
    }

    const ext = file.substring(file.lastIndexOf('.'));
    if (BINARY_EXTS.has(ext)) {
      console.log(`  [SKIP]     ${file} (binary)`);
      skipped++;
      continue;
    }

    const localContent = readFileSync(join(PUBLIC_DIR, file));
    const localHash = sha256(localContent);

    const cacheBust = `_cb=${Date.now()}`;
    const url = `${BASE_URL}/${file}${file.includes('?') ? '&' : '?'}${cacheBust}`;
    const { status, body, error } = await fetchRemote(url);

    if (error || status === 0) {
      console.log(`  [ERROR]    ${file} — ${error || 'network error'}`);
      mismatches++;
    } else if (status === 404) {
      console.log(`  [MISSING]  ${file} — not found on remote`);
      missing++;
    } else if (!body) {
      console.log(`  [ERROR]    ${file} — empty response`);
      mismatches++;
    } else {
      const remoteHash = sha256(body);
      if (localHash === remoteHash) {
        console.log(`  [MATCH]    ${file}`);
        matches++;
      } else {
        console.log(`  [MISMATCH] ${file}`);
        console.log(`             local:  ${localHash.substring(0, 16)}...`);
        console.log(`             remote: ${remoteHash.substring(0, 16)}...`);
        mismatches++;
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${matches} match, ${mismatches} mismatch, ${missing} missing, ${skipped} skipped`);
  console.log(`Total files: ${files.length}\n`);

  if (mismatches > 0 || missing > 0) {
    console.log('NOTE: Firebase CDN may cache for up to 1 hour after deploy.');
    console.log('If you just deployed, wait and try again.\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
