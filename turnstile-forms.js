(() => {
  const forms = [...document.querySelectorAll('form[data-turnstile-form]')];
  const widgets = new Map();
  const local = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  function status(form, text) {
    let element = form.querySelector('[data-turnstile-status]');
    if (!element) {
      element = document.createElement('p');
      element.className = 'turnstile-status';
      element.dataset.turnstileStatus = '';
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      form.append(element);
    }
    element.dataset.state = '';
    element.textContent = text;
  }
  window.kuaraTurnstileReady = () => {
    for (const form of forms) {
      if (widgets.has(form)) continue;
      if (local) { status(form, 'Prévia local: a verificação funciona no domínio publicado.'); continue; }
      const holder = form.querySelector('[data-turnstile-widget]');
      const field = form.elements.namedItem('cf-turnstile-response');
      const id = window.turnstile.render(holder, {
        sitekey: '0x4AAAAAAFyz0vmm5nreHXuC',
        action: form.getAttribute('name'), language:'pt-br', theme:'light',
        size: form.clientWidth < 320 ? 'compact' : 'flexible',
        'response-field': false,
        callback: token => { field.value = token; if (form.querySelector('[data-turnstile-status]')?.dataset.state !== 'success' && form.querySelector('[data-turnstile-status]')?.dataset.state !== 'error') status(form, ''); },
        'expired-callback': () => { field.value = ''; status(form, 'A verificação expirou. Confirme novamente antes de enviar.'); },
        'error-callback': () => { field.value = ''; status(form, 'Não foi possível carregar a verificação. Confira a conexão ou recarregue a página.'); },
      });
      widgets.set(form, id);
    }
  };
  for (const form of forms) {
    form.addEventListener('submit', async event => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (local) { status(form, 'Prévia local: os envios estão disponíveis no domínio publicado.'); return; }
      const fields = new FormData(form);
      if (!String(fields.get('cf-turnstile-response') || '').trim()) {
        status(form, 'Aguarde ou conclua a verificação de segurança antes de enviar.'); return;
      }
      const button = form.querySelector('[type="submit"]');
      if (button?.disabled) return;
      if (button) button.disabled = true;
      status(form, 'Validando e enviando…');
      try {
        const response = await fetch(form.action, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:new URLSearchParams(fields).toString() });
        if (!response.ok) {
          const detail = (response.headers.get('content-type') || '').startsWith('text/plain') ? (await response.text()).slice(0,300) : '';
          throw new Error(detail || `Não foi possível concluir o envio (erro ${response.status}).`);
        }
        form.reset();
        if (window.turnstile && widgets.has(form)) window.turnstile.reset(widgets.get(form));
        status(form, form.name.startsWith('newsletter-')
          ? 'Cadastro recebido com sucesso! Obrigada por acompanhar a Kûara.'
          : 'Formulário enviado com sucesso! Recebemos suas informações e entraremos em contato.');
        const feedback = form.querySelector('[data-turnstile-status]');
        feedback.dataset.state = 'success';
        feedback.tabIndex = -1;
        feedback.focus({ preventScroll: true });
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (button) button.disabled = false;
      } catch (error) {
        status(form, `${error.message || 'Não foi possível concluir o envio.'} Seus campos foram mantidos. Tente novamente.`);
        form.querySelector('[data-turnstile-status]').dataset.state = 'error';
        form.elements.namedItem('cf-turnstile-response').value = '';
        if (window.turnstile && widgets.has(form)) window.turnstile.reset(widgets.get(form));
        if (button) button.disabled = false;
      }
    });
  }
})();
