// Build the home-page Field Note tiles.
//
//   npm run tiles:build
//
// Reads the large source exports that live OUTSIDE this repo (in the sibling
// project folders), crops them to the 4:5 Field Notes grid, and writes
// responsive webp into public/images/tiles/.
//
// It also GENERATES the "method" tile, which has no Instagram source. That one
// is an inverted field note: black ground, cream ink, same furniture. Being the
// odd one out is the point, it marks the tile that is a door rather than a
// document.
//
// SVG uses system-font fallbacks (Helvetica) for the same reason as
// generate-og.mjs: librsvg can't reliably load web fonts. Close enough to the
// grotesque used in the Instagram set at tile sizes.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Sibling project folders. Override with TILE_SRC if the tree moves.
const SRC_ROOT = process.env.TILE_SRC || path.resolve(ROOT, '..');
const OUT_DIR = path.join(ROOT, 'public/images/tiles');

// --- The Field Notes series palette (sampled from the real exports) ---------
const FN = {
  cream: '#F4ECD7',
  ink: '#111111',
  magenta: '#B8317B',
};

// 4:5 at two widths. 1120 covers 2x on a ~560px tile.
const WIDTHS = [560, 1120];
const RATIO = 5 / 4;

const SOURCES = [
  {
    id: 'stack',
    from: 'ai-sovereignties/ai_stack_fieldnotes.png',
  },
  {
    id: 'ladder',
    from: 'ai-sovereignties/content updates/IMG_8066.PNG',
    // 1360x1300, the only asset off the 4:5 grid. Padded onto cream for now.
    // Re-export at 1080x1350 and this note goes away.
    expectPad: true,
  },
];

// --- The generated method tile ---------------------------------------------

function methodTileSvg() {
  const W = 1080;
  const H = 1350;
  const M = 90; // margin

  const cropMark = (x, y) =>
    `<g stroke="${FN.cream}" stroke-width="3" opacity="0.45">
       <line x1="${x - 14}" y1="${y}" x2="${x + 14}" y2="${y}"/>
       <line x1="${x}" y1="${y - 14}" x2="${x}" y2="${y + 14}"/>
     </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${FN.ink}"/>

  ${cropMark(48, 190)}
  ${cropMark(W - 48, 190)}
  ${cropMark(48, H - 90)}
  ${cropMark(W - 48, H - 90)}

  <!-- Eyebrow bar, inverted: cream bar, black text -->
  <rect x="${M}" y="${M}" width="760" height="58" fill="${FN.cream}"/>
  <rect x="${M + 22}" y="${M + 23}" width="13" height="13" fill="${FN.ink}"/>
  <text x="${M + 50}" y="${M + 39}"
        font-family="Menlo, Consolas, monospace"
        font-size="23" font-weight="500" letter-spacing="4.2"
        fill="${FN.ink}">FIELD NOTES FROM HISTORY IN THE MAKING</text>

  <!-- Asterisk -->
  <text x="${M + 20}" y="380"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="96" font-weight="700" fill="${FN.cream}">*</text>

  <!-- Magenta rule -->
  <rect x="${M + 20}" y="440" width="112" height="13" fill="${FN.magenta}"/>

  <!-- Headline -->
  <text x="${M + 18}" y="600"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="86" font-weight="700" letter-spacing="-1"
        fill="${FN.cream}">Run this</text>

  <rect x="${M + 8}" y="628" width="640" height="106" fill="${FN.cream}"/>
  <text x="${M + 26}" y="712"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="86" font-weight="700" letter-spacing="-1"
        fill="${FN.ink}">where you live</text>

  <!-- Sub-line -->
  <text x="${M + 18}" y="812"
        font-family="Menlo, Consolas, monospace"
        font-size="27" letter-spacing="0.5"
        fill="#9a9186">map the AI infrastructure</text>
  <text x="${M + 18}" y="852"
        font-family="Menlo, Consolas, monospace"
        font-size="27" letter-spacing="0.5"
        fill="#9a9186">in your own jurisdiction</text>

  <!-- Sign-off -->
  <rect x="${M + 8}" y="1120" width="384" height="82" fill="${FN.cream}"/>
  <text x="${M + 26}" y="1177"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="54" font-weight="700" letter-spacing="-0.5"
        fill="${FN.ink}">/start/</text>

  <text x="${M + 18}" y="1258"
        font-family="Menlo, Consolas, monospace"
        font-size="22" letter-spacing="2.6"
        fill="#7d766c">CIVIC INTERPLAY &#183; THE METHOD, NOT THE MAP</text>
</svg>`;
}


// --- Generated cream field notes, for tools with no artwork of their own ----

