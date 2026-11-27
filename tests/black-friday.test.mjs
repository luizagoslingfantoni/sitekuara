import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blackFridayDestination, salesOnHold } from '../netlify/lib/black-friday.mjs';
import { guardForm } from '../netlify/lib/turnstile-guard.mjs';
import { verifiedEventData } from '../netlify/lib/form-event.mjs';
import { syncContact } from '../netlify/lib/brevo.mjs';

test('released campaign opens at midnight Brasília, including the exact boundary', () => {
 assert.equal(salesOnHold, false);
 assert.equal(blackFridayDestination(Date.parse('2026-11-27T02:59:59.999Z')), null);
 for (const instant of [
  '2026-11-27T03:00:00.000Z',
  '2026-11-27T00:00:00-03:00',
  '2026-11-28T12:00:00-03:00',
 ]) assert.equal(blackFridayDestination(Date.parse(instant)), '/black-friday/vendas');
});

test('published presale identifier is accepted by Turnstile and matches the submitted form', () => {
 const html = readFileSync(new URL('../black-friday/index.html', import.meta.url), 'utf8');
 const name = html.match(/<form[^>]*name="([^"]+)"/)[1];
 assert.match(name, /^[a-z0-9_-]{1,32}$/i);
 assert.equal(name, html.match(/name="form-name" value="([^"]+)"/)[1]);
});

test('presale is signed and stored independently without enrolling in another campaign', async () => {
 const name = 'pre-venda-black-friday-2026';
 const secret = 'test-only';
 const fields = { 'form-name': name, nome: 'Teste', sobrenome: 'Cadastro', email: 'teste@example.org', autorizacao: 'sim', 'cf-turnstile-response': 'test-token' };
 const request = new Request('https://kuaraceramicas.com.br/black-friday/obrigado/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams(fields) });
 let stored;
 const response = await guardForm(request, {next:async req => { stored = Object.fromEntries(new URLSearchParams(await req.text())); return new Response('ok'); }}, { secret, fetcher:async()=>({ok:true,json:async()=>({success:true,hostname:'kuaraceramicas.com.br',action:name})}) });
 assert.equal(response.status,200);
 delete stored['form-name'];
 const verified = await verifiedEventData(stored, secret);
 assert.equal(verified['form-name'],name);
 const result = await syncContact(verified, {env:{BREVO_LIST_FORNO_LATAO:'10'},fetcher:()=>assert.fail('Must not use another list')});
 assert.equal(result.storedIn,'netlify-forms');
 let contact;
 await syncContact(verified,{env:{BREVO_LIST_BLACK_FRIDAY_2026:'36',BREVO_API_KEY:'test-only'},fetcher:async(_,options)=>{ contact=JSON.parse(options.body); return {ok:true}; }});
 assert.deepEqual(contact.listIds,[36]);
});


test('public /blackfriday URL keeps its address and receives the scheduled edge handler', async () => {
 const { config } = await import('../netlify/edge-functions/black-friday.js');
 for (const path of ['/blackfriday', '/blackfriday/']) assert(config.path.includes(path));
 const redirects = readFileSync(new URL('../_redirects', import.meta.url), 'utf8');
 assert.match(redirects, /^\/blackfriday \/black-friday\/index\.html 200$/m);
 assert.match(redirects, /^\/blackfriday\/ \/black-friday\/index\.html 200$/m);
});

test('public campaign serves sales on every campaign route after opening', async () => {
 const { default: handle, config } = await import('../netlify/edge-functions/black-friday.js');
 const originalNow = Date.now;
 try {
  Date.now = () => Date.parse('2026-11-27T02:59:59.999Z');
  const before = await handle(new Request('https://kuaraceramicas.com.br/blackfriday'), { next: async () => new Response('presale') });
  assert.equal(await before.text(), 'presale');
  assert.equal(before.headers.get('Cache-Control'), 'no-store');
  assert.equal(before.headers.has('X-Kuara-Campaign'), false);
  for (const instant of ['2026-11-27T03:00:00.000Z', '2026-11-27T12:00:00-03:00', '2026-12-01T12:00:00-03:00']) {
   Date.now = () => Date.parse(instant);
   for (const path of config.path) {
    const response = await handle(new Request('https://kuaraceramicas.com.br' + path), { next: () => assert.fail('Must serve the sales page after opening') });
    assert(response instanceof URL);
    assert.equal(response.href, 'https://kuaraceramicas.com.br/black-friday/vendas');
   }
  }
 } finally { Date.now = originalNow; }
});
