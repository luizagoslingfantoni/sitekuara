import { guardForm } from '../lib/turnstile-guard.mjs';
export default async (request, context) => {
  try {
    return await guardForm(request, context, { secret: Netlify.env.get('TURNSTILE_SECRET_KEY') });
  } catch {
    return new Response('O formulário está temporariamente indisponível.', { status:503, headers:{ 'Cache-Control':'no-store', 'Content-Type':'text/plain; charset=utf-8' } });
  }
};
export const config = { path:'/*', method:'POST' };
