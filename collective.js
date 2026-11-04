(() => {
  const products = [
  {
    "number": "1",
    "name": "Vaso Mica",
    "dimensions": "15 × 17,2 cm",
    "value": 952.0,
    "technique": "Queima a lenha",
    "image": "/assets/coletivo-peca-15.webp"
  },
  {
    "number": "2",
    "name": "Jarra Terra",
    "dimensions": "10 × 12,4 cm",
    "value": 630.0,
    "technique": "Queima a lenha",
    "image": "/assets/coletivo-peca-13.webp"
  },
  {
    "number": "3",
    "name": "Vaso Chão de Cerrado",
    "dimensions": "21 × 16,2 cm",
    "value": 952.0,
    "technique": "Queima a lenha",
    "image": "/assets/coletivo-peca-14.webp"
  },
  {
    "number": "4",
    "name": "Vaso Colméia",
    "dimensions": "19 × 19,1 cm",
    "value": 1316.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-12.webp"
  },
  {
    "number": "5",
    "name": "Travessa Vestígio",
    "dimensions": "20 × 40,7 cm",
    "value": 2674.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-11.webp"
  },
  {
    "number": "6",
    "name": "Jarra Flor de Cerrado",
    "dimensions": "27 × 12,7 cm",
    "value": 1232.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-10.webp"
  },
  {
    "number": "7",
    "name": "Vaso Manga Rosa",
    "dimensions": "26 × 30,6 cm",
    "value": 2534.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-09.webp"
  },
  {
    "number": "9",
    "name": "Jarra Laranjeira",
    "dimensions": "20 × 14 cm",
    "value": 1043.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-06.webp"
  },
  {
    "number": "10",
    "name": "Jarra",
    "dimensions": "16 × 13,4 cm",
    "value": 744.8,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-05.webp"
  },
  {
    "number": "11",
    "name": "Travessa Cosmo",
    "dimensions": "13 × 33,4 cm",
    "value": 2156.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-04.webp"
  },
  {
    "number": "12",
    "name": "Vaso Araçá",
    "dimensions": "17 × 25 cm",
    "value": 2400.0,
    "technique": "Saggar",
    "image": "/assets/coletivo-peca-08.webp"
  }
];

  const description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eget metus vitae mauris volutpat fermentum. Curabitur vitae purus sed magna facilisis interdum.';

  const track = document.querySelector('[data-collective-track]');
  const moreButton = document.querySelector('[data-collective-more]');
  const dialog = document.querySelector('.collective-detail');
  if (!track || !dialog) return;

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const close = dialog.querySelector('.collective-detail__close');
  const allPieces = [];
  let currentIndex = 0;
  let opener;
  const purchaseLink = (piece) => `https://wa.me/5537999662621?text=${encodeURIComponent(`Olá. Me interessei pela peça ${piece.name} e gostaria de mais informações.`)}`;

  const showPiece = (index) => {
    currentIndex = (index + allPieces.length) % allPieces.length;
    const piece = allPieces[currentIndex];
    dialog.querySelector('[data-piece-technique]').textContent = piece.technique;
    dialog.querySelector('[data-piece-name]').textContent = piece.name;
    dialog.querySelector('[data-piece-description]').textContent = description;
    dialog.querySelector('[data-piece-dimensions]').textContent = piece.dimensions;
    dialog.querySelector('[data-piece-price]').textContent = currency.format(piece.value);
    const detailImage = dialog.querySelector('[data-piece-image]');
    detailImage.src = piece.image;
    detailImage.alt = `${piece.name} em ${piece.technique}`;
    dialog.querySelector('[data-piece-count]').textContent = `${currentIndex + 1} / ${allPieces.length}`;
    dialog.querySelector('[data-piece-whatsapp]').href = purchaseLink(piece);
  };

  const openPiece = (index, button) => {
    opener = button;
    showPiece(index);
    dialog.showModal();
  };

  products.forEach((piece) => {
      const { name, technique, value } = piece;
      const pieceIndex = allPieces.push(piece) - 1;
      const card = document.createElement('article');
      card.className = 'collective-piece';
      if (pieceIndex >= 12) card.hidden = true;
      const visual = document.createElement('div');
      visual.className = 'collective-piece__visual';
      const image = document.createElement('img');
      image.src = piece.image;
      image.alt = `${name} em ${technique}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = 600;
      image.height = 750;
      visual.append(image);
      const body = document.createElement('div');
      body.className = 'collective-piece__body';
      const techniqueLabel = document.createElement('p');
      techniqueLabel.className = 'collective-piece__technique';
      techniqueLabel.textContent = technique;
      const title = document.createElement('h3');
      title.textContent = name;
      const price = document.createElement('strong');
      price.textContent = currency.format(value);
      const actions = document.createElement('div');
      actions.className = 'collective-piece__actions';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'collective-piece__link';
      button.textContent = 'Informações';
      button.setAttribute('aria-label', `Mais informações sobre ${name}, peça ${piece.number} em ${technique}`);
      button.addEventListener('click', () => openPiece(pieceIndex, button));
      actions.append(button);
      body.append(techniqueLabel, title, price, actions);
      card.append(visual, body);
      track.append(card);
  });
  if (moreButton) moreButton.hidden = allPieces.length <= 12;

  moreButton?.addEventListener('click', () => {
    track.querySelectorAll('.collective-piece[hidden]').forEach((card) => { card.hidden = false; });
    moreButton.hidden = true;
  });

  close.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-piece-prev]').addEventListener('click', () => showPiece(currentIndex - 1));
  dialog.querySelector('[data-piece-next]').addEventListener('click', () => showPiece(currentIndex + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPiece(currentIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPiece(currentIndex + 1); }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
})();

const memberGallery = document.querySelector('.collective-members');
if (memberGallery) {
  memberGallery.setAttribute('role', 'region');
  memberGallery.setAttribute('tabindex', '0');
  memberGallery.setAttribute('aria-label', 'Integrantes do coletivo, deslize para ver as quatro fotografias');
  const controls = document.createElement('div');
  controls.className = 'collective-members__controls shell';
  for (const [label, glyph] of [['Foto anterior', '←'], ['Próxima foto', '→']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.textContent = glyph;
    controls.append(button);
  }
  memberGallery.after(controls);
  const [previous, next] = controls.querySelectorAll('button');
  const step = () => memberGallery.querySelector('figure')?.getBoundingClientRect().width ?? 280;
  previous.addEventListener('click', () => memberGallery.scrollBy({ left: -(step() + 16), behavior: 'smooth' }));
  next.addEventListener('click', () => memberGallery.scrollBy({ left: step() + 16, behavior: 'smooth' }));
}
