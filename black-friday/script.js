// Validation runs before the site's protected Netlify Forms handler.
const presaleForm = document.querySelector('[data-presale-form]');
if (presaleForm) {
 const fields = [...presaleForm.querySelectorAll('input[type="text"]')];
 fields.forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
 presaleForm.addEventListener('submit', event => {
  fields.forEach(input => input.setCustomValidity(input.value.trim() ? '' : 'Preencha este campo.'));
  if (!presaleForm.reportValidity()) event.preventDefault();
 });
}
const ribbonToggle = document.querySelector('.ribbon-toggle');
const heroMotionRoot = document.querySelector('.reference-hero');
const heroVideo = heroMotionRoot.querySelector('video');
const heroReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let heroMotionPaused = heroReducedMotion.matches || Boolean(heroVideo && navigator.connection?.saveData);
let heroInView = true;
const syncHeroMotion = () => {
 heroMotionRoot.classList.toggle('is-paused', heroMotionPaused);
 ribbonToggle.setAttribute('aria-pressed', String(heroMotionPaused));
 const subject = heroVideo ? 'vídeo e faixas animadas' : 'faixas animadas';
 ribbonToggle.setAttribute('aria-label', `${heroMotionPaused ? 'Retomar' : 'Pausar'} ${subject}`);
 ribbonToggle.textContent = heroMotionPaused ? '▶' : 'Ⅱ';
 if (!heroVideo) return;
 if (heroMotionPaused || document.hidden || !heroInView) {
  heroVideo.pause();
 } else {
  if (!heroVideo.getAttribute('src')) heroVideo.src = heroVideo.dataset.src;
  heroVideo.play().catch(() => {
   if (document.hidden || !heroInView || heroMotionPaused) return;
   heroMotionPaused = true;
   syncHeroMotion();
  });
 }
};
ribbonToggle.addEventListener('click', () => {
 heroMotionPaused = !heroMotionPaused;
 syncHeroMotion();
});
heroReducedMotion.addEventListener('change', event => {
 if (event.matches) { heroMotionPaused = true; syncHeroMotion(); }
});
if (heroVideo) {
 new IntersectionObserver(([entry]) => {
  heroInView = entry.isIntersecting;
  syncHeroMotion();
 }).observe(heroMotionRoot);
 document.addEventListener('visibilitychange', syncHeroMotion);
}
syncHeroMotion();

// Delegation keeps zoom available after the photo in a tile changes.
const photoDialog = document.querySelector('#photo-dialog');
const expandedPhoto = photoDialog.querySelector('.photo-expanded');
let expandedPhotoIndex = 0;
const showGalleryPhoto = index => {
 expandedPhotoIndex = (index + kuaraCommunityPhotos.length) % kuaraCommunityPhotos.length;
 const photo = kuaraCommunityPhotos[expandedPhotoIndex];
 expandedPhoto.src = photo.src;
 expandedPhoto.alt = photo.alt;
 photoDialog.querySelector('.photo-counter').textContent = `${expandedPhotoIndex + 1} / ${kuaraCommunityPhotos.length}`;
};
document.addEventListener('click', event => {
 const button = event.target.closest('[data-gallery-photo]');
 if (!button) return;
 showGalleryPhoto(Number(button.dataset.photoIndex));
 photoDialog.showModal();
});
photoDialog.querySelector('.photo-close').addEventListener('click', () => photoDialog.close());
photoDialog.querySelector('.photo-previous').addEventListener('click', () => showGalleryPhoto(expandedPhotoIndex - 1));
photoDialog.querySelector('.photo-next').addEventListener('click', () => showGalleryPhoto(expandedPhotoIndex + 1));
photoDialog.addEventListener('keydown', event => {
 if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
  event.preventDefault();
  showGalleryPhoto(expandedPhotoIndex + (event.key === 'ArrowRight' ? 1 : -1));
 }
});
photoDialog.addEventListener('click', event => {
 if (event.target !== photoDialog) return;
 const box = photoDialog.getBoundingClientRect();
 if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) photoDialog.close();
});
photoDialog.addEventListener('close', () => expandedPhoto.removeAttribute('src'));


// Measure the real header, including text wrapping and browser zoom.
const hero = document.querySelector('.reference-hero');
const syncHeroOffset = () => {
 const offset = Math.ceil(hero.getBoundingClientRect().top + window.scrollY);
 document.documentElement.style.setProperty('--hero-offset', `${offset}px`);
 document.documentElement.style.setProperty('--sticky-header-height', `${document.querySelector('.page-header').getBoundingClientRect().height}px`);
};
const headerObserver = new ResizeObserver(syncHeroOffset);
headerObserver.observe(document.querySelector('body > header'));
const draftBanner = document.querySelector('.draft');
if (draftBanner) headerObserver.observe(draftBanner);
window.addEventListener('resize', syncHeroOffset);
window.visualViewport?.addEventListener('resize', syncHeroOffset);
document.fonts.ready.then(syncHeroOffset);
syncHeroOffset();

