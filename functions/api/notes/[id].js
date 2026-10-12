// DELETE /api/notes/:id   posters can remove their own notes
import { currentPoster } from '../../../lib-functions/auth.js';

export async function onRequestDelete({ request, env, params }) {
  const me = await currentPoster(request, env);
  if (!me) return new Response('Sign in first.', { status: 401 });
  const id = Number(params.id);
  const { meta } = await env.NOTES.prepare('DELETE FROM notes WHERE id = ? AND email = ?').bind(id, me.email).run();
  return new Response(null, { status: meta.changes ? 204 : 404 });
}