// The generated field note, on either ground.
//
// Four of these sat in What's New together and the row read as four identical
// pale rectangles. Same fix as the claim cards in build-claim-cards.mjs: flip
// the ground on some of them. The magenta rule stays magenta on both, which is
// what lets the rest move.
function generatedTileSvg({ headline, knockout, sub, signoff, ground = 'cream' }) {
  const W = 1080, H = 1350, M = 90;
  const ink = ground === 'ink';
  const bg = ink ? FN.ink : FN.cream;
  const fg = ink ? FN.cream : FN.ink;
  const mute = ink ? '#9a9186' : '#8b8378';
  const subMute = ink ? '#9a9186' : '#7d766c';

  const mark = (x, y) =>
    `<g stroke="${fg}" stroke-width="3" opacity="${ink ? 0.45 : 0.28}">
       <line x1="${x - 14}" y1="${y}" x2="${x + 14}" y2="${y}"/>
       <line x1="${x}" y1="${y - 14}" x2="${x}" y2="${y + 14}"/>
     </g>`;
  const kw = knockout.length * 44 + 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${mark(48, 190)} ${mark(W - 48, 190)} ${mark(48, H - 90)} ${mark(W - 48, H - 90)}

  <rect x="${M}" y="${M}" width="760" height="58" fill="${fg}"/>
  <rect x="${M + 22}" y="${M + 23}" width="13" height="13" fill="${bg}"/>
  <text x="${M + 50}" y="${M + 39}" font-family="Menlo, Consolas, monospace"
        font-size="23" font-weight="500" letter-spacing="4.2"
        fill="${bg}">FIELD NOTES FROM HISTORY IN THE MAKING</text>

  <text x="${M + 20}" y="380" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="96" font-weight="700" fill="${fg}">*</text>
  <rect x="${M + 20}" y="440" width="112" height="13" fill="${FN.magenta}"/>

  <text x="${M + 18}" y="600" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="700" letter-spacing="-1" fill="${fg}">${headline}</text>
  <rect x="${M + 8}" y="628" width="${kw}" height="98" fill="${fg}"/>
  <text x="${M + 26}" y="704" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="700" letter-spacing="-1" fill="${bg}">${knockout}</text>

  <text x="${M + 18}" y="808" font-family="Menlo, Consolas, monospace"
        font-size="27" fill="${subMute}">${sub}</text>

  <text x="${M + 18}" y="1258" font-family="Menlo, Consolas, monospace"
        font-size="22" letter-spacing="2.6" fill="${mute}">${signoff}</text>
</svg>`;
}

const GENERATED = [
  {
    id: 'map',
    ground: 'ink',
    // Already published as a post feature image, so its provenance is settled
    // and it is literally this tracker's own map.
    photo: 'public/images/sovereignties-map.png',
    headline: 'Tracking the',
    knockout: 'super cycle',
    sub: 'energy, water and land, site by site',
    signoff: 'CIVIC INTERPLAY \u00B7 TRACKER',
  },
  {
    id: 'submission',
    ground: 'ink',
    headline: 'The Senate',
    knockout: 'Submission',
    sub: 'key recommendations',
    signoff: 'CIVIC INTERPLAY \u00B7 SUBMISSION',
  },
  {
    id: 'listening',
    headline: 'Listening to an',
    knockout: 'emergent field',
    sub: 'the vocabulary of civic AI, counted',
    signoff: 'CIVIC INTERPLAY \u00B7 LISTENING',
  },
  {
    id: 'friends',
    headline: 'Source materials',
    knockout: 'on civic AI',
    sub: 'what the field is writing now',
    signoff: 'CIVIC INTERPLAY \u00B7 READING',
  },
  {
    id: 'terrain',
    headline: 'A walkable',
    knockout: 'semantic terrain',
    sub: 'texts and noticings, clustered by what',
    signoff: 'CIVIC INTERPLAY \u00B7 TOOL',
  },
  {
    id: 'player',
    headline: 'A player that',
    knockout: "doesn't watch back",
    sub: 'no third-party scripts, no cookies',
    signoff: 'CIVIC INTERPLAY \u00B7 TOOL',
  },
  {
    id: 'toolkit',
    headline: 'Workflows and',
    knockout: 'prompts, forkable',
    sub: 'everything here is a draft',
    signoff: 'CIVIC INTERPLAY \u00B7 TOOLKIT',
  },
];


// The generated field note with a photograph across the top.
//
// Same idea as an ARCHIVE claim card: the image takes the top of the frame and
// the furniture sits under it. This is how a real photograph gets into What's
// New without losing the series look. The SVG here is an overlay with no
// ground of its own; the photo and the ground are composited under it, because
// librsvg cannot be relied on to load an embedded raster.
const PHOTO_H = 600;

function photoTileOverlaySvg({ headline, knockout, sub, signoff, ground = 'cream' }) {
  const W = 1080, H = 1350, M = 90;
  const ink = ground === 'ink';
  const bg = ink ? FN.ink : FN.cream;
  const fg = ink ? FN.cream : FN.ink;
  const mute = ink ? '#9a9186' : '#8b8378';
  const subMute = ink ? '#9a9186' : '#7d766c';

  const mark = (x, y) =>
    `<g stroke="${fg}" stroke-width="3" opacity="${ink ? 0.45 : 0.28}">
       <line x1="${x - 14}" y1="${y}" x2="${x + 14}" y2="${y}"/>
       <line x1="${x}" y1="${y - 14}" x2="${x}" y2="${y + 14}"/>
     </g>`;
  const kw = knockout.length * 44 + 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${mark(48, PHOTO_H + 70)} ${mark(W - 48, PHOTO_H + 70)} ${mark(48, H - 90)} ${mark(W - 48, H - 90)}

  <rect x="${M}" y="${PHOTO_H + 60}" width="760" height="58" fill="${fg}"/>
  <rect x="${M + 22}" y="${PHOTO_H + 83}" width="13" height="13" fill="${bg}"/>
  <text x="${M + 50}" y="${PHOTO_H + 99}" font-family="Menlo, Consolas, monospace"
        font-size="23" font-weight="500" letter-spacing="4.2"
        fill="${bg}">FIELD NOTES FROM HISTORY IN THE MAKING</text>

  <rect x="${M + 20}" y="${PHOTO_H + 170}" width="112" height="13" fill="${FN.magenta}"/>

  <text x="${M + 18}" y="${PHOTO_H + 300}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="700" letter-spacing="-1" fill="${fg}">${headline}</text>
  <rect x="${M + 8}" y="${PHOTO_H + 328}" width="${kw}" height="98" fill="${fg}"/>
  <text x="${M + 26}" y="${PHOTO_H + 404}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="700" letter-spacing="-1" fill="${bg}">${knockout}</text>

  <text x="${M + 18}" y="${PHOTO_H + 508}" font-family="Menlo, Consolas, monospace"
        font-size="27" fill="${subMute}">${sub}</text>

  <text x="${M + 18}" y="1258" font-family="Menlo, Consolas, monospace"
        font-size="22" letter-spacing="2.6" fill="${mute}">${signoff}</text>
</svg>`;
}

