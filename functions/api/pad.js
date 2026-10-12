// GET /api/pad  posters only: the shared scratch pad
// PUT /api/pad  posters only: { body, base } where base is the updated_at the
//               editor started from; a mismatch means someone else saved first.
import { currentPoster } from '../../lib-functions/auth.js';

const MAX = 200_000;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const read = (env) => env.NOTES.prepare('SELECT body, updated_by, updated_at FROM pad WHERE id = 1').first();

export async function onRequestGet({ request, env }) {
  if (!(await currentPoster(request, env))) return json({ error: 'Sign in to see the pad.' }, 401);
  return json((await read(env)) || { body: '', updated_by: null, updated_at: null });
}

export async function onRequestPut({ request, env }) {
  const me = await currentPoster(request, env);
  if (!me) return json({ error: 'Sign in to edit the pad.' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const body = String(data.body ?? '');
  if (body.length > MAX) return json({ error: 'The pad is full.' }, 400);
  const row = await env.NOTES.prepare(
    `UPDATE pad SET body = ?, updated_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = 1 AND (? IS NULL OR updated_at = ?) RETURNING body, updated_by, updated_at`
  ).bind(body, me.name, data.base ?? null, data.base ?? null).first();
  if (!row) return json({ error: 'conflict', current: await read(env) }, 409);
  return json(row);
}
