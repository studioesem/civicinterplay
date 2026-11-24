// Who is posting? Verifies the Cloudflare Access login cookie (a signed JWT)
// against the team's public keys, then looks the email up in the `people`
// table in D1 (managed at /people). Only people on that list can post, edit
// the pad or use the board, whatever Access lets through. Access only proves
// the person owns the email address.
//
// ADMINS secret: {"name@example.org":"Sarah"}. Admins can add and remove
// people, are always on the list, and can't be removed from the page.
// POSTERS secret: the old list. Only used once, to fill an empty table.

let certsCache = null;

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function getKeys(team) {
  if (certsCache && certsCache.team === team && Date.now() - certsCache.at < 3600_000) return certsCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  const { keys } = await res.json();
  certsCache = { team, keys, at: Date.now() };
  return keys;
}

async function verifyAccessJwt(token, env) {
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) return null;
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  const jwk = (await getKeys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  // The audience check is optional: if ACCESS_AUD is set, the token must be
  // for that app. Either way it must be signed by our team's keys, and the
  // email must be on the POSTERS list.
  if (env.ACCESS_AUD) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ACCESS_AUD)) return null;
  }
  if (payload.iss && payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return payload;
}

// The verified email of whoever is signed in through Access, or null.
// Says nothing about whether they're on the list.
export async function signedInEmail(request, env) {
  // Local development only: set DEV_USER to an email in .dev.vars.
  if (env.DEV_USER) return env.DEV_USER.toLowerCase();
  if (!env.ACCESS_TEAM_DOMAIN) return null;
  const cookie = request.headers.get('Cookie') || '';
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || (cookie.match(/CF_Authorization=([^;]+)/) || [])[1];
  if (!token) return null;
  try {
    const payload = await verifyAccessJwt(token, env);
    return payload?.email ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

function parseList(raw) {
  try {
    const obj = JSON.parse(raw || '{}');
    return Object.fromEntries(Object.entries(obj).map(([e, n]) => [e.toLowerCase(), n]));
  } catch {
    return {};
  }
}

export const admins = (env) => parseList(env.ADMINS);
export const isAdmin = (email, env) => !!email && email in admins(env);

// Fill an empty people table from the old POSTERS secret, once.
async function seed(env) {
  const row = await env.NOTES.prepare('SELECT COUNT(*) AS n FROM people').first();
  if (row && row.n > 0) return;
  const old = { ...parseList(env.POSTERS), ...admins(env) };
  const rows = Object.entries(old);
  if (!rows.length) return;
  await env.NOTES.batch(rows.flatMap(([email, name]) => [
    env.NOTES.prepare('INSERT OR IGNORE INTO people (email, name, added_by) VALUES (?, ?, ?)').bind(email, name, 'imported'),
    env.NOTES.prepare('INSERT INTO people_log (action, email, name, done_by) VALUES (?, ?, ?, ?)').bind('imported', email, name, 'imported'),
  ]));
}

// { email, name, admin } for someone signed in AND on the list, else null.
export async function lookupPerson(email, env) {
  if (!email) return null;
  // Seed before anything else, so the old list is copied across whoever
  // signs in first (an admin's first add must not skip it).
  if (env.NOTES) await seed(env);
  const adminName = admins(env)[email];
  if (adminName) return { email, name: adminName, admin: true };
  if (!env.NOTES) return null;
  const row = await env.NOTES.prepare('SELECT name FROM people WHERE email = ?').bind(email).first();
  return row ? { email, name: row.name, admin: false } : null;
}

export async function currentPoster(request, env) {
  return lookupPerson(await signedInEmail(request, env), env);
}
