// GET /api/pad/versions  posters only: kept versions of the pad, newest first
import { currentPoster } from '../../../lib-functions/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function onRequestGet({ request, env }) {
  if (!(await currentPoster(request, env))) return json({ error: 'Sign in to see the pad.' }, 401);
  const { results } = await env.NOTES.prepare(
    'SELECT id, saved_by, saved_at, length(body) AS chars, substr(body, 1, 90) AS preview FROM pad_versions ORDER BY id DESC'
  ).all();
  return json({ versions: results });
}
