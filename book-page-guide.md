# Book Page Embeds

Civic Interplay posts can include "book page" embeds for more composed, finished prose. These create a visual register shift: paper background, spine shadow, Playfair Display headings, EB Garamond body, drop caps.

## Usage in posts

Wrap content in a `<div class="book-page">` inside any post's HTML:

```html
<div class="book-page">
  <div class="book-page-header">
    <span class="book-eyebrow">Chapter Two · Still Here</span>
    <h2 class="book-title">What the City <em>Remembers</em></h2>
  </div>
  <div class="book-page-body">
    <blockquote class="book-epigraph">
      <p>The archive is not a place where the past is stored.</p>
      <cite>Carolyn Steedman, Dust, 2001</cite>
    </blockquote>
    <p class="book-lead">Every site carries a frequency beneath its noise.</p>
    <p>The ABC sound archive began, in one sense, as bureaucratic habit.</p>
  </div>
  <div class="book-folio">
    <span>Still Here</span>
    <span>29</span>
  </div>
</div>
```

### Optional: link to full standalone page

```html
<div class="book-page">
  ...content...
  <div class="book-folio">
    <span>Still Here</span>
    <a href="/essays/chapter-two.html">Read full chapter →</a>
  </div>
</div>
```

## Fonts required

Add to the site's font import:

```
Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600
EB+Garamond:ital,wght@0,400;0,500;1,400
```

These are ONLY used inside `.book-page` blocks. The rest of the site uses Fira Sans + Merriweather.
