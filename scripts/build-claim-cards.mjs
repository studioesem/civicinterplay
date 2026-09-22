// Build the claim cards.
//
//   npm run cards:build                          every non-draft set
//   npm run cards:build -- --set 2026-09-19      one tracking night
//   npm run cards:build -- --only 03,13          named cards, for iterating
//   npm run cards:build -- --include-held        render the held ones too
//
// Reads src/content/claimcards/*.json and writes 1080x1350 PNGs into
// public/images/cards/{set}/, in the Field Notes language: cream ground, ink
// furniture, magenta rule, one knockout highlight per claim.
//
// Unlike build-tiles.mjs, which hand-positions every glyph and guesses the
// knockout width from a character count, this goes through satori. Claims vary
// too much in length to place by hand, and the highlight has to survive being
// wrapped mid-phrase. satori lays out flexbox with real font metrics and emits
// SVG with the glyphs already converted to paths, so sharp needs no font
// configuration at all.
//
// A card marked `hold` does not render. The caveat lives in the JSON next to
// the claim, so the thing that makes the image is the thing that knows whether
// the claim is cleared. That is the point, not a safety rail bolted on after.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';
import { parseClaim, plainClaim } from './lib/claim-text.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SRC_DIR = path.join(ROOT, 'src/content/claimcards');
const OUT_ROOT = path.join(ROOT, 'public/images/cards');

// Artwork for ARCHIVE cards lives in the sibling project folders, not in this
// repo. Same convention as build-tiles.mjs.
const SRC_ROOT = process.env.TILE_SRC || path.resolve(ROOT, '..');

// --- The design -------------------------------------------------------------
// Everything that decides how a card looks is in this block. Changing the look
// of every card is changing a number here and re-running the build.

const W = 1080;
const H = 1350;
const M = 90;

// Sampled from the published Field Notes set, same values as build-tiles.mjs.
const FN = {
  cream: '#F4ECD7',
  ink: '#111111',
  magenta: '#B8317B',
  purple: '#7D50BD',
};

// Two grounds. Seventeen cards on one ground read as wallpaper, so the run
// flips between them. Inverting is the same move build-tiles.mjs makes for the
// `method` tile, and the mute values come from there too.
//
// The magenta rule under the asterisk is magenta on both grounds. It is the one
// thing that does not vary, which is what lets everything else.
const GROUNDS = {
  cream: { bg: FN.cream, fg: FN.ink, mute: '#8b8378', markOpacity: 0.28 },
  ink: { bg: FN.ink, fg: FN.cream, mute: '#9a9186', markOpacity: 0.45 },
};

// A coloured knockout always carries cream text, so there is one rule to
// remember rather than a table. `default` is the ground inverted.
const HIGHLIGHTS = {
  default: (g) => ({ bg: g.fg, fg: g.bg }),
  magenta: () => ({ bg: FN.magenta, fg: FN.cream }),
  purple: () => ({ bg: FN.purple, fg: FN.cream }),
};

// Claim size by length of the claim with its brackets stripped. Tuned against
// the longest cards in the 19 September set (06 at 167 characters, 17 at 150).
// Nudge the sizes, not the thresholds: the thresholds are where lines break.
export const SIZE_LADDER = [
  { upTo: 90, size: 76 },
  { upTo: 120, size: 68 },
  { upTo: 150, size: 60 },
  { upTo: 180, size: 54 },
  { upTo: Infinity, size: 48 },
];

// An ARCHIVE card gives the top of the frame to the photograph, so its claim
// drops one rung to leave room for the attribution and sign-off beneath.
const claimSize = (text, hasImage = false) => {
  const i = SIZE_LADDER.findIndex((s) => text.length <= s.upTo);
  return SIZE_LADDER[Math.min(i + (hasImage ? 1 : 0), SIZE_LADDER.length - 1)].size;
};

const IMAGE_HEIGHT = 540;

const SIGNOFF = ['FIELD NOTES · CIVIC INTERPLAY', 'DATACENTRES.CIVICINTERPLAY.IO'];

// --- Fonts ------------------------------------------------------------------
// Fira Sans is the site's heading face; Fira Mono is its sibling, which is what
// the monospace furniture in the Field Notes language has always been standing
// in for. satori reads woff but not woff2, so point at the .woff files.

