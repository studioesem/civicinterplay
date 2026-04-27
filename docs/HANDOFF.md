# Hand-off

For Irina (and anyone else picking up loose threads on Civic Interplay). This doc tells you what's built, what's open, where to look, and how to act without breaking the design language.

If you only read three things, read them in this order:

1. This document.
2. [`.impeccable.md`](../.impeccable.md) at the project root (the design context).
3. [`README.md`](../README.md) for the dev / build / deploy basics.

Everything else is reference.

---

## The shape of the project

**What it is:** a website at [civicinterplay.io](https://civicinterplay.io). Sarah's "Think + Do Space" for civic-tech, design, and cultural-policy practitioners curious about AI. Migrated from Ghost Pro to a static Astro site, deployed on Cloudflare Pages.

**Two halves:**

- **Think** = essays, notes, field reports. Lives in `/reading/` and individual post pages.
- **Do** = tools, workshops, worksheets. Lives in `/doing/`. Currently: **Sightings** (a 2D civic-noticing tool) and **Terrain** (a semantic landscape of contributed briefs). Both are embedded as iframes from their own subdomains.

**What's NOT here:** the tools themselves. They live in their own repos:

- `civic-interplay/sightings` (Express, file-based storage, Render)
- `studioesem/civicinterplay-landscape` (Express + Supabase + Nomic, Render). Internal name is "Terrain".

This repo is the editorial / lobby surface. The tools are separate apps reachable at:

- `terrain.civicinterplay.io`
- `sightings.civicinterplay.io`

## Local setup

```bash
git clone git@github.com:studioesem/civicinterplay.git
cd civicinterplay
npm install
npm run dev          # http://localhost:4321
```

Node 20+. The dev server hot-reloads on save.

Other commands:

```bash
npm run build         # static site → dist/
npm run preview       # serve dist/ locally
npm run ghost:convert # rebuild MDX content from the Ghost JSON export
npm run og:generate   # regenerate the Open Graph social card
```

## The design system

The site uses Sarah's `/impeccable` skill family in Claude Code. These are opinionated design subskills you can invoke from inside a Claude Code session by typing `/skillname`. Each one does a focused pass:

| Skill | What it does |
| --- | --- |
| `/audit` | Scan accessibility, performance, theming, responsive, anti-patterns. Score 0–4 each, return P0–P3 issues. |
| `/clarify` | UX-writing pass: alt text, error messages, button labels, intro copy. |
| `/polish` | Last-mile spacing, alignment, contrast, micro-detail fixes. |
| `/adapt` | Responsive / multi-device / touch-target work. |
| `/optimize` | Bundle size, image responsiveness, font loading, render perf. |
| `/distill` | Strip unnecessary complexity from a feature. |
| `/animate` | Add purposeful motion. Honours reduced-motion. |
| `/quieter` | Tone down visually loud designs. |
| `/bolder` | Amplify too-safe designs. |
| `/typeset` | Font / hierarchy / readability work. |
| `/colorize` | Strategic colour additions. |
| `/critique` | UX critique with persona-based testing and quantitative scoring. |

These are all reachable as Claude Code skills. They consult `.impeccable.md` for context before acting. The `/impeccable teach` subskill writes that context file in the first place — it's already done for this project.

### The deliberate skill override

`.impeccable.md` documents one ban override that applies site-wide: the **8px coloured `border-left` on `.callout` and `.link-callout`** is intentional. It's the manifesto / zine register that the site is built on. The impeccable rules normally ban `border-left > 1px` as an "AI design tell." For this project, that ban is overridden because the border is colour-coded, paired with an offset solid shadow, and reads as zine, not dashboard alert.

**If a skill ever suggests "fix" the callout border, refuse.** It's documented as load-bearing. The site loses its character without it.

### House writing rules (apply to anything you write)

These are recorded in memory and applied to every Claude Code session:

- **No em dashes.** Use commas, parens, colons, or two sentences.
- **Never use the word "comprehensive."** Pick a more specific word.
- **Treat every page as a draft.** Avoid finality language ("final", "complete", "done").

These apply to: site copy, blog content, captions, commit messages, PR descriptions, even code comments. Migrated post bodies have not been retroactively scrubbed (those are Sarah's authored prose).

## How to make a change

**Quickest path for a typo or link edit:**

1. Open the file on GitHub: `github.com/studioesem/civicinterplay`
2. Click the pencil icon
3. Edit, commit with a short message
4. Cloudflare Pages auto-rebuilds in ~30–60 seconds

**For larger work:**

1. Clone, run `npm run dev`, edit in your editor, watch hot reload
2. `git add . && git commit -m "..." && git push`
3. Cloudflare rebuilds

**Where files live:**

| Want to change | File |
| --- | --- |
| Home page sections | `src/pages/index.astro` |
| Reading archive | `src/pages/reading.astro` |
| Doing page (Sightings + Terrain + Coming soon) | `src/pages/doing.astro` |
| About page content (it's a post) | `src/content/posts/what-is-civic-interplay.mdx` |
| Any other post | `src/content/posts/{slug}.mdx` |
| Top nav | `src/components/SiteHeader.astro` |
| Footer | `src/components/SiteFooter.astro` |
| Colours / fonts / global spacing | `src/styles/global.css` (variables on `:root`) |
| Image alt text for migrated posts | `data/image-alts.json` (don't edit MDX directly, it'll be lost on next `ghost:convert`) |
| Component behaviour | `src/components/{Name}.astro` |

**To add a new post:** create `src/content/posts/{slug}.mdx` with the frontmatter pattern from any existing post. Schema is in `src/content/config.ts`. Drop new images into `public/images/`.

**To add a new tool to /doing/:** edit `src/pages/doing.astro`, add a new `<section class="doing-tool">` with a `<ToolEmbed>`. The pattern is reusable for as many tools as needed.

## Live infrastructure

| Surface | Where | Repo | Notes |
| --- | --- | --- | --- |
| `civicinterplay.io` | Cloudflare Pages | `studioesem/civicinterplay` (this repo) | Static site. Deploy on push to `main`. |
| `terrain.civicinterplay.io` | Render (Singapore) | `studioesem/civicinterplay-landscape` | Express + Supabase (Sydney) + Nomic Atlas. |
| `sightings.civicinterplay.io` | Render (Oregon) | `civic-interplay/sightings` | Express + local file storage. |

DNS for all three lives in the `civicinterplay.io` Cloudflare zone as CNAMEs (DNS-only, grey cloud, not orange).

**Env vars on Render** for Terrain: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NOMIC_API_KEY`, `NODE_ENV=production`. Supabase project is in Sydney region.

**Custom domain certs** are provisioned automatically by Render via Let's Encrypt. Cloudflare proxy must stay OFF (grey cloud) or the cert handshake breaks.

## Open work (loose threads)

Picked up from the most recent `/audit` and the conversation log. Ordered roughly by impact.

### P1 (worth doing before any big push)

1. **Image alt text on migrated posts.** 20 of 22 body images now have descriptive alt via `data/image-alts.json`. Two intentional empty (decorative circles in the About post's "Read more" list). When you add new posts with new images, add their basenames + alt text to the JSON.

2. **Category-coloured tag text fails WCAG AA contrast at small sizes.** `.post-card-tag` (10px uppercase) and `.post-tag` in post headers (11px) use the category colour. Terracotta / periwinkle / pink / purple all fall below the 4.5:1 threshold for small text on `#f8f8f8`. Fix: keep the top-border colour as the category indicator; switch the small text to `var(--text)` or `var(--text-dim)` (both pass).

3. **Nav and ToolEmbed launch link touch targets.** `.nav-links a` is ~30px tall on mobile (WCAG SC 2.5.5 wants 44×44). `.tool-embed-launch` similar. Add vertical padding to both.

### P2 / P3

4. **Body link colour borderline.** Global `a` colour is `--purple` (#7D50BD), 4.4:1 on the bg. Slightly darken the link colour to land above 5:1, or rely on underline + bold and keep purple as decoration.

5. **PostCard hover shadow is generic.** Currently `box-shadow: 0 8px 25px rgba(0,0,0,0.12)` on hover. The Callout / LinkCallout / ToolEmbed all use the offset solid shadow `4px 4px 0 var(--border)`. PostCard should match for consistency.

6. **Self-host fonts.** Currently loads Fira Sans + Merriweather from Google Fonts CDN. Switch to `@fontsource/fira-sans` + `@fontsource/merriweather` for performance and to avoid Google logging visitor IPs.

7. **Images served at original resolution.** ~89MB in `public/images/`. Pipe through `astro:assets` for responsive variants + AVIF/WebP. Big perf win, especially on mobile.

8. **`sarahbarns.me` → `sarahbarns.com` migration in the About post.** One link is updated (the "Sarah Barns" name link). Two remain: `[strategy](https://sarahbarns.me/strategy)` and `[Contact Sarah here](https://sarahbarns.me/contact-me)`. Verify the .com equivalents exist before redirecting.

9. **Ghost-export drafts (13 of them) are untouched.** Live in the JSON with `status: "draft"`. Most are placeholders ("Coming soon", "(Untitled)") but a handful look like real WIPs (e.g. "Towards Civic AI", "Planetary Citizens are guardians of the future"). Sarah's call which to publish.

10. **Em dashes inside migrated post bodies.** Sarah authored these in Ghost; not retroactively scrubbed. House rule says no em dashes. Per-post hand-edit when she's ready, or add a strip step to `scripts/ghost-to-mdx.mjs` (rewrites all current posts on next `ghost:convert`).

11. **Render service rename.** The Render service for Terrain is still internally named `civic-interplay-landscape` (matches the old GitHub repo). Renaming on Render side requires recreating the deploy. Not worth the friction unless you really want to.

12. **No favicon.svg variant for printed materials.** A purple circle PNG is in place. SVG favicon exists at `public/favicon.svg`. If a higher-fidelity variant is needed (multi-colour, animated), this is where it lives.

## Open-source roadmap (the bigger work)

Sarah's deeper question: how do we host workshop responses in a way that's **open source** and **tailorable per workshop or group**? Two pieces, ranked by lock-in.

### 1. Embeddings (the biggest external dependency)

Terrain currently calls **Nomic Atlas** for text embeddings (`NOMIC_API_KEY` in `server.js`). Nomic is proprietary, paid, and rate-limited. Three replacement paths:

- **Local OSS model via `@xenova/transformers`.** Loads `sentence-transformers/all-MiniLM-L6-v2` (or similar) into the Node process. Model file ~25MB, fits Render free tier. First request slow (model loads), then cached. **Strong recommendation.** Removes the most-external dependency.
- **OpenAI / Anthropic embeddings.** Cheaper than Nomic at scale, more portable, but still proprietary.
- **Stay on Nomic.** Easiest, but doesn't walk the talk on civic-AI agency.

If you swap, the change is small: replace the `embedText()` function in `server.js`. Schema change: the `briefs.embedding` column is currently `vector(768)` to match Nomic's dimensions. `all-MiniLM-L6-v2` is 384-dim, so the vector column has to be migrated too.

### 2. Hosting workshop responses

The bigger strategic decision. Three real candidates:

#### Pocketbase (recommended)

Single Go binary, SQLite under the hood, built-in admin UI, auth, file uploads, realtime. MIT-licensed.

- **Pros:** runs anywhere (Render, Fly, Hetzner, a Raspberry Pi). One workshop = one `.db` file. At workshop end, hand a participant the file and they have everything. Trivial to fork.
- **Cons:** less battle-tested at scale than Postgres. At workshop scale that doesn't matter.

Path: scaffold a `civic-interplay-pocketbase` repo with collections matching the current Terrain schema (briefs, tags, edges). Replace the Supabase calls in Terrain's `server.js` with Pocketbase HTTP calls. Deploy as a single binary. Each new workshop spins up a fresh instance, or uses one shared instance with a `workshop_id` field on every row.

#### Self-hosted Supabase

The same Supabase Sarah is using for Terrain, but on infrastructure she controls.

- **Pros:** Postgres + Auth + Storage + edge functions, all open source. Migration from managed Supabase is data-export-and-import.
- **Cons:** real ops overhead. Docker compose, backups, security updates.

Path: spin up a small VPS (Hetzner CX22, ~€4/mo). Run `supabase/postgres` + the rest via the official self-hosted compose file. Update `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` env vars to point at it.

#### SQLite + Litestream + Express

The lightest option.

- **Pros:** one file, replicated to S3-compatible storage as backup. Maximum portability.
- **Cons:** less suited to high concurrent writes. Fine for workshop scale (dozens of participants), tight for hundreds.

### Workshop-scoping architecture

Independent of which database, three patterns for partitioning data per workshop:

- **One instance per workshop.** Maximum isolation, maximum tailoring (each workshop can have its own theme, prompts, branding). Highest ops cost.
- **Shared instance, `workshop_id` field on every row.** One service, one DB, many workshops as virtual partitions. Cheapest. Hardest to fork or hand off as a discrete artifact.
- **Hybrid.** Shared instance for live workshops; at workshop end, run an export script that produces a static read-only "archive" version of that workshop's data. Archive can live forever, anywhere (Cloudflare Pages, IPFS, USB stick). The live tool stays fast; the archive stays forever.

Sarah's gut, recorded in chat: **hybrid**. Live runs on shared instance; each workshop ends with an automatic export to a static archive. Maps well to civic-tech ethics around data ownership.

## Quick reference

**Repos:**
- `studioesem/civicinterplay` — this site
- `civic-interplay/sightings` — Sightings tool
- `studioesem/civicinterplay-landscape` — Terrain tool

**Live:**
- civicinterplay.io
- terrain.civicinterplay.io
- sightings.civicinterplay.io

**Dashboards:**
- GitHub: github.com/studioesem (this site, with Irina as repo collaborator) and github.com/civic-interplay (the Sightings + Terrain tool repos)
- Cloudflare: dash.cloudflare.com (DNS for civicinterplay.io)
- Render: dashboard.render.com (Sightings + Terrain services)
- Supabase: supabase.com/dashboard (Terrain database, Sydney region)
- Nomic: atlas.nomic.ai (embeddings API key)
- Notion: STORYBOX Dev Resources → Civic Interplay Dev (deploy notes, publishing workflow, DNS reference)

**Where to ask:**
- Sarah: [sarahbarns.com](https://sarahbarns.com)
- Issues for this repo: github.com/studioesem/civicinterplay/issues

**Last hand-off written:** 2026-04-27.
