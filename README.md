# Civic Interplay

The website for **Civic Interplay**, a Think + Do Space for civic-tech, design, and cultural-policy practitioners exploring the planetary age.

Migrated from Ghost Pro to a static Astro site, deployed on Cloudflare Pages.

- **Live site:** https://civicinterplay.io
- **Tools subdomain:** https://sightings.civicinterplay.io (separate project)
- **Website Author:** Sarah Barns ([sarahbarns.com](https://sarahbarns.com), [Studio ESEM](https://studioesem.com))
- ****Tools** live at https://github.com/civic-interplay/

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
```

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
