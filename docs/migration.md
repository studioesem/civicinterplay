# Ghost → Astro migration

This site started life on Ghost Pro. The migration is a re-runnable script that turns the Ghost JSON export into Astro MDX content collection entries.

## Re-running the conversion

```bash
npm run ghost:convert
```

Or directly:

```bash
node scripts/ghost-to-mdx.mjs
```

What it does, in order:

1. Finds the most recent `civic-interplay.ghost.*.json` in the project root.
2. Wipes `src/content/posts/`.
3. For each `published` post, builds an MDX file: cleaned body, frontmatter, `<Callout>` blocks restored from Ghost callout cards.
4. Copies images from `civicinterplay-images/` to `public/images/` (idempotent. Only changed/new files).

## What gets migrated

- **Status filter:** `published` only. Drafts (13 of them at last run) stay in the JSON; flip them on individually by changing `status` in the export, or by adjusting the script's filter.
- **Categories:** Ghost tags are mapped to the four Civic Interplay categories. Tags prefixed with `hash-` (Ghost's import-tracking tags) are ignored.

| Ghost tag slug | Civic Interplay category |
| --- | --- |
| `intro-summaries` | `introduction` |
| `training-grounds` | `training-grounds` |
| `the-guides` | `the-guides` |
| `work-sheets` | `work-sheets` |
| `the-portals` | `the-portals` (no posts at last run) |

- **Slug-based overrides** live in `SLUG_CATEGORY_OVERRIDE` at the top of the script. Currently:
  - `the-active-interface` → `introduction` (untagged in Ghost; conceptually an intro post)
- **Excerpts:** prefer Ghost's `custom_excerpt`, fall back to a derived excerpt from `plaintext` (leading emoji like 💡 from callouts is stripped).
- **Feature images:** `__GHOST_URL__/content/images/.../filename.ext` → `/images/filename.ext`.
- **Frontmatter** includes `title`, `slug`, `excerpt`, `publishedAt`, `updatedAt`, `featureImage`, `categories[]`, `primaryCategory`, `featured`, `draft`. The schema is in `src/content/config.ts`.

## What gets stripped

Ghost's editor leaves a lot of cruft in the HTML. The script removes:

- `kg-signup-card`, `kg-cta-card`, `kg-product-card`, `kg-bookmark-card`, `kg-button-card`, Ghost widget cards that don't belong in a static site
- All `<svg>`, `<style>`, `<form>`, `<script>` tags (the signup widget injects CSS keyframes containing `{` and `}` that breaks MDX parsing)
- Ghost's `<div class="kg-callout-emoji">` (we don't render the emoji)
- Inline `style="white-space: pre-wrap"` and `style="color: …"` on every text run
- Redundant `<b><strong>...</strong></b>` wrappers that Ghost emits
- `class` attributes on inline tags (`kg-*` leftovers)
- Redundant `**bold**` inside heading lines

## Callout transformation

Ghost's `kg-callout-card` blocks are extracted before turndown runs (turndown would otherwise mangle them), each replaced by a sentinel token. After turndown converts the rest of the body to markdown, the sentinels are replaced with proper `<Callout>...</Callout>` blocks containing the inner content as markdown.

Ghost callouts come in colour variants (yellow / blue / green …). We drop the variant. Our `<Callout>` rotates through the palette automatically.

## Hand-editing posts

Hand-editing a generated MDX file is fine for a one-off fix (typo, broken link, image replacement). **A re-run of `ghost:convert` will overwrite it.** If a fix needs to survive a re-run, the right place is one of:

- The Ghost export itself (rare: the JSON is meant to be the past-tense source)
- The conversion script's cleaning rules (`cleanGhostNoise`, `extractCallouts`, the post-processing steps)
- The frontmatter generation block (e.g. for a per-slug override like the `SLUG_CATEGORY_OVERRIDE` table)

## Posts at last run

12 published posts (alphabetical by slug):

- `at-de-ceuvel` (Training Grounds)
- `can-we-shift-our-mindset` (The Guides + Introduction)
- `civic-interplay-toolkit` (Training Grounds + The Guides)
- `digital-ecological-footprint` (Work Sheets + Training Grounds)
- `learning-to-be-planetary-citizens` (Introduction)
- `mystical-language-loops-with-benjamin` (The Guides)
- `the-active-interface` (Introduction. By slug override)
- `the-many-afterlives-of-albert-einstein` (Training Grounds)
- `we-care-rmit` (Training Grounds)
- `what-can-you-do-here` (Introduction)
- `what-is-civic-interplay` (Introduction + The Guides). This one is also reachable via `/about/`
- `you-me-data-and-the-city` (Training Grounds)

## Source files in the project root (local only)

These are kept for re-running the migration but are not committed to git:

- `civic-interplay.ghost.2026-04-26-04-04-53.json`. The export (contains drafts and personal data)
- `civicinterplay-images/`. Raw image source folder (redundant with `public/images/`)

These two **are** committed as reference assets:

- `civicinterplay-preview.html`. The approved standalone design preview
- `download-ghost-images.sh`. Utility for fetching images from Ghost into `civicinterplay-images/`

## Deferred follow-ups

Not blocking, but worth a polish pass at some point:

- **Image alt text** is empty on most migrated images. Ghost didn't capture alt text in the export.
- **"Thanks for reading… Subscribe for free…"** trailing paragraph is auto-injected by Ghost on every post; could be stripped in `cleanGhostNoise`.
- **No featured-asymmetric grid** on home: the preview has a `post-grid-featured` layout (one big card, smaller siblings) that is in the CSS but not yet wired to a section.
- **No favicon** in `public/` yet.
