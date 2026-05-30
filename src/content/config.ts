import { defineCollection, z } from 'astro:content';

export const CATEGORIES = [
  'introduction',
  'training-grounds',
  'the-guides',
  'work-sheets',
  'the-portals',
] as const;

export const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  introduction: 'Introduction',
  'training-grounds': 'Training Grounds',
  'the-guides': 'The Guides',
  'work-sheets': 'Work Sheets',
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

export const collections = { posts, embeds };
