// RSS for the Reading page: publications, essays, notes, experiments, field
// notes and presentations. Hand-written XML so there is no extra dependency.
import { getCollection } from 'astro:content';
import readingsData from '../data/readings.json';
import talksData from '../data/talks.json';

const SITE = 'https://civicinterplay.io';
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (href: string) => (/^https?:/.test(href) ? href : SITE + href);

type Item = { title: string; link: string; description: string; category: string; date?: Date };

export async function GET() {
  const items: Item[] = [];
  const LABEL: Record<string, string> = { essay: 'Essay', note: 'Field note', experiment: 'Experiment' };

  for (const p of await getCollection('posts')) {
    if (p.data.draft || !LABEL[p.data.section]) continue;
    items.push({
      title: p.data.title,
      link: `${SITE}/${p.slug}/`,
      description: p.data.excerpt ?? '',
      category: LABEL[p.data.section],
      date: p.data.publishedAt,
    });
  }
  for (const n of await getCollection('fieldnotes')) {
    if (n.data.draft) continue;
    items.push({ title: n.data.title, link: `${SITE}/field-notes/${n.slug}/`, description: n.data.description, category: 'Field note', date: n.data.publishedAt });
  }
  for (const r of readingsData.readings as Array<Record<string, any>>) {
    if (r.draft) continue;
    const by = [r.authors, r.publisher, r.year].filter(Boolean).join(' · ');
    items.push({
      title: r.title,
      link: r.doi ? `https://doi.org/${r.doi}` : r.href,
      description: `${by}${by ? '. ' : ''}${r.note ?? ''}`,
      category: 'Reading',
      date: r.added ? new Date(r.added) : undefined,
    });
  }
  for (const t of talksData.talks as Array<Record<string, any>>) {
    items.push({
      title: t.title,
      link: abs(t.href),
      description: [t.publisher, t.year].filter(Boolean).join(' · ') + (t.note ? `. ${t.note}` : ''),
      category: 'Presentation',
    });
  }

  // Dated items newest first; undated ones after them, in page order.
  items.sort((a, b) => (b.date?.valueOf() ?? -Infinity) - (a.date?.valueOf() ?? -Infinity));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Civic Interplay: Reading</title>
<link>${SITE}/reading/</link>
<atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
<description>Readings on civic AI and surrounds, essays, presentations and field notes from Civic Interplay.</description>
<language>en-au</language>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(i.link)}</link>
<guid isPermaLink="true">${esc(i.link)}</guid>
<category>${esc(i.category)}</category>
<description>${esc(i.description)}</description>${i.date ? `\n<pubDate>${i.date.toUTCString()}</pubDate>` : ''}
</item>`
  )
  .join('\n')}
</channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
