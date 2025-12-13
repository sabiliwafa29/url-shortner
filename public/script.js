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
      alert('Create link failed: ' + (err.message || err));
    }
  });

  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const href = resultLink.href;
    try {
      await navigator.clipboard.writeText(href);
      copyBtn.textContent = 'Copied';
      setTimeout(()=>copyBtn.textContent = 'Copy',1500);
    } catch(e) {
      alert('Copy failed');
    }
  });
});
