// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. Inisialisasi Environment Variables
dotenv.config();

const app = express();
const PORT = 3001;

// 2. Konfigurasi Middleware
// Menangani CORS agar Vite (port 5173) bisa mengakses Server ini (port 3001)
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

// Middleware untuk logging setiap ada request masuk
app.use((req, res, next) => {
  console.log(`\n📥 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 3. Endpoint Test (Untuk memastikan server hidup)
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Server API SIMONALISA berjalan dengan baik di port 3001' 
  });
});

// 4. Endpoint Utama Gemini
app.post('/api/gemini', async (req, res) => {
  console.log('='.repeat(50));
  console.log('📝 Menerima request ke Gemini API');
  
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    // Log pengecekan API Key (Hanya menampilkan 10 karakter awal demi keamanan)
    if (!API_KEY) {
      console.error('❌ ERROR: API Key tidak ditemukan di .env');
      return res.status(500).json({ 
        error: 'Konfigurasi Server Salah',
        message: 'API Key tidak ditemukan di server. Pastikan file .env sudah benar.'
      });
    }

    console.log('🔑 API Key Terdeteksi:', `${API_KEY.substring(0, 10)}...`);

    // Validasi Body
    if (!req.body.contents) {
      console.error('❌ ERROR: Body request kosong atau salah format');
      return res.status(400).json({ error: 'Struktur data contents wajib ada' });
    }

    // 5. Panggil Google Gemini API
    console.log('🌐 Menghubungi Google AI Studio...');
    
    const googleResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  }
);

    const data = await googleResponse.json();

    // Jika Google memberikan respon error (misal: kuota habis, region tidak didukung)
    if (!googleResponse.ok) {
      console.error('❌ Error dari Google Gemini:', JSON.stringify(data, null, 2));
      return res.status(googleResponse.status).json({
        error: 'Google Gemini API Error',
        details: data
      });
    }

    // 6. Kirim hasil sukses ke Frontend
    console.log('✅ Sukses! Mengirim jawaban AI ke Dashboard.');
    res.status(200).json(data);
    
  } catch (error) {
    console.error('💥 Internal Server Error:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server internal',
      message: error.message 
    });
  }
  console.log('='.repeat(50));
});

// 7. Jalankan Server
app.listen(PORT, () => {
  console.log('\n' + '⭐'.repeat(25));
  console.log(`🚀 BACKEND SIMONALISA AKTIF`);
  console.log(`📡 URL API: http://localhost:${PORT}/api/gemini`);
  console.log(`🔗 Cek Status: http://localhost:${PORT}/api/test`);
  console.log('⭐'.repeat(25) + '\n');
});