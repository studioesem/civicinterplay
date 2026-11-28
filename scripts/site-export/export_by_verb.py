#!/usr/bin/env python3
"""Simplified asset list, one row per public page, for sorting by verb.
Columns: Topic, Theme, Key content, Images, Format, Verb, URL.
Reads the two existing exports in this folder (26 Nov for descriptions, 27 Nov for topic + images).
Theme, Format and Verb are a hand-assigned first pass (28 Nov 2026). Draft: edit freely.
"""
import csv, pathlib, sys
HERE = pathlib.Path(__file__).parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'civic-interplay-assets-by-verb-2026-11-28.csv'

# path: (theme, format, verb)
MAP = {
 '/': ('Civic Interplay overview', 'Home page', 'read'),
 '/about': ('Civic Interplay overview', 'Page', 'read'),
 '/projects': ('Civic Interplay overview', 'Index page', 'read'),
 '/proposition': ('Legibility and accountability of digital infrastructure', 'Position statement', 'read'),
 '/join': ('Taking part', 'Invitation', 'drop'),
 '/what-can-you-do-here': ('Taking part', 'Invitation', 'drop'),
 '/reading': ('Civic AI and participatory AI', 'Reading list', 'read'),
 '/listening': ('Civic AI and participatory AI', 'Live tool (literature search)', 'dig'),
 '/terrain': ('Texts and noticings', 'Live tool (semantic map)', 'breathe'),
 '/facts-and-moments': ('Energy transmission and AI infrastructure', 'Card set', 'dig'),
 '/player': ('Ethical media', 'Live tool (video player)', 'make'),
 '/walk': ('Walking a place', 'Audio walk', 'breathe'),
 '/sovereignties': ('Data centres and AI infrastructure', 'Project hub', 'dig'),
 '/submission': ('Data centres and AI infrastructure', 'Inquiry submission', 'read'),
 '/data-centres-map': ('Data centres and AI infrastructure', 'Live tool (map)', 'dig'),
 '/field-notes/ai-stack': ('Data centres and AI infrastructure', 'Field note (diagram)', 'read'),
 '/field-notes/benefit-ladder': ('Community benefit from data centres', 'Field note (diagram)', 'read'),
 '/gathering-intelligences': ('Place and public value', 'Method guide', 'read'),
 '/gathering-intelligences/assemble': ('Place and public value', 'Method step 1', 'dig'),
 '/gathering-intelligences/dig': ('Place and public value', 'Method step 2', 'dig'),
 '/gathering-intelligences/making-sense': ('Place and public value', 'Method step 3', 'make'),
 '/gathering-intelligences/sense-checking': ('Place and public value', 'Method step 4', 'breathe'),
 '/experiments/side-angle-on-place-flows': ('Place and public value', 'Experiment (visual)', 'dig'),
 '/experiments/side-angle-on-the-western-parkland-city': ('Place and public value', 'Experiment (visual)', 'dig'),
 '/we-care-rmit': ('Participatory storytelling', 'Project', 'make'),
 '/civic-interplay-toolkit': ('Method', 'Toolkit (GitHub)', 'make'),
 '/digital-ecological-footprint': ('Digital footprint', 'Calculator', 'make'),
 '/you-me-data-and-the-city': ('Data and the city', 'Essay', 'read'),
 '/indy-johar-planetary-civics-2023': ('Planetary civics', 'Conversation', 'read'),
 '/indy-johar-planetary-civics-2023-transcript': ('Planetary civics', 'Transcript', 'read'),
 '/rosi-braidotti-planetary-civics-2024': ('Planetary civics', 'Conversation', 'read'),
 '/rosi-braidotti-planetary-civics-2024-transcript': ('Planetary civics', 'Transcript', 'read'),
 '/learning-to-be-planetary-citizens': ('Planetary civics', 'Essay', 'read'),
 '/micro-political-imaginaries': ('Planetary civics', 'Essay', 'read'),
 '/mystical-language-loops-with-benjamin': ('Language and storytelling', 'Essay', 'breathe'),
 '/the-many-afterlives-of-albert-einstein': ('Creativity and technology', 'Essay', 'read'),
 '/the-active-interface': ('Creativity and technology', 'Essay', 'read'),
 '/can-we-shift-our-mindset': ('Digital footprint', 'Essay', 'breathe'),
 '/what-is-civic-interplay': ('Civic Interplay overview', 'Essay', 'read'),
 '/towards-civic-ai': ('Civic AI and participatory AI', 'Position paper', 'read'),
 '/civic-ai-storybox-remix-2025': ('Public space media', 'Note', 'read'),
 '/at-de-ceuvel': ('Gatherings', 'Note (gathering)', 'breathe'),
 '/what-time-are-we-living-in': ('AI companies and governance', 'Note', 'breathe'),
 '/anthropic-civitas': ('AI companies and governance', 'Note', 'read'),
 '/jack-clark-on-ai': ('AI companies and governance', 'Note', 'read'),
 '/clark-and-the-s1': ('AI companies and governance', 'Side-by-side comparison', 'dig'),
}
VERB_ORDER = ['read', 'dig', 'make', 'breathe', 'drop']

old = {r['path']: r for r in csv.DictReader(open(HERE / 'civic-interplay-site-content-2026-11-26.csv', encoding='utf-8-sig'))}
new = {r['URL'].replace('https://civicinterplay.io', '').rstrip('/') or '/': r
       for r in csv.DictReader(open(HERE / 'civic-interplay-site-content-2026-11-27.csv', encoding='utf-8-sig'))}
missing = set(new) ^ set(MAP)
assert not missing, f'unmapped or stale paths: {missing}'

rows = []
for path, r in new.items():
    theme, fmt, verb = MAP[path]
    o = old.get(path, {})
    key = o.get('description') or o.get('subtitle') or r['Title']
    rows.append([r['Project'], theme, f"{r['Title']}: {key}", r['Images'], fmt, verb, r['URL']])
rows.sort(key=lambda x: (VERB_ORDER.index(x[5]), x[0], x[1], x[2]))
with open(OUT, 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.writer(fh)
    w.writerow(['Topic', 'Theme', 'Key content', 'Images', 'Format', 'Verb', 'URL'])
    w.writerows(rows)
from collections import Counter
print(len(rows), 'rows ->', OUT); print(Counter(x[5] for x in rows))
