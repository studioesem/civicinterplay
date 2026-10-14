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
