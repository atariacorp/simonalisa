// api/gemini.js
export default async function handler(req, res) {
  // 1. Handle Preflight CORS (Penting agar Vercel tidak blokir Frontend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
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

  // 3. Validasi Body Request (Agar tidak Error 500 jika data kosong)
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Body request kosong! Pastikan frontend mengirimkan data JSON.' 
    });
  }

  try {
    // 4. Ambil API Key dari Environment Variable
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'Configuration Error',
        message: 'API Key belum dipasang di Environment Variables'
      });
    }

    // 5. Panggil Gemini API menggunakan endpoint yang sukses di Thunder Client
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body) 
      }
    );

    const data = await googleResponse.json();

    // 6. Cek Error dari Google
    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: 'Google Gemini API Error',
        details: data
      });
    }

    // 7. Kirim jawaban sukses ke Frontend
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error detail:', error); 
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}