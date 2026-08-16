# Publishing on Civic Interplay

A guide for co-publishers. No coding needed: posts are written and published through Pages CMS, a simple editor that works in your browser.

Everything is a draft. Take your time.

## Signing in

1. Go to [app.pagescms.org](https://app.pagescms.org)
2. Sign in with your GitHub account (the one invited to this repository)
3. Choose **studioesem/civicinterplay** from the list

You'll see two sections in the sidebar:

- **Posts**: the site's articles. This is where you'll spend your time.
- **Embeds**: video and audio clips that can be reused across posts. Leave these alone unless you know what you're doing.

## Writing a new post

Click **Posts**, then **Add an entry**. The fields, in order of importance:

| Field | What to do |
|---|---|
| Title | The headline. Write it like a sentence, not ALL CAPS. |
| Slug | The web address of the post, e.g. `listening-to-the-anthropocene` becomes `civicinterplay.io/listening-to-the-anthropocene`. Lowercase words joined with hyphens, no spaces or punctuation. Required: the post's filename is built from it. |
| Excerpt | One or two sentences shown on the homepage cards and in link previews. Keep it on a single line. |
| Published at | The date shown on the post. Set it to today (or backdate if it belongs earlier in the story). |
| Feature image | The main image, shown on the card and at the top of the post. Upload from your computer; it lands in the site's image library. |
| Feature image alt text | A short description of the image for screen readers and search engines. |
| Categories | Tick every category that fits. See below for what they mean. |
| Primary category | The one category that colours the post's card. |
| Draft | Keep this ON while you're working. See "Publishing" below. |
| Body | The post itself. |

Fields you can usually ignore: subtitle, updated at, the feature video/audio fields (those are for special media posts), author (defaults to Sarah), featured, article type, keywords.

### The categories

- **Introduction** (purple): orientation pieces about what Civic Interplay is
- **Training Grounds** (terracotta): exercises, workshops, practice
- **The Guides** (periwinkle): people and ideas that guide the work
- **Work Sheets** (forest green): working documents and tools
- **The Portals**: media pieces, video and audio portals

## Saving and drafts

Every time you press Save, your changes are stored in the site's history with your name on them. Save early, save often; nothing appears on the live site while **Draft** is on.

You can close the browser and come back later. Your draft will be there.

## Publishing

When the post is ready:

1. Read it once more in preview
2. Switch **Draft** off
3. Save

That's it. The site rebuilds itself and the post appears at civicinterplay.io within a couple of minutes. There is no undo button as such, but switching Draft back on and saving removes the post from the live site again just as quickly.

A gentle warning: publishing is instant and there is no approval step. When in doubt, leave it as a draft and ask.

## Images

- Upload through the Feature image field or the image button in the body editor
- Use JPG for photos, PNG for graphics with text
- Before uploading, give the file a sensible name (`botanica-tree.jpg`, not `IMG_4032 copy FINAL.jpg`); that name becomes part of its web address forever
- Big files make the site slow. Aim for under 500 KB; 1600px wide is plenty
- To caption an image in the body, put a line in *italics* directly underneath it; the site styles it as a small centred caption

## Callout cards and video players

The coloured callout cards and the video players are special blocks. The visual editor can't create them (and will garble them if it saves over them), so they're always added and edited in **Source** mode: the Editor/Source switch at the top right of the Body field.

Step one, once per post: in Source mode, put the lines you need at the very top of the Body, before any text. Only include the ones the post actually uses.

```
import Callout from '../../components/Callout.astro';
import VideoEmbed from '../../components/VideoEmbed.astro';
```

### A callout card

```
<Callout>

Your text here. Normal formatting works inside: **bold**, *italics*, links.

</Callout>
```

The blank lines above and below the text matter. Keep them.

### A video player

```
<VideoEmbed
  src="https://media.civicinterplay.io/clips/your-clip.mp4"
  poster="/images/your-poster.jpg"
  caption="Caption shown under the player."
  aspectRatio="auto"
/>
```

The poster is a normal image from the site's image library. The video itself lives at media.civicinterplay.io; ask Sarah to upload new clips there. For tall phone-shaped clips, add `portrait` on its own line before the closing `/>`.

Golden rule: once a post contains any of these blocks, do all future edits to that post in Source mode.

## Editing an existing post

Open it from the Posts list, edit, save. If the post is live (Draft off), your saved changes go live within minutes. For bigger reworks of a live post, tell Sarah first.

## Things to leave alone

- The **Embeds** section, unless agreed
- Posts that contain special blocks (coloured callout boxes and embedded players). These use custom code that the visual editor garbles on save. If a post contains code-looking tags like `<Callout>` or `import ...`, don't edit it in the visual editor: click **Source** on the small Editor/Source switch at the top right of the Body field first and make your changes there, where the special blocks stay untouched. When in doubt, ask Sarah.
- Anything outside Pages CMS: the repository's other files are the site's machinery

## When something goes wrong

Nothing you do in Pages CMS can truly break the site. Every save is recorded in the site's history and any change can be wound back. If something looks wrong on the live site, don't try to fix it in a hurry: message Sarah (sarah@sitelines.media) with the post name and what happened.