const FONT_FILES = [
  ['@fontsource/fira-sans/files/fira-sans-latin-400-normal.woff', 'Fira Sans', 400],
  ['@fontsource/fira-sans/files/fira-sans-latin-700-normal.woff', 'Fira Sans', 700],
  ['@fontsource/fira-sans/files/fira-sans-latin-800-normal.woff', 'Fira Sans', 800],
  ['@fontsource/fira-mono/files/fira-mono-latin-400-normal.woff', 'Fira Mono', 400],
  ['@fontsource/fira-mono/files/fira-mono-latin-500-normal.woff', 'Fira Mono', 500],
];

async function loadFonts() {
  return Promise.all(
    FONT_FILES.map(async ([file, name, weight]) => ({
      name,
      weight,
      style: 'normal',
      data: await fs.readFile(path.join(ROOT, 'node_modules', file)),
    }))
  );
}

// --- Element helper ---------------------------------------------------------
// satori takes a React-element shape. A three-line helper is cheaper than
// adding a JSX transform to a folder of plain .mjs scripts.

const h = (type, style, children) => ({
  type,
  props: { style, ...(children === undefined ? {} : { children }) },
});

const text = (style, content) => h('div', style, content);

// The ▸ that marks an attribution line in the source cards is not in Fira Mono,
// and satori draws a notdef box for it. A CSS triangle does not work either:
// satori renders the zero-size-plus-transparent-borders trick as a solid
// square. Inline SVG does, so the marker is drawn rather than typed.
const marker = (fill, size = 13) => ({
  type: 'svg',
  props: {
    width: size,
    height: Math.round(size * 1.23),
    viewBox: '0 0 13 16',
    style: { marginRight: 14 },
    children: { type: 'polygon', props: { points: '0,0 13,8 0,16', fill } },
  },
});

// --- Card furniture ---------------------------------------------------------

function cropMark(x, y, g) {
  const line = (w, hgt) =>
    h('div', {
      position: 'absolute',
      left: x - w / 2,
      top: y - hgt / 2,
      width: w,
      height: hgt,
      backgroundColor: g.fg,
      opacity: g.markOpacity,
    });
  return [line(28, 3), line(3, 28)];
}

// The bar is always the opposite of the ground, so on an inverted card it reads
// cream with ink type, exactly as the inverted tile in build-tiles.mjs does.
function eyebrow(label, g) {
  return h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: g.fg,
      height: 58,
      paddingLeft: 22,
      paddingRight: 30,
    },
    [
      h('div', { width: 13, height: 13, backgroundColor: g.bg, marginRight: 28 }),
      text(
        {
          fontFamily: 'Fira Mono',
          fontWeight: 500,
          fontSize: 23,
          letterSpacing: 4.2,
          color: g.bg,
        },
        label
      ),
    ]
  );
}

// The claim is set as one flex-wrapped row of words rather than a paragraph.
//
// satori will not wrap an inline span, so a highlight long enough to break a
// line (card 13's quoted phrase is the case that proves it) cannot be a single
// element. Every word is its own box instead, and the highlighted ones carry
// the ink ground. Each word's horizontal space is split half onto the word
// before it and half onto the word after, so two neighbouring highlighted
// words butt together into one continuous bar, and the bar keeps the same
// lead-in whether the word beside it is highlighted or not.
//
// Vertical padding is on every word, highlighted or not, so all the flex rows
// come out the same height and the leading stays even.
//
// Words that were not separated by a space in the source stay in one token, so
// the comma in "[[20 gigawatts]], roughly" cannot wrap onto the next line on
// its own. A token is a nested non-wrapping row; the outer row only breaks
// between tokens.
function claimBlock(claim, hasImage, g, hl) {
  const size = claimSize(plainClaim(claim), hasImage);
  const gap = size * 0.26; // the width of a word space at this size
  const padY = size * 0.07;
  const tight = size * 0.05; // the pad where a highlight meets glued punctuation

  // Split every run into words, remembering where a space was and was not.
  const pieces = [];
  let spaceBefore = true;
  for (const run of parseClaim(claim)) {
    const words = run.text.split(/\s+/).filter(Boolean);
    words.forEach((word, i) => {
      pieces.push({
        word,
        highlight: run.highlight,
        glue: i === 0 && !spaceBefore && !/^\s/.test(run.text) && pieces.length > 0,
      });
      spaceBefore = true;
    });
    spaceBefore = /\s$/.test(run.text) || words.length === 0;
  }

  // Group glued pieces into tokens.
  const tokens = [];
  for (const piece of pieces) {
    if (piece.glue && tokens.length > 0) tokens[tokens.length - 1].push(piece);
    else tokens.push([piece]);
  }

  const pieceBox = (piece, prev, next) =>
    h(
      'div',
      {
        display: 'flex',
        paddingTop: padY,
        paddingBottom: padY,
        ...(piece.highlight
          ? {
              backgroundColor: hl.bg,
              color: hl.fg,
              paddingLeft: prev ? tight : gap / 2,
              paddingRight: next ? tight : gap / 2,
            }
          : {}),
      },
      piece.word
    );

  return h(
    'div',
    {
      display: 'flex',
      flexWrap: 'wrap',
      alignContent: 'flex-start',
      fontFamily: 'Fira Sans',
      fontWeight: 800,
      fontSize: size,
      letterSpacing: -0.5,
      color: g.fg,
    },
    tokens.map((token, t) => {
      const endsHighlighted = token[token.length - 1].highlight;
      const nextStartsHighlighted = tokens[t + 1]?.[0].highlight ?? false;
      const isLast = t === tokens.length - 1;

      // Half the word space sits on each side of the join, so two neighbouring
      // highlights butt into one continuous bar and every other pairing still
      // comes out to a full space.
      const marginRight = isLast
        ? 0
        : (endsHighlighted ? gap / 2 : gap) - (nextStartsHighlighted ? gap / 2 : 0);

      return h(
        'div',
        { display: 'flex', marginRight },
        token.map((piece, i) => pieceBox(piece, token[i - 1], token[i + 1]))
      );
    })
  );
}

