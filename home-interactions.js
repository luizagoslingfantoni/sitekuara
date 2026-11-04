(() => {
  const sections = [...document.querySelectorAll('main > .hero, main > .welcome, main > .courses, main > .people')];
  const measure = () => sections.forEach(section => {
    section.style.setProperty('--stack-top', `${Math.min(0, window.innerHeight - section.offsetHeight - 120)}px`);
  });
  const observer = new ResizeObserver(measure);
  sections.forEach(section => observer.observe(section));
  window.addEventListener('resize', measure);
  measure();

  const track = document.querySelector('.community-slider__track');
  if (!track) return;
  const previous = document.querySelector('[data-testimonial-prev]');
  const next = document.querySelector('[data-testimonial-next]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  const move = direction => {
    const step = track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
    track.scrollBy({left: direction * step, behavior: reducedMotion.matches ? 'auto' : 'smooth'});
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  track.addEventListener('scroll', update, {passive:true});
  new ResizeObserver(update).observe(track);
  update();
})();
