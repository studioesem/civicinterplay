// Inline formatting for short CMS text fields: **bold**, *italics* and
// [links](https://...). Everything else is escaped, so a stray < in the CMS
// can't break the page.
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const inlineMd = (s: string | undefined) =>
  escapeHtml(String(s ?? '').trim())
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

// Set the project name in italics in running text, as a title. Headings,
// existing italics and tag attributes are left alone.
export const italiciseName = (html: string) => {
  let skip = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<(h[1-6]|em|i)[\s>]/i.test(part)) skip++;
        else if (/^<\/(h[1-6]|em|i)>/i.test(part)) skip = Math.max(0, skip - 1);
        return part;
      }
      return skip ? part : part.replace(/Civic Interplay/g, '<em>Civic Interplay</em>');
    })
    .join('');
};