function attribution(lines, g) {
  return h(
    'div',
    { display: 'flex', flexDirection: 'column' },
    lines.filter(Boolean).map((line) =>
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'flex-start',
          fontFamily: 'Fira Mono',
          fontSize: 21,
          lineHeight: 1.3,
          letterSpacing: 0.6,
          color: g.fg,
          marginBottom: 10,
        },
        [marker(FN.magenta), text({ display: 'block', width: 810 }, line)]
      )
    )
  );
}

function signoff(g) {
  return h(
    'div',
    { display: 'flex', flexDirection: 'column', marginTop: 34 },
    SIGNOFF.map((line) =>
      h('div', { display: 'flex', alignItems: 'center', marginBottom: 9 }, [
        h('div', { width: 11, height: 11, backgroundColor: g.mute, marginRight: 14 }),
        text(
          { fontFamily: 'Fira Mono', fontSize: 19, letterSpacing: 2.4, color: g.mute },
          line
        ),
      ])
    )
  );
}

// --- The card ---------------------------------------------------------------

function cardTree(card, imageData) {
  const hasImage = Boolean(imageData);
  const g = GROUNDS[card.ground ?? 'cream'];
  const hl = (HIGHLIGHTS[card.highlight ?? 'default'])(g);

  const body = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      paddingLeft: M,
      paddingRight: M,
      paddingTop: hasImage ? 44 : M,
      paddingBottom: M,
    },
    [
      eyebrow(card.kind, g),
      hasImage
        ? null
        : h(
            'div',
            { display: 'flex', flexDirection: 'column', marginTop: 74 },
            [
              text(
                { fontFamily: 'Fira Sans', fontWeight: 700, fontSize: 96, color: g.fg, lineHeight: 1 },
                '*'
              ),
              h('div', { width: 112, height: 13, backgroundColor: FN.magenta, marginTop: 34 }),
            ]
          ),
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexGrow: 1,
          paddingTop: hasImage ? 30 : 54,
          paddingBottom: hasImage ? 30 : 40,
        },
        [claimBlock(card.claim, hasImage, g, hl)]
      ),
      attribution([card.source, card.meta], g),
      signoff(g),
    ].filter(Boolean)
  );

  return h(
    'div',
    {
      width: W,
      height: H,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: g.bg,
      position: 'relative',
    },
    [
      ...(hasImage ? [h('img', { width: W, height: IMAGE_HEIGHT })] : []),
      ...cropMark(48, hasImage ? IMAGE_HEIGHT + 80 : 190, g),
      ...cropMark(W - 48, hasImage ? IMAGE_HEIGHT + 80 : 190, g),
      ...cropMark(48, H - 48, g),
      ...cropMark(W - 48, H - 48, g),
      body,
    ]
  );
}

// satori wants the image src on props, not style.
function withImageSrc(tree, src) {
  if (!src) return tree;
  const img = tree.props.children.find((c) => c && c.type === 'img');
  if (img) img.props.src = src;
  return tree;
}

// --- Build ------------------------------------------------------------------

function parseArgs(argv) {
  const args = { set: null, only: null, includeHeld: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--set') args.set = argv[i + 1];
    else if (argv[i] === '--only') args.only = argv[i + 1].split(',').map((s) => s.trim());
    else if (argv[i] === '--include-held') args.includeHeld = true;
  }
  return args;
}

