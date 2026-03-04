import React, { useState } from 'react';
import { Loader, Search, Sparkles } from 'lucide-react';
import API_KEYS from './keys'; // sesuaikan path jika perlu

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, allData = null, selectedYear = new Date().getFullYear(), interactivePlaceholder = "Ajukan pertanyaan tentang data...", userRole }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [customQuery, setCustomQuery] = useState('');

    if (userRole === 'viewer') {
        return null;
    }

    const handleGetAnalysis = async (query) => {
        setIsLoading(true);
        setAnalysis('');
        setError('');
        const prompt = getAnalysisPrompt(query, allData);

        // Daftar API key yang akan dicoba
        const apiKeys = [
            API_KEYS.primary,
            API_KEYS.secondary,
            API_KEYS.tertiary
        ].filter(key => key); // buang key kosong

        let lastError = null;

        for (const apiKey of apiKeys) {
            try {
                const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory };
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.candidates?.[0]?.content?.parts?.[0]) {
                        setAnalysis(result.candidates[0].content.parts[0].text);
                        setIsLoading(false);
                        return; // sukses
                    } else {
                        throw new Error("Respons dari API tidak memiliki format yang diharapkan.");
                    }
                } else if (response.status === 429) {
                    console.log(`Key ${apiKey} quota exhausted, trying next...`);
                    lastError = `Key ${apiKey} quota exhausted`;
                    continue;
                } else {
                    throw new Error(`API call failed with status: ${response.status}`);
                }
            } catch (err) {
                console.error("Gemini API error with key:", apiKey, err);
                lastError = err;
            }
        }

        setError(`Gagal mendapatkan analisis. Semua API Key tidak berfungsi. ${lastError ? 'Error terakhir: ' + (lastError.message || lastError) : ''}`);
        setIsLoading(false);
    };

    const renderFormattedText = (text) => {
        const lines = text.split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.substring(4)}</h3>;
            if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.substring(3)}</h2>;
            if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.substring(2)}</h1>;
            if (line.startsWith('* ')) return <li key={index} className="ml-5 list-disc" dangerouslySetInnerHTML={{ __html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>;
            if (line.trim() === '') return <br key={index} />;
            return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        });
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        onClick={() => handleGetAnalysis(customQuery)}
                        disabled={isLoading || disabledCondition || !customQuery}
                        className="flex-shrink-0 flex items-center justify-center w-full md:w-auto px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="animate-spin mr-2" size={20} /> : <Search className="mr-2" size={20} />}
                        Tanya AI
                    </button>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => handleGetAnalysis('')}
                        disabled={isLoading || disabledCondition}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="mr-2" size={20} />
                        Beri Analisa & Rekomendasi
                    </button>
                </div>
            </div>
            {(isLoading || analysis || error) && (
                <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Hasil Analisis AI</h3>
                    {isLoading && <div className="flex items-center justify-center h-40"><Loader className="animate-spin text-purple-500" size={40}/></div>}
                    {error && <p className="text-red-600">{error}</p>}
                    {analysis && <div className="prose max-w-none text-gray-700 dark:text-gray-300">{renderFormattedText(analysis)}</div>}
                </div>
            )}
        </div>
    );
};

export default GeminiAnalysis;