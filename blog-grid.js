(() => {
 const search=document.querySelector('#writing-search'),grid=document.querySelector('.writings-grid'),cards=[...document.querySelectorAll('[data-writing]')],newsletter=document.querySelector('.writing-newsletter'),empty=document.querySelector('.writings-empty'),more=document.querySelector('#writing-load-more');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 // Fixed editorial feature, then descending publication date. Stable order for equal dates.
 cards.sort((a,b)=>Number(b.dataset.pinned==='true')-Number(a.dataset.pinned==='true') || (Date.parse(b.dataset.published)||0)-(Date.parse(a.dataset.published)||0));
 cards.forEach(card=>grid.append(card));grid.insertBefore(newsletter,cards[5]||null);
 let limit=8;
 const render=()=>{
  const query=normalize(search.value.trim()),matches=cards.filter(card=>normalize(card.textContent).includes(query));
  cards.forEach(card=>{const position=matches.indexOf(card);card.hidden=position<0||position>=limit});
  newsletter.hidden=Boolean(query);empty.hidden=matches.length>0;
  more.disabled=matches.length<=limit;
  more.hidden=matches.length<=limit;
  more.title=more.disabled?'Todos os escritos disponíveis estão exibidos':'Carregar mais escritos';
 };
 search.addEventListener('input',()=>{limit=8;render()});
 more.addEventListener('click',()=>{limit+=9;render()});
 render();
 if(['localhost','127.0.0.1'].includes(location.hostname) && !newsletter.querySelector('[data-turnstile-form]')){
  const form=newsletter.querySelector('form'),captcha=form.querySelector('.writing-captcha');
  captcha.classList.add('writing-captcha--preview');captcha.textContent='Espaço do CAPTCHA · disponível na versão publicada';
  form.addEventListener('submit',event=>{event.preventDefault();const status=form.querySelector('.writing-form-status');status.hidden=false;status.textContent='Prévia local: o cadastro será enviado na versão publicada.'});
 }
})();
