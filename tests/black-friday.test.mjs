import test from 'node:test';
import assert from 'node:assert/strict';
import { blackFridayDestination } from '../netlify/lib/black-friday.mjs';
import { guardForm } from '../netlify/lib/turnstile-guard.mjs';
import { verifiedEventData } from '../netlify/lib/form-event.mjs';
import { syncContact } from '../netlify/lib/brevo.mjs';

test('campaign changes at midnight Brasília, including the exact boundary', () => {
 assert.equal(blackFridayDestination(Date.parse('2026-11-27T02:59:59.999Z')), null);
 assert.equal(blackFridayDestination(Date.parse('2026-11-27T03:00:00.000Z')), '/black-friday/vendas');
 assert.equal(blackFridayDestination(Date.parse('2026-11-27T00:00:00-03:00')), '/black-friday/vendas');
});

test('presale is signed and stored independently without enrolling in another campaign', async () => {
 const name = 'pre-venda-black-friday-kuara-2026';
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
 await syncContact(verified,{env:{BREVO_LIST_BLACK_FRIDAY_2026:'50',BREVO_API_KEY:'test-only'},fetcher:async(_,options)=>{ contact=JSON.parse(options.body); return {ok:true}; }});
 assert.deepEqual(contact.listIds,[50]);
});
