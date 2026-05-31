/**
 * Wavit icon generator
 * Generates all required Android + iOS app icon PNGs from the W logo SVG.
 * Run: node scripts/generate-icons.mjs
 */

import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── SVG builders ─────────────────────────────────────────────────────────────

/**
 * Full badge icon — dark background + W stroke (for ic_launcher, ic_launcher_round, iOS).
 * Uses a plain rect so it renders identically at any size.
 */
function badgeSvg(size) {
  const r = size * 0.24;   // corner radius ~24% = matches the component's rx≈13.5/56
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0d1428"/>
      <stop offset="100%" stop-color="#160b38"/>
    </linearGradient>
    <linearGradient id="w" x1="${size*0.107}" y1="${size*0.5}" x2="${size*0.893}" y2="${size*0.5}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#22d3ee"/>
      <stop offset="48%"  stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="border" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="rgba(99,147,255,0.35)"/>
      <stop offset="100%" stop-color="rgba(167,139,250,0.2)"/>
    </linearGradient>
  </defs>

  <!-- Badge background -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Badge border -->
  <rect x="0.5" y="0.5" width="${size-1}" height="${size-1}" rx="${r}" ry="${r}"
        stroke="url(#border)" stroke-width="${size*0.018}" fill="none"/>

  <!-- W path — scaled from 56×56 viewbox -->
  <g transform="scale(${size/56})">
    <!-- Shadow/glow layer -->
    <path d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
      stroke="rgba(34,211,238,0.25)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Primary stroke -->
    <path d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
      stroke="url(#w)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}

/**
 * Foreground-only icon — W on transparent background (for Android adaptive icon foreground layer).
 * The foreground canvas is 108dp; the safe zone is the inner 72dp (66%).
 * We centre the W within the safe zone.
 */
function foregroundSvg(size) {
  // safe zone = 66% of size; W is drawn inside that
  const safe = size * 0.66;
  const offset = (size - safe) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="w" x1="${offset + safe*0.107}" y1="${size*0.5}" x2="${offset + safe*0.893}" y2="${size*0.5}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#22d3ee"/>
      <stop offset="48%"  stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <!-- W centred inside safe zone -->
  <g transform="translate(${offset}, ${offset}) scale(${safe/56})">
    <path d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
      stroke="rgba(34,211,238,0.25)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
      stroke="url(#w)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPng(svg, size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  return resvg.render().asPng();
}

function write(filePath, png) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
  console.log(`  ✓  ${path.relative(ROOT, filePath)}`);
}

// ── Android specs ──────────────────────────────────────────────────────────────

const ANDROID_RES = path.join(ROOT, 'android/app/src/main/res');

const androidDensities = [
  { dir: 'mipmap-mdpi',     launcher: 48,  foreground: 108 },
  { dir: 'mipmap-hdpi',     launcher: 72,  foreground: 162 },
  { dir: 'mipmap-xhdpi',    launcher: 96,  foreground: 216 },
  { dir: 'mipmap-xxhdpi',   launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi',  launcher: 192, foreground: 432 },
];

console.log('\n🤖  Generating Android icons…');
for (const { dir, launcher, foreground } of androidDensities) {
  const base = path.join(ANDROID_RES, dir);
  // ic_launcher (square badge)
  write(path.join(base, 'ic_launcher.png'),       renderPng(badgeSvg(launcher),      launcher));
  // ic_launcher_round (same art — system clips to circle)
  write(path.join(base, 'ic_launcher_round.png'), renderPng(badgeSvg(launcher),      launcher));
  // ic_launcher_foreground (transparent, for adaptive icons)
  write(path.join(base, 'ic_launcher_foreground.png'), renderPng(foregroundSvg(foreground), foreground));
}

// ── iOS spec ───────────────────────────────────────────────────────────────────

const IOS_ICON_DIR = path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

console.log('\n🍎  Generating iOS icons…');
// Contents.json only declares one universal 1024×1024 icon
write(path.join(IOS_ICON_DIR, 'AppIcon-512@2x.png'), renderPng(badgeSvg(1024), 1024));

console.log('\n✅  All icons generated!\n');
