// Self-hosted fonts. Importing these instead of loading from Google Fonts means
// no visitor's browser ever calls fonts.googleapis.com / fonts.gstatic.com, so
// the site (and the embeddable player) makes zero third-party requests.
// The woff2 files are bundled at build time and served from our own origin.

// Fira Sans (headings + UI) — weights 300/400/500/600 + italics 300/400.
import '@fontsource/fira-sans/300.css';
import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/500.css';
import '@fontsource/fira-sans/600.css';
import '@fontsource/fira-sans/300-italic.css';
import '@fontsource/fira-sans/400-italic.css';

// Merriweather (body) — weights 300/400/700 + italics 300/400.
import '@fontsource/merriweather/300.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';
import '@fontsource/merriweather/300-italic.css';
import '@fontsource/merriweather/400-italic.css';
