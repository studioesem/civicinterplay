// Who is posting? Verifies the Cloudflare Access login cookie (a signed JWT)
// against the team's public keys, then maps the email to a first name from
// the POSTERS secret, e.g. {"name@example.org":"Sarah"}.
// Only people on that list can post, whatever Access lets through.

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

export async function currentPoster(request, env) {
  // Local development only: set DEV_USER to an email in .dev.vars.
  if (env.DEV_USER) return lookup(env.DEV_USER, env);
  if (!env.ACCESS_TEAM_DOMAIN || !env.POSTERS) return null;
  const cookie = request.headers.get('Cookie') || '';
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || (cookie.match(/CF_Authorization=([^;]+)/) || [])[1];
  if (!token) return null;
  try {
    const payload = await verifyAccessJwt(token, env);
    return payload?.email ? lookup(payload.email, env) : null;
  } catch {
    return null;
  }
}

function lookup(email, env) {
  let posters = {};
  try { posters = JSON.parse(env.POSTERS || '{}'); } catch {}
  const name = posters[email.toLowerCase()];
  return name ? { email: email.toLowerCase(), name } : null;
}
