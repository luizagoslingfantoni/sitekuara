// Complete os endereços quando os formulários forem disponibilizados.
const kuaraLinks = { geopoetica: "https://docs.google.com/forms/d/e/1FAIpQLSfQ6P8zv8K7_-A9WFGDh2ULa04qFDqoxvUmSUAPjPpUsNAytA/viewform", precolombiano: "https://docs.google.com/forms/d/e/1FAIpQLScaH7KYK2nUWj0Ez8P4KM1G9vBqPfTsVdg-DaXaA6LqHgpSwQ/viewform", orientacoes: 'https://forms.gle/xCfNsfQen6noLrAB7', latao: "https://docs.google.com/forms/d/e/1FAIpQLSeBCY3V7_W_Bub4vk-dBABGAlLwq2lYksk3G4hJidqREQLF0g/viewform", queimas: "https://docs.google.com/forms/d/e/1FAIpQLSfJEhWlHnkIL8DMuzVuQr4Pd5wORj7_wc8_1GvwQH-iumTzYw/viewform" };
for (const link of document.querySelectorAll('[data-pending-link]')) {
  const url = kuaraLinks[link.dataset.pendingLink];
  if (url && /^https:\/\//.test(url)) {
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled'); link.parentElement.querySelector('small')?.remove();
  }
}
// Este JSON deve conter somente publicações reais obtidas pelo servidor.
const feed = document.querySelector('[data-instagram-feed]');
if (feed && !feed.closest('[hidden]')) fetch(feed.dataset.instagramSource || '/instagram-feed.json').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
  const grid = feed.querySelector('.instagram-preview__grid');
  for (const post of (data.posts || []).slice(0, 6)) {
    // Imagens locais mantêm a política de segurança do site e não expõem tokens.
    if (!/^\/assets\/instagram\/[a-zA-Z0-9_.-]+$/.test(post.image)) continue;
    const a = document.createElement('a'); a.href = 'https://www.instagram.com/' + (feed.dataset.instagramProfile || 'kuaraceramicas') + '/';
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    const img = document.createElement('img'); img.src = post.image; img.alt = post.caption || 'Publicação da Kûara no Instagram'; img.loading = 'lazy';
    a.append(img); grid.append(a);
  }
  grid.hidden = !grid.children.length;
  const placeholder = feed.querySelector('[data-instagram-placeholder]');
  if (placeholder) placeholder.hidden = grid.children.length > 0;
}).catch(() => {});