// Keep a single FAQ answer open, including browsers without grouped details support.
const faqItems = [...document.querySelectorAll('#duvidas .faq details')];
faqItems.forEach(item => item.addEventListener('toggle', () => {
 if (!item.open) return;
 faqItems.forEach(other => { if (other !== item) other.open = false; });
}));

// Sticky navigation uses the palette of the section underneath, as on the main site.
const pageHeader = document.querySelector('.page-header');
const menuToggle = pageHeader.querySelector('.menu-toggle');
const setMenuOpen = open => {
 menuToggle.setAttribute('aria-expanded', String(open));
 pageHeader.dataset.menuOpen = String(open);
};
menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
pageHeader.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
document.addEventListener('keydown', event => {
 if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
  setMenuOpen(false);
  menuToggle.focus();
 }
});
const mobileMenu = matchMedia('(max-width: 760px)');
mobileMenu.addEventListener('change', () => setMenuOpen(false));
let headerFrame = 0;
const updateHeaderTheme = () => {
 headerFrame = 0;
 pageHeader.dataset.scrolled = String(scrollY > 8);
 if (document.querySelector('dialog[open]')) return;
 let color = 'rgb(255, 255, 255)';
 if (scrollY > 40) {
  const y = Math.min(innerHeight - 1, pageHeader.getBoundingClientRect().bottom + 2);
  const hit = document.elementsFromPoint(innerWidth / 2, y).find(el => !el.closest('.page-header,.whatsapp-float') && el.closest('main,footer.page-footer'));
  const section = hit?.closest('.presale-panel,section,footer.page-footer');
  if (section?.matches('.reference-hero')) color = 'rgb(35, 55, 84)';
  else {
   let node = section || hit;
   while (node) {
    const candidate = getComputedStyle(node).backgroundColor;
    const rgba = candidate.match(/[\d.]+/g)?.map(Number);
    if (rgba?.length >= 3 && (rgba.length < 4 || rgba[3] > .5)) { color = candidate; break; }
    node = node.parentElement;
   }
  }
 }
 const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number);
 const linear = rgb.map(v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
 const dark = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2] < .3;
 pageHeader.style.setProperty('--header-bg', color);
 pageHeader.style.setProperty('--header-ink', dark ? '#f5eee5' : '#233754');
 pageHeader.dataset.scrollTheme = dark ? 'dark' : 'light';
};
const scheduleHeaderTheme = () => { if (!headerFrame) headerFrame = requestAnimationFrame(updateHeaderTheme); };
addEventListener('scroll', scheduleHeaderTheme, { passive: true });
addEventListener('resize', scheduleHeaderTheme);
addEventListener('load', scheduleHeaderTheme);
scheduleHeaderTheme();

// Testimonials and photographs occupy independent, fixed spaces.
const testimonialDialog = document.querySelector('#testimonial-dialog');
const quoteGrid = document.querySelector('[data-rotating-testimonials]');
const allQuotes = [...quoteGrid.querySelectorAll('.community-quote')];
const measureQuote = quote => {
 const text = quote.querySelector('.quote-text');
 const button = quote.querySelector('.testimonial-read');
 button.hidden = text.scrollHeight <= text.clientHeight + 2;
};
const quoteResize = new ResizeObserver(entries => entries.forEach(entry => measureQuote(entry.target)));
allQuotes.forEach(quote => {
 const button = quote.querySelector('.testimonial-read');
 button.setAttribute('aria-label', `Continuar lendo o depoimento de ${quote.querySelector('strong').textContent}`);
 button.addEventListener('click', () => {
  testimonialDialog.querySelector('h3').textContent = quote.querySelector('strong').textContent;
  testimonialDialog.querySelector('blockquote p').textContent = quote.querySelector('.quote-text').textContent;
  testimonialDialog.querySelector('.testimonial-source').textContent = quote.querySelector('small').textContent;
  testimonialDialog.showModal();
 });
 quoteResize.observe(quote);
});
testimonialDialog.querySelector('.testimonial-close').addEventListener('click', () => testimonialDialog.close());
testimonialDialog.addEventListener('click', event => {
 if (event.target !== testimonialDialog) return;
 const box = testimonialDialog.getBoundingClientRect();
 if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) testimonialDialog.close();
});

