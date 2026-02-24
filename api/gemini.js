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

    const resp = await fetch(`${apiUrl}${apiUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => null);
    const status = resp.status || 200;
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
};

module.exports = handler;
