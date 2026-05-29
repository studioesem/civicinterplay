import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkBreaks from 'remark-breaks';

export default defineConfig({
  site: 'https://civicinterplay.io',
  integrations: [mdx({ remarkPlugins: [remarkBreaks] }), sitemap()],
  build: {
    format: 'directory',
  },
  markdown: {
    remarkPlugins: [remarkBreaks],
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
