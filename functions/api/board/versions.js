// GET /api/board/versions  posters only: kept versions of the board, newest first
import { currentPoster } from '../../../lib-functions/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function onRequestGet({ request, env }) {
  if (!(await currentPoster(request, env))) return json({ error: 'Sign in to see the board.' }, 401);
  const { results } = await env.NOTES.prepare(
    'SELECT id, shapes, saved_by, saved_at FROM board_versions ORDER BY id DESC'
  ).all();
  return json({ versions: results });
}