const shuffled = items => {
 const copy = [...items];
 for (let i = copy.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [copy[i], copy[j]] = [copy[j], copy[i]];
 }
 return copy;
};
const createPhoto = index => {
 const photo = kuaraCommunityPhotos[index];
 const button = document.createElement('button');
 button.className = 'gallery-photo';
 button.type = 'button';
 button.dataset.galleryPhoto = '';
 button.dataset.photoIndex = String(index);
 button.setAttribute('aria-label', `Ampliar imagem: ${photo.alt}`);
 const img = document.createElement('img');
 img.alt = photo.alt;
 img.loading = 'lazy';
 img.decoding = 'async';
 img.src = photo.src;
 button.append(img);
 return button;
};
const galleries = [];
const rotatingTiles = [];
const tileObserver = new IntersectionObserver(entries => entries.forEach(entry => {
 const tile = rotatingTiles.find(item => item.element === entry.target);
 if (tile) tile.visible = entry.isIntersecting;
}), {threshold: .1});
const wrapFace = node => {
 const face = document.createElement('div');
 face.className = 'gallery-face';
 face.append(node);
 return face;
};
const addGallery = (element, kind, initial, queue) => {
 const gallery = {element, kind, queue, tiles: []};
 element.replaceChildren();
 initial.forEach(item => {
  const frame = document.createElement('div');
  frame.className = 'gallery-tile';
  const content = kind === 'quote' ? item : createPhoto(item);
  frame.append(wrapFace(content));
  const tile = {element:frame, item, gallery, elapsed:0, visible:false, transitioning:false};
  gallery.tiles.push(tile);
  rotatingTiles.push(tile);
  element.append(frame);
  tileObserver.observe(frame);
 });
 galleries.push(gallery);
};
const quoteOrder = shuffled(allQuotes);
addGallery(quoteGrid, 'quote', quoteOrder.slice(0,6), quoteOrder.slice(6));
document.querySelectorAll('[data-rotating-photos]').forEach(grid => {
 const initial = [...grid.querySelectorAll('[data-photo-index]')].map(node => Number(node.dataset.photoIndex));
 const queue = shuffled(kuaraCommunityPhotos.map((_,i) => i).filter(index => !initial.includes(index)));
 addGallery(grid, 'photo', initial, queue);
});
const swapTile = async tile => {
 if (tile.transitioning || !tile.gallery.queue.length) return;
 tile.transitioning = true;
 const next = tile.gallery.queue.shift();
 const node = tile.gallery.kind === 'quote' ? next : createPhoto(next);
 if (tile.gallery.kind === 'photo') {
  const img = node.querySelector('img');
  img.loading = 'eager';
  try { await img.decode(); } catch {
   tile.gallery.queue.push(next);
   tile.transitioning = false;
   tile.elapsed = 0;
   return;
  }
 }
 // Re-check after image loading so a card never changes under a hovering reader.
 if (document.hidden || tile.gallery.element.matches(':hover,:focus-within') || document.querySelector('dialog[open]')) {
  tile.gallery.queue.unshift(next);
  tile.transitioning = false;
  return;
 }
 const outgoing = tile.element.firstElementChild;
 const incoming = wrapFace(node);
 outgoing.inert = true;
 outgoing.setAttribute('aria-hidden','true');
 outgoing.classList.add('is-leaving');
 incoming.classList.add('is-entering');
 tile.element.append(incoming);
 if (tile.gallery.kind === 'quote') measureQuote(node);
 const previous = tile.item;
 tile.item = next;
 tile.elapsed = 0;
 tile.element.dataset.change = String(Number(tile.element.dataset.change || 0) + 1);
 setTimeout(() => {
  outgoing.remove();
  incoming.classList.remove('is-entering');
  tile.gallery.queue.push(previous);
  tile.transitioning = false;
 }, heroReducedMotion.matches ? 0 : 650);
};
document.fonts.ready.then(() => allQuotes.filter(quote => quote.isConnected).forEach(measureQuote));
let galleryTick = performance.now();
setInterval(() => {
 const now = performance.now();
 const elapsed = Math.min(now - galleryTick, 500);
 galleryTick = now;
 if (document.hidden || document.querySelector('dialog[open]')) return;
 rotatingTiles.forEach(tile => {
  if (!tile.visible || tile.transitioning || tile.gallery.element.matches(':hover,:focus-within')) return;
  tile.elapsed += elapsed;
  if (tile.elapsed >= 10000) swapTile(tile);
 });
}, 200);
