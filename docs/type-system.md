# Type system

Draft, October 2026. The tokens live at the top of `src/styles/global.css`.

The reference is the drawing studies ("A side angle on place flows", "A side angle on the Western Parkland City"). Same two families as the site; the difference is how they are set.

## What the audit found

| | In use across `src/` | Target |
|---|---|---|
| Families | Fira Sans, Merriweather, one stray monospace | Fira Sans, Merriweather |
| Font sizes | about 55 distinct values | 6 |
| Letter-spacing | 12 distinct values | 2 (none, and 0.12em for uppercase labels) |
| Uppercase | 21 files | small labels and the wordmark only |

## The rule

**Fira Sans names things. Merriweather is anything read as a sentence.**

## Roles

| Role | Set as | Example |
|---|---|---|
| Heading | Fira Sans 700, sentence case, line-height 1.1 to 1.25, no tracking | section headings, card titles in the home page sections |
| Label | Fira Sans 500, uppercase, 0.7rem, tracked 0.12em | kickers, tags, "What's new" |
| Name | Fira Sans 500 | post card titles, buttons, links that act as controls |
| UI | Fira Sans 400 | small interface copy |
| Reading | Merriweather 300, line-height 1.55 to 1.7 | intro paragraphs, card descriptions, essays |
| Note | Merriweather italic 300 or 400 | asides, captions, the hero hover questions |

Fira 300 survives in one place: the CIVIC INTERPLAY wordmark in the hero.

## Sizes

| Token | Size | Use |
|---|---|---|
| `--fs-label` | 0.7rem | uppercase labels |
| `--fs-small` | 0.875rem | meta, card descriptions, buttons |
| `--fs-body` | 1rem | UI copy |
| `--fs-lead` | 1.15rem | card titles, intro paragraphs |
| `--fs-h2` | 1.35 to 1.7rem | section and page headings |
| `--fs-display` | 2.1 to 3.6rem | the hero wordmark |

Weights: `--w-light` 300 (Merriweather), `--w-regular` 400, `--w-medium` 500, `--w-bold` 700.

## Status

- Home page and the hero hover questions: on the system.
- Everything else (PostCard, Tile, SectionHeading on other pages, article pages, Reading, Doing, the tracker pages): not yet.
