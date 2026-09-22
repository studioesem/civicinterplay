# Builds the A4 print copy of the walk from the artifact source.
# Swaps the Google Fonts link for the self-hosted faces, because headless
# Chrome will not fetch webfonts and silently falls back to a system serif.
import re, sys

src = open(sys.argv[1]).read()
src = re.sub(r'<link rel="pre(connect|load)".*?>\n', '', src)
src = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n', '', src)
title = re.search(r'<title>(.*?)</title>', src).group(1)
src = src.replace('<title>%s</title>\n' % title, '')

F = '/Users/sarahlbarns/Projects/studioesem/civicinterplay/application-dsa/fonts'
faces = ''.join(
    "  @font-face{font-family:'%s';font-style:%s;font-weight:%s;"
    "src:url('file://%s/%s-latin-%s-%s.woff2') format('woff2');font-display:block}\n"
    % (fam, st, w, F, slug, w, st)
    for fam, slug, cuts in [
        ("Fira Sans", "fira-sans", [(300, 'normal'), (400, 'normal'), (500, 'normal'), (600, 'normal')]),
        ("Merriweather", "merriweather", [(300, 'normal'), (400, 'normal'), (700, 'normal'),
                                          (300, 'italic'), (400, 'italic')])]
    for w, st in cuts)

PRINT = """
<style>
  @page { size: A4; margin: 14mm 15mm 13mm; }

  @media print {
    html { font-size: 11.5px; }
    body { background: #fff; }
    .wrap { max-width: none; padding: 0; }

    header.page { margin-bottom: 1.6rem; padding-bottom: 1.2rem; }
    section { margin-bottom: 2rem; }

    .said { box-shadow: none; border: 1px solid var(--border-light); }
    .guide { box-shadow: none; }

    .move, .reg, .guide, .field, .rule-band, .pairing, .sheet { break-inside: avoid; }
    .section-head { break-after: avoid; }
    .page-break { break-before: page; }

    /* Cut lines for the guide cards. All six belong on one sheet. */
    .guides { gap: 0; grid-template-columns: 1fr 1fr; }
    .guide {
      border: 1px dashed rgba(28,25,23,0.35);
      border-left: 8px solid var(--hue);
      margin: 0;
      padding: 0.7rem 0.85rem 0.8rem;
    }
    .guide h3 { font-size: 1.25rem; margin-bottom: 0.05rem; }
    .guide .key { margin-bottom: 0.5rem; font-size: 0.74rem; }
    .guide dl { font-size: 0.8rem; gap: 0.25rem 0.7rem; grid-template-columns: 6rem 1fr; }
    .guide dt { font-size: 0.6rem; padding-top: 0.22rem; }
    .guide .emblem { top: 0.7rem; right: 0.85rem; width: 4.1rem; height: 3.05rem; }
    .guide .who, .guide h3, .guide .key { padding-right: 4.7rem; }
    .pairing { margin-top: 0.9rem; font-size: 0.82rem; padding: 0.7rem 0.9rem; }
  }
</style>
"""

out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<title>%s</title>\n<style>\n%s</style>\n' % (title, faces)
       + src.rstrip() + '\n' + PRINT + '\n</body>\n</html>\n')
out = out.replace('<style>\n  :root {', '</head>\n<body>\n<style>\n  :root {', 1)
open(sys.argv[2], 'w').write(out)
print('print copy built')
