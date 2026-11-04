try {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !sessionStorage.getItem('kuara-opening-seen')) {
    document.documentElement.classList.add('kuara-opening');
    sessionStorage.setItem('kuara-opening-seen', '1');
  }
} catch (error) {
  // Private browsing may restrict session storage; the site remains usable.
}
