const SUPABASE_URL = 'https://lplgqdnsleocmbilbiem.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbGdxZG5zbGVvY21iaWxiaWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjM5NjgsImV4cCI6MjA4OTY5OTk2OH0.b2-gE86CKadLeAzL72leFPxE2XlCupvq4GKI0I3CfBo';

// İzin verilen origin'ler (GitHub Pages siteniz)
const ALLOWED_ORIGINS = [
  'https://eevvrreenn.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

module.exports = async function handler(req, res) {
  // CORS kontrolü
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

  if (!allowed && origin !== '') {
    return res.status(403).json({ error: 'Forbidden origin: ' + origin });
  }

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,Prefer');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Supabase path — /api/proxy/rest/v1/raporlar → /rest/v1/raporlar
  const path = req.url.replace(/^\/api\/proxy/, '');
  if (!path.startsWith('/rest/v1/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const targetUrl = SUPABASE_URL + path;

  // Body
  let body = undefined;
  if (['POST','PATCH','PUT'].includes(req.method)) {
    body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': req.headers['prefer'] || '',
      },
      body,
    });

    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);

    // Supabase header'larını aktar
    ['content-range', 'x-total-count'].forEach(h => {
      const v = response.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
};
