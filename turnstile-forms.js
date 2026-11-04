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
        callback: token => { field.value = token; status(form, ''); },
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
        if (!response.ok) throw new Error('Não foi possível concluir o envio.');
        if (form.hasAttribute('data-whatsapp-form')) {
          const lines = [`Olá, quero falar sobre ${form.dataset.formKind || 'a Kûara'}.`];
          const excluded = new Set(['consent','autorizacao','verificacao','form-name','website','cf-turnstile-response','kuara-verification']);
          for (const [name, value] of fields) if (!excluded.has(name) && String(value).trim()) lines.push(`${name.replaceAll('_',' ')}: ${String(value).trim()}`);
          window.location.assign('https://wa.me/5537999662621?text=' + encodeURIComponent(lines.join('\n')));
        } else {
          window.location.assign(form.action);
        }
      } catch {
        status(form, 'Não foi possível concluir o envio. Seus campos foram mantidos. Confirme a verificação e tente novamente.');
        form.elements.namedItem('cf-turnstile-response').value = '';
        if (window.turnstile && widgets.has(form)) window.turnstile.reset(widgets.get(form));
        if (button) button.disabled = false;
      }
    });
  }
})();
