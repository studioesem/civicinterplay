// GET /api/me   { name } when signed in as a poster, otherwise { name: null }
import { currentPoster } from '../../lib-functions/auth.js';

export async function onRequestGet({ request, env }) {
  const me = await currentPoster(request, env);
  return new Response(JSON.stringify({ name: me?.name ?? null }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
