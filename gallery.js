(() => {
 const cards=[...document.querySelectorAll('.masonry-photo')],filters=[...document.querySelectorAll('[data-filter]')];
 const toggle=document.querySelector('#firing-toggle'),options=document.querySelector('#firing-options'),count=document.querySelector('#gallery-count'),empty=document.querySelector('.gallery-empty');
 const dialog=document.querySelector('.photo-viewer'),photo=dialog.querySelector('figure img');
 let visible=cards.slice(),index=0,origin=null;
 const closeMenu=()=>{options.hidden=true;toggle.setAttribute('aria-expanded','false')};
 toggle.addEventListener('click',()=>{options.hidden=!options.hidden;toggle.setAttribute('aria-expanded',String(!options.hidden))});
 document.addEventListener('click',e=>{if(!e.target.closest('.firing-dropdown'))closeMenu()});
 filters.forEach(button=>button.addEventListener('click',()=>{
  const value=button.dataset.filter;
  filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  cards.forEach(card=>{card.hidden=!(value==='Todos'||card.dataset.category===value||card.dataset.firing===value)});
  visible=cards.filter(c=>!c.hidden);empty.hidden=visible.length>0;
  count.textContent=`${value} · ${visible.length} ${visible.length===1?'fotografia':'fotografias'}`;
  closeMenu();if(button.closest('#firing-options'))toggle.focus();
 }));
 const show=()=>{const img=visible[index].querySelector('img');photo.src=img.dataset.full||img.src;photo.alt=img.alt};
 cards.forEach(card=>card.addEventListener('click',()=>{origin=card;index=visible.indexOf(card);show();dialog.showModal();document.documentElement.style.overflow='hidden'}));
 const move=direction=>{index=(index+direction+visible.length)%visible.length;show()};
 dialog.querySelector('.photo-prev').addEventListener('click',()=>move(-1));dialog.querySelector('.photo-next').addEventListener('click',()=>move(1));
 dialog.querySelector('.photo-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';origin?.focus()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(dialog.open&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});
 let touchX=0;photo.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});photo.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>50)move(dx<0?1:-1)},{passive:true});
 count.textContent=`Todos · ${visible.length} fotografias`;
})();
