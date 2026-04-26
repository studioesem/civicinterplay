# Components

Every reusable piece of UI lives in `src/components/`. They all use the design tokens from `src/styles/global.css` (CSS custom properties on `:root`).

## Where to import them from

- From an **Astro page** in `src/pages/`: `'../components/Foo.astro'`
- From an **MDX post** in `src/content/posts/`: `'../../components/Foo.astro'`

## Quick reference

| Component | Use for |
| --- | --- |
| `<Callout>` | Pull-quote / manifesto block inside post bodies |
| `<LinkCallout>` | Pointer to another page on the site |
| `<VideoEmbed>` | A video file from R2 (or any direct URL) |
| `<ToolEmbed>` | A site / tool embedded as an iframe |
| `<Glitch>` | Chromatic-aberration hover on a word or phrase |
| `<PostCard>` | A card linking to a post (used on home + future indexes) |
| `<SectionHeading>` | Bordered section title block on home and similar |
| `<Hero>` | Page hero with image, glitch-able heading, tagline |

---

## `<Callout>`

A zine-style block with a coloured left border, an offset solid shadow, and a scroll-reveal fade-in. The border colour rotates through the palette so a stack of callouts reads like a printed manifesto.

**This is the deliberate skill-override component**. See `.impeccable.md`. Don't "fix" the 8px left border in future passes.

```mdx
import Callout from '../../components/Callout.astro';

<Callout>

**This is a callout.** It can contain any markdown,
including _emphasis_, [links](/reading/), and multiple paragraphs.

</Callout>
```

The blank lines around the inner content matter. Without them MDX treats the children as plain text.

---

## `<LinkCallout>`

A callout-style block that links to another page on the site (or anywhere). Two ways to use it.

**Slug mode**. Auto-populates from the content collection:

```mdx
import LinkCallout from '../../components/LinkCallout.astro';

<LinkCallout slug="at-de-ceuvel" eyebrow="Read next" />
```

The component fetches the post's title, excerpt, and category, and colour-codes the left border to match the destination's category.

**Explicit mode**. For non-post links (other site sections, external):

```mdx
<LinkCallout
  href="/doing/"
  eyebrow="Take with you"
  title="Sightings & other tools"
  excerpt="The Do half of Civic Interplay."
  category="introduction"
/>
```

Props:

| Prop | Type | Notes |
| --- | --- | --- |
| `slug` | string | Optional. If set, looks up the post in the `posts` collection. |
| `href` | string | Optional. Overrides the slug-derived URL. External URLs auto-open in a new tab. |
| `title` | string | Optional. Overrides the slug-derived title. |
| `eyebrow` | string | Defaults to `"Read next"`. |
| `excerpt` | string | Optional. Overrides the slug-derived excerpt. Truncated to 2 lines. |
| `category` | category slug | Optional. Sets the left-border colour. Auto-set in slug mode. |

---

## `<VideoEmbed>`

For videos hosted on Cloudflare R2 or any direct file URL. Native `<video>` element, lazy preload, optional poster, captions, multiple sources.

```mdx
import VideoEmbed from '../../components/VideoEmbed.astro';

<VideoEmbed
  src="https://media.civicinterplay.io/clip.mp4"
  poster="/images/clip-poster.jpg"
  caption="Test field, August 2025"
/>
```

For an ambient / muted background loop (e.g. on a landing section):

```mdx
<VideoEmbed
  src="https://media.civicinterplay.io/loop.mp4"
  webm="https://media.civicinterplay.io/loop.webm"
  loop
  autoplay
  hideControls
  aspectRatio="21/9"
/>
```

Props:

| Prop | Type | Default |
| --- | --- | --- |
| `src` | string (required) | MP4/H.264 is broadest |
| `webm` | string | Optional alt source, served first if browser prefers |
| `poster` | string | Image shown before playback |
| `caption` | string | Rendered as a `<figcaption>` |
| `aspectRatio` | string | `"16/9"`. Use `"auto"` for native ratio. |
| `loop` | boolean | `false` |
| `autoplay` | boolean | `false`. Auto-pairs with `muted`. Honours `prefers-reduced-motion`. |
| `muted` | boolean | tracks `autoplay` |
| `hideControls` | boolean | `false`. Useful for ambient loops. |
| `title` | string | Accessible title |

---

## `<ToolEmbed>`

For embedding a tool or site (e.g. `sightings.civicinterplay.io`) inside a page. Wraps an iframe with a styled header, a "open in new tab" launch link, and the same border + offset shadow as `<Callout>`.

Used on `/doing/`. Reuse for any future tool surface.

```astro
---
import ToolEmbed from '../components/ToolEmbed.astro';
---
<ToolEmbed
  title="Sightings"
  src="https://sightings.civicinterplay.io/"
  openLabel="Open Sightings in a new tab"
  height="780px"
/>
```

| Prop | Type | Default |
| --- | --- | --- |
| `title` | string (required) | Header label |
| `src` | string (required) | iframe URL |
| `height` | CSS size | `"720px"` |
| `openLabel` | string | `"Open in a new tab"` |

The embedded site needs to allow being framed by `civicinterplay.io` (CSP `frame-ancestors` or `X-Frame-Options`). If it doesn't, the iframe area renders blank and the launch link still works.

---

## `<Glitch>`

A chromatic-aberration hover effect for a word or short phrase. Mostly used on the hero heading, but can be sprinkled inline.

```astro
<Glitch>Interplay</Glitch>
```

Honours `prefers-reduced-motion`.

---

## `<PostCard>`

A card linking to a post. Used by the home page section grids. Has category-coded top border and tag colour.

```astro
<PostCard
  href="/at-de-ceuvel/"
  title="They gathered inside a makeshift structure at De Ceuvel."
  excerpt="Irina was there to hug people on arrival..."
  category="training-grounds"
  categoryLabel="Training Grounds"
  image="/images/Metabolic-1.jpg"
  imageAlt=""
/>
```

| Prop | Type | Notes |
| --- | --- | --- |
| `href` | string (required) | |
| `title` | string (required) | |
| `excerpt` | string | Truncated to 3 lines |
| `category` | category slug | Drives the top border + tag colour |
| `categoryLabel` | string | Display label (can show multi-category like `"Training Grounds · The Guides"`) |
| `image` | string | Falls back to a category-coded gradient placeholder if absent |
| `imageAlt` | string | |
| `fallbackGradient` | string | Override the default category gradient |

---

## `<SectionHeading>`

The bordered title block used between sections on the home page.

```astro
<SectionHeading title="An Introduction" />
```

If you pass an `href` prop, the whole block becomes a link.

---

## `<Hero>`

Page hero with feature image, large heading with an optional glitch-able word, and italic tagline.

```astro
<Hero
  image="/images/CivicAI_Visualisation_Header-2-1.jpg"
  imageAlt="Civic Interplay"
  beforeGlitch="Civic "
  glitchWord="Interplay"
  tagline="Towards civic agencies & civic AI intelligence"
/>
```

If `image` is omitted, a forest → purple gradient fallback fills the same space.

---

## Category slugs

The category enum lives in `src/content/config.ts`:

| Slug | Label | Color token |
| --- | --- | --- |
| `introduction` | Introduction | `--purple` (#7D50BD) |
| `training-grounds` | Training Grounds | `--terracotta` (#D16D54) |
| `the-guides` | The Guides | `--periwinkle` (#8E9BDD) |
| `work-sheets` | Work Sheets | `--forest` (#454E41) |
| `the-portals` | The Portals | `--pink` (#E076DB) |
