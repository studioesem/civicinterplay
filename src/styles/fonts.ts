// Self-hosted fonts. Importing these instead of loading from Google Fonts means
// no visitor's browser ever calls fonts.googleapis.com / fonts.gstatic.com, so
// the site (and the embeddable player) makes zero third-party requests.
// The woff2 files are bundled at build time and served from our own origin.

// Literata (headings and reading text) — weights 300/400/500/600/700 + italics 300/400/500.
import '@fontsource/literata/300.css';
import '@fontsource/literata/400.css';
import '@fontsource/literata/500.css';
import '@fontsource/literata/600.css';
import '@fontsource/literata/700.css';
import '@fontsource/literata/300-italic.css';
import '@fontsource/literata/400-italic.css';
import '@fontsource/literata/500-italic.css';

// Fragment Mono (labels, dates, page references) — one weight + italic.
import '@fontsource/fragment-mono/400.css';
import '@fontsource/fragment-mono/400-italic.css';
