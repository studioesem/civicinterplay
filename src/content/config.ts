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
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    featureImage: z.string().optional(),
    featureImageAlt: z.string().optional(),
    categories: z.array(z.enum(CATEGORIES)).default([]),
    primaryCategory: z.enum(CATEGORIES).optional(),
    author: z.string().default('Sarah Barns'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
