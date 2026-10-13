// add@in.civicinterplay.io: email a link (with an optional note above it) and
// it lands in Publications on civic AI as a hidden draft. The page's title,
// authors, publisher and year are read from its metadata; whatever you wrote
// in the email becomes "Why it matters". Publish it by unticking Hidden in
// the CMS. Replies to the sender either way.
import PostalMime from 'postal-mime';
import { createMimeMessage } from 'mimetext';
import { EmailMessage } from 'cloudflare:email';

export default {
  async email(message, env) {
    const sender = message.from.toLowerCase();
    const allowed = JSON.parse(env.ALLOWED_SENDERS || '[]').map((e) => e.toLowerCase());
    if (!allowed.includes(sender)) {
      message.setReject('This address only accepts links from Civic Interplay contributors.');
      return;
    }
    // Email Routing records SPF/DKIM results; refuse mail that fails both.
    const auth = message.headers.get('Authentication-Results') || '';
    if (/dkim=fail/i.test(auth) && /spf=fail/i.test(auth)) {
      message.setReject('Sender could not be verified.');
      return;
    }

    const mail = await PostalMime.parse(message.raw);
    const text = mail.text || (mail.html || '').replace(/<[^>]+>/g, ' ');
    const url = firstUrl(text) || firstUrl(mail.subject || '');
    if (!url) return reply(message, mail, 'No link found', "I couldn't find a link in your email, so nothing was added.");

    try {
      const meta = await readMeta(url);
      const note = noteFrom(text, url) || meta.description || '';
      const entry = {
        id: slugify(meta.title || new URL(url).hostname),
        title: meta.title || url,
        authors: meta.authors || '',
        publisher: meta.publisher || new URL(url).hostname.replace(/^www\./, ''),
        year: meta.year || String(new Date().getFullYear()),
        href: url,
        accent: 'periwinkle',
        note,
        draft: true,
      };
      const result = await addEntry(env, entry, mail.from?.name || sender);
      if (result === 'exists') {
        return reply(message, mail, 'Already on the list', `${url} is already in Publications on civic AI, so nothing was added.`);
      }
      const gaps = ['authors', 'note'].filter((k) => !entry[k]);
      return reply(message, mail, `Added as a draft: ${entry.title}`, [
        `"${entry.title}" is now a hidden draft in Publications on civic AI.`,
        '',
        `Authors: ${entry.authors || '(not found)'}`,
        `Publisher: ${entry.publisher}`,
        `Year: ${entry.year}`,
        `Why it matters: ${entry.note || '(empty)'}`,
        '',
        gaps.length ? `Please fill in: ${gaps.join(', ')}. ` : '',
        'To publish it, open the CMS (app.pagescms.org), go to Publications on civic AI, check the details and untick "Hidden (waiting for review)".',
      ].join('\n'));
    } catch (err) {
      return reply(message, mail, 'Not added', `Something went wrong adding ${url}:\n\n${err.message}\n\nNothing was changed.`);
    }
  },
};

