(function(){
  const form = document.getElementById('shortenForm');
  const resultSection = document.getElementById('result');
  const jsonResult = document.getElementById('jsonResult');
  const shortLink = document.getElementById('shortLink');
  const qrArea = document.getElementById('qrArea');
  const logOutput = document.getElementById('logOutput');
  const openLinkBtn = document.getElementById('openLink');
  const previewBtn = document.getElementById('previewTarget');

  function log(...args){
    const txt = args.map(a=>typeof a==='object'?JSON.stringify(a,null,2):String(a)).join(' ')+"\n";
    logOutput.textContent = txt + logOutput.textContent;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    resultSection.classList.add('hidden');
    qrArea.innerHTML = '';

    const originalUrl = document.getElementById('originalUrl').value.trim();
    const customAlias = document.getElementById('customAlias').value.trim() || undefined;
    const title = document.getElementById('title').value.trim() || undefined;
    const expiresIn = document.getElementById('expiresIn').value ? Number(document.getElementById('expiresIn').value) : undefined;
    const token = document.getElementById('token').value.trim();

    const body = { originalUrl };
    if(customAlias) body.customAlias = customAlias;
    if(title) body.title = title;
    if(expiresIn) body.expiresIn = expiresIn;

    log('Creating short URL', body);

    try{
      const headers = { 'Content-Type':'application/json', 'Accept':'application/json' };
      if(token) headers['Authorization'] = 'Bearer '+token;
      const resp = await fetch('/api/urls', {
        method:'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await resp.json().catch(()=>({}));
      if(!resp.ok){
        log('Create failed', resp.status, data);
        jsonResult.textContent = JSON.stringify({ status: resp.status, body: data }, null, 2);
        resultSection.classList.remove('hidden');
        return;
      }

      log('Created', data);
      jsonResult.textContent = JSON.stringify(data, null, 2);
      resultSection.classList.remove('hidden');

      const shortUrl = data.data && (data.data.shortUrl || (data.data.shortCode? window.location.origin + '/' + data.data.shortCode : null));
      if(shortUrl){
        shortLink.innerHTML = `<a href="${shortUrl}" target="_blank">${shortUrl}</a>`;
        openLinkBtn.onclick = ()=> window.open(shortUrl, '_blank');
      }

      // If the API returned a QR data URL, show it
      const qr = data.data && data.data.qrCode;
      if(qr){
        const img = document.createElement('img'); img.src = qr; qrArea.appendChild(img);
      } else {
        // Poll preview to check when qr is ready
        if(data.data && data.data.shortCode){
          pollForQR(data.data.shortCode);
        }
      }

    }catch(err){
      log('Error creating short URL', err.message||err);
      jsonResult.textContent = JSON.stringify({ error: err.message||String(err) }, null, 2);
      resultSection.classList.remove('hidden');
    }
  });

  previewBtn.addEventListener('click', async ()=>{
    const text = jsonResult.textContent;
    if(!text) return;
    try{
      const parsed = JSON.parse(text);
      const shortCode = parsed.data && parsed.data.shortCode;
      if(!shortCode) return log('No shortCode in result');
      const resp = await fetch('/'+shortCode, { headers: { 'Accept':'application/json' } });
      const payload = await resp.json();
      log('Preview', payload);
      alert('Target: '+payload.targetUrl);
    }catch(err){ log('Preview error', err); }
  });

  async function pollForQR(shortCode){
    log('Start polling for QR', shortCode);
    const max = 12; // 12 attempts ~ 60s
    for(let i=0;i<max;i++){
      try{
        const resp = await fetch('/'+shortCode, { headers: { 'Accept':'application/json' } });
        const payload = await resp.json();
        if(payload && payload.targetUrl){
          // try to get QR from our API (we expect qrPending flag)
          if(payload.qrPending===false){
            // fetch full URL info from /api/urls? not implemented; assume payload has qr field
            // try GET /api/urls (not available). Instead, try to fetch shortUrl and let worker do it.
            log('QR should be ready; reload or fetch record from dashboard');
            return;
          }
          log('Polling, qrPending=', payload.qrPending);
        }
      }catch(err){ log('Polling error', err.message||err); }
      await new Promise(r=>setTimeout(r,5000));
    }
    log('Polling finished, QR not ready');
  }

})();