document.querySelectorAll('.course-fit-faq__faq').forEach(group => {
 const items = [...group.querySelectorAll('details')];
 items.forEach(item => { item.open = false; item.addEventListener('toggle', () => {
  if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
 }); });
});
