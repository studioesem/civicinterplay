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

export const collections = { posts, embeds, fieldnotes };
