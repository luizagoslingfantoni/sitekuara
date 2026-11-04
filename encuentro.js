const encuentroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const encuentroText = [...document.querySelectorAll(
  '.encuentro-page main h1, .encuentro-page main h2, .encuentro-hero .eyebrow, .encuentro-about__copy p, .encuentro-day__body > strong, .encuentro-day__preview, .encuentro-day__details p, .encuentro-amanda blockquote, .encuentro-amanda .about-opening__story p'
)];
const encuentroImages = [...document.querySelectorAll(
  '.encuentro-hero__image, .encuentro-day__image img'
)];

encuentroText.forEach((element) => element.setAttribute('data-encuentro-parallax', ''));
encuentroImages.forEach((element) => element.setAttribute('data-encuentro-parallax-image', ''));

let encuentroFrame = 0;
const updateEncuentroText = () => {
  encuentroFrame = 0;
  const viewport = window.innerHeight;
  const sectionProgress = new Map();

  for (const element of [...encuentroText, ...encuentroImages]) {
    if (encuentroMotion.matches) {
      element.style.removeProperty('--encuentro-parallax-y');
      continue;
    }

    const section = element.closest('section');
    if (!section) continue;
    if (!sectionProgress.has(section)) {
      const box = section.getBoundingClientRect();
      let progress = section.classList.contains('encuentro-hero')
        ? Math.min(1, Math.max(0, window.scrollY / Math.max(1, box.height)))
        : (viewport - box.top) / Math.max(1, viewport + box.height) * 2 - 1;
      progress = Math.max(-1, Math.min(1, progress));
      sectionProgress.set(section, { progress, visible: box.bottom > -40 && box.top < viewport + 40 });
    }

    const state = sectionProgress.get(section);
    if (!state.visible) continue;
    const heading = element.matches('h1,h2,blockquote');
    const image = element.hasAttribute('data-encuentro-parallax-image');
    const depth = (image ? 36 : heading ? 30 : 15) * (window.innerWidth < 600 ? .55 : 1);
    element.style.setProperty('--encuentro-parallax-y', `${Math.round(state.progress * depth)}px`);
  }
};

const requestEncuentroText = () => {
  if (!encuentroFrame) encuentroFrame = window.requestAnimationFrame(updateEncuentroText);
};

requestEncuentroText();
window.addEventListener('scroll', requestEncuentroText, { passive: true });
window.addEventListener('resize', requestEncuentroText);
encuentroMotion.addEventListener('change', requestEncuentroText);
