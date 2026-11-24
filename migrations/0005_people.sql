-- Who can post, edit the pad and use the board. Managed from /people by the
-- admins named in the ADMINS secret. Replaces the POSTERS secret: the first
-- time the table is read and found empty, it is filled from POSTERS.
-- No emails live in this file (the repo is public).
CREATE TABLE IF NOT EXISTS people (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  added_by TEXT,
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Every add and remove, with who did it.
CREATE TABLE IF NOT EXISTS people_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  done_by TEXT,
  done_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
