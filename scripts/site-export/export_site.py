#!/usr/bin/env python3
"""Export the Civic Interplay site's content to CSV, one row per public page.

Columns: Title, Project, Action (left blank), Contents, Images, URL (canonical).
Reads the built site (civicinterplay/dist, built 26 Nov 2026 18:55) for the text
people actually see, and the post source files (src/content) for dates, section
and categories. Team and login pages (/board, /pad, /people, /login) and the
bare media embed frames (/embed/*) are left out.

usage: npm run build, then python3 scripts/site-export/export_site.py [out.csv]
"""
import csv, html, pathlib, re, sys
from html.parser import HTMLParser

SITE = pathlib.Path(__file__).resolve().parents[2]   # repo root (scripts/site-export/..)
DIST = SITE / 'dist'
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else
                   pathlib.Path(__file__).parent / 'civic-interplay-site-content-2026-11-27.csv')
BASE = 'https://civicinterplay.io'
SKIP = ('/board', '/pad', '/people', '/login', '/embed/')
CATEGORY_LABEL = {'foundational-docs': 'Foundational Docs', 'training-grounds': 'Training Grounds',
                  'essays-readings': 'Essays & Readings', 'the-portals': 'The Portals'}


class Page(HTMLParser):
    """Collect title, meta description, headings, visible body text, images (site header/footer/nav left out)."""
    SKIP_TAGS = {'script', 'style', 'noscript', 'svg', 'template', 'nav', 'button', 'form', 'dialog'}
    BLOCK = {'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'blockquote', 'dd', 'dt', 'td', 'th', 'br', 'div', 'section', 'article'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = self.desc = self.canonical = ''
        self.h1, self.h2 = [], []
        self.images = []
        self.parts = []
        self.in_main = 0
        self.skip = 0
        self.in_title = False
        self.heading = None
        self.buf = ''
        self.stack = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title' and not self.title and not self.in_main: self.in_title = True
        if tag == 'meta' and a.get('name') == 'description': self.desc = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href', '')
        if tag == 'body': self.in_main += 1
        site_chrome = tag in ('header', 'footer') and 'site' in (a.get('class') or '')
        if tag in self.SKIP_TAGS or site_chrome or a.get('hidden') is not None or a.get('aria-hidden') == 'true':
            self.skip += 1; self.stack.append(tag)
        if not self.in_main or self.skip: return
        if tag in ('h1', 'h2'): self.heading = tag; self.buf = ''
        if tag == 'img' and a.get('src'):
            self.images.append(f"{a['src']}" + (f" — {a['alt']}" if a.get('alt') else ''))
        if tag in self.BLOCK: self.parts.append('\x00')

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if self.stack and tag == self.stack[-1]:
            self.stack.pop(); self.skip -= 1
        if tag == 'body' and self.in_main: self.in_main -= 1
        if tag == self.heading:
            (self.h1 if tag == 'h1' else self.h2).append(' '.join(self.buf.split())); self.heading = None
        if tag in self.BLOCK: self.parts.append('\x00')

    def handle_data(self, data):
        if self.in_title: self.title += data
        if not self.in_main or self.skip: return
        self.parts.append(data.replace('\n', ' '))
        if self.heading: self.buf += data

    def text(self):
        t = ''.join(self.parts)
        lines = [' '.join(l.split()) for l in t.split('\x00')]
        return '\n'.join(l for l in lines if l)


def frontmatter(path):
    """Minimal YAML front matter reader for the post fields we need."""
    src = path.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---', src, re.S)
    if not m: return {}
    fm, out, key = m.group(1), {}, None
    for line in fm.split('\n'):
        k = re.match(r'^([A-Za-z]\w*):\s*(.*)$', line)
        if k:
            key, val = k.group(1), k.group(2).strip()
            out[key] = [] if val == '' else val.strip('"\'')
        elif key and line.strip().startswith('- ') and isinstance(out.get(key), list):
            out[key].append(line.strip()[2:].strip('"\''))
        elif key and isinstance(out.get(key), str):
            out[key] += ' ' + line.strip()
    return out


# source metadata keyed by URL path
meta = {}
for coll, kind in (('posts', 'post'), ('fieldnotes', 'field note'), ('experiments', 'experiment')):
    for f in sorted((SITE / 'src/content' / coll).glob('*.md*')):
        fm = frontmatter(f)
        slug = fm.get('slug') or f.stem
        path = {'posts': f'/{slug}', 'fieldnotes': f'/field-notes/{slug}', 'experiments': f'/experiments/{slug}'}[coll]
        cats = fm.get('categories') or []
        meta[path] = dict(
            page_type=('project' if fm.get('section') == 'project' else kind),
            section=fm.get('section', ''),
            categories='; '.join(CATEGORY_LABEL.get(c, c) for c in (cats if isinstance(cats, list) else [cats])),
            published=str(fm.get('publishedAt', ''))[:10], updated=str(fm.get('updatedAt', ''))[:10],
            subtitle=fm.get('subtitle', ''), author=fm.get('author', ''),
            feature_image=fm.get('featureImage', ''),
            keywords='; '.join(fm['keywords']) if isinstance(fm.get('keywords'), list) else fm.get('keywords', ''),
            draft=fm.get('draft', ''), source_file=str(f.relative_to(SITE)))

# Project, following the four projects on /projects; tools and experiments listed
# there go under "Tools & experiments"; everything else is general Civic Interplay.
PROJECT = [
    ('Data Centres Transparency Project', ('/sovereignties', '/submission', '/data-centres-map',
                                           '/field-notes/ai-stack', '/field-notes/benefit-ladder')),
    ('Tracing public value: A side angle on a place', ('/experiments/side-angle-on-',)),
    ('Gathering Intelligences', ('/gathering-intelligences', '/walk')),
    ('WeCare, City North', ('/we-care-rmit',)),
    ('Tools & experiments', ('/terrain', '/facts-and-moments', '/player', '/listening')),
]
def project(path):
    for name, prefixes in PROJECT:
        if any(path == p or path.startswith(p) for p in prefixes): return name
    return 'Civic Interplay'

def absolute(src):
    return src if src.startswith('http') else BASE + ('' if src.startswith('/') else '/') + src

rows = []
for f in sorted(DIST.rglob('index.html')):
    path = '/' + str(f.parent.relative_to(DIST)).replace('.', '').strip('/')
    path = '/' if path == '/' else path.rstrip('/')
    if any(path.startswith(s) for s in SKIP): continue
    p = Page(); p.feed(f.read_text(encoding='utf-8'))
    body = p.text()
    m = meta.get(path, {})
    rows.append(dict(
        url=BASE + (path if path != '/' else '/'),
        path=path,
        page_type=m.get('page_type', 'home' if path == '/' else 'page'),
        title=html.unescape(' '.join(p.title.split())).replace(' — Civic Interplay', '').replace(' | Civic Interplay', '').replace(' · Civic Interplay', ''),
        h1=' | '.join(p.h1),
        subtitle=m.get('subtitle', ''),
        description=html.unescape(p.desc),
        section=m.get('section', ''),
        categories=m.get('categories', ''),
        published=m.get('published', ''),
        updated=m.get('updated', ''),
        author=m.get('author', ''),
        keywords=m.get('keywords', ''),
        headings=' | '.join(p.h2),
        word_count=len(body.split()),
        body_text=body,
        images='\n'.join(absolute(i) for i in dict.fromkeys(p.images)),
        canonical=p.canonical or BASE + path,
        feature_image=m.get('feature_image', ''),
        source_file=m.get('source_file', ''),
    ))

rows.sort(key=lambda r: (r['page_type'] not in ('home',), r['page_type'], r['published'] or '9999', r['path']))
with open(OUT, 'w', newline='', encoding='utf-8-sig') as fh:      # BOM so Excel reads the accents
    w = csv.writer(fh)
    w.writerow(['Title', 'Project', 'Action', 'Contents', 'Images', 'URL'])
    for r in rows:
        w.writerow([r['title'] or r['h1'], project(r['path']), '', r['body_text'], r['images'], r['canonical']])
print(f'{len(rows)} pages -> {OUT}')
from collections import Counter
print(Counter(r['page_type'] for r in rows))
print('empty bodies:', [r['path'] for r in rows if r['word_count'] < 20])
