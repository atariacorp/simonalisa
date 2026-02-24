const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GENERATIVE_API_KEY;
  const apiUrl = process.env.GENERATIVE_API_URL || process.env.GEMINI_API_URL;

  if (!apiKey || !apiUrl) {
    return res.status(500).json({ error: 'Generative API not configured' });
  }

  try {
    const body = req.body || {};
    console.log('api/gemini invoked with body:', JSON.stringify(body));

    const resp = await fetch(`${apiUrl}${apiUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const status = resp.status || 200;
    const text = await resp.text().catch(() => null);
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = null;
    }

    console.log('api/gemini response status:', status);
    console.log('api/gemini response text:', text);

    if (data) {
      return res.status(status).json(data);
    }
    return res.status(status).json({ raw: text, status });
  } catch (err) {
    console.error('api/gemini error:', err);
    // Return error details temporarily for debugging. Remove stack before production.
    return res.status(500).json({ error: err.message || String(err), stack: err.stack || null });
  }
};

export default handler;
