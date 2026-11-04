import test from 'node:test';
import assert from 'node:assert/strict';
import { guardForm } from '../netlify/lib/turnstile-guard.mjs';
import { signForm, verifyForm } from '../netlify/lib/form-proof.mjs';
import { forms, syncContact } from '../netlify/lib/brevo.mjs';
const secret = 'test-only-secret-not-real';
const base = { 'form-name':'contato-kuara', nome:'Ana', sobrenome:'Silva', email:'ana@example.org', mensagem:'Gostaria de informações.', autorizacao:'sim', 'cf-turnstile-response':'test-token' };
const request = (patch = {}, headers = {}) => new Request('https://kuaraceramicas.com.br/contato/obrigado/', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded', Origin:'https://kuaraceramicas.com.br', ...headers }, body:new URLSearchParams({ ...base, ...patch }) });
const verdict = (patch = {}) => async () => ({ ok:true, json:async () => ({ success:true, hostname:'kuaraceramicas.com.br', action:'contato-kuara', ...patch }) });

test('verified form retains message, strips token and carries a server-signed proof', async () => {
 let record;
 const response = await guardForm(request({ 'kuara-verification':'forged' }), { next:async req => { record=Object.fromEntries(new URLSearchParams(await req.text())); return new Response('ok'); } }, { secret, fetcher:async (url, options) => {
  assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(options.redirect,'error');
  assert.equal(JSON.parse(options.body).secret,secret);
  return { ok:true, json:async () => ({ success:true, hostname:'kuaraceramicas.com.br', action:'contato-kuara' }) };
 }});
 assert.equal(response.status,200);
 assert.equal(record.mensagem,base.mensagem);
 assert.equal(record['cf-turnstile-response'],'');
 assert.notEqual(record['kuara-verification'],'forged');
 assert.equal(await verifyForm(record,secret),true);
 for (const patch of [{email:'victim@example.org'},{nome:'Other'},{'form-name':'newsletter-kuara'},{telefone:'000'}]) assert.equal(await verifyForm({...record,...patch},secret),false);
});
test('invalid, expired/reused token, wrong host or wrong action never reaches storage', async () => {
 for (const response of [{success:false,'error-codes':['timeout-or-duplicate']},{hostname:'attacker.example'},{action:'newsletter-kuara'},{success:'true'}]) {
  const result=await guardForm(request(),{next:()=>assert.fail('Must not store')},{secret,fetcher:verdict(response)});
  assert.equal(result.status,403);
 }
});
test('missing secret, missing token, oversized token, spoofed origin, invalid email, honeypot, unknown form and missing consent fail closed', async () => {
 const next=()=>assert.fail('Must not store'); const fetcher=()=>assert.fail('Must not call Cloudflare');
 for (const [patch,code] of [[{'cf-turnstile-response':''},403],[{'cf-turnstile-response':'x'.repeat(2049)},403],[{email:'bad'},400],[{website:'spam'},400],[{'form-name':'attacker'},400],[{autorizacao:''},400]]) assert.equal((await guardForm(request(patch),{next},{secret,fetcher})).status,code);
 assert.equal((await guardForm(request(),{next},{fetcher})).status,503);
 assert.equal((await guardForm(request({}, {Origin:'https://attacker.example'}),{next},{secret,fetcher})).status,403);
});
test('provider timeout and provider failure cannot bypass validation', async () => {
 for (const fetcher of [async()=>{throw new Error('timeout')},async()=>({ok:false,status:503})]) assert.equal((await guardForm(request(),{next:()=>assert.fail('Must not store')},{secret,fetcher})).status,503);
});
test('large bodies and duplicate identity fields are rejected', async () => {
 const next=()=>assert.fail('Must not store'); const fetcher=()=>assert.fail('Must not call Cloudflare');
 assert.equal((await guardForm(request({mensagem:'x'.repeat(33000)}),{next},{secret,fetcher})).status,413);
 const duplicate = new Request('https://kuaraceramicas.com.br/', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(base).toString()+'&email=other@example.org'});
 assert.equal((await guardForm(duplicate,{next},{secret,fetcher})).status,400);
});
test('proof refuses missing, changed, expired and wrong-key signatures', async () => {
 const now=Date.now();const proof=await signForm(base,secret,now);
 assert.equal(await verifyForm({...base,'kuara-verification':proof},secret,now),true);
 assert.equal(await verifyForm(base,secret,now),false);
 assert.equal(await verifyForm({...base,'kuara-verification':proof},'wrong',now),false);
 assert.equal(await verifyForm({...base,'kuara-verification':proof},secret,now+8*86400000),false);
});
test('all eight forms validate then route to their own list without real API calls', async () => {
 const env={BREVO_API_KEY:'test-only'};
 for (const [index,[name,[variable,consent]]] of Object.entries(forms).entries()) {
  env[variable]=String(28+index);
  let record;
  await guardForm(request({'form-name':name,[consent]:'sim'}),{next:async req=>{record=Object.fromEntries(new URLSearchParams(await req.text()));return new Response('ok');}},{secret,fetcher:verdict({action:name})});
  assert.equal(await verifyForm(record,secret),true);
  const result=await syncContact(record,{env,fetcher:async()=>({ok:true})});
  assert.equal(result.listId,28+index);
 }
});
