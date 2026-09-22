# Civic Interplay Website

The website for **Civic Interplay**, a Think + Do Space for civic-tech, design, and cultural-policy practitioners exploring the planetary age.

Migrated from Ghost Pro to a static Astro site, deployed on Cloudflare Pages.

- **Live site:** https://civicinterplay.io
- **Tools subdomain:** https://sightings.civicinterplay.io (separate project) https://terrain.civicinterplay.io
- **Website Author:** Sarah Barns ([sarahbarns.com](https://sarahbarns.com), [Studio ESEM](https://studioesem.com))
- ****Tools** live at https://github.com/civic-interplay/ co-created with Irina Panovich, Civic Interplay co-founder 

## Publishing

Posts are written and published through [Pages CMS](https://app.pagescms.org), no coding needed. Co-publishers: see [PUBLISHING.md](./PUBLISHING.md).

## Stack

- [Astro 5](https://astro.build) static site, MDX content collections
- Vanilla CSS (no Tailwind), hand-tuned to match the approved design preview
- Cloudflare Pages for deploy

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # → dist/
npm run preview      # serves the built dist/ locally
npm run ghost:convert # re-runs the Ghost JSON → MDX conversion
npm run tiles:build   # rebuilds the home-page Field Note tiles
npm run cards:build   # cuts the claim cards to PNG
```

### Field Note tiles

`npm run tiles:build` crops the large Instagram exports to the 4:5 Field Notes
grid and writes responsive webp into `public/images/tiles/`. Sources live in the
**sibling project folders** (`../data centres/`, `../ai-sovereignties/`), not in
this repo, because they are 0.4–1.4MB each. Set `TILE_SRC` if that tree moves.

The script also *generates* the `method` tile, which has no Instagram source. It
is an inverted field note (black ground, cream ink) so the one tile that is a
door rather than a document reads as deliberately different.

Tile copy lives in `src/data/tiles.ts` as real text, never baked into the image,
so a call to action can be edited without re-exporting a PNG.

### Claim cards

One headline claim from a night of tracking: a label chip, the claim with one
phrase highlighted, two attribution lines. `src/content/claimcards/{night}.json`
is the only copy of the text, and it feeds two renderers:

- the running page at `/claims/`, every night newest first, each card anchored at
  `#{night}-{id}` with its own permalink and download
- `npm run cards:build`, which cuts 1080x1350 PNGs into `public/images/cards/{night}/`

Both parse the `[[highlight]]` markers through `scripts/lib/claim-text.mjs` and
both read the same `ground` and `highlight` fields, so a claim cannot say or look
one way on the site and another on the card. Editable in Pages CMS under
**Claim cards**; see [PUBLISHING.md](./PUBLISHING.md).

`ground` flips a card between cream and inverted and `highlight` sets the colour
behind the knockout, because a run of seventeen identical cards reads as
wallpaper. The magenta rule under the asterisk does not vary, which is what holds
the series together while everything else moves. On the page the two grounds are
`.accent-fieldnote` and `.accent-fieldnote-ink`, declared in the Card accents
block in `global.css` alongside the six brand tints; nothing sets a card colour
outside that block.

The export goes through satori rather than hand-placed SVG, because claims vary
too much in length to position by hand and a highlight has to survive being
wrapped mid-phrase. Every card carries a status, and a card marked **hold** does
not render and gets no download until its caveat has a way to travel with it.

Node 20+ recommended.

## Project structure

```
.
├── astro.config.mjs              # Astro config (incl. /about → /what-is-civic-interplay redirect)
├── public/                       # Static assets
│   └── images/                   # Post images, copied from civicinterplay-images/ at conversion time
├── scripts/
│   └── ghost-to-mdx.mjs          # Ghost export → MDX converter (re-runnable)
├── src/
│   ├── components/               # Astro components. See docs/components.md
│   ├── content/
│   │   ├── config.ts             # Content collection schema + category map
│   │   └── posts/                # Generated MDX posts (don't hand-edit unless intentional)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/                    # Routes
│   │   ├── index.astro           # Home (curated lobby)
│   │   ├── reading.astro         # Flat archive of all posts
│   │   ├── doing.astro           # Tools + future workshops (with Sightings embed)
│   │   └── [slug].astro          # Per-post page
│   └── styles/
│       └── global.css            # Tokens, base styles, layout chrome
├── civicinterplay-preview.html   # Approved design source of truth. Do not edit
├── CLAUDE.md                     # Brief for Claude Code sessions
├── .impeccable.md                # Design Context for the /impeccable skill
└── docs/                         # Component + migration docs
```

## Design source of truth

Two files lock the look and feel:

- **`civicinterplay-preview.html`**. The approved standalone HTML preview. Reference for typography, palette, callouts, card patterns. The migration is a port of this; net-new components must extend its language, not invent a new one.
- **`.impeccable.md`**, Design Context for the `/impeccable` Claude skill. Documents users, brand personality, aesthetic direction, design principles, and one deliberate **skill override**: the 8px coloured `border-left` on `.callout` is intentional (zine / manifesto register), not a dashboard alert. Future polish passes must not "fix" it.

## Content workflow

Posts live as MDX in `src/content/posts/`. They are produced by the Ghost-to-MDX conversion script. See [`docs/migration.md`](docs/migration.md) for the full process.

To re-run the migration after adding a new Ghost export:

```bash
npm run ghost:convert
```

This wipes `src/content/posts/`, regenerates from the JSON, and copies images from `civicinterplay-images/` to `public/images/`. Hand-editing an MDX file is fine for one-off fixes, but a re-run will overwrite it.

## Deploy

Deployed via Cloudflare Pages, Git-connected to this repo on the default branch.

- **Build command:** `npm run build`
- **Build output:** `dist`
- **Node version:** 20 (set in Pages dashboard env)

The Sightings tool at `sightings.civicinterplay.io` is a **separate** Cloudflare Pages project. Pushes here don't affect it. The `/doing/` page embeds it via iframe; if framing is blocked by `X-Frame-Options` or CSP `frame-ancestors`, the Sightings project headers need updating.

## House rules

A few things that show up across the site (and should keep showing up):

- No em dashes. Use commas, parens, or two sentences.
- Don't use the word "comprehensive". Pick a more specific word.
- Treat every page as a draft. Avoid finality language ("final", "complete", "done").
- `<Callout>`'s coloured left border is a deliberate design choice. See `.impeccable.md`.

## Further reading

- [`docs/components.md`](docs/components.md). Every component's props + usage examples
- [`docs/migration.md`](docs/migration.md), Ghost export → Astro conversion and the decisions baked in
- [`.impeccable.md`](.impeccable.md), Design Context for `/impeccable`
- [`CLAUDE.md`](CLAUDE.md). Short brief for Claude Code sessions
