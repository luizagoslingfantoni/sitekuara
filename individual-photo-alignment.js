(() => {
 const section = document.querySelector('.individual-session');
 if (!section) return;
 const notes = section.querySelector('.individual-session__notes');
 const photos = section.querySelector('.individual-contact-gallery');
 const actions = section.querySelector('.individual-mentorship__contact-copy .revision-actions');
 const copy = section.querySelector('.individual-mentorship__contact-copy');
 if (!notes || !photos || !actions) return;
 let frame;
 const update = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
   if (innerWidth <= 900) return;
   const noteRect = notes.getBoundingClientRect();
   const actionsRect = actions.getBoundingClientRect();
   photos.style.setProperty('--notes-photo-height', `${noteRect.height}px`);
   photos.style.setProperty('--notes-photo-gap', `${Math.max(0, noteRect.top-actionsRect.bottom)}px`);
  });
 };
 const observer = new ResizeObserver(update);
 observer.observe(notes);observer.observe(actions);observer.observe(section.querySelector('.individual-session__facts'));
 addEventListener('resize',update,{passive:true});
 document.fonts.ready.then(update);
 update();
})();
