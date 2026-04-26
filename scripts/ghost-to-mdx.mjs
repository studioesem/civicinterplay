// Convert the Ghost JSON export into Astro MDX content collection entries.
// Run with `npm run ghost:convert`.
//
// Reads:   civic-interplay.ghost.*.json (in project root)
// Writes:  src/content/posts/*.mdx
// Copies:  civicinterplay-images/* -> public/images/*
//
// See .impeccable.md and CLAUDE.md for design / migration context.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const POSTS_OUT = path.join(ROOT, 'src/content/posts');
const IMAGES_SRC = path.join(ROOT, 'civicinterplay-images');
const IMAGES_OUT = path.join(ROOT, 'public/images');

// --- Tag → category mapping --------------------------------------------------

const TAG_TO_CATEGORY = {
  'intro-summaries': 'introduction',
  'training-grounds': 'training-grounds',
  'the-guides': 'the-guides',
  'work-sheets': 'work-sheets',
  'the-portals': 'the-portals',
};

// Untagged or mis-tagged posts that need an explicit category, by slug.
const SLUG_CATEGORY_OVERRIDE = {
  'the-active-interface': 'introduction',
};

// --- Helpers -----------------------------------------------------------------

async function findGhostJson() {
  const files = await fs.readdir(ROOT);
  const ghost = files.find((f) => f.startsWith('civic-interplay.ghost.') && f.endsWith('.json'));
  if (!ghost) {
    throw new Error('No civic-interplay.ghost.*.json export found in project root.');
  }
  return path.join(ROOT, ghost);
}

function basenameFromUrl(url) {
  if (!url) return null;
  // Ghost stores URLs like "__GHOST_URL__/content/images/2025/08/Foo.jpg"
  // and sometimes "https://civicinterplay.io/content/images/2025/08/Foo.jpg".
  const m = url.match(/\/content\/images\/[^"]*?\/([^/?#"]+)$/);
  if (m) return m[1];
  // Fallback: last path segment.
  const parts = url.split('/');
  return parts[parts.length - 1] || null;
}

function rewriteImageUrl(url) {
  const base = basenameFromUrl(url);
  if (!base) return url;
  return `/images/${base}`;
}

function rewriteHtmlImageUrls(html) {
  return html
    .replace(/__GHOST_URL__\/content\/images\/[^"'\s)]+/g, (m) => rewriteImageUrl(m))
    .replace(/https?:\/\/[^"'\s)]*\/content\/images\/[^"'\s)]+/g, (m) => rewriteImageUrl(m))
    .replace(/srcset="[^"]*"/g, ''); // drop srcset, original-only is fine post-migration
}

// Strip a top-level <div class="..."> block (depth-aware) when the open tag
// matches a needle. Used to remove Ghost CTA / signup widgets cleanly.
function stripDivByClass(html, needle) {
  let out = '';
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf('<div', i);
    if (start === -1) {
      out += html.slice(i);
      break;
    }
    const tagEnd = html.indexOf('>', start);
    if (tagEnd === -1) {
      out += html.slice(i);
      break;
    }
    const openTag = html.slice(start, tagEnd + 1);
    if (!openTag.includes(needle)) {
      out += html.slice(i, tagEnd + 1);
      i = tagEnd + 1;
      continue;
    }
    // Walk forward tracking <div> depth until we hit the matching </div>.
    let depth = 1;
    let j = tagEnd + 1;
    while (j < html.length && depth > 0) {
      const nextOpen = html.indexOf('<div', j);
      const nextClose = html.indexOf('</div>', j);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + 4;
      } else {
        depth--;
        j = nextClose + 6;
      }
    }
    out += html.slice(i, start);
    i = j;
  }
  return out;
}

// Strip Ghost-specific noise that turndown would otherwise carry into the markdown.
function cleanGhostNoise(html) {
  let out = html;

  // Strip widget cards that don't make sense in a static migrated site.
  for (const cls of [
    'kg-signup-card',
    'kg-cta-card',
    'kg-product-card',
    'kg-bookmark-card',
    'kg-button-card',
  ]) {
    out = stripDivByClass(out, cls);
  }

  return out
    // Drop raw <svg>, <style>, <form>, <script> blocks (they break MDX with stray { }).
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<form\b[\s\S]*?<\/form>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    // Remove the Ghost emoji from callouts (we don't render them).
    .replace(/<div class="kg-callout-emoji">[\s\S]*?<\/div>/g, '')
    // Strip inline white-space:pre-wrap styles that wrap nearly every text run.
    .replace(/style="white-space:\s*pre-wrap;?"/g, '')
    // Strip color: inline styles (Ghost's per-paragraph colour styles).
    .replace(/style="color:[^"]*?"/g, '')
    // Collapse empty <b><strong></strong></b> wrappers introduced by Ghost.
    .replace(/<b>(\s*<strong[^>]*>)/g, '$1')
    .replace(/(<\/strong>\s*)<\/b>/g, '$1')
    // Drop class attributes on inline tags — they're all kg-* leftovers.
    .replace(/<(strong|em|span|p|figure|img|h\d)([^>]*?)\sclass="[^"]*"([^>]*)>/g, '<$1$2$3>');
}

// Replace each Ghost callout card with a placeholder we can re-emit as <Callout>.
// Placeholder uses only letters + digits so turndown's markdown escaper leaves it alone.
const CALLOUT_TOKEN = (i) => `XXCALLOUTPLACEHOLDER${i}XX`;

function extractCallouts(html) {
  const callouts = [];
  const placeholderHtml = html.replace(
    /<div class="kg-card kg-callout-card[^"]*">([\s\S]*?)<\/div>\s*(?=<div class="kg-card|<p|<h\d|<figure|<blockquote|<hr|$)/g,
    (_match, inner) => {
      const idx = callouts.length;
      callouts.push(inner);
      return `<p>${CALLOUT_TOKEN(idx)}</p>`;
    }
  );
  return { html: placeholderHtml, callouts };
}

function buildTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    bulletListMarker: '-',
  });

  // Preserve <figure><img></figure> as a clean Markdown image with caption.
  td.addRule('figureImage', {
    filter: (node) => node.nodeName === 'FIGURE',
    replacement: (_content, node) => {
      const img = node.querySelector('img');
      if (!img) return '';
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const captionEl = node.querySelector('figcaption');
      const caption = captionEl ? captionEl.textContent.trim() : '';
      const md = `![${alt}](${src})`;
      return caption ? `${md}\n\n*${caption}*\n` : `${md}\n`;
    },
  });

  return td;
}

function escapeFrontmatter(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/"/g, '\\"');
}

function deriveExcerpt(plaintext) {
  if (!plaintext) return '';
  // Strip leading emoji / symbol characters that Ghost callouts inject
  // (the 💡 lightbulb is the most common one).
  const cleaned = plaintext
    .replace(/^[\p{Emoji}\p{Symbol}\s]+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 200) return cleaned;
  const cut = cleaned.slice(0, 200);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '…';
}

// --- Image copy --------------------------------------------------------------

async function copyImages() {
  let copied = 0;
  let skipped = 0;
  await fs.mkdir(IMAGES_OUT, { recursive: true });

  if (!fsSync.existsSync(IMAGES_SRC)) {
    console.warn(`! Images source dir not found: ${IMAGES_SRC}`);
    return { copied, skipped };
  }

  const files = await fs.readdir(IMAGES_SRC);
  for (const file of files) {
    if (file.startsWith('.')) continue;
    const src = path.join(IMAGES_SRC, file);
    const dst = path.join(IMAGES_OUT, file);
    const srcStat = await fs.stat(src);
    if (!srcStat.isFile()) continue;
    try {
      const dstStat = await fs.stat(dst);
      if (dstStat.size === srcStat.size && dstStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }
    } catch {
      /* not present, copy below */
    }
    await fs.copyFile(src, dst);
    copied++;
  }
  return { copied, skipped };
}

// --- Main --------------------------------------------------------------------

