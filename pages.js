const agendaButtons = [...document.querySelectorAll('[data-agenda-filter]')];
if (agendaButtons.length) {
  const cards = [...document.querySelectorAll('[data-event-category]')];
  const empty = document.querySelector('[data-agenda-empty]');
  agendaButtons.forEach((button) => button.addEventListener('click', () => {
    const selected = button.dataset.agendaFilter;
    agendaButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    cards.forEach((card) => {
      const matches = selected === 'todos' || card.dataset.eventCategory.split(' ').includes(selected);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    empty.hidden = visible !== 0;
  }));
}

document.querySelectorAll('[data-local-captcha]').forEach((form) => {
  const question = form.querySelector('[data-captcha-question]');
  const answerField = form.elements.namedItem('verificacao');
  if (!(question instanceof HTMLElement) || !(answerField instanceof HTMLInputElement)) return;
  const first = 2 + Math.floor(Math.random() * 6);
  const second = 2 + Math.floor(Math.random() * 6);
  form.dataset.captchaAnswer = String(first + second);
  question.textContent = `Verificação antispam: quanto é ${first} + ${second}?`;
  answerField.addEventListener('input', () => answerField.setCustomValidity(''));
});

document.querySelectorAll('[data-exact-topics]').forEach((form) => {
  const group = form.querySelector('[data-topic-group]');
  const topics = [...(group?.querySelectorAll('input[type="checkbox"]') || [])];
  const status = group?.querySelector('[data-topic-status]');
  const experience = [...form.querySelectorAll('input[name="experiencia[]"]')];
  const otherExperience = form.elements.namedItem('experiencia_outra');
  const exact = Number(form.dataset.exactTopics || 3);
  if (!topics.length || !(status instanceof HTMLElement)) return;

  const updateTopics = () => {
    const selected = topics.filter((topic) => topic.checked).length;
    topics[0].setCustomValidity('');
    status.textContent = selected === exact
      ? `${exact} temas selecionados.`
      : `Selecione exatamente ${exact} temas. ${selected} de ${exact} selecionados.`;
  };
  topics.forEach((topic) => topic.addEventListener('change', updateTopics));
  experience.forEach((item) => item.addEventListener('change', () => experience[0].setCustomValidity('')));
  otherExperience?.addEventListener('input', () => experience[0]?.setCustomValidity(''));

  form.addEventListener('submit', (event) => {
    const selected = topics.filter((topic) => topic.checked).length;
    if (selected !== exact) {
      event.preventDefault();
      topics[0].setCustomValidity(`Selecione exatamente ${exact} temas.`);
      topics[0].reportValidity();
      topics[0].focus();
      return;
    }
    if (!experience.some((item) => item.checked) && !String(otherExperience?.value || '').trim()) {
      event.preventDefault();
      experience[0].setCustomValidity('Escolha uma opção ou descreva sua experiência.');
      experience[0].reportValidity();
      experience[0].focus();
    }
  });
  updateTopics();
});

const preference = document.querySelector('[data-analytics-preference]');
if (preference) {
  preference.checked = localStorage.getItem('kuara-analytics-preference') === 'yes';
  preference.addEventListener('change', () => {
    localStorage.setItem('kuara-analytics-preference', preference.checked ? 'yes' : 'no');
    document.querySelector('[data-preference-status]').textContent = 'Preferência salva neste navegador. Nenhuma ferramenta de análise está ativa no momento.';
  });
}

const emberCanvas = document.querySelector('[data-ember-field]');
if (emberCanvas) {
  const context = emberCanvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastDraw = 0;
  let visible = true;
  const embers = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: .65 + Math.random() * 1.8,
    speed: .0001 + Math.random() * .00022,
    phase: Math.random() * Math.PI * 2
  }));
  const smoke = Array.from({ length: 22 }, () => ({
    x: .18 + Math.random() * .64,
    y: .18 + Math.random() * .85,
    size: 55 + Math.random() * 120,
    speed: .00006 + Math.random() * .00012,
    phase: Math.random() * Math.PI * 2
  }));
  const resize = () => {
    const scale = Math.min(.55, 900 / Math.max(1, emberCanvas.clientWidth));
    width = Math.round(emberCanvas.clientWidth * scale);
    height = Math.round(emberCanvas.clientHeight * scale);
    emberCanvas.width = width;
    emberCanvas.height = height;
    draw(performance.now(), true);
  };
  const draw = (time, still = false) => {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    const glow = context.createRadialGradient(width * .52, height * .98, 0, width * .52, height * .98, width * .48);
    glow.addColorStop(0, 'rgba(255,111,28,.20)');
    glow.addColorStop(.4, 'rgba(173,54,17,.07)');
    glow.addColorStop(1, 'rgba(173,54,17,0)');
    context.fillStyle = glow;
    context.fillRect(0, height * .45, width, height * .55);
    context.globalCompositeOperation = 'screen';
    smoke.forEach((puff) => {
      const y = (puff.y - (still ? 0 : time * puff.speed) % 1 + 1) % 1;
      const x = (puff.x + Math.sin(time * .00035 + puff.phase) * .045) * width;
      const radius = puff.size * Math.max(.65, width / 900);
      const gradient = context.createRadialGradient(x, y * height, 0, x, y * height, radius);
      gradient.addColorStop(0, 'rgba(218,212,203,.12)');
      gradient.addColorStop(1, 'rgba(218,212,203,0)');
      context.fillStyle = gradient;
      context.fillRect(x - radius, y * height - radius, radius * 2, radius * 2);
    });
    embers.forEach((spark) => {
      const y = (spark.y - (still ? 0 : time * spark.speed) % 1 + 1) % 1;
      if (y < .12 || y > .95) return;
      const x = (spark.x + Math.sin(time * .00018 + spark.phase) * .025) * width;
      context.beginPath();
      context.arc(x, y * height, spark.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(255,${120 + Math.round(spark.size * 35)},72,${.28 * (1 - y)})`;
      context.fill();
    });
    context.globalCompositeOperation = 'source-over';
  };
  const tick = (time) => {
    if (visible && !reducedMotion.matches && time - lastDraw > 40) {
      draw(time);
      lastDraw = time;
    }
    frame = requestAnimationFrame(tick);
  };
  new ResizeObserver(resize).observe(emberCanvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(emberCanvas);
  reducedMotion.addEventListener('change', resize);
  frame = requestAnimationFrame(tick);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
}

const revealStack = document.querySelector('[data-reveal-stack]');
if (revealStack) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let queued = false;
  const updateStack = () => {
    queued = false;
    const rect = revealStack.getBoundingClientRect();
    const reach = window.innerHeight * .75;
    const progress = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (reach - rect.top) / (window.innerHeight * .75)));
    const width = Math.min(revealStack.clientWidth * .22, 155);
    revealStack.style.setProperty('--stack-left', `${Math.round(-width * progress)}px`);
    revealStack.style.setProperty('--stack-left-inner', `${Math.round(-width * .38 * progress)}px`);
    revealStack.style.setProperty('--stack-right-inner', `${Math.round(width * .38 * progress)}px`);
    revealStack.style.setProperty('--stack-right', `${Math.round(width * progress)}px`);
  };
  const requestUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(updateStack);
  };
  updateStack();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  reducedMotion.addEventListener('change', requestUpdate);
}
