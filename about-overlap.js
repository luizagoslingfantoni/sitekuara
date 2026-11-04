(() => {
 const opening = document.querySelector('.about-opening');
 if (!opening) return;
 const update = () => opening.style.setProperty('--about-stack-top', `${Math.min(0, innerHeight - opening.offsetHeight - 120)}px`);
 new ResizeObserver(update).observe(opening);
 addEventListener('resize', update, {passive:true});
 update();
})();
