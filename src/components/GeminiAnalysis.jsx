import React, { useState } from 'react';
import { Loader, Search, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Import library baru

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, allData, userRole, interactivePlaceholder = "Ajukan pertanyaan..." }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [customQuery, setCustomQuery] = useState('');

    if (userRole === 'viewer') return null;

    const handleGetAnalysis = async (query) => {
    setIsLoading(true);
    setAnalysis('');
    setError('');

    const prompt = getAnalysisPrompt(query, allData);

    try {
        // Panggil file gemini.js Anda
        const response = await fetch('/api/gemini', { // Panggil route lokal Anda
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
});

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Gagal mendapatkan analisis dari server");
        }

        // Ambil teks dari struktur respons Gemini
        const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        setAnalysis(aiResponse || "Tidak ada hasil analisis.");
        
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="my-8">
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2 items-center">
                    <input
                        type="text"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder={interactivePlaceholder}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                    <button
                        onClick={() => handleGetAnalysis(customQuery)}
                        disabled={isLoading || disabledCondition || !customQuery}
                        className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
                    >
                        {isLoading ? <Loader className="animate-spin mr-2" /> : <Search className="mr-2" />}
                        Tanya AI
                    </button>
                </div>
                
                <div className="flex justify-end">
                    <button
                        onClick={() => handleGetAnalysis('')}
                        disabled={isLoading || disabledCondition}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md disabled:opacity-50"
                    >
                        <Sparkles className="mr-2" />
                        Beri Analisa & Rekomendasi
                    </button>
                </div>
            </div>

            {(isLoading || analysis || error) && (
                <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold mb-4">Hasil Analisis AI</h3>
                    {isLoading && <Loader className="animate-spin text-purple-500 mx-auto" size={40}/>}
                    {error && <p className="text-red-600">{error}</p>}
                    
                    {/* MERENDER MARKDOWN SECARA AMAN */}
                    {analysis && (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GeminiAnalysis;
