// GET  /api/notes?page=/path/   public: the reflections for a page
// POST /api/notes               posters only: { page, body }
import { currentPoster } from '../../lib-functions/auth.js';

const MAX = 280;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const cleanPage = (p) => (typeof p === 'string' && /^\/[\w\-\/.%]*$/.test(p) && p.length < 200 ? p : null);

export async function onRequestGet({ request, env }) {
  const page = cleanPage(new URL(request.url).searchParams.get('page'));
  if (!page) return json({ notes: [] });
  const me = await currentPoster(request, env);
  const { results } = await env.NOTES.prepare(
    'SELECT id, name, email, body, created_at FROM notes WHERE page = ? ORDER BY created_at ASC LIMIT 50'
  ).bind(page).all();
  const notes = results.map(({ email, ...n }) => ({ ...n, mine: !!me && me.email === email }));
  return json({ notes });
}

export async function onRequestPost({ request, env }) {
  const me = await currentPoster(request, env);
  if (!me) return json({ error: 'Sign in to leave a note.' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const page = cleanPage(data.page);
  const body = String(data.body || '').trim().replace(/\s+\n/g, '\n');
  if (!page || !body) return json({ error: 'A note needs some words.' }, 400);
  if (body.length > MAX) return json({ error: `Keep it to ${MAX} characters.` }, 400);
  const row = await env.NOTES.prepare(
    'INSERT INTO notes (page, name, email, body) VALUES (?, ?, ?, ?) RETURNING id, name, body, created_at'
  ).bind(page, me.name, me.email, body).first();
  return json({ note: { ...row, mine: true } }, 201);
}
