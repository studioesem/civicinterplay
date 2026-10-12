-- Earlier states of the shared pad, so anyone signed in can roll back.
CREATE TABLE IF NOT EXISTS pad_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  saved_by TEXT,
  saved_at TEXT NOT NULL,
  kept_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
