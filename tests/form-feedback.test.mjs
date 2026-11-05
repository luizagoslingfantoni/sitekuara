import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../turnstile-forms.js',import.meta.url),'utf8');
function setup(ok) {
 let submit, resetCount=0, widgetOptions;
 const feedback={dataset:{},focus(){},scrollIntoView(){}};
 const button={disabled:false}; const token={value:'valid-token'};
 const form={name:'newsletter-kuara',clientWidth:300,action:'/newsletter/obrigado/',elements:{namedItem:()=>token},getAttribute:()=> 'newsletter-kuara',reportValidity:()=>true,querySelector:s=>s==='[type="submit"]'?button:s==='[data-turnstile-status]'?feedback:{},addEventListener:(event,handler)=>submit=handler,reset:()=>resetCount++};
 const window={turnstile:{render:(holder,options)=>{widgetOptions=options;return 'widget'},reset(){}}};
 vm.runInNewContext(source,{document:{querySelectorAll:()=>[form]},location:{hostname:'kuaraceramicas.com.br'},window,FormData:class extends Map{constructor(){super([['cf-turnstile-response','valid-token']])}},URLSearchParams,fetch:async()=>({ok})});
 window.kuaraTurnstileReady();
 return {feedback,button,submit:()=>submit({preventDefault(){}}),get resets(){return resetCount},refresh:()=>widgetOptions.callback('new-token')};
}
test('successful submission stays on page and keeps confirmation after captcha refresh',async()=>{
 const ui=setup(true);await ui.submit();assert.equal(ui.resets,1);assert.equal(ui.feedback.dataset.state,'success');assert.match(ui.feedback.textContent,/sucesso/);ui.refresh();assert.match(ui.feedback.textContent,/sucesso/);assert.equal(ui.button.disabled,false);
});
test('failed submission preserves fields and re-enables retry',async()=>{
 const ui=setup(false);await ui.submit();assert.equal(ui.resets,0);assert.match(ui.feedback.textContent,/campos foram mantidos/);assert.equal(ui.button.disabled,false);
});
