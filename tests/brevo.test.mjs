import test from 'node:test';
import assert from 'node:assert/strict';
import { forms, syncContact } from '../netlify/lib/brevo.mjs';
const env = { BREVO_API_KEY: 'test-only-key' };
Object.values(forms).forEach(([key], index) => { env[key] = String(index + 28); });
const submission = name => ({ 'form-name': name, email: ' Ana@Example.org ', nome: ' Ana ', sobrenome: ' Silva ', telefone: '(37) 99999-0000', consent: 'sim', autorizacao: 'sim' });

test('eight forms route to lists 28–35 and preserve opt-outs', async () => {
  for (const [index, name] of Object.keys(forms).entries()) {
    const result = await syncContact(submission(name), { env, fetcher: async (url, options) => {
      assert.equal(url, 'https://api.brevo.com/v3/contacts');
      assert.equal(options.headers['api-key'], env.BREVO_API_KEY);
      const body = JSON.parse(options.body);
      assert.deepEqual(body.listIds, [28 + index]);
      assert.equal(body.email, 'ana@example.org');
      assert.equal(body.attributes.NOME, 'Ana');
      assert.equal(body.attributes.TELEFONE_SITE, '(37) 99999-0000');
      assert.equal(body.updateEnabled, true);
      assert.equal('emailBlacklisted' in body, false);
      assert.equal('smsBlacklisted' in body, false);
      assert.equal('forceMerge' in body, false);
      return { ok: true, status: 204 };
    }});
    assert.equal(result.listId, 28 + index);
  }
});
test('ignore unknown forms, missing consent, honeypot and invalid email without API calls', async () => {
  const fetcher = () => { throw new Error('Unexpected API request'); };
  for (const patch of [{ 'form-name': 'other' }, { autorizacao: '' }, { website: 'spam' }, { email: 'invalid' }]) {
    const result = await syncContact({ ...submission('newsletter-kuara'), ...patch }, { env, fetcher });
    assert.ok(result.skipped);
  }
});
test('missing or invalid list and missing key fail before calling API', async () => {
  for (const patch of [{ BREVO_LIST_HOME: '' }, { BREVO_LIST_HOME: '28,29' }, { BREVO_LIST_HOME: '-1' }, { BREVO_API_KEY: '' }]) {
    await assert.rejects(syncContact(submission('newsletter-kuara'), { env: { ...env, ...patch }, fetcher: () => assert.fail('Unexpected API request') }), /Brevo:/);
  }
});
test('transient failure retries; permanent failure does not expose contact or key', async () => {
  let calls = 0;
  await syncContact(submission('newsletter-kuara'), { env, wait: async () => {}, fetcher: async () => ++calls < 3 ? { ok: false, status: 429 } : { ok: true, status: 201 } });
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(syncContact(submission('newsletter-kuara'), { env, fetcher: async () => { calls++; return { ok: false, status: 401 }; } }), error => !error.message.includes('Example') && !error.message.includes(env.BREVO_API_KEY) && error.message.includes('401'));
  assert.equal(calls, 1);
});
test('missing surname never overwrites existing surname; WhatsApp is retained as text', async () => {
  const data = { ...submission('interesse-forno-de-latao'), sobrenome: '', telefone: '', whatsapp: '+55 37 99999-0000' };
  await syncContact(data, { env, fetcher: async (_, options) => {
    const { attributes } = JSON.parse(options.body);
    assert.equal('SOBRENOME' in attributes, false);
    assert.equal(attributes.TELEFONE_SITE, data.whatsapp);
    return { ok: true };
  }});
});

test('reject oversized or control-character email without contacting Brevo', async () => {
  for (const email of ['a'.repeat(200)+'@example.org', 'a\u0000@example.org']) {
    const result = await syncContact({ ...submission('newsletter-kuara'), email }, { env, fetcher: () => assert.fail('Unexpected API request') });
    assert.equal(result.skipped, 'invalid-email');
  }
});
test('client fields cannot select lists or overwrite API flags; redirects are forbidden', async () => {
  await syncContact({ ...submission('newsletter-kuara'), listIds: [35], updateEnabled: false, emailBlacklisted: false }, { env, fetcher: async (_, options) => {
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.listIds, [28]);
    assert.equal('emailBlacklisted' in body, false);
    return { ok: true };
  }});
});
