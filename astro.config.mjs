import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://civicinterplay.io',
  integrations: [mdx(), sitemap()],
  build: {
    format: 'directory',
  },
  redirects: {
    '/about': '/what-is-civic-interplay',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
