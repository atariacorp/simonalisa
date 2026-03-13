// api/gemini.js
export default async function handler(req, res) {
  // 1. Handle Preflight CORS (Penting agar Vercel tidak blokir Frontend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Bisa diganti domain asli nanti
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Hanya terima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Gunakan method POST'
    });
  }

  try {
    // 3. Ambil API Key (Pastikan nanti diisi di Dashboard Vercel)
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'Configuration Error',
        message: 'API Key belum dipasang di Vercel Environment Variables'
      });
    }

    // 4. Panggil Gemini API (Menggunakan model 'latest' yang sukses tadi)
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }
    );

    const data = await googleResponse.json();

    // 5. Cek Error dari Google
    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: 'Google Gemini API Error',
        details: data
      });
    }

    // 6. Kirim jawaban sukses
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}