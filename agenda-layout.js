(() => {
 const events=[...document.querySelectorAll('.agenda-event')],upcoming=document.querySelector('#upcoming-events'),past=document.querySelector('#past-events');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 events.filter(e=>e.dataset.end>=today).sort((a,b)=>a.dataset.start.localeCompare(b.dataset.start)).forEach(e=>upcoming.append(e));
 events.filter(e=>e.dataset.end<today).sort((a,b)=>b.dataset.start.localeCompare(a.dataset.start)).forEach(e=>past.append(e));
 // Past events are records, never outbound navigation targets.
 past.querySelectorAll('a').forEach(link=>{const block=document.createElement('div');block.className=link.className;block.hidden=link.hidden;while(link.firstChild)block.append(link.firstChild);link.replaceWith(block)});
 past.querySelectorAll('.agenda-event__cta,.event-cta').forEach(cta=>cta.remove());
 document.querySelector('#upcoming-empty').hidden=upcoming.children.length>0;
 document.querySelector('#past-empty').hidden=past.children.length>0;
 const equalizeCards=()=>{
  const cards=events.map(e=>e.querySelector('.agenda-event__grid'));
  cards.forEach(c=>c.style.height='auto');
  if(upcoming.dataset.layout!=='grid')return;
  const height=Math.ceil(Math.max(...cards.map(c=>c.getBoundingClientRect().height)));
  cards.forEach(c=>c.style.height=height+'px');
 };
 document.querySelectorAll('.agenda-ufsj-details').forEach(detail=>detail.addEventListener('toggle',equalizeCards));
 let resizeFrame;
 window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(equalizeCards)});
 document.fonts.ready.then(equalizeCards);
 const buttons=[...document.querySelectorAll('[data-view]')];
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const grid=button.dataset.view==='grid';
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  [upcoming,past].forEach(section=>section.dataset.layout=grid?'grid':'list');
  events.forEach(event=>{event.querySelector('.agenda-event__list').hidden=grid;event.querySelector('.agenda-event__grid').hidden=!grid});
  equalizeCards();
 }));
})();