async function main() {
  const ghostPath = await findGhostJson();
  console.log(`Reading ${path.basename(ghostPath)}`);
  const raw = JSON.parse(await fs.readFile(ghostPath, 'utf8'));
  const db = raw.db[0].data;

  const tagById = new Map(db.tags.map((t) => [t.id, t]));
  const postTags = new Map();
  for (const pt of db.posts_tags) {
    if (!postTags.has(pt.post_id)) postTags.set(pt.post_id, []);
    postTags.get(pt.post_id).push({ tag: tagById.get(pt.tag_id), sort: pt.sort_order ?? 0 });
  }

  const td = buildTurndown();

  await fs.rm(POSTS_OUT, { recursive: true, force: true });
  await fs.mkdir(POSTS_OUT, { recursive: true });

  const published = db.posts.filter((p) => p.status === 'published');
  console.log(`Converting ${published.length} published posts.`);

  const written = [];

  for (const post of published) {
    const slug = post.slug;

    const tagEntries = (postTags.get(post.id) || [])
      .sort((a, b) => a.sort - b.sort)
      .map((e) => e.tag)
      .filter((t) => t && !t.slug.startsWith('hash-'));

    const categoryOrder = [];
    for (const t of tagEntries) {
      const cat = TAG_TO_CATEGORY[t.slug];
      if (cat && !categoryOrder.includes(cat)) categoryOrder.push(cat);
    }

    const override = SLUG_CATEGORY_OVERRIDE[slug];
    if (override && !categoryOrder.includes(override)) {
      categoryOrder.unshift(override);
    }

    const primaryCategory = categoryOrder[0] || override || null;

    // Body: clean → extract callouts → rewrite images → turndown → restore callouts.
    let html = post.html || '';
    html = rewriteHtmlImageUrls(html);
    html = cleanGhostNoise(html);
    const { html: withPlaceholders, callouts } = extractCallouts(html);

    let body = td.turndown(withPlaceholders);

    // Replace each placeholder with a <Callout> block whose inner content is
    // the original callout's HTML run through turndown again.
    for (let i = 0; i < callouts.length; i++) {
      const innerMd = td.turndown(callouts[i]).trim();
      const block = `<Callout>\n\n${innerMd}\n\n</Callout>`;
      body = body.split(CALLOUT_TOKEN(i)).join(block);
    }

    // Strip redundant bold inside ATX headings (Ghost wraps headings in <strong>).
    body = body.replace(/^(#{1,6})\s*\*\*(.+?)\*\*\s*$/gm, '$1 $2');

    // Tidy: collapse triple-or-more blank lines, trim.
    body = body.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    const featureImage = post.feature_image ? rewriteImageUrl(post.feature_image) : undefined;
    const excerpt = (post.custom_excerpt || deriveExcerpt(post.plaintext || '')).trim();

    const fm = [
      '---',
      `title: "${escapeFrontmatter(post.title)}"`,
      `slug: "${slug}"`,
      excerpt ? `excerpt: "${escapeFrontmatter(excerpt)}"` : null,
      `publishedAt: ${post.published_at}`,
      post.updated_at ? `updatedAt: ${post.updated_at}` : null,
      featureImage ? `featureImage: "${featureImage}"` : null,
      `categories: [${categoryOrder.map((c) => `"${c}"`).join(', ')}]`,
      primaryCategory ? `primaryCategory: "${primaryCategory}"` : null,
      `featured: ${Boolean(post.featured)}`,
      'draft: false',
      '---',
    ]
      .filter(Boolean)
      .join('\n');

    const usesCallout = body.includes('<Callout>');
    const imports = usesCallout ? `\nimport Callout from '../../components/Callout.astro';\n` : '';

    const mdx = `${fm}\n${imports}\n${body}`;
    const outPath = path.join(POSTS_OUT, `${slug}.mdx`);
    await fs.writeFile(outPath, mdx, 'utf8');
    written.push({ slug, primaryCategory, calloutCount: callouts.length });
    console.log(`  ✓ ${slug.padEnd(50)} [${primaryCategory ?? 'uncategorised'}]`);
  }

  console.log(`\nCopying images...`);
  const { copied, skipped } = await copyImages();
  console.log(`  ${copied} copied, ${skipped} skipped (already up to date).`);

  console.log(`\nDone. ${written.length} posts written to src/content/posts/.`);
}

main().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
