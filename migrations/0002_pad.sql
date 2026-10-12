-- One shared scratch pad for signed-in people. Never served publicly.
CREATE TABLE IF NOT EXISTS pad (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT OR IGNORE INTO pad (id, body) VALUES (1, '');
