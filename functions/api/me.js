// GET /api/me   { name, admin, signedIn }
// name is set only for people on the list. signedIn is true for anyone who
// got through Access, so pages can say "you're signed in but not on the list".
import { signedInEmail, lookupPerson } from '../../lib-functions/auth.js';

export async function onRequestGet({ request, env }) {
  const email = await signedInEmail(request, env);
  const me = await lookupPerson(email, env);
  return new Response(JSON.stringify({ name: me?.name ?? null, admin: !!me?.admin, signedIn: !!email }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
