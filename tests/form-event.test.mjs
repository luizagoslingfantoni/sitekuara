import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedEventData } from '../netlify/lib/form-event.mjs';
import { signForm } from '../netlify/lib/form-proof.mjs';
import { forms } from '../netlify/lib/brevo.mjs';
const secret='test-only-key';
test('Netlify event without form-name recovers the signed destination for all eight lists',async()=>{
 for(const [name,[,consent]] of Object.entries(forms)) {
  const data={'form-name':name,nome:'Ana',email:'ana@example.org',[consent]:'sim'};
  data['kuara-verification']=await signForm(data,secret);
  delete data['form-name'];
  const result=await verifiedEventData({...data,ip:'192.0.2.1',user_agent:'test'},secret);
  assert.equal(result['form-name'],name);
  assert.equal(await verifiedEventData({...data,email:'changed@example.org'},secret),null);
  assert.equal(await verifiedEventData({...data,'form-name':'attacker'},secret),null);
 }
});
test('event recovery never bypasses missing or invalid proof',async()=>{
 assert.equal(await verifiedEventData({email:'ana@example.org'},secret),null);
 assert.equal(await verifiedEventData(null,secret),null);
 const data={'form-name':'contato-kuara',email:'ana@example.org',autorizacao:'sim'};
 data['kuara-verification']=await signForm(data,secret);
 assert.equal(await verifiedEventData(data,'wrong-key'),null);
});