// Artwork is cropped and sized here rather than in satori, which pads rather
// than fills when the source aspect does not match the box. `imageCrop` is
// "left,top,width,height" in source pixels, and exists because a screen capture
// arrives with the interface it was captured from still in the frame. Leave it
// off and the image is centre-cropped to fill.
async function readImage(relPath, crop) {
  const abs = path.join(SRC_ROOT, relPath);
  try {
    let img = sharp(await fs.readFile(abs));

    if (crop) {
      const [left, top, width, height] = crop.split(',').map((n) => parseInt(n, 10));
      img = img.extract({ left, top, width, height });
    }

    const buf = await img
      .resize(W, IMAGE_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 86 })
      .toBuffer();

    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch (err) {
    console.warn(`    no usable artwork at ${relPath}, setting it as type instead`);
    console.warn(`    looked in ${SRC_ROOT}; set TILE_SRC if that tree has moved`);
    console.warn(`    ${err.message}`);
    return null;
  }
}

// An ARCHIVE card's photograph also has to reach the web page, or the page
// stops previewing the card. The source lives outside this repo, so the crop
// that goes into the image is written out again as a webp the page can serve.
// Written whether or not the card is held: the photograph is the evidence, not
// the artwork, and the page shows the claim regardless.
async function writePhoto(imageData, id, outDir) {
  const buf = Buffer.from(imageData.split(',')[1], 'base64');
  const out = path.join(outDir, `${id}-photo.webp`);
  await fs.writeFile(out, await sharp(buf).webp({ quality: 82 }).toBuffer());
  return `${id}-photo.webp`;
}

async function renderCard(card, imageData, fonts, outDir) {
  const tree = withImageSrc(cardTree(card, imageData), imageData);

  const svg = await satori(tree, { width: W, height: H, fonts });
  await fs.writeFile(path.join(outDir, `${card.id}.svg`), svg, 'utf8');

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await fs.writeFile(path.join(outDir, `${card.id}.png`), png);

  return {
    kb: Math.round(png.length / 1024),
    size: claimSize(plainClaim(card.claim), Boolean(imageData)),
    image: Boolean(imageData),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fonts = await loadFonts();

  const files = (await fs.readdir(SRC_DIR)).filter((f) => f.endsWith('.json'));
  let rendered = 0;
  let held = 0;

  for (const file of files) {
    const set = JSON.parse(await fs.readFile(path.join(SRC_DIR, file), 'utf8'));
    if (args.set && set.set !== args.set) continue;

    const outDir = path.join(OUT_ROOT, set.set);
    await fs.mkdir(outDir, { recursive: true });

    console.log(`\n${set.set}  ${set.title}${set.draft ? '  (draft)' : ''}`);

    const manifest = [];

    for (const card of set.cards) {
      if (args.only && !args.only.includes(card.id)) continue;

      // Before the hold check, so a held archive card still gets its
      // photograph onto the page even though its artwork is not cut.
      const imageData = card.image ? await readImage(card.image, card.imageCrop) : null;
      const photo = imageData ? await writePhoto(imageData, card.id, outDir) : null;

      manifest.push({
        id: card.id,
        kind: card.kind ?? 'CLAIM',
        status: card.status,
        hold: Boolean(card.hold),
        claim: plainClaim(card.claim),
        image: card.hold && !args.includeHeld ? null : `${card.id}.png`,
        photo,
      });

      if (card.hold && !args.includeHeld) {
        console.log(`  held  ${card.id}  ${card.title ?? ''} — the caveat must travel with it`);
        held += 1;
        continue;
      }

      const { kb, size, image } = await renderCard(card, imageData, fonts, outDir);
      console.log(
        `  ${card.id}  ${String(card.status).padEnd(10)} ${String(size).padStart(2)}px  ` +
          `${String(kb).padStart(4)}KB${image ? '  photo' : ''}`
      );
      rendered += 1;
    }

    await fs.writeFile(
      path.join(outDir, 'manifest.json'),
      `${JSON.stringify({ set: set.set, cards: manifest }, null, 2)}\n`,
      'utf8'
    );
  }

  console.log(`\n${rendered} rendered, ${held} held.`);
  if (held > 0 && !args.includeHeld) {
    console.log('Pass --include-held to cut the held ones anyway.');
  }
}

main().catch((err) => {
  console.error('Claim card build failed:', err);
  process.exit(1);
});
