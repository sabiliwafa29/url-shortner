// Basic UI behavior for tabs and small interactions
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // In this static demo we don't change form behavior, but you could toggle views here
  }));

  // set current year
  const y = new Date().getFullYear();
  const el = document.getElementById('year'); if (el) el.textContent = y;

  // Toast helper (single container)
  function showToast(message, type = '') {
    try {
      let container = document.getElementById('toast');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast';
        container.className = 'toast';
        document.body.appendChild(container);
      }

      // create item
      const item = document.createElement('div');
      item.className = 'toast-item ' + (type || '');
      const icon = document.createElement('span');
      icon.className = 'toast-icon';
      icon.setAttribute('aria-hidden', 'true');
      // use inline SVGs for crisper icons; color inherits from `color` on the element
      if (type === 'success') {
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else if (type === 'error') {
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else {
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>';
      }

      const text = document.createElement('div');
      text.className = 'toast-text';
      text.textContent = message;

      item.appendChild(icon);
      item.appendChild(text);
      container.appendChild(item);

      // animate in
      requestAnimationFrame(() => item.classList.add('show'));

      // auto remove
      const ttl = 4200;
      const remover = () => {
        item.classList.remove('show');
        setTimeout(() => { try { item.remove(); } catch(e){} }, 260);
      };
      const t = setTimeout(remover, ttl);

      // allow click to dismiss
      item.addEventListener('click', () => { clearTimeout(t); remover(); });
    } catch (e) { /* ignore */ }
  }
  
  // Form submit handling: POST to /api/urls
  const form = document.getElementById('shortenForm');
  if (!form) return;

  const urlInput = document.getElementById('url');
  const tokenInput = document.getElementById('token');
  const aliasInput = document.getElementById('customAlias');
  const resultBox = document.getElementById('result');
  const resultLink = document.getElementById('resultLink');
  const resultQr = document.getElementById('resultQr');
  const copyBtn = document.getElementById('copyBtn');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const originalUrl = urlInput.value.trim();
    const token = tokenInput.value.trim();
    const customAlias = aliasInput.value.trim() || undefined;

    if (!originalUrl) return;

    const payload = { originalUrl };
    if (customAlias) payload.customAlias = customAlias;

    try {
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/urls', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      const info = data.data;
      const href = info.shortUrl || `${location.origin}/${info.shortCode || info.customAlias}`;
      resultLink.textContent = href;
      resultLink.href = href;
      resultQr.innerHTML = '';
      if (info.qrCode) {
        const img = document.createElement('img'); img.src = info.qrCode; resultQr.appendChild(img);
      }
      resultBox.hidden = false;

    } catch (err) {
      showToast('Create link failed: ' + (err.message || err), 'error');
    }
  });

  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const href = resultLink.href;
    try {
      await navigator.clipboard.writeText(href);
      copyBtn.textContent = 'Copied';
      setTimeout(()=>copyBtn.textContent = 'Copy',1500);
    } catch(e) {
      showToast('Copy failed', 'error');
    }
  });

  // --- Modal login: open/close and submit ---
  const getStarted = document.getElementById('getStartedBtn');
  const modal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginMsg = document.getElementById('loginMsg');
  const tokenField = document.getElementById('token');
  const modalCard = modal && modal.querySelector('.modal-card');
  const loginSubmitBtn = loginForm && loginForm.querySelector('button[type="submit"]');
  const signOutBtn = document.getElementById('signOutBtn');
  let previousActive = null;
  let trapListener = null;

  function showModal() {
    if (!modal) return;
    previousActive = document.activeElement;
    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    const email = document.getElementById('loginEmail'); if (email) email.focus();
    // focus trap
    trapListener = (ev) => {
      if (ev.key !== 'Tab') return;
      const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (ev.shiftKey) { if (document.activeElement === first) { ev.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { ev.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', trapListener);
  }
  function hideModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    loginMsg.textContent = '';
    document.body.style.overflow = '';
    if (trapListener) document.removeEventListener('keydown', trapListener);
    trapListener = null;
    // restore previous focus
    try { if (previousActive && typeof previousActive.focus === 'function') previousActive.focus(); }
    catch(e){}
    previousActive = null;
  }

  if (getStarted && modal) {
    getStarted.addEventListener('click', (ev) => { ev.preventDefault(); showModal(); });

    // overlay and dismiss buttons
    modal.addEventListener('click', (ev) => {
      if (ev.target.matches('[data-dismiss]') || ev.target.classList.contains('modal-overlay')) hideModal();
    });
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', hideModal);

    // close on Esc
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hideModal(); });
  }

  // Prefill token from localStorage if exists
  try {
    const saved = localStorage.getItem('url_short_token');
    if (saved && tokenField) tokenField.value = saved;
    if (saved && signOutBtn) signOutBtn.classList.remove('hidden');
  } catch(e){}

  if (loginForm) {
    loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const emailEl = document.getElementById('loginEmail');
      const pwdEl = document.getElementById('loginPassword');
      const email = emailEl.value.trim();
      const password = pwdEl.value;

      // quick validation (show errors as toast)
      emailEl.classList.remove('input-error'); pwdEl.classList.remove('input-error');
      if (!email) { emailEl.classList.add('input-error'); showToast('Please enter your email', 'error'); emailEl.focus(); return; }
      if (!password) { pwdEl.classList.add('input-error'); showToast('Please enter your password', 'error'); pwdEl.focus(); return; }
      if (loginSubmitBtn) { loginSubmitBtn.disabled = true; loginSubmitBtn.setAttribute('aria-busy','true'); }
      if (modalCard) modalCard.setAttribute('aria-busy','true');

      // show spinner inside button
      if (loginSubmitBtn && !loginSubmitBtn.querySelector('.login-spinner')) {
        const sp = document.createElement('span'); sp.className = 'login-spinner'; loginSubmitBtn.appendChild(sp);
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ email, password })
        });
        const body = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(body.error || body.message || 'Login failed');
        // try common places for token
        const token = body.token || (body.data && body.data.token) || (body.data && body.data.accessToken) || body.accessToken;
        if (token && tokenField) {
          tokenField.value = token;
          try { localStorage.setItem('url_short_token', token); } catch(e){}
          if (signOutBtn) signOutBtn.classList.remove('hidden');
        }
        showToast('Signed in', 'success');
        setTimeout(()=>hideModal(),500);
      } catch (err) {
        showToast(err.message || 'Sign in failed', 'error');
      } finally {
        if (loginSubmitBtn) { loginSubmitBtn.disabled = false; loginSubmitBtn.removeAttribute('aria-busy'); }
        if (modalCard) modalCard.removeAttribute('aria-busy');
        const spinner = loginSubmitBtn && loginSubmitBtn.querySelector('.login-spinner'); if (spinner) spinner.remove();
      }
    });
  }

  // Sign out behavior
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      try { localStorage.removeItem('url_short_token'); } catch(e){}
      if (tokenField) tokenField.value = '';
      signOutBtn.classList.add('hidden');
      // optional visual feedback
      showToast('Signed out', 'success');
    });
  }
});
