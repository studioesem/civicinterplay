# Editor Guide

Day-to-day guide for editing civicinterplay.io. Written for two editors (Sarah + Irina) sharing the same repo. Read once cover-to-cover, then dip back in for reference.

For the architectural story (why the site is shaped this way, what lives where strategically), see [`HANDOFF.md`](HANDOFF.md). This doc is the practical companion.

## 1. First-time setup

You'll need: a GitHub account with write access to `studioesem/civicinterplay`, Git, Node 20+, and any editor (VS Code, Cursor, etc.).

```bash
git clone git@github.com:studioesem/civicinterplay.git
cd civicinterplay
npm install
npm run dev          # http://localhost:4321
```

The dev server hot-reloads on save. Leave it running while you work. Press Ctrl+C to stop.

## 2. Writing a new post

Posts live in `src/content/posts/{slug}.mdx`. The filename slug becomes the URL: `civicinterplay.io/{slug}/`.

Copy the frontmatter pattern from an existing post (e.g. `what-time-are-we-living-in.mdx`). Schema reference is in `src/content/config.ts`.

Minimum frontmatter:

```yaml
---
title: "Your title"
slug: "your-slug"
subtitle: "Optional one-line tagline for the post page."
excerpt: "Longer summary used on the home grid, reading list, and meta tags."
publishedAt: 2026-05-30T10:00:00.000Z
featureImage: "/images/your-hero.jpg"
featureImageAlt: "Describe the hero image."
categories: ["training-grounds"]
primaryCategory: "training-grounds"
featured: false
draft: true
---

import Callout from '../../components/Callout.astro';

Your body content goes here, written in Markdown. Use `<Callout>...</Callout>` for the bordered quote blocks.
```

Categories: `introduction`, `training-grounds`, `the-guides`, `work-sheets`, `the-portals`. `primaryCategory` drives the card's coloured border on the home page.

`draft: true` hides the post from listings and the build. Flip to `false` (or remove the field) when you're ready to publish.

**Single newlines** in MDX become line breaks (`<br>`) on the page, matching the Substack convention. Use a blank line for paragraph breaks. Existing migrated posts wrote one long line per paragraph; both styles work.

## 3. Hero options

The frontmatter supports three mutually-exclusive hero formats. The post page picks the first one that's set:

| Field | Renders as |
| --- | --- |
| `featureVideo` (+ optional `featureVideoWebm`) | Video player with `featureImage` as poster |
| `featureAudio` (+ optional `featureAudioOgg`) | Audio player with `featureImage` as poster art |
| `featureImage` alone | Image hero |

Always set `featureImage` and `featureImageAlt`. They double as the social-share card and as the poster/fallback for the video and audio modes.

## 4. Adding images to a post

Drop the source image into `civic-interplay-videos/` (this folder is gitignored — kept locally as the working area). Then wash + resize it in one step:

```bash
node ~/Projects/studioesem/scripts/magenta-wash.js path/to/your-image.png
```

The script applies the site's signature magenta tint, resizes to ≤1600px wide, and outputs a web-ready JPEG next to the input. Move the result into `public/images/` with a kebab-case filename, then reference it in frontmatter or body as `/images/your-image.jpg`.

For body images, write them as standard Markdown:

```mdx
![Concept diagram for the project.](/images/your-image.jpg)
```

## 5. Embedding video or audio inside a post

Both components live in `src/components/` and need a one-line import at the top of the MDX file.

**Video** (after the existing `import Callout` line):

```mdx
import VideoEmbed from '../../components/VideoEmbed.astro';

<VideoEmbed
  src="https://media.civicinterplay.io/posts/your-post/your-clip.mp4"
  webm="https://media.civicinterplay.io/posts/your-post/your-clip.webm"
  poster="/images/your-clip-poster.jpg"
  caption="Caption shown beside the Civic Interplay imprint."
  aspectRatio="auto"
/>
```

**Audio:**

```mdx
import AudioEmbed from '../../components/AudioEmbed.astro';

<AudioEmbed
  src="https://media.civicinterplay.io/clips/your-clip.mp3"
  poster="/images/your-clip-art.jpg"
  caption="20 minutes at the Botanica."
/>
```

Both wrap the media in a bordered card with offset shadow + a `Civic Interplay` imprint on the right of the caption bar. They respect `prefers-reduced-motion` and load lazily where it matters.

## 6. Uploading media to R2

Videos and audio over a few hundred KB don't belong in the repo. They go to the `civic-interplay` R2 bucket, served at `media.civicinterplay.io`. The upload script handles the rest:

```bash
bash ~/Projects/studioesem/scripts/upload-civicinterplay.sh \
  ~/Projects/studioesem/civicinterplay/civic-interplay-videos/your-clip.mp4 \
  posts/your-post/your-clip.mp4
```

The second argument is the path inside the bucket. Convention so far:
- `posts/{post-slug}/...` for media tied to a specific post
- `clips/...` for re-usable / context-free clips

