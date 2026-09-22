import { defineCollection, z } from 'astro:content';

export const CATEGORIES = [
  'foundational-docs',
  'training-grounds',
  'essays-readings',
  'the-portals',
] as const;

export const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  'foundational-docs': 'Foundational Docs',
  'training-grounds': 'Training Grounds',
  'essays-readings': 'Essays & Readings',
  'the-portals': 'The Portals',
};

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    subtitle: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    featureImage: z.string().optional(),
    featureImageAlt: z.string().optional(),
    featureVideo: z.string().optional(),
    featureVideoWebm: z.string().optional(),
    featureAudio: z.string().optional(),
    featureAudioOgg: z.string().optional(),
    categories: z.array(z.enum(CATEGORIES)).default([]),
    primaryCategory: z.enum(CATEGORIES).optional(),
    author: z.string().default('Sarah Barns'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    // Overrides the colour a card gets from its category. Use when a card
    // should read as what it IS rather than where it sits, e.g. a tool listed
    // under Training Grounds wants cream, like the tool tile on the home page.
    accent: z
      .enum(['cream', 'purple', 'terracotta', 'periwinkle', 'pink', 'plain'])
      .optional(),
    articleType: z.enum(['BlogPosting', 'Article', 'ScholarlyArticle', 'CreativeWork']).default('BlogPosting'),
    keywords: z.array(z.string()).optional(),
  }),
});

const embeds = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    mediaType: z.enum(['video', 'audio']).default('video'),
    // Video sources (used when mediaType === 'video')
    video: z.string().optional(),
    videoWebm: z.string().optional(),
    aspectRatio: z.string().optional(),
    // Audio sources (used when mediaType === 'audio')
    audio: z.string().optional(),
    audioOgg: z.string().optional(),
    // Shared
    poster: z.string().optional(),
    caption: z.string().optional(),
    credit: z.string().optional(),
    sourcePostSlug: z.string().optional(),
  }),
});

// Field notes: the investigative series (cream cards, magenta rule, numbered
// layers). Body is MDX so it reads like the rest of the site; `layers` is
// structured so the diagram's content stays real text rather than pixels, and
// so it can be edited as a form in Pages CMS.
const fieldnotes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string().default('Civic Interplay / Field note'),
    heading: z.string(),
    standfirst: z.string(),
    tileId: z.string(),
    imageAlt: z.string(),
    caption: z.string().optional(),
    tagHeading: z.string().optional(),
    layers: z
      .array(
        z.object({
          num: z.string(),
          name: z.string(),
          detail: z.string(),
          tag: z.string().optional(),
          tagNote: z.string().optional(),
          verify: z.boolean().default(false),
          highlight: z.boolean().default(false),
        })
      )
      .default([]),
    next: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          external: z.boolean().default(false),
        })
      )
      .default([]),
    doi: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// Claim cards: one file per tracking night, holding the headline claims that
// night produced. Not posts. These are the claims a post could be built from,
// with their source, page and date recorded at the moment the document was read.
//
// The same file feeds two renderers: the running page at /facts-and-moments/ and the image
// export in scripts/build-claim-cards.mjs. The text lives here once so a claim
// cannot say one thing on the site and another on the card.
//
// See ai-sovereignties/docs/cards/README.md for the format this encodes.

/** Every card carries a status. Post nothing above its status. */
export const CLAIM_STATUS = ['VERIFIED', 'SOURCED', 'UNVERIFIED'] as const;

// A set of seventeen identical cards reads as wallpaper, so the ground flips
// between cream and ink across the run and the knockout takes one of three
// colours. The magenta rule under the asterisk stays magenta on every card,
// whatever the ground: it is the one constant that holds the series together.
//
// Inverting a card already means something in this project. build-tiles.mjs
// inverts the `method` tile because it is a door rather than a document. Here
// it is rhythm rather than category, so it is set per card rather than derived,
// and can be shuffled without anything breaking.
export const CLAIM_GROUNDS = ['cream', 'ink'] as const;

/** A coloured knockout always carries cream text. `default` is the ground inverted. */
export const CLAIM_HIGHLIGHTS = ['default', 'magenta', 'purple'] as const;

export const CLAIM_STATUS_MEANS: Record<(typeof CLAIM_STATUS)[number], string> = {
  VERIFIED: 'Confirmed by the reader.',
  SOURCED: 'Quoted correctly from a named document; nobody has independently checked it.',
  UNVERIFIED: "Rests on this project's own computation, with no adversarial pass.",
};

const claimcards = defineCollection({
  type: 'data',
  schema: z.object({
    // The night the documents were read. Not the night a post goes out, and not
    // the date on the source. Becomes the filename and the URL.
    set: z.string(),
    title: z.string(),
    standfirst: z.string().optional(),
    readOn: z.string().optional(),
    // The time of the sitting, in plain words. Free text rather than a clock
    // value because what matters is that it was one evening, not a precise
    // minute, and because anything more exact than the record supports would be
    // a figure this project could not stand behind.
    readAt: z.string().optional(),
    // A working note about how the set plays as a sequence. Written in card
    // numbers, which are not printed on the cards, so it is not rendered.
    runningOrder: z.string().optional(),
    draft: z.boolean().default(false),
    cards: z
      .array(
        z.object({
          id: z.string(),
          kind: z.enum(['CLAIM', 'ARCHIVE']).default('CLAIM'),
          // A working title, for finding the card again. Never printed.
          title: z.string().optional(),
          // One sentence. [[Double square brackets]] mark the knockout
          // highlight; see scripts/lib/claim-text.mjs.
          claim: z.string(),
          source: z.string(),
          meta: z.string().optional(),
          // The ceiling, not the average. A card that is SOURCED for its figure
          // and UNVERIFIED for its comparison sits at UNVERIFIED.
          status: z.enum(CLAIM_STATUS),
          ground: z.enum(CLAIM_GROUNDS).default('cream'),
          highlight: z.enum(CLAIM_HIGHLIGHTS).default('default'),
          // The caveat that must travel with the claim. Shown on the page,
          // never printed on the card: small type on a card is not a caveat.
          note: z.string().optional(),
          // Keeps the card out of the image export until its caveat can travel.
          hold: z.boolean().default(false),
          // Artwork for an ARCHIVE card, relative to the sibling project root
          // (the same tree build-tiles.mjs reads, overridable with TILE_SRC).
          image: z.string().optional(),
          // "left,top,width,height" in source pixels, for trimming the
          // interface out of a screen capture. Omit to centre-crop.
          imageCrop: z.string().optional(),
          imageAlt: z.string().optional(),
        })
      )
      .default([]),
  }),
});

export const collections = { posts, embeds, fieldnotes, claimcards };
