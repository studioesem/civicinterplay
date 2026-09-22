# A Steward's First Walk

The steward onboarding walk, in two forms.

- `../../public/walk/index.html` is the live page, served at `/walk/`. It is a single
  self-contained file: every word is in the markup, the nine plates are base64 at the
  foot. Edit it directly, nothing to build.
- `walk-source.html` is the reading and printing copy, and `make-print.py` turns it
  into the A4 print layout:

      python3 make-print.py walk-source.html /tmp/walk-print.html

  Then render with headless Chrome. It swaps the Google Fonts link for the self-hosted
  faces in `application-dsa/fonts/`, because headless Chrome will not fetch webfonts
  and falls back to a system serif without saying so. Chrome writes the PDF and then
  never exits, so run it in the background and kill it once the file lands.

Timings are 45 minutes in total. In the live page they are `data-mins` on each point;
in the print copy they are the `<b>0n</b>N min` labels in the clock column. Change both.
