import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw, Loader2, AlertTriangle, Info } from 'lucide-react';

/**
 * Komponen Universal Gemini Analysis
 * @param {Function} getAnalysisPrompt - Fungsi untuk merakit string prompt
 * @param {Object} allData - Data mentah yang akan dianalisis (opsional)
 * @param {Boolean} disabledCondition - Kondisi tombol dinonaktifkan (misal data kosong)
 * @param {String} title - Judul kotak analisis
 * @param {String} subtitle - Subjudul/Keterangan
 * @param {String} systemInstruction - Instruksi peran AI (Analis Keuangan, dsb)
 */
const GeminiAIComponent = ({ 
  getAnalysisPrompt, 
  allData = {}, 
  disabledCondition = false,
  title = "AI Insight: Analisis Eksekutif",
  subtitle = "Ringkasan cerdas berdasarkan data terkini",
  systemInstruction = "Anda adalah analis keuangan publik profesional. Berikan analisis singkat, padat, dan strategis dalam bahasa Indonesia. Format dengan poin-poin tebal yang rapi."
}) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAnalysis = async () => {
    if (disabledCondition) return;
    
    setLoading(true);
    setError(null);

    // Ambil prompt dari fungsi yang dikirim via props
    const prompt = getAnalysisPrompt("", allData);

    try {
      // Memanggil file backend gemini.js Anda
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { 
            parts: [{ text: systemInstruction }] 
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mendapatkan analisis");
      }

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysis(text || "Gagal menghasilkan analisis.");
    } catch (err) {
      console.error("AI Error:", err);
      setError(err.message || "Gagal menghubungi layanan AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/20 p-6 md:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-500/30 shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
              {title}
              <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading || disabledCondition}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            loading || disabledCondition
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-xl active:scale-95'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {analysis ? 'Analisis Ulang' : 'Mulai Analisis AI'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-2xl mb-4 text-sm font-medium border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {analysis ? (
        <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-gray-800/70 p-6 rounded-2xl backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-inner animate-in fade-in duration-700">
          {analysis}
        </div>
      ) : (
        !loading && (
          <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800/50 text-center">
            <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Tekan tombol di atas untuk memerintahkan AI menganalisis data ini secara otomatis.
            </p>
          </div>
        )
      )}
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Sedang merumuskan evaluasi strategis...</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAIComponent;