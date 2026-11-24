// GET    /api/people               admins only: everyone on the list
// Adds and removes are recorded in people_log (who, when) but not shown on
// the page. Read them with: wrangler d1 execute civicinterplay-notes --remote
//   --command "SELECT * FROM people_log ORDER BY id DESC"
// POST   /api/people {email,name}  admins only: add someone (or rename them)
// DELETE /api/people?email=...     admins only: remove someone
// Admins come from the ADMINS secret and can't be removed here, so nobody can
// make themselves an admin or lock the others out through this page.
import { currentPoster, admins } from '../../lib-functions/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i;

async function admin(request, env) {
  const me = await currentPoster(request, env);
  return me?.admin ? me : null;
}

async function list(env) {
  const people = (await env.NOTES.prepare('SELECT email, name, added_by, added_at FROM people ORDER BY lower(name), email').all()).results;
  const fixed = admins(env);
  const listed = new Set(people.map((p) => p.email));
  for (const [email, name] of Object.entries(fixed)) {
    if (!listed.has(email)) people.push({ email, name, added_by: null, added_at: null });
  }
  for (const p of people) p.admin = p.email in fixed;
  return { people };
}

export async function onRequestGet({ request, env }) {
  if (!(await admin(request, env))) return json({ error: 'Only Sarah and Amber can manage people.' }, 403);
  return json(await list(env));
}

export async function onRequestPost({ request, env }) {
  const me = await admin(request, env);
  if (!me) return json({ error: 'Only Sarah and Amber can manage people.' }, 403);
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (!EMAIL.test(email)) return json({ error: 'That doesn’t look like an email address.' }, 400);
  if (!name) return json({ error: 'Add a first name. It shows next to their notes.' }, 400);
  if (email in admins(env)) return json({ error: 'Admins are set in Cloudflare, not here.' }, 400);
  const existed = await env.NOTES.prepare('SELECT 1 FROM people WHERE email = ?').bind(email).first();
  await env.NOTES.batch([
    env.NOTES.prepare('INSERT INTO people (email, name, added_by) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name').bind(email, name, me.name),
    env.NOTES.prepare('INSERT INTO people_log (action, email, name, done_by) VALUES (?, ?, ?, ?)').bind(existed ? 'renamed' : 'added', email, name, me.name),
  ]);
  return json(await list(env));
}

export async function onRequestDelete({ request, env }) {
  const me = await admin(request, env);
  if (!me) return json({ error: 'Only Sarah and Amber can manage people.' }, 403);
  const email = (new URL(request.url).searchParams.get('email') || '').trim().toLowerCase();
  if (email in admins(env)) return json({ error: 'Admins can’t be removed here.' }, 400);
  const row = await env.NOTES.prepare('SELECT name FROM people WHERE email = ?').bind(email).first();
  if (!row) return json({ error: 'Not on the list.' }, 404);
  await env.NOTES.batch([
    env.NOTES.prepare('DELETE FROM people WHERE email = ?').bind(email),
    env.NOTES.prepare('INSERT INTO people_log (action, email, name, done_by) VALUES (?, ?, ?, ?)').bind('removed', email, row.name, me.name),
  ]);
  return json(await list(env));
}
