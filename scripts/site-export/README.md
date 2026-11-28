# Site export

CSV exports of the public pages on civicinterplay.io. Draft.

- `export_site.py` reads the built site (`dist/`) and `src/content`, and writes one row per public page: Title, Project, Action, Contents, Images, URL. Run `npm run build` first.
- `export_by_verb.py` writes the shorter list for sorting assets by verb: Topic, Theme, Key content, Images, Format, Verb, URL. It reads the two dated CSVs in this folder. Theme, Format and Verb are set by hand in the `MAP` at the top of the script (verbs: read, dig, make, breathe, drop).
- A copy of the outputs is kept in Dropbox: `2023/FELLOWSHIP/PROJECTS/CIVIC INTERPLAY/Site export/`.

Team and login pages (/board, /pad, /people, /login) and /embed frames are left out.
