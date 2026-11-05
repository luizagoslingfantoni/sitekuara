import { signForm } from './form-proof.mjs';
const names = new Set(['newsletter-kuara','newsletter-escritos','interesse-ceramica-geopoetica','interesse-forno-de-latao','interesse-pre-colombiano','interesse-queimas-poeticas','avisos-politicas-sociais','contato-kuara','pedido-fornos-de-tijolos','interesse-fornos-de-tijolos','pedido-barros-artesanais','interesse-barros-artesanais']);
const single = ['form-name','email','nome','sobrenome','telefone','whatsapp','consent','autorizacao','website','cf-turnstile-response'];
const fail = (status, message) => new Response(message, { status, headers: { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' } });

export async function guardForm(request, context, { secret, fetcher = fetch } = {}) {
  if (request.method !== 'POST') return context.next();
  const url = new URL(request.url);
  const type = request.headers.get('content-type') || '';
  // Netlify's signed event functions receive JSON, never browser form submissions.
  if (url.pathname.startsWith('/.netlify/functions/') && type.startsWith('application/json')) return context.next();
  if (!type.toLowerCase().startsWith('application/x-www-form-urlencoded')) return fail(415, 'Formato de envio não permitido.');
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return fail(403, 'Envie o formulário pelo próprio site.');
  if (!secret) return fail(503, 'O formulário está temporariamente indisponível. Tente novamente mais tarde.');
  if (Number(request.headers.get('content-length')) > 32768) return fail(413, 'O formulário excedeu o tamanho permitido.');
  const reader = request.body?.getReader();
  if (!reader) return fail(400, 'Formulário vazio.');
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 32768) { await reader.cancel(); return fail(413, 'O formulário excedeu o tamanho permitido.'); }
      chunks.push(value);
    }
  } catch { return fail(400, 'Não foi possível ler o formulário.'); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const fields = new URLSearchParams(new TextDecoder().decode(bytes));
  if (single.some(name => fields.getAll(name).length > 1)) return fail(400, 'Há campos duplicados no formulário.');
  const data = Object.fromEntries(fields);
  if (!names.has(data['form-name'])) return fail(400, 'Formulário não reconhecido.');
  if (data.website?.trim()) return fail(400, 'Não foi possível validar o envio.');
  if (data.consent !== 'sim' && data.autorizacao !== 'sim') return fail(400, 'Confirme a autorização para contato.');
  const email = (data.email || '').trim();
  if (email.length > 200 || /[\u0000-\u001f\u007f]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, 'Confira seu e-mail.');
  const token = data['cf-turnstile-response'];
  if (!token || token.length > 2048) return fail(403, 'Conclua a verificação de segurança e tente novamente.');
  let verdict;
  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ secret, response:token }),
      redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    verdict = await response.json();
    if (!response.ok) {
      const codes = Array.isArray(verdict['error-codes']) ? verdict['error-codes'] : [];
      console.error('Turnstile verification HTTP', response.status, codes.join(','));
      if (codes.includes('invalid-input-secret') || codes.includes('missing-input-secret')) return fail(503, 'O formulário está indisponível por um erro de configuração da verificação de segurança.');
      return fail(503, 'A verificação está indisponível. Tente novamente.');
    }
  } catch (error) { console.error('Turnstile verification failed:', error.name, error.message); return fail(503, 'A verificação está indisponível. Tente novamente.'); }
  if (verdict.success !== true || verdict.hostname !== url.hostname || verdict.action !== data['form-name']) return fail(403, 'A verificação expirou ou não foi aceita. Tente novamente.');
  // Sign only validated contact fields. The visitor cannot supply this proof.
  fields.set('kuara-verification', await signForm(data, secret));
  fields.set('cf-turnstile-response', '');
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  return context.next(new Request(request.url, { method:'POST', headers, body:fields.toString() }));
}
