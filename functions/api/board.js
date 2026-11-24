// GET /api/board         posters only: the shared whiteboard (tldraw snapshot JSON)
// GET /api/board?meta=1  posters only: who saved last and when, without the body
// PUT /api/board         posters only: { body, base, keep } where base is the
//                        updated_at the editor started from; a mismatch means
//                        someone else saved first (409, with their copy).
// Before a save replaces the board, the old one is kept in board_versions when
// it's someone else's, a large cut, a restore, or 10 minutes since the last
// kept copy. The last 50 are kept. Same rules as the pad.
import { currentPoster } from '../../lib-functions/auth.js';

const MAX = 1_800_000; // D1 caps a single value at 2 MB
const KEEP = 50;
const GAP_MS = 10 * 60 * 1000;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const read = (env) => env.NOTES.prepare('SELECT body, updated_by, updated_at FROM board WHERE id = 1').first();
const empty = { body: '', updated_by: null, updated_at: null };

function countShapes(body) {
  try {
    const store = JSON.parse(body)?.store || {};
    return Object.values(store).filter((r) => r && r.typeName === 'shape').length;
  } catch {
    return 0;
  }
}

export async function onRequestGet({ request, env }) {
  if (!(await currentPoster(request, env))) return json({ error: 'Sign in to see the board.' }, 401);
  if (new URL(request.url).searchParams.has('meta')) {
    const row = await env.NOTES.prepare('SELECT updated_by, updated_at FROM board WHERE id = 1').first();
    return json(row || { updated_by: null, updated_at: null });
  }
  return json((await read(env)) || empty);
}

export async function onRequestPut({ request, env }) {
  const me = await currentPoster(request, env);
  if (!me) return json({ error: 'Sign in to edit the board.' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const body = String(data.body ?? '');
  if (body.length > MAX) return json({ error: 'The board is full.' }, 400);
  if (body) {
    try { if (!JSON.parse(body)?.store) throw new Error(); } catch { return json({ error: 'Bad board data.' }, 400); }
  }
  const cur = await read(env);
  if (data.base != null && cur && cur.updated_at !== data.base) return json({ error: 'conflict', current: cur }, 409);
  await keepVersion(env, cur, me, body, data.keep === true);
  const row = await env.NOTES.prepare(
    `UPDATE board SET body = ?, updated_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = 1 AND (? IS NULL OR updated_at = ?) RETURNING body, updated_by, updated_at`
  ).bind(body, me.name, data.base ?? null, data.base ?? null).first();
  if (!row) return json({ error: 'conflict', current: (await read(env)) || empty }, 409);
  return json({ updated_by: row.updated_by, updated_at: row.updated_at });
}

async function keepVersion(env, cur, me, next, force) {
  if (!cur || !cur.body.trim() || cur.body === next) return;
  const last = await env.NOTES.prepare('SELECT kept_at FROM board_versions ORDER BY id DESC LIMIT 1').first();
  const stale = !last || Date.now() - Date.parse(last.kept_at) > GAP_MS;
  const theirs = cur.updated_by && cur.updated_by !== me.name;
  const shapes = countShapes(cur.body);
  const bigCut = countShapes(next) < shapes * 0.6;
  if (!(force || stale || theirs || bigCut)) return;
  await env.NOTES.batch([
    env.NOTES.prepare('INSERT INTO board_versions (body, shapes, saved_by, saved_at) VALUES (?, ?, ?, ?)').bind(cur.body, shapes, cur.updated_by, cur.updated_at),
    env.NOTES.prepare('DELETE FROM board_versions WHERE id NOT IN (SELECT id FROM board_versions ORDER BY id DESC LIMIT ?)').bind(KEEP),
  ]);
}
