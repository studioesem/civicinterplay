// The claim-card text format, shared by the site and the image export.
//
// A claim is one sentence. The words that get the black knockout highlight are
// wrapped in double square brackets:
//
//   "...totalling [[20 gigawatts]], roughly twice the state's peak demand."
//
// Plain ESM with no dependencies so both scripts/build-claim-cards.mjs and the
// Astro components can import it. One parser, so a claim cannot say one thing
// on the site and another on the card.

const HIGHLIGHT = /\[\[(.+?)\]\]/g;

/**
 * Split a claim into runs.
 * @param {string} claim
 * @returns {{text: string, highlight: boolean}[]} runs in order, empty ones dropped
 */
export function parseClaim(claim) {
  const runs = [];
  let last = 0;

  for (const match of claim.matchAll(HIGHLIGHT)) {
    if (match.index > last) {
      runs.push({ text: claim.slice(last, match.index), highlight: false });
    }
    runs.push({ text: match[1], highlight: true });
    last = match.index + match[0].length;
  }

  if (last < claim.length) {
    runs.push({ text: claim.slice(last), highlight: false });
  }

  return runs.filter((r) => r.text.length > 0);
}

/**
 * The claim with its brackets stripped. For alt text, meta descriptions, and
 * anywhere the length of the real sentence is what matters.
 * @param {string} claim
 * @returns {string}
 */
export function plainClaim(claim) {
  return claim.replace(HIGHLIGHT, '$1');
}
