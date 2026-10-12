// GET /api/pad/versions/:id  posters only: the full text of one kept version
import { currentPoster } from '../../../../lib-functions/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function onRequestGet({ request, env, params }) {
  if (!(await currentPoster(request, env))) return json({ error: 'Sign in to see the pad.' }, 401);
  const row = await env.NOTES.prepare('SELECT id, body, saved_by, saved_at FROM pad_versions WHERE id = ?').bind(Number(params.id)).first();
  return row ? json(row) : json({ error: 'Not found.' }, 404);
}
