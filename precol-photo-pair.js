(() => {
  const gallery = document.querySelector('.precol-photo-pair');
  const form = document.querySelector('.precol-page .course-reference-grid > form');
  if (!gallery || !form) return;
  const measure = () => {
    const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
    const height = (gallery.clientWidth - gap) / 2 * 5 / 4;
    gallery.style.setProperty('--intro-photo-height', `${height}px`);
    gallery.style.setProperty('--intro-form-height', `${form.getBoundingClientRect().height}px`);
  };
  const observer = new ResizeObserver(measure);
  observer.observe(form);
  observer.observe(gallery);
  measure();
})();
