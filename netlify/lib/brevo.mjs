export const forms = Object.freeze({
  'newsletter-kuara': ['BREVO_LIST_HOME', 'autorizacao'],
  'newsletter-escritos': ['BREVO_LIST_BLOG', 'autorizacao'],
  'interesse-ceramica-geopoetica': ['BREVO_LIST_GEOPOETICA', 'consent'],
  'interesse-forno-de-latao': ['BREVO_LIST_FORNO_LATAO', 'consent'],
  'interesse-pre-colombiano': ['BREVO_LIST_PRE_COLOMBIANO', 'consent'],
  'interesse-queimas-poeticas': ['BREVO_LIST_QUEIMAS_POETICAS', 'consent'],
  'avisos-politicas-sociais': ['BREVO_LIST_POLITICAS_SOCIAIS', 'autorizacao'],
  'contato-kuara': ['BREVO_LIST_CONTATO', 'autorizacao'],
});

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

// Called only by the Netlify-verified form event, never directly from the browser.
export async function syncContact(data, { env = process.env, fetcher = fetch,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const name = clean(data?.['form-name'], 100);
  if (!Object.hasOwn(forms, name)) return { skipped: 'unmapped-form' };
  const [variable, consent] = forms[name];
  if (clean(data.website, 200) || data[consent] !== 'sim') return { skipped: 'no-consent-or-spam' };
  // Reject oversized identifiers instead of silently changing their identity.
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (email.length > 200 || /[\u0000-\u001f\u007f]/.test(email)) return { skipped: 'invalid-email' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { skipped: 'invalid-email' };
  const list = env[variable];
  if (!/^\d+$/.test(list || '') || !Number.isSafeInteger(Number(list)) || Number(list) < 1) {
    throw new Error(`Brevo: configure ${variable} with a positive list ID.`);
  }
  if (!env.BREVO_API_KEY?.trim()) throw new Error('Brevo: BREVO_API_KEY is missing.');
  const attributes = {};
  for (const [key, value, limit] of [
    ['NOME', data.nome, 100], ['SOBRENOME', data.sobrenome, 100],
    ['TELEFONE_SITE', data.telefone || data.whatsapp, 30],
  ]) {
    const text = clean(value, limit);
    if (text) attributes[key] = text;
  }
  const body = JSON.stringify({ email, attributes, listIds: [Number(list)], updateEnabled: true });
  // No blacklist or forceMerge flags: preserve opt-outs and other list memberships.
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetcher('https://api.brevo.com/v3/contacts', {
        method: 'POST', headers: { 'api-key': env.BREVO_API_KEY.trim(), 'Content-Type': 'application/json', Accept: 'application/json' },
        body, redirect: 'error', signal: AbortSignal.timeout(8000),
      });
    } catch {
      if (attempt === 2) throw new Error(`Brevo: network failure for ${name}; submission remains in Netlify Forms.`);
      await wait(500 * (attempt + 1));
      continue;
    }
    if (response.ok) return { synced: true, form: name, listId: Number(list) };
    if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
      await wait(500 * (attempt + 1));
      continue;
    }
    // Don't log response bodies: they may contain submitted personal information.
    throw new Error(`Brevo: HTTP ${response.status} for ${name}; submission remains in Netlify Forms.`);
  }
}
