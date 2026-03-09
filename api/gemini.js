// HANYA aktifkan baris di bawah jika Anda menggunakan Node.js versi tua (di bawah v18)
// import fetch from 'node-fetch'; 

const handler = async (req, res) => {
  // 1. Validasi Method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Ambil Environment Variables
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const apiUrl = process.env.GENERATIVE_API_URL;

  // 3. Validasi Keberadaan Config (Pindahkan ke atas sebelum eksekusi)
  if (!apiKey || !apiUrl) {
    console.error('Missing API Config');
    return res.status(500).json({ error: 'API Configuration Missing pada Server' });
  }

  try {
    const body = req.body;
    
    // 4. Konstruksi URL yang Aman
    // Menggunakan Gemini 2.0 Flash (Free Tier friendly) sangat disarankan
    const finalUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}key=${apiKey}`;

    const resp = await fetch(finalUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // Cek jika response kosong sebelum parsing JSON
    const text = await resp.text();
    const data = text ? JSON.parse(text) : {};

    if (!resp.ok) {
      // Jika Free Tier habis limit (429), pesan ini akan muncul
      return res.status(resp.status).json({ 
        error: data.error?.message || 'Gemini API Error',
        status: resp.status
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
  }
};

export default handler;