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
ribbonToggle.addEventListener('click', () => {
 const paused = document.querySelector('.reference-hero').classList.toggle('is-paused');
 ribbonToggle.setAttribute('aria-pressed', String(paused));
 ribbonToggle.setAttribute('aria-label', paused ? 'Retomar faixas animadas' : 'Pausar faixas animadas');
 ribbonToggle.textContent = paused ? '▶' : 'Ⅱ';
});

// As fotos recebidas entram como <img> nos quatro botões da galeria.
// data-full-image pode apontar para uma versão maior que a miniatura.
const photoDialog = document.querySelector('#photo-dialog');
const expandedPhoto = photoDialog.querySelector('.photo-expanded');
document.querySelectorAll('[data-gallery-photo]').forEach(button => {
 const photo = button.querySelector('img');
 if (!photo || !photo.getAttribute('src')) return;
 button.disabled = false;
 button.setAttribute('aria-label', `Ampliar imagem: ${photo.alt || 'foto da mentoria'}`);
 button.addEventListener('click', () => {
  expandedPhoto.src = button.dataset.fullImage || photo.currentSrc || photo.src;
  expandedPhoto.alt = photo.alt;
  photoDialog.showModal();
 });
});
photoDialog.querySelector('.photo-close').addEventListener('click', () => photoDialog.close());
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

// All original testimonials remain available, with full text in an accessible dialog.
const testimonialDialog = document.querySelector('#testimonial-dialog');
document.querySelectorAll('.mosaic-quote').forEach(quote => {
 const button = document.createElement('button');
 button.className = 'testimonial-read';
 button.type = 'button';
 button.textContent = 'Ler depoimento';
 button.setAttribute('aria-label', `Ler depoimento de ${quote.querySelector('strong').textContent}`);
 button.addEventListener('click', () => {
  testimonialDialog.querySelector('h3').textContent = quote.querySelector('strong').textContent;
  testimonialDialog.querySelector('blockquote p').textContent = quote.querySelector('p').textContent;
  testimonialDialog.querySelector('.testimonial-source').textContent = quote.querySelector('small').textContent;
  testimonialDialog.showModal();
 });
 quote.querySelector('footer').append(button);
});
testimonialDialog.querySelector('.testimonial-close').addEventListener('click', () => testimonialDialog.close());
testimonialDialog.addEventListener('click', event => {
 if (event.target !== testimonialDialog) return;
 const box = testimonialDialog.getBoundingClientRect();
 if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) testimonialDialog.close();
});

// Each fixed tile alternates between a photograph and a testimonial every six
// visible, unpaused seconds. Moving the original nodes preserves zoom/read controls.
const community = document.querySelector('#experiencias');
const communityGrid = community.querySelector('.community-grid');
const playButton = community.querySelector('.community-play');
const shuffled = items => {
 const copy = [...items];
 for (let i = copy.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [copy[i], copy[j]] = [copy[j], copy[i]];
 }
 return copy;
};
const pools = {
 quote: shuffled(community.querySelectorAll('.mosaic-quote')),
 photo: shuffled(community.querySelectorAll('.mosaic-photo')),
};
const mobileGallery = matchMedia('(max-width: 640px)');
const tabletGallery = matchMedia('(max-width: 1000px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let galleryPaused = reducedMotion.matches;
let tiles = [];
const setGalleryPaused = paused => {
 galleryPaused = paused;
 playButton.textContent = paused ? 'Retomar galeria' : 'Pausar galeria';
 playButton.setAttribute('aria-pressed', String(paused));
};
setGalleryPaused(galleryPaused);
playButton.addEventListener('click', () => setGalleryPaused(!galleryPaused));
reducedMotion.addEventListener('change', event => { if (event.matches) setGalleryPaused(true); });

const actions = document.createElement('div');
actions.className = 'community-actions';
playButton.replaceWith(actions);
const nextButton = document.createElement('button');
nextButton.type = 'button';
nextButton.className = 'community-next';
nextButton.textContent = 'Ver outras histórias';
actions.append(playButton, nextButton);

const tileObserver = new IntersectionObserver(entries => {
 entries.forEach(entry => {
  const tile = tiles.find(item => item.element === entry.target);
  if (tile) tile.visible = entry.isIntersecting;
 });
}, { threshold: .1 });
const nextCard = kind => {
 const pool = pools[kind];
 for (let i = 0; i < pool.length; i++) {
  const card = pool.shift();
  pool.push(card);
  if (!communityGrid.contains(card)) return card;
 }
 return null;
};
const faceFor = card => {
 const face = document.createElement('div');
 face.className = 'community-face';
 face.append(card);
 return face;
};
const swapTile = tile => {
 if (tile.transitioning) return;
 const kind = tile.kind === 'photo' ? 'quote' : 'photo';
 const card = nextCard(kind);
 if (!card) return;
 const outgoing = tile.element.firstElementChild;
 const incoming = faceFor(card);
 outgoing.inert = true;
 outgoing.setAttribute('aria-hidden', 'true');
 outgoing.classList.add('is-leaving');
 incoming.classList.add('is-entering');
 tile.element.append(incoming);
 tile.kind = kind;
 tile.element.dataset.kind = kind;
 tile.element.dataset.change = String(Number(tile.element.dataset.change) + 1);
 tile.transitioning = true;
 tile.elapsed = 0;
 tile.cleanup = setTimeout(() => {
  outgoing.remove();
  incoming.classList.remove('is-entering');
  tile.transitioning = false;
 }, reducedMotion.matches ? 0 : 660);
};
const renderCommunity = () => {
 tileObserver.disconnect();
 tiles.forEach(tile => clearTimeout(tile.cleanup));
 communityGrid.replaceChildren();
 communityGrid.classList.add('is-ready');
 tiles = [];
 const pattern = mobileGallery.matches ? ['photo', 'quote']
  : tabletGallery.matches ? ['photo', 'quote', 'quote', 'photo']
  : ['photo', 'quote', 'photo', 'quote', 'photo', 'photo', 'quote', 'photo'];
 pattern.forEach((kind, index) => {
  const element = document.createElement('div');
  element.className = 'community-tile';
  element.dataset.kind = kind;
  element.dataset.change = '0';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', `Fotos e histórias da comunidade, quadro ${index + 1}`);
  element.append(faceFor(nextCard(kind)));
  communityGrid.append(element);
  tiles.push({ element, kind, elapsed: 0, visible: false, transitioning: false, cleanup: null });
  tileObserver.observe(element);
 });
};
nextButton.addEventListener('click', () => {
 setGalleryPaused(true);
 tiles.forEach(swapTile);
});
renderCommunity();
mobileGallery.addEventListener('change', renderCommunity);
tabletGallery.addEventListener('change', renderCommunity);
let galleryTick = performance.now();
setInterval(() => {
 const now = performance.now();
 const elapsed = Math.min(now - galleryTick, 500);
 galleryTick = now;
 if (galleryPaused || document.hidden || document.querySelector('dialog[open]')) return;
 tiles.forEach(tile => {
  if (!tile.visible || tile.element.matches(':hover') || tile.element.contains(document.activeElement)) return;
  tile.elapsed += elapsed;
  if (tile.elapsed >= 6000) swapTile(tile);
 });
}, 200);

