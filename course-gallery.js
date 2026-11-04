(() => {
 const galleries = document.querySelectorAll('.kiln-gallery, .social-photo-gallery__grid, .course-reference-grid, .individual-contact-gallery');
 if (!galleries.length) return;
 const template = document.createElement('template');
 template.innerHTML = "<dialog aria-label=\"Galeria de processos da Kûara\" class=\"gallery-lightbox\"><div class=\"gallery-lightbox__frame\"><button aria-label=\"Fechar galeria\" class=\"gallery-lightbox__close\" type=\"button\">×</button><button aria-label=\"Imagem anterior\" class=\"gallery-lightbox__nav gallery-lightbox__nav--prev\" type=\"button\"></button><img alt=\"\" class=\"gallery-lightbox__image\"/><button aria-label=\"Próxima imagem\" class=\"gallery-lightbox__nav gallery-lightbox__nav--next\" type=\"button\"></button><div class=\"gallery-lightbox__caption\"><span></span><span class=\"gallery-lightbox__count\"></span></div></div></dialog>";
 const viewer = template.content.firstElementChild;
 document.body.append(viewer);
 const image = viewer.querySelector('.gallery-lightbox__image');
 const caption = viewer.querySelector('.gallery-lightbox__caption span');
 const count = viewer.querySelector('.gallery-lightbox__count');
 let items = [], active = 0, opener;
 const show = i => { viewer.querySelectorAll('.gallery-lightbox__nav').forEach(b=>b.hidden=items.length<2); count.hidden=items.length<2; active = (i + items.length) % items.length; const source = items[active]; image.src = source.dataset.full || source.src; image.alt = source.alt; caption.textContent = ''; caption.hidden = true; count.textContent = `${active + 1} / ${items.length}`; };
 galleries.forEach(gallery => {
  const photos = [...gallery.querySelectorAll('figure img')];
  const unique = [...new Map(photos.map(img => [img.src, photos.find(p => p.src === img.src)])).values()];
  photos.forEach(img => {
   const button = document.createElement('button'); button.type = 'button'; button.className = 'process-mosaic__open'; button.setAttribute('aria-label', 'Ampliar imagem: ' + (img.alt || unique.find(p => p.src === img.src)?.alt || 'registro da formação'));
   if (img.closest('[aria-hidden="true"]')) button.tabIndex = -1;
   img.before(button); button.append(img);
   button.addEventListener('click', () => {items = unique; opener = button; show(unique.findIndex(p => p.src === img.src)); viewer.showModal();});
  });
 });
 viewer.querySelector('.gallery-lightbox__close').addEventListener('click', () => viewer.close());
 viewer.querySelector('.gallery-lightbox__nav--prev').addEventListener('click', () => show(active - 1));
 viewer.querySelector('.gallery-lightbox__nav--next').addEventListener('click', () => show(active + 1));
 viewer.addEventListener('keydown', e => {if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {e.preventDefault(); show(active + (e.key === 'ArrowRight' ? 1 : -1));}});
 viewer.addEventListener('click', e => {if (e.target === viewer) viewer.close();});
 viewer.addEventListener('close', () => opener?.focus());
 let startX;
 image.addEventListener('touchstart', e => {startX = e.changedTouches[0].clientX;}, {passive:true});
 image.addEventListener('touchend', e => {const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>50)show(active+(dx<0?1:-1));}, {passive:true});
})();
