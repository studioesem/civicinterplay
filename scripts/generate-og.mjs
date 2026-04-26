// Generate the default Open Graph tile for civicinterplay.io.
// Renders an SVG (`public/og-default.svg`) to a 1200x630 PNG (`public/og-default.png`).
//
// Re-run when the wordmark / tagline / palette changes:
//   npm run og:generate
//
// SVG uses system-font fallbacks (Helvetica / Georgia) because librsvg can't
// reliably load web fonts. Visually close enough to Fira Sans + Merriweather at
// OG sizes; if pixel-perfect brand fonts matter later, swap to Satori.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SVG_OUT = path.join(ROOT, 'public/og-default.svg');
const PNG_OUT = path.join(ROOT, 'public/og-default.png');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <!-- Background: warm grey, matches site bg -->
  <rect width="1200" height="630" fill="#f8f8f8"/>

  <!-- Subtle gradient texture echoing the animated header on civicinterplay.io -->
  <defs>
    <linearGradient id="bgwash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8f8f8"/>
      <stop offset="50%" stop-color="#f0eff0"/>
      <stop offset="100%" stop-color="#f8f8f8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgwash)"/>

  <!-- Bold border + offset shadow, matching the section-heading register on the site -->
  <rect x="48" y="48" width="1104" height="534" fill="#ffffff" stroke="#1c1917" stroke-width="4"/>
  <rect x="56" y="56" width="1104" height="534" fill="none" stroke="#1c1917" stroke-width="2" opacity="0.35"/>

  <!-- Eyebrow -->
  <text x="96" y="148"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="22" font-weight="500" letter-spacing="4"
        fill="#454E41">
    CIVIC INTERPLAY · A THINK + DO SPACE
  </text>

  <!-- Wordmark: "CIVIC" in dark, "INTERPLAY" in brand purple -->
  <text x="96" y="320"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="124" font-weight="300" letter-spacing="6"
        fill="#1c1917">CIVIC <tspan fill="#7D50BD">INTERPLAY</tspan></text>

  <!-- Tagline -->
  <text x="100" y="400"
        font-family="Georgia, serif"
        font-size="32" font-style="italic"
        fill="rgba(28,25,23,0.72)">
    Towards civic agencies &amp; civic AI intelligence.
  </text>

  <!-- Palette stripe (5 brand colours) -->
  <g transform="translate(96, 470)">
    <rect x="0"   y="0" width="180" height="44" fill="#7D50BD"/>
    <rect x="180" y="0" width="180" height="44" fill="#E076DB"/>
    <rect x="360" y="0" width="180" height="44" fill="#D16D54"/>
    <rect x="540" y="0" width="180" height="44" fill="#8E9BDD"/>
    <rect x="720" y="0" width="180" height="44" fill="#454E41"/>
  </g>

  <!-- URL bottom-right -->
  <text x="1104" y="555"
        text-anchor="end"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="20" font-weight="500" letter-spacing="3"
        fill="rgba(28,25,23,0.6)">
    CIVICINTERPLAY.IO
  </text>
</svg>
`;

async function main() {
  await fs.writeFile(SVG_OUT, svg, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, SVG_OUT)}`);

  const buf = await sharp(Buffer.from(svg))
    .resize(1200, 630, { fit: 'cover' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  await fs.writeFile(PNG_OUT, buf);
  console.log(`Wrote ${path.relative(ROOT, PNG_OUT)} (${buf.length} bytes)`);
}

main().catch((err) => {
  console.error('OG generation failed:', err);
  process.exit(1);
});
