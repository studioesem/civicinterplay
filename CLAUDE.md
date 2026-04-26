# Civic Interplay Site

Astro static site migrating from Ghost Pro. Deploys to Cloudflare Pages.

## Design
- Fonts: Fira Sans (headings) + Merriweather (body)
- Palette: #7D50BD (purple), #E076DB (pink), #D16D54 (terracotta), #F8DFF6 (blush), #DACCBA (sand), #454E41 (forest), #8E9BDD (periwinkle)
- Category colours: Introduction=purple, Training Grounds=terracotta, The Guides=periwinkle, Work Sheets=forest
- Callout blocks with scroll-reveal, coloured left borders, box-shadow
- Glitch hover effect on key words
- Light background (#f8f8f8), bold borders, card hover lift

## Source files
- Ghost JSON export: ./civic-interplay.ghost.2026-04-26-04-04-53.json
- Downloaded images: ./civicinterplay-images/
- Approved HTML preview: ./civicinterplay-preview.html
- Image download script: ./download-ghost-images.sh

## Deploy
- Repo: studioesem/civicinterplay on GitHub
- Host: Cloudflare Pages
- Build: astro build, output: dist
- Same workflow as studioesem/sarahbsite

## No em dashes. Never use "comprehensive". Everything is a draft.
