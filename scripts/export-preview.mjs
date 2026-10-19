#!/usr/bin/env node
import { constants } from 'node:fs';
import { access, lstat, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const [destinationArg, ...extraArgs] = process.argv.slice(2);
const marker = process.env.LANE_MARKER?.trim();
const baseUrl = process.env.RIG_URL ?? `http://127.0.0.1:${process.env.PORT ?? '8787'}`;

function fail(message) {
  console.error(`export-preview: ${message}`);
  process.exit(1);
}

function isWithin(parent, candidate) {
  const pathFromParent = relative(parent, candidate);
  return pathFromParent === '' || (!pathFromParent.startsWith(`..${sep}`) && pathFromParent !== '..' && !isAbsolute(pathFromParent));
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

if (!destinationArg || extraArgs.length > 0) {
  fail('usage: pnpm export-preview /absolute/path/outside/repo/digest.html');
}
if (!marker) fail('LANE_MARKER must be set in .env or the environment');

const outputPath = resolve(destinationArg);
if (!outputPath.toLowerCase().endsWith('.html')) fail('destination must end in .html');

let outputParent;
try {
  outputParent = await realpath(dirname(outputPath));
} catch {
  fail('destination directory must already exist');
}
const canonicalOutputPath = join(outputParent, outputPath.slice(outputPath.lastIndexOf(sep) + 1));
if (isWithin(repoRoot, canonicalOutputPath)) fail('destination must be outside the repository');
try {
  await lstat(canonicalOutputPath);
  fail('destination already exists; remove it before exporting again');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

let url;
try {
  url = new URL('/digest/2026-10-28', baseUrl);
} catch {
  fail('RIG_URL must be a valid local rig URL');
}
if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname) || url.username || url.password) {
  fail('RIG_URL must point to a local HTTP rig');
}
url.search = '';
url.hash = '';

let response;
try {
  response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
} catch (error) {
  fail(`could not fetch ${url}: ${error.message}`);
}
if (!response.ok) fail(`rig returned HTTP ${response.status}`);
if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
  fail('rig response is not HTML');
}

const html = await response.text();
if (!/^\s*<!doctype\s+html\s*>/i.test(html)) fail('response is missing an HTML doctype');
if (!html.includes(`<span class="marker">${escapeHtml(marker)}</span>`)) {
  fail('response does not contain the configured lane marker banner');
}
if (/<script\b/i.test(html)) fail('response contains a script element');
if (/<(?:img|iframe|audio|video|source|object|embed)\b/i.test(html)) {
  fail('response contains a separately loaded media asset');
}
if (/<link\b[^>]*\bhref\s*=/i.test(html) || /@import\b/i.test(html)) {
  fail('response contains an external stylesheet or linked asset');
}
if (/<[^>]+\b(?:src|poster)\s*=/i.test(html) ||
    /<[^>]+\bhref\s*=\s*["'](?:https?:)?\/\//i.test(html) ||
    /url\s*\(/i.test(html)) {
  fail('response references an external asset');
}

// Check once more immediately before writing so an unexpected path change cannot replace a file.
try {
  await access(canonicalOutputPath, constants.F_OK);
  fail('destination already exists; remove it before exporting again');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
await writeFile(canonicalOutputPath, html, { encoding: 'utf8', flag: 'wx' });
console.log(`saved ${canonicalOutputPath}`);