// Ground, then photograph, then furniture.
async function photoTileBuffer(g) {
  const photo = await sharp(path.join(ROOT, g.photo))
    .resize(1080, PHOTO_H, { fit: 'cover', position: 'centre' })
    .toBuffer();

  return sharp({
    create: {
      width: 1080, height: 1350, channels: 4,
      background: g.ground === 'ink' ? FN.ink : FN.cream,
    },
  })
    .composite([
      { input: photo, top: 0, left: 0 },
      { input: Buffer.from(photoTileOverlaySvg(g)), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

// Tiles whose artwork already exists in this repo at the right shape, so there
// is nothing to generate. A claim card is already 1080x1350.
const REPO_SOURCES = [
  {
    id: 'facts',
    from: 'public/images/cards/2026-09-19/10.png',
    note: 'claim card 10, the one VERIFIED card in the set',
  },
];

// --- Build ------------------------------------------------------------------

async function writeVariants(input, id, label) {
  const written = [];
  for (const w of WIDTHS) {
    const h = Math.round(w * RATIO);
    const buf = await sharp(input)
      .resize(w, h, { fit: 'contain', background: FN.cream })
      .webp({ quality: 82 })
      .toBuffer();
    const out = path.join(OUT_DIR, `${id}-${w}.webp`);
    await fs.writeFile(out, buf);
    written.push(`${path.relative(ROOT, out)} (${Math.round(buf.length / 1024)}KB)`);
  }
  console.log(`  ${label}`);
  written.forEach((w) => console.log(`    ${w}`));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(`Source root: ${SRC_ROOT}\n`);

  for (const src of SOURCES) {
    const from = path.join(SRC_ROOT, src.from);
    try {
      await fs.access(from);
    } catch {
      console.error(`  MISSING: ${src.from}`);
      console.error(`    Looked in ${SRC_ROOT}. Set TILE_SRC to the folder holding`);
      console.error(`    the sibling project directories, then re-run.`);
      process.exitCode = 1;
      continue;
    }

    const meta = await sharp(from).metadata();
    const isFourFive = Math.abs(meta.height / meta.width - RATIO) < 0.01;
    let label = `${src.id}  <-  ${src.from}  [${meta.width}x${meta.height}]`;
    if (!isFourFive) {
      label += `  PADDED onto cream, not 4:5`;
      if (!src.expectPad) label += `  (unexpected)`;
    }
    await writeVariants(from, src.id, label);
  }

  const svg = methodTileSvg();
  await fs.writeFile(path.join(OUT_DIR, 'method.svg'), svg, 'utf8');
  await writeVariants(Buffer.from(svg), 'method', 'method  <-  generated (inverted field note)');

  for (const src of REPO_SOURCES) {
    const from = path.join(ROOT, src.from);
    await writeVariants(from, src.id, `${src.id}  <-  ${src.from}  (${src.note})`);
  }

  for (const g of GENERATED) {
    if (g.photo) {
      await writeVariants(await photoTileBuffer(g), g.id, `${g.id}  <-  ${g.photo}  (photo + field note)`);
      continue;
    }
    const gsvg = generatedTileSvg(g);
    await fs.writeFile(path.join(OUT_DIR, `${g.id}.svg`), gsvg, 'utf8');
    await writeVariants(Buffer.from(gsvg), g.id, `${g.id}  <-  generated (${g.ground === 'ink' ? 'inverted' : 'cream'} field note)`);
  }

  console.log(`\nDone. Tiles in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error('Tile build failed:', err);
  process.exit(1);
});
