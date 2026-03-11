import React from 'react';
import SectionTitle from '../components/SectionTitle';  // <-- INI BENAR
import { BookOpen, FileText, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';

const GuideView = () => {
  const sections = [
    {
      title: "📊 Dashboard",
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      items: [
        "Lihat ringkasan APBD: total pendapatan, belanja, dan pembiayaan",
        "Pantau realisasi anggaran dan pendapatan secara real-time",
        "Analisis interaktif dengan AI Gemini"
      ]
    },
    {
      title: "🤖 Fitur AI",
      icon: <HelpCircle className="w-6 h-6 text-purple-500" />,
      items: [
        "Klik 'Beri Analisa & Rekomendasi' untuk analisis otomatis",
        "Ajukan pertanyaan spesifik di kolom 'Tanya AI'",
        "Contoh: 'Analisis anggaran Dinas Pendidikan'"
      ]
    },
    {
      title: "📈 Analisis Kinerja",
      icon: <ArrowRight className="w-6 h-6 text-green-500" />,
      items: [
        "Bandingkan kinerja antar SKPD",
        "Lihat tren realisasi per bulan",
        "Identifikasi SKPD dengan penyerapan rendah"
      ]
    },
    {
      title: "💰 Sumber Dana",
      icon: <CheckCircle className="w-6 h-6 text-yellow-500" />,
      items: [
        "Rincian penggunaan DAK, DAU, DPP, dll",
        "Filter berdasarkan SKPD dan sub kegiatan",
        "Download data ke Excel"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SectionTitle>📖 Panduan Penggunaan Aplikasi</SectionTitle>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-8">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Selamat datang di <strong>Sistem Informasi Analisa APBD</strong>. Aplikasi ini membantu Anda 
          menganalisis Anggaran Pendapatan dan Belanja Daerah dengan dukungan AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              {section.icon}
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {section.title}
              </h3>
            </div>
            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
        <p className="font-semibold text-yellow-800 dark:text-yellow-300">💡 Tips Penggunaan AI:</p>
        <p className="text-yellow-700 dark:text-yellow-400">
          Gunakan pertanyaan yang spesifik. Contoh: "Analisis realisasi belanja Dinas PU bulan Maret" 
          atau "Bandingkan penyerapan anggaran Dinas Pendidikan dan Dinas Kesehatan".
        </p>
      </div>
    </div>
  );
};

export default GuideView;