const firstUrl = (s) => {
  const u = (s.match(/https?:\/\/[^\s<>"')\]]+/) || [])[0]?.replace(/[.,;:]+$/, '');
  return u && unwrap(u);
};

// Mail services wrap links in their own redirects (Gmail, Outlook safe links,
// university filters). Use the real address inside.
function unwrap(u) {
  for (let i = 0; i < 3; i++) {
    let url;
    try { url = new URL(u); } catch { return u; }
    const host = url.hostname;
    const inner =
      (/(^|\.)google\.[a-z.]+$/.test(host) && url.pathname === '/url' && (url.searchParams.get('q') || url.searchParams.get('url'))) ||
      (/safelinks\.protection\.outlook\.com$/.test(host) && url.searchParams.get('url')) ||
      (/^urldefense\.(com|proofpoint\.com)$/.test(host) && (url.pathname.match(/\/v3\/__(.+?)__;/) || [])[1]) ||
      null;
    if (!inner || !/^https?:\/\//.test(inner)) return u;
    u = inner;
  }
  return u;
}

// Your own words: the email text without the link, quoted replies or signature.
function noteFrom(text, url) {
  const lines = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^(--\s*$|>|On .+wrote:$|Sent from my)/.test(line.trim())) break;
    lines.push(line);
  }
  return lines.join(' ').replace(url, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
}

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().split(/\s+/).slice(0, 6).join('-').slice(0, 60) || 'link';

// Journal articles: the DOI registry (Crossref) is reliable where publisher
// sites block automated visits.
async function readMeta(url) {
  const doi = (decodeURIComponent(url).match(/\b(10\.\d{4,9}\/[^\s?#]+)/) || [])[1];
  if (doi) {
    const cr = await crossref(doi).catch(() => null);
    if (cr) return cr;
  }
  const page = await readPage(url).catch(() => null);
  if (page && !/^(just a moment|attention required|access denied|403|404)/i.test(page.title)) return page;
  return { title: '', authors: '', publisher: '', year: '', description: '' };
}

async function crossref(doi) {
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'CivicInterplayInbox/1.0 (https://civicinterplay.io)' },
  });
  if (!res.ok) return null;
  const w = (await res.json()).message;
  const year = (w.issued?.['date-parts']?.[0]?.[0] || w.created?.['date-parts']?.[0]?.[0] || '').toString();
  return {
    title: (w.title?.[0] || '').replace(/<[^>]+>/g, ''),
    authors: joinNames((w.author || []).map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name).filter(Boolean)),
    publisher: w['container-title']?.[0] || w.publisher || '',
    year,
    description: (w.abstract || '').replace(/<[^>]+>/g, '').replace(/^\s*Abstract\s*/i, '').trim().slice(0, 400),
  };
}

async function readPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CivicInterplayInbox/1.0; +https://civicinterplay.io)', Accept: 'text/html' },
    redirect: 'follow',
  });
  const html = (await res.text()).slice(0, 400_000);
  const metas = [...html.matchAll(/<meta\s[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')) || [])[1];
  const get = (key) => metas.filter((t) => (attr(t, 'name') || attr(t, 'property') || '').toLowerCase() === key).map((t) => decode(attr(t, 'content') || '')).filter(Boolean);
  const titleTag = decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '').trim();
  const authors = get('citation_author').length ? get('citation_author') : get('dc.creator').length ? get('dc.creator') : get('author');
  const date = get('citation_publication_date')[0] || get('citation_date')[0] || get('dc.date')[0] || get('article:published_time')[0] || '';
  const site = get('og:site_name')[0] || '';
  let title = get('citation_title')[0] || get('og:title')[0] || titleTag;
  if (site) title = title.replace(new RegExp(`\\s*[-|–·:]\\s*${site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '');
  return {
    title: title.trim(),
    authors: joinNames([...new Set(authors.map(flipName))]),
    publisher: get('citation_journal_title')[0] || get('citation_publisher')[0] || site,
    year: (date.match(/\b(19|20)\d{2}\b/) || [])[0] || '',
    description: get('og:description')[0] || get('description')[0] || '',
  };
}

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
// "Sieber, Renée" -> "Renée Sieber"
const flipName = (n) => (/^[^,]+,\s*[^,]+$/.test(n) ? n.split(/,\s*/).reverse().join(' ') : n).trim();
const joinNames = (a) => (a.length <= 1 ? a[0] || '' : `${a.slice(0, -1).join(', ')} & ${a[a.length - 1]}`);

async function addEntry(env, entry, who) {
  const api = `https://api.github.com/repos/${env.REPO}/contents/${env.FILE}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'civicinterplay-inbox',
  };
  const cur = await fetch(`${api}?ref=${env.BRANCH}`, { headers });
  if (!cur.ok) throw new Error(`GitHub read failed (${cur.status})`);
  const { sha, content } = await cur.json();
  const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\n/g, '')), (c) => c.charCodeAt(0))));
  const norm = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  if (data.readings.some((r) => norm(r.href) === norm(entry.href))) return 'exists';
  const ids = new Set(data.readings.map((r) => r.id));
  let id = entry.id;
  for (let i = 2; ids.has(id); i++) id = `${entry.id}-${i}`;
  data.readings.push({ ...entry, id });
  const body = new TextEncoder().encode(JSON.stringify(data, null, 2) + '\n');
  let bin = '';
  body.forEach((b) => (bin += String.fromCharCode(b)));
  const put = await fetch(api, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Inbox: draft publication "${entry.title}" (from ${who})`,
      content: btoa(bin),
      sha,
      branch: env.BRANCH,
    }),
  });
  if (!put.ok) throw new Error(`GitHub save failed (${put.status}): ${(await put.text()).slice(0, 200)}`);
  return 'added';
}

async function reply(message, mail, subject, body) {
  const msg = createMimeMessage();
  msg.setSender({ name: 'Civic Interplay inbox', addr: message.to });
  msg.setRecipient(message.from);
  msg.setSubject(subject);
  const id = message.headers.get('Message-ID');
  if (id) msg.setHeader('In-Reply-To', id);
  msg.addMessage({ contentType: 'text/plain', data: body });
  await message.reply(new EmailMessage(message.to, message.from, msg.asRaw()));
}
