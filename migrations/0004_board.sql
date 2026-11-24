-- One shared whiteboard for signed-in people. Never served publicly.
-- The board is a tldraw document snapshot stored as JSON text.
CREATE TABLE IF NOT EXISTS board (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT OR IGNORE INTO board (id, body) VALUES (1, '');

-- Earlier states of the board, so anyone signed in can roll back.
CREATE TABLE IF NOT EXISTS board_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  shapes INTEGER NOT NULL DEFAULT 0,
  saved_by TEXT,
  saved_at TEXT NOT NULL,
  kept_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
