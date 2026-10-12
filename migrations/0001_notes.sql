-- Short reflections left on pages by invited people.
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,          -- path, e.g. /projects/
  name TEXT NOT NULL,          -- first name, from the poster list, never typed
  email TEXT NOT NULL,         -- kept for ownership; never returned publicly
  body TEXT NOT NULL,          -- up to 280 characters
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS notes_page ON notes (page, created_at);