It prints the final URL (`https://media.civicinterplay.io/...`) once done. Paste that into the `src` of `<VideoEmbed>` or `<AudioEmbed>` or into frontmatter.

For long videos, encode for web first with ffmpeg before uploading. Recipe lives in `HANDOFF.md`. Short version: 720p H.264 + AAC, with `-movflags +faststart`.

## 7. Sharing a video or audio clip elsewhere (iframe embed)

The site exposes a self-hosted iframe embed pattern at `civicinterplay.io/embed/{slug}/`. Anyone (you, a guest, another publication) can drop the iframe HTML into their own page.

To register a new embed, add one JSON file under `src/content/embeds/`:

```json
{
  "title": "Christopher Olah at the Vatican, May 2026",
  "mediaType": "video",
  "video": "https://media.civicinterplay.io/posts/what-time/olah-vatican.mp4",
  "videoWebm": "https://media.civicinterplay.io/posts/what-time/olah-vatican.webm",
  "poster": "https://civicinterplay.io/images/vatican-may-2026-with-oleh.jpg",
  "caption": "Christopher Olah at the Vatican, May 2026.",
  "sourcePostSlug": "what-time-are-we-living-in",
  "aspectRatio": "auto"
}
```

For an audio embed, set `"mediaType": "audio"` and use `audio` / `audioOgg` instead of `video` / `videoWebm`.

The slug is the filename (without `.json`). Push, and the iframe page is live at `https://civicinterplay.io/embed/{slug}/`.

The iframe HTML to share:

```html
<iframe
  src="https://civicinterplay.io/embed/olah-vatican-2026/"
  width="640" height="380"
  frameborder="0" allowfullscreen
  allow="autoplay; fullscreen; encrypted-media"
  style="border: 0; max-width: 100%;"
></iframe>
```

The embed page shows the styled player + a "Watch on Civic Interplay" (or "Listen on") link in the corner that opens the source post in the parent frame. `noindex` is set so embed pages don't compete with canonical posts in search.

`Content-Security-Policy: frame-ancestors *` is set on `/embed/*` so any site can iframe these. See `public/_headers`.

## 8. Publishing

Two paths, depending on the size of the change.

**Quick edit (typo, link tweak):** edit the file directly on GitHub.
1. Browse to `github.com/studioesem/civicinterplay`, open the file, click the pencil.
2. Make the edit, commit straight to `main` with a short message.
3. Cloudflare Pages auto-rebuilds in 30–60 seconds.

**Larger edit (a new post, an image, structural change):** local.
1. `git pull --rebase` first, so you've got whatever the other person pushed.
2. Edit with `npm run dev` running so you see changes live.
3. `git add <files>`, `git commit -m "..."`, `git push`.

Either way, a successful push to `main` triggers the Cloudflare Pages deploy. Watch progress at `dash.cloudflare.com → Pages → civicinterplay`.

## 9. Working together

You're both direct repo collaborators, so either of you can push to `main` without a PR. Two simple rules:

- **Always `git pull --rebase` before starting work**, so you're starting from the latest.
- **Heads-up before substantive edits** to the same file (Slack, email, whatever) prevents most collisions.

If a push gets rejected because someone else pushed first: `git pull --rebase origin main` to replay your commits on top, then push again. Conflicts are rare on this codebase because the files are mostly orthogonal (one post per file, etc.).

For bigger or experimental work, prefer a feature branch + PR:

```bash
git checkout -b irina/new-post-foo
# edits...
git push -u origin irina/new-post-foo
gh pr create   # or use the GitHub web "New PR" button
```

Cloudflare Pages builds a **preview deployment** for every PR — there's a unique URL on the PR page you can share before merging, useful for reviewing a post layout without affecting prod.

## 10. House writing rules

These apply to everything you write: post copy, captions, commit messages, even code comments.

- **No em dashes.** Use commas, parens, colons, or two sentences.
- **Never use the word "comprehensive."** Pick a more specific word.
- **Treat every page as a draft.** Avoid finality language ("final", "complete", "done").

Migrated post bodies weren't retroactively scrubbed — those are Sarah's authored prose. Apply the rules to anything new.

## Common gotchas

- **"This file was modified outside the editor — reload?"** — happens when the other editor pushed while you had the file open. Click reload, then re-apply your changes. Save your in-flight edit to a scratch file first if it's substantive.
- **`git push` rejected.** Someone pushed first. `git pull --rebase origin main`, fix any conflicts, push again.
- **Build failed on Cloudflare.** Check `dash.cloudflare.com → Pages → civicinterplay → the failed deployment → View build log`. Usually a YAML typo in frontmatter (unclosed string, missing field). Fix locally, push.
- **An image looks huge and slow.** Run it through `magenta-wash.js` — even without changing the colour treatment, the default 1600px-wide JPEG re-encode usually cuts size by 90%+.

## Where to ask

- Sarah: [sarahbarns.com](https://sarahbarns.com)
- Issues / questions about the codebase: `github.com/studioesem/civicinterplay/issues`
