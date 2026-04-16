import React, { useState, useMemo, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector, ComposedChart, Line,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
    TrendingUp, Award, AlertTriangle, CheckCircle, Info, 
    Bot, Sparkles, Loader2, RefreshCw, LayoutGrid, Lightbulb,
    Target, Gauge, Coins, Building2, Wallet, PieChart as PieChartIcon,
    Sliders, Calculator, FileSpreadsheet, Download, Eye, EyeOff,
    Shield, Scale, Brain, Rocket, Medal, Trophy, Star, Users,
    HardHat, BookOpen, Landmark, PiggyBank, Activity, Zap,
    ArrowUpRight, ArrowDownRight, Clock, Settings, BarChart3,
    LineChart as LineChartIcon, X, Plus, Minus, Save, Printer,
    ChevronDown, ChevronUp
} from 'lucide-react';
import GeminiAnalysis from '../components/GeminiAnalysis';

// --- UTILITIES & CONSTANTS ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatCompactCurrency = (value) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)} T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} M`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)} JT`;
    return formatCurrency(value);
};

const MONTHS_ARRAY = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const PIE_COLORS = {
    'Belanja Modal': '#10B981',
    'Belanja Pegawai': '#EF4444',
    'Belanja Barang & Jasa': '#F59E0B',
    'Belanja Transfer': '#3B82F6',
    'Belanja Tak Terduga': '#8B5CF6',
    'Lainnya': '#64748b'
};

// Indikator Kesehatan Fiskal
const FISCAL_HEALTH_INDICATORS = {
    modalRatio: { min: 30, max: 50, ideal: 35, weight: 0.25 },
    dependencyRatio: { min: 0, max: 100, ideal: 30, weight: 0.20, inverse: true },
    efficiencyRatio: { min: 70, max: 100, ideal: 85, weight: 0.20 },
    mandatoryRatio: { min: 0, max: 50, ideal: 30, weight: 0.20, inverse: true },
    capitalAbsorption: { min: 70, max: 100, ideal: 85, weight: 0.15 }
};

// ==============================================================================
// KOMPONEN SIMULASI ALOKASI IDEAL
// ==============================================================================
const SimulasiAlokasiIdeal = ({ data, onClose, selectedYear }) => {
    const [allocations, setAllocations] = useState({
        modal: data?.modalPercentage || 25,
        pegawai: data?.pegawaiPercentage || 35,
        barangJasa: data?.barangJasaPercentage || 25,
        transfer: data?.transferPercentage || 10,
        takTerduga: data?.takTerdugaPercentage || 5
    });
    
    const [showImpact, setShowImpact] = useState(false);
    
    const total = allocations.modal + allocations.pegawai + allocations.barangJasa + allocations.transfer + allocations.takTerduga;
    const isValid = Math.abs(total - 100) < 0.01;
    
    const totalAPBD = data?.totalAPBD || 0;
    
    const calculateScore = () => {
        let score = 0;
        // Modal ideal 30-40%
        if (allocations.modal >= 30 && allocations.modal <= 40) score += 35;
        else if (allocations.modal >= 25 && allocations.modal <= 45) score += 25;
        else if (allocations.modal >= 20 && allocations.modal <= 50) score += 15;
        else score += 5;
        
        // Pegawai ideal ≤30%
        if (allocations.pegawai <= 30) score += 30;
        else if (allocations.pegawai <= 35) score += 20;
        else if (allocations.pegawai <= 40) score += 10;
        else score += 0;
        
        // Barang & Jasa ideal 20-30%
        if (allocations.barangJasa >= 20 && allocations.barangJasa <= 30) score += 20;
        else if (allocations.barangJasa >= 15 && allocations.barangJasa <= 35) score += 15;
        else score += 10;
        
        // Transfer ideal 5-15%
        if (allocations.transfer >= 5 && allocations.transfer <= 15) score += 10;
        else if (allocations.transfer >= 0 && allocations.transfer <= 20) score += 5;
        
        // Tak Terduga ideal 1-5%
        if (allocations.takTerduga >= 1 && allocations.takTerduga <= 5) score += 5;
        else if (allocations.takTerduga <= 10) score += 3;
        
        return score;
    };
    
    const score = calculateScore();
    const modalValue = (allocations.modal / 100) * totalAPBD;
    const pegawaiValue = (allocations.pegawai / 100) * totalAPBD;
    const barangJasaValue = (allocations.barangJasa / 100) * totalAPBD;
    
    const handleAllocationChange = (type, value) => {
        const newValue = Math.min(60, Math.max(0, value));
        setAllocations(prev => ({ ...prev, [type]: newValue }));
    };
    
    const resetToIdeal = () => {
        setAllocations({
            modal: 35,
            pegawai: 30,
            barangJasa: 25,
            transfer: 7,
            takTerduga: 3
        });
    };
    
    const applyCurrent = () => {
        setAllocations({
            modal: data?.modalPercentage || 25,
            pegawai: data?.pegawaiPercentage || 35,
            barangJasa: data?.barangJasaPercentage || 25,
            transfer: data?.transferPercentage || 10,
            takTerduga: data?.takTerdugaPercentage || 5
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="sticky top-0 z-10 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-3xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <Calculator size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">
                                    SIMULASI ALOKASI IDEAL APBD
                                </h3>
                                <p className="text-white/80 text-sm mt-1">
                                    Optimalkan komposisi belanja untuk kesehatan fiskal yang lebih baik
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Ringkasan */}
                    <div className={`p-5 rounded-2xl ${score >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200' : score >= 60 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Skor Kualitas Belanja</p>
                                <p className={`text-3xl font-black ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {score}/100
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Alokasi</p>
                                <p className={`text-xl font-black ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {total.toFixed(1)}%
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={resetToIdeal}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    Reset ke Ideal
                                </button>
                                <button
                                    onClick={applyCurrent}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors"
                                >
                                    Gunakan Saat Ini
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sliders */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    Belanja Modal
                                </label>
                                <span className="text-sm font-black text-emerald-600">{allocations.modal}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                                value={allocations.modal}
                                onChange={(e) => handleAllocationChange('modal', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>0%</span>
                                <span className="text-emerald-600 font-bold">Target Ideal: 30-40%</span>
                                <span>50%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Nilai: {formatCurrency(modalValue)}</p>
                        </div>
                        
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    Belanja Pegawai
                                </label>
                                <span className="text-sm font-black text-red-600">{allocations.pegawai}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                                value={allocations.pegawai}
                                onChange={(e) => handleAllocationChange('pegawai', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>0%</span>
                                <span className="text-red-600 font-bold">Target Ideal: ≤30%</span>
                                <span>50%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Nilai: {formatCurrency(pegawaiValue)}</p>
                        </div>
                        
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    Belanja Barang & Jasa
                                </label>
                                <span className="text-sm font-black text-amber-600">{allocations.barangJasa}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                step="1"
                                value={allocations.barangJasa}
                                onChange={(e) => handleAllocationChange('barangJasa', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>0%</span>
                                <span className="text-amber-600 font-bold">Target Ideal: 20-30%</span>
                                <span>40%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Nilai: {formatCurrency(barangJasaValue)}</p>
                        </div>
                        
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    Belanja Transfer
                                </label>
                                <span className="text-sm font-black text-blue-600">{allocations.transfer}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                step="1"
                                value={allocations.transfer}
                                onChange={(e) => handleAllocationChange('transfer', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>0%</span>
                                <span className="text-blue-600 font-bold">Target Ideal: 5-15%</span>
                                <span>20%</span>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    Belanja Tak Terduga
                                </label>
                                <span className="text-sm font-black text-purple-600">{allocations.takTerduga}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="15"
                                step="0.5"
                                value={allocations.takTerduga}
                                onChange={(e) => handleAllocationChange('takTerduga', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>0%</span>
                                <span className="text-purple-600 font-bold">Target Ideal: 1-5%</span>
                                <span>15%</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Visualisasi Perbandingan */}
                    <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <PieChartIcon size={18} />
                            Perbandingan Alokasi
                        </h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Modal', current: data?.modalPercentage || 0, simulated: allocations.modal, target: 35 },
                                    { name: 'Pegawai', current: data?.pegawaiPercentage || 0, simulated: allocations.pegawai, target: 30 },
                                    { name: 'Barang & Jasa', current: data?.barangJasaPercentage || 0, simulated: allocations.barangJasa, target: 25 },
                                    { name: 'Transfer', current: data?.transferPercentage || 0, simulated: allocations.transfer, target: 10 },
                                    { name: 'Tak Terduga', current: data?.takTerdugaPercentage || 0, simulated: allocations.takTerduga, target: 5 }
                                ]} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip formatter={(v) => `${v}%`} />
                                    <Legend />
                                    <Bar dataKey="current" fill="#94A3B8" name="Saat Ini" />
                                    <Bar dataKey="simulated" fill="#6366F1" name="Simulasi" />
                                    <Bar dataKey="target" fill="#10B981" name="Target Ideal" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Tombol Aksi */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={() => setShowImpact(!showImpact)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Target size={18} />
                            {showImpact ? 'Sembunyikan Dampak' : 'Lihat Dampak Simulasi'}
                        </button>
                    </div>
                    
                    {/* Dampak Simulasi */}
                    {showImpact && (
                        <div className="mt-4 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                <Activity size={18} />
                                Dampak Perubahan Alokasi
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Perubahan Alokasi Modal</span>
                                    <span className={`font-bold ${allocations.modal > (data?.modalPercentage || 0) ? 'text-green-600' : 'text-red-600'}`}>
                                        {allocations.modal > (data?.modalPercentage || 0) ? '+' : ''}{(allocations.modal - (data?.modalPercentage || 0)).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Perubahan Alokasi Pegawai</span>
                                    <span className={`font-bold ${allocations.pegawai < (data?.pegawaiPercentage || 0) ? 'text-green-600' : 'text-red-600'}`}>
                                        {allocations.pegawai < (data?.pegawaiPercentage || 0) ? '-' : '+'}{Math.abs(allocations.pegawai - (data?.pegawaiPercentage || 0)).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="border-t border-indigo-200 dark:border-indigo-800 pt-3 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-700">Perubahan Skor Kualitas</span>
                                        <span className={`text-xl font-bold ${score > (data?.score || 0) ? 'text-green-600' : score < (data?.score || 0) ? 'text-red-600' : 'text-gray-600'}`}>
                                            {score > (data?.score || 0) ? '+' : ''}{score - (data?.score || 0)} poin
                                        </span>
                                    </div>
                                    <div className="mt-2 p-3 bg-white/50 rounded-lg">
                                        <p className="text-xs text-gray-500 italic">
                                            {score >= 80 ? '✅ Alokasi ini sangat baik! Mendekati komposisi ideal.' :
                                             score >= 60 ? '⚠️ Alokasi ini cukup baik, masih perlu optimalisasi.' :
                                             '❌ Alokasi ini perlu perbaikan signifikan.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// KOMPONEN INDEKS KESEHATAN FISKAL
// ==============================================================================
const IndeksKesehatanFiskal = ({ data, totalAPBD }) => {
    const [expanded, setExpanded] = useState(false);
    
    const hitungIndeks = () => {
        let score = 0;
        let details = [];
        
        // 1. Rasio Belanja Modal (Bobot 25%)
        const modalRatio = data?.modalPercentage || 0;
        let modalScore = 0;
        if (modalRatio >= 35) modalScore = 100;
        else if (modalRatio >= 30) modalScore = 80;
        else if (modalRatio >= 25) modalScore = 60;
        else if (modalRatio >= 20) modalScore = 40;
        else modalScore = 20;
        score += modalScore * 0.25;
        details.push({ name: 'Rasio Belanja Modal', value: modalRatio, score: modalScore, target: '≥30%', weight: '25%' });
        
        // 2. Rasio Belanja Pegawai (Bobot 20%, inverse)
        const pegawaiRatio = data?.pegawaiPercentage || 0;
        let pegawaiScore = 0;
        if (pegawaiRatio <= 25) pegawaiScore = 100;
        else if (pegawaiRatio <= 30) pegawaiScore = 80;
        else if (pegawaiRatio <= 35) pegawaiScore = 60;
        else if (pegawaiRatio <= 40) pegawaiScore = 40;
        else pegawaiScore = 20;
        score += pegawaiScore * 0.20;
        details.push({ name: 'Rasio Belanja Pegawai', value: pegawaiRatio, score: pegawaiScore, target: '≤30%', weight: '20%' });
        
        // 3. Efisiensi Belanja (Bobot 20%)
        const efficiency = data?.penyerapanTotal || 0;
        let efficiencyScore = 0;
        if (efficiency >= 85) efficiencyScore = 100;
        else if (efficiency >= 75) efficiencyScore = 80;
        else if (efficiency >= 65) efficiencyScore = 60;
        else if (efficiency >= 50) efficiencyScore = 40;
        else efficiencyScore = 20;
        score += efficiencyScore * 0.20;
        details.push({ name: 'Efisiensi Belanja', value: efficiency, score: efficiencyScore, target: '≥80%', weight: '20%' });
        
        // 4. Penyerapan Belanja Modal (Bobot 15%)
        const modalAbsorption = data?.modalPenyerapan || 0;
        let absorptionScore = 0;
        if (modalAbsorption >= 85) absorptionScore = 100;
        else if (modalAbsorption >= 70) absorptionScore = 80;
        else if (modalAbsorption >= 60) absorptionScore = 60;
        else if (modalAbsorption >= 50) absorptionScore = 40;
        else absorptionScore = 20;
        score += absorptionScore * 0.15;
        details.push({ name: 'Penyerapan Belanja Modal', value: modalAbsorption, score: absorptionScore, target: '≥80%', weight: '15%' });
        
        // 5. Diversifikasi Belanja (Bobot 20%)
        const diversity = 100 - Math.abs(modalRatio - 35) - Math.abs(pegawaiRatio - 30) * 0.5;
        let diversityScore = Math.min(100, Math.max(0, diversity));
        score += diversityScore * 0.20;
        details.push({ name: 'Diversifikasi Belanja', value: diversity, score: diversityScore, target: 'Optimal', weight: '20%' });
        
        return { totalScore: Math.round(score), details };
    };
    
    const indeks = hitungIndeks();
    const getStatus = (score) => {
        if (score >= 85) return { text: 'SANGAT SEHAT', color: 'emerald', icon: <Trophy size={20} /> };
        if (score >= 70) return { text: 'SEHAT', color: 'green', icon: <CheckCircle size={20} /> };
        if (score >= 55) return { text: 'CUKUP SEHAT', color: 'amber', icon: <Activity size={20} /> };
        if (score >= 40) return { text: 'KURANG SEHAT', color: 'orange', icon: <AlertTriangle size={20} /> };
        return { text: 'KRITIS', color: 'red', icon: <AlertCircle size={20} /> };
    };
    
    const status = getStatus(indeks.totalScore);
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Gauge size={20} className="text-indigo-600" />
                    Indeks Kesehatan Fiskal Daerah (IKFD)
                </h3>
                <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-4xl font-black">{indeks.totalScore}<span className="text-lg text-gray-400">/100</span></p>
                    <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-${status.color}-100 text-${status.color}-700`}>
                        {status.icon}
                        {status.text}
                    </div>
                </div>
                <div className="w-32 h-32 relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={status.color === 'emerald' ? '#10B981' : status.color === 'green' ? '#22C55E' : status.color === 'amber' ? '#F59E0B' : status.color === 'orange' ? '#F97316' : '#EF4444'}
                            strokeWidth="8"
                            strokeDasharray={`${indeks.totalScore * 2.827}, 282.7`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black">{indeks.totalScore}</span>
                    </div>
                </div>
            </div>
            
            {expanded && (
                <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {indeks.details.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                            <div className="flex items-center gap-4">
                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${item.score}%` }}></div>
                                </div>
                                <span className="font-mono text-xs w-12">{item.value}%</span>
                                <span className="text-[10px] text-gray-400 w-16">{item.target}</span>
                            </div>
                        </div>
                    ))}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 italic">
                            *IKFD mengukur kesehatan fiskal berdasarkan 5 indikator utama dengan bobot masing-masing
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==============================================================================
// KOMPONEN RADAR CHART UNTUK PERBANDINGAN
// ==============================================================================
const RadarComparison = ({ data }) => {
    const radarData = [
        { subject: 'Belanja Modal', A: data?.modalPercentage || 0, B: 35, fullMark: 50 },
        { subject: 'Belanja Pegawai', A: data?.pegawaiPercentage || 0, B: 30, fullMark: 50 },
        { subject: 'Efisiensi', A: data?.penyerapanTotal || 0, B: 85, fullMark: 100 },
        { subject: 'Penyerapan Modal', A: data?.modalPenyerapan || 0, B: 85, fullMark: 100 },
        { subject: 'Diversifikasi', A: data?.diversityScore || 65, B: 85, fullMark: 100 }
    ];
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-purple-600" />
                Perbandingan Kinerja vs Target Ideal
            </h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Radar name="Kondisi Saat Ini" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
                        <Radar name="Target Ideal" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeDasharray="5 5" />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Tooltip formatter={(v) => `${v}%`} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const AnalisisKualitasBelanjaView = ({ data, theme, selectedYear, userCanUseAi }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = useState('Semua SKPD');
    const [startMonth, setStartMonth] = useState(MONTHS_ARRAY[0]);
    const [endMonth, setEndMonth] = useState(MONTHS_ARRAY[MONTHS_ARRAY.length - 1]);
    const [activePaguIndex, setActivePaguIndex] = useState(-1);
    const [activeRealisasiIndex, setActiveRealisasiIndex] = useState(-1);
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [showSimulator, setShowSimulator] = useState(false);
    const [showExecutiveInfo, setShowExecutiveInfo] = useState(true);
    
    const skpdList = useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    const classifyRekeningByCode = (kodeRekening) => {
        if (!kodeRekening) return 'Lainnya';
        const kode = String(kodeRekening);
        if (kode.startsWith('5.2')) return 'Belanja Modal';
        if (kode.startsWith('5.1.01')) return 'Belanja Pegawai';
        if (kode.startsWith('5.1.02')) return 'Belanja Barang & Jasa';
        if (kode.startsWith('5.1.05') || kode.startsWith('5.1.06')) return 'Belanja Transfer';
        if (kode.startsWith('5.3')) return 'Belanja Tak Terduga';
        return 'Lainnya';
    };

    const classifyRekeningByName = (namaRekening) => {
        if (!namaRekening) return 'Lainnya';
        const nama = String(namaRekening).toUpperCase();
        if (nama.includes('MODAL')) return 'Belanja Modal';
        if (nama.includes('PEGAWAI')) return 'Belanja Pegawai';
        if (nama.includes('BARANG') && nama.includes('JASA')) return 'Belanja Barang & Jasa';
        if (nama.includes('TRANSFER')) return 'Belanja Transfer';
        return 'Lainnya';
    };

    const qualityStats = useMemo(() => {
        const initialStats = {
            'Belanja Modal': { pagu: 0, realisasi: 0 },
            'Belanja Pegawai': { pagu: 0, realisasi: 0 },
            'Belanja Barang & Jasa': { pagu: 0, realisasi: 0 },
            'Belanja Transfer': { pagu: 0, realisasi: 0 },
            'Belanja Tak Terduga': { pagu: 0, realisasi: 0 },
            'Lainnya': { pagu: 0, realisasi: 0 },
        };

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' ? (anggaran || []) : (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredAnggaran.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].pagu += (item.nilai || 0);
        });

        const startIndex = MONTHS_ARRAY.indexOf(startMonth);
        const endIndex = MONTHS_ARRAY.indexOf(endMonth);
        const actualStart = Math.min(startIndex, endIndex);
        const actualEnd = Math.max(startIndex, endIndex);
        const selectedMonths = MONTHS_ARRAY.slice(actualStart, actualEnd + 1);

        const realisasiBulanIni = selectedMonths.map(month => (realisasi || {})[month] || []).flat();
        const nonRkudBulanIni = selectedMonths.map(month => (realisasiNonRkud || {})[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        const filteredNonRkud = selectedSkpd === 'Semua SKPD' ? nonRkudBulanIni : nonRkudBulanIni.filter(item => item.NAMASKPD === selectedSkpd);

        filteredRealisasi.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].realisasi += (item.nilai || 0);
        });

        filteredNonRkud.forEach(item => {
            const category = classifyRekeningByName(item.NAMAREKENING);
            initialStats[category].realisasi += (item.nilai || 0);
        });
        
        const totalPagu = Object.values(initialStats).reduce((sum, item) => sum + item.pagu, 0);
        const totalRealisasi = Object.values(initialStats).reduce((sum, item) => sum + item.realisasi, 0);
        
        const tableData = Object.entries(initialStats).map(([name, values]) => ({
            name,
            ...values,
            persenPagu: totalPagu > 0 ? (values.pagu / totalPagu) * 100 : 0,
            persenRealisasi: totalRealisasi > 0 ? (values.realisasi / totalRealisasi) * 100 : 0,
            penyerapan: values.pagu > 0 ? (values.realisasi / values.pagu) * 100 : 0,
        }));

        const paguChartData = tableData
            .filter(d => d.pagu > 0)
            .map(d => ({
                name: d.name,
                value: d.pagu,
                persenPagu: d.persenPagu,
                fill: PIE_COLORS[d.name]
            }))
            .sort((a, b) => b.value - a.value);

        const realisasiChartData = tableData
            .filter(d => d.realisasi > 0)
            .map(d => ({ 
                name: d.name, 
                value: d.realisasi,
                fill: PIE_COLORS[d.name]
            }))
            .sort((a, b) => b.value - a.value);

        const totalRealisasiChartValue = realisasiChartData.reduce((sum, item) => sum + item.value, 0);
        const formattedRealisasiChartData = realisasiChartData.map(item => ({
            ...item,
            percent: totalRealisasiChartValue > 0 ? (item.value / totalRealisasiChartValue) * 100 : 0
        }));
        
        const belanjaModal = tableData.find(d => d.name === 'Belanja Modal') || { pagu: 0, realisasi: 0, penyerapan: 0 };
        const belanjaOperasi = ['Belanja Pegawai', 'Belanja Barang & Jasa', 'Belanja Transfer', 'Lainnya']
            .reduce((acc, cat) => {
                const item = tableData.find(d => d.name === cat) || { pagu: 0, realisasi: 0 };
                return {
                    pagu: acc.pagu + item.pagu,
                    realisasi: acc.realisasi + item.realisasi
                };
            }, { pagu: 0, realisasi: 0 });
        
        const rasioModal = totalPagu > 0 ? (belanjaModal.pagu / totalPagu) * 100 : 0;
        const rasioOperasi = totalPagu > 0 ? (belanjaOperasi.pagu / totalPagu) * 100 : 0;
        const penyerapanTotal = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
        
        let skorKualitas = 0;
        if (rasioModal >= 30) skorKualitas += 40;
        else if (rasioModal >= 20) skorKualitas += 30;
        else if (rasioModal >= 10) skorKualitas += 20;
        else skorKualitas += 10;
        
        if (belanjaModal.penyerapan >= 80) skorKualitas += 30;
        else if (belanjaModal.penyerapan >= 60) skorKualitas += 20;
        else if (belanjaModal.penyerapan >= 40) skorKualitas += 10;
        
        if (penyerapanTotal >= 80) skorKualitas += 30;
        else if (penyerapanTotal >= 60) skorKualitas += 20;
        else if (penyerapanTotal >= 40) skorKualitas += 10;
        
        // Hitung diversifikasi
        const diversityScore = 100 - Math.abs(rasioModal - 35) - Math.abs(rasioOperasi - 65) * 0.5;
        
        return { 
            tableData, 
            paguChartData, 
            formattedRealisasiChartData,
            totalPagu, 
            totalRealisasi,
            belanjaModal,
            belanjaOperasi,
            rasioModal,
            rasioOperasi,
            skorKualitas,
            penyerapanTotal,
            modalPenyerapan: belanjaModal.penyerapan,
            modalPercentage: rasioModal,
            pegawaiPercentage: tableData.find(d => d.name === 'Belanja Pegawai')?.persenPagu || 0,
            barangJasaPercentage: tableData.find(d => d.name === 'Belanja Barang & Jasa')?.persenPagu || 0,
            transferPercentage: tableData.find(d => d.name === 'Belanja Transfer')?.persenPagu || 0,
            takTerdugaPercentage: tableData.find(d => d.name === 'Belanja Tak Terduga')?.persenPagu || 0,
            diversityScore
        };

    }, [anggaran, realisasi, realisasiNonRkud, selectedSkpd, startMonth, endMonth]);

    const getAnalysisPrompt = (query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data kualitas belanja, jawab pertanyaan ini: ${query}`;
        }
        
        if (qualityStats.totalPagu === 0) return "Data anggaran tidak cukup untuk dianalisis.";
        
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        const dataToUse = allData || qualityStats;

        return `ANALISIS KUALITAS BELANJA DAERAH
TAHUN: ${selectedYear}
SKPD: ${selectedSkpd}
PERIODE: ${period}

DATA RINGKAS:
- Total Pagu Anggaran: ${formatCurrency(qualityStats.totalPagu)}
- Total Realisasi: ${formatCurrency(qualityStats.totalRealisasi)} (${qualityStats.penyerapanTotal.toFixed(2)}%)
- Skor Kualitas: ${qualityStats.skorKualitas}/100

KOMPOSISI PAGU:
${qualityStats.tableData.map(item => `- ${item.name}: ${formatCurrency(item.pagu)} (${item.persenPagu.toFixed(2)}%)`).join('\n')}

RASIO BELANJA MODAL: ${qualityStats.rasioModal.toFixed(2)}% (Target ideal >30%)
RASIO BELANJA OPERASI: ${qualityStats.rasioOperasi.toFixed(2)}%
PENYERAPAN BELANJA MODAL: ${qualityStats.modalPenyerapan.toFixed(2)}%

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Kualitas Alokasi Anggaran: Apakah rasio belanja modal sudah ideal?
2. Kualitas Eksekusi: Bandingkan penyerapan belanja modal dengan total penyerapan.
3. Rekomendasi Strategis: 3 langkah konkret untuk meningkatkan kualitas belanja.
4. Peringatan Dini: Identifikasi kategori belanja dengan masalah.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
    };
    
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400';
        if (score >= 60) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400';
        if (score >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400';
        return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={28} />;
        if (score >= 60) return <Award className="text-amber-600 dark:text-amber-400" size={28} />;
        if (score >= 40) return <Info className="text-orange-600 dark:text-orange-400" size={28} />;
        return <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />;
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 8}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    cornerRadius={6}
                    style={{ filter: `drop-shadow(0px 4px 10px ${fill}60)`, zIndex: 10 }}
                />
            </g>
        );
    };

    return (
        <div className="space-y-8 max-w-full p-2 md:p-6 bg-gray-50/30 dark:bg-transparent min-h-screen">
            <SectionTitle>Analisis Kualitas Belanja</SectionTitle>

            {/* EXECUTIVE DASHBOARD */}
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-emerald-600 to-teal-800 rounded-3xl p-8 text-white shadow-2xl border border-white/10 group mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={140} className="text-yellow-300" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
                        <div className="p-5 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-2xl shadow-lg shadow-amber-500/30">
                            <Scale size={36} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                                <Sparkles size={16} className="text-yellow-300 animate-pulse" /> 
                                EXECUTIVE DASHBOARD
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                RINGKASAN EKSEKUTIF <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-5xl md:text-6xl">
                                    KUALITAS BELANJA
                                </span>
                            </h2>
                            <p className="text-lg text-white/80 mt-2 max-w-3xl">
                                Analisis komprehensif komposisi dan kualitas belanja daerah
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowExecutiveInfo(!showExecutiveInfo)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                        >
                            {showExecutiveInfo ? <EyeOff size={22} /> : <Eye size={22} />}
                        </button>
                    </div>

                    {showExecutiveInfo && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Coins size={22} className="text-yellow-400" />
                                        <p className="text-xs font-bold uppercase text-teal-200 tracking-wider">Total Pagu</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(qualityStats.totalPagu)}</p>
                                </div>
                                <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp size={22} className="text-emerald-400" />
                                        <p className="text-xs font-bold uppercase text-teal-200 tracking-wider">Total Realisasi</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black text-emerald-300">{formatCurrency(qualityStats.totalRealisasi)}</p>
                                    <p className="text-xs text-teal-200/70 mt-1">{qualityStats.penyerapanTotal.toFixed(1)}% dari pagu</p>
                                </div>
                                <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Award size={22} className="text-purple-400" />
                                        <p className="text-xs font-bold uppercase text-teal-200 tracking-wider">Skor Kualitas</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black text-purple-300">{qualityStats.skorKualitas}/100</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={18} className="text-emerald-300" />
                                        <h3 className="font-bold text-lg uppercase tracking-wider">Rasio Belanja Modal</h3>
                                    </div>
                                    <p className={`text-3xl font-black ${qualityStats.rasioModal >= 30 ? 'text-emerald-300' : 'text-amber-300'}`}>
                                        {qualityStats.rasioModal.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-teal-200 mt-2">
                                        Target ideal: &gt;30% dari total APBD
                                    </p>
                                    <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min(qualityStats.rasioModal, 100)}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Gauge size={18} className="text-blue-300" />
                                        <h3 className="font-bold text-lg uppercase tracking-wider">Penyerapan Belanja Modal</h3>
                                    </div>
                                    <p className={`text-3xl font-black ${qualityStats.modalPenyerapan >= 80 ? 'text-emerald-300' : qualityStats.modalPenyerapan >= 60 ? 'text-amber-300' : 'text-red-300'}`}>
                                        {qualityStats.modalPenyerapan.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-teal-200 mt-2">
                                        Target ideal: &gt;80% realisasi dari pagu
                                    </p>
                                    <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min(qualityStats.modalPenyerapan, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <button
                                    onClick={() => setShowSimulator(true)}
                                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <Calculator size={16} />
                                    Simulasi Alokasi Ideal
                                </button>
                            </div>

                            <div className="flex items-start gap-5 text-base bg-gradient-to-r from-teal-800/50 to-emerald-800/50 p-6 rounded-2xl border border-teal-500/30 backdrop-blur-sm">
                                <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0">
                                    <Lightbulb size={32} className="text-white" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-black text-white flex items-center gap-2">
                                        <Sparkles size={20} className="text-yellow-300" />
                                        CATATAN EKSEKUTIF
                                    </p>
                                    <p className="text-base leading-relaxed text-teal-100">
                                        <span className="font-bold text-white">PRIORITAS UTAMA:</span> Belanja modal idealnya mencapai minimal 30% dari total APBD. 
                                        Saat ini rasio belanja modal adalah <span className="font-black text-yellow-300 text-lg">{qualityStats.rasioModal.toFixed(1)}%</span> dengan penyerapan 
                                        <span className={`font-black text-lg ml-1 ${qualityStats.modalPenyerapan >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
                                            {qualityStats.modalPenyerapan.toFixed(1)}%
                                        </span>. 
                                        {qualityStats.rasioModal < 30 && ' Perlu peningkatan alokasi untuk infrastruktur dan pembangunan.'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Indeks Kesehatan Fiskal & Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <IndeksKesehatanFiskal data={qualityStats} totalAPBD={qualityStats.totalPagu} />
                <RadarComparison data={qualityStats} />
            </div>

            {/* AI Analysis Section */}
            <div className="relative">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                        {showAnalysis ? (
                            <>🗂️ Sembunyikan Analisis AI</>
                        ) : (
                            <>🤖 Tampilkan Analisis AI</>
                        )}
                    </button>
                </div>
                
                {showAnalysis && qualityStats.totalPagu > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        <span>Data: {selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD' : selectedSkpd} | Periode: {startMonth} - {endMonth}</span>
                    </div>
                )}
                
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={qualityStats.totalPagu === 0} 
                        userCanUseAi={userCanUseAi}
                        allData={{
                            selectedSkpd,
                            startMonth,
                            endMonth,
                            totalPagu: qualityStats.totalPagu,
                            totalRealisasi: qualityStats.totalRealisasi,
                            skorKualitas: qualityStats.skorKualitas,
                            rasioModal: qualityStats.rasioModal,
                            belanjaModalPenyerapan: qualityStats.modalPenyerapan,
                            tableData: qualityStats.tableData
                        }}
                    />
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                {/* FILTER SECTION */}
                <div className="flex flex-col xl:flex-row gap-6 mb-8 items-end">
                    <div className="w-full xl:w-1/3 relative">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter SKPD</label>
                        <select
                            value={selectedSkpd}
                            onChange={(e) => setSelectedSkpd(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none"
                        >
                            <option value="Semua SKPD">🏢 Keseluruhan SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>
                    <div className="w-full xl:w-2/3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rentang Periode Realisasi</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none">
                                {MONTHS_ARRAY.map(month => <option key={`start-${month}`} value={month}>Mulai: {month}</option>)}
                            </select>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none">
                                {MONTHS_ARRAY.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {qualityStats.totalPagu > 0 ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Pagu</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(qualityStats.totalPagu)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Realisasi</p>
                                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(qualityStats.totalRealisasi)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Penyerapan Total</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {qualityStats.penyerapanTotal.toFixed(2)}%
                                </p>
                            </div>
                            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${getScoreColor(qualityStats.skorKualitas)}`}>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Skor Kualitas</p>
                                    <p className="text-2xl font-black">{qualityStats.skorKualitas}</p>
                                </div>
                                <div className="bg-white/40 dark:bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                                    {getScoreIcon(qualityStats.skorKualitas)}
                                </div>
                            </div>
                        </div>

                        {/* Donut Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-center">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                        <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                                        Komposisi Pagu Anggaran
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Struktur alokasi belanja (Target ideal Modal &gt;30%)</p>
                                </div>
                                
                                <div className="w-full relative flex justify-center">
                                    <ResponsiveContainer width="99%" height={320}>
                                        <PieChart>
                                            <Tooltip content={<CustomDonutTooltip />} cursor={{fill: 'transparent'}} />
                                            <Legend 
                                                content={renderCustomLegend}
                                                layout="vertical" 
                                                verticalAlign="middle" 
                                                align="right"
                                                wrapperStyle={{ width: '45%', right: -10, top: '50%', transform: 'translateY(-50%)' }}
                                            />
                                            <Pie
                                                data={qualityStats.paguChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="40%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                stroke="none"
                                                activeIndex={activePaguIndex}
                                                activeShape={renderActiveShape}
                                                onMouseEnter={(_, index) => setActivePaguIndex(index)}
                                                onMouseLeave={() => setActivePaguIndex(-1)}
                                            >
                                                {qualityStats.paguChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none', cursor: 'pointer' }} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                        <p className="text-lg font-black text-gray-800 dark:text-white leading-tight">100%</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-center">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                        <span className="w-2 h-6 bg-teal-500 rounded-full inline-block"></span>
                                        Komposisi Realisasi
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Proporsi serapan aktual ({startMonth} - {endMonth})</p>
                                </div>
                                
                                <div className="w-full relative flex justify-center">
                                    <ResponsiveContainer width="99%" height={320}>
                                        <PieChart>
                                            <Tooltip content={<CustomDonutTooltip />} cursor={{fill: 'transparent'}} />
                                            <Legend 
                                                content={renderCustomLegend}
                                                layout="vertical" 
                                                verticalAlign="middle" 
                                                align="right"
                                                wrapperStyle={{ width: '45%', right: -10, top: '50%', transform: 'translateY(-50%)' }}
                                            />
                                            <Pie
                                                data={qualityStats.formattedRealisasiChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="40%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                stroke="none"
                                                activeIndex={activeRealisasiIndex}
                                                activeShape={renderActiveShape}
                                                onMouseEnter={(_, index) => setActiveRealisasiIndex(index)}
                                                onMouseLeave={() => setActiveRealisasiIndex(-1)}
                                            >
                                                {qualityStats.formattedRealisasiChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none', cursor: 'pointer' }} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Realisasi</p>
                                        <p className="text-lg font-black text-teal-600 dark:text-teal-400 leading-tight">
                                            {qualityStats.penyerapanTotal.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="mb-10 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                        <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    Perbandingan Pagu vs Realisasi Kategori Belanja
                                </h3>
                            </div>
                            
                            <div className="w-full mt-4">
                                <ResponsiveContainer width="99%" height={380}>
                                    <ComposedChart data={qualityStats.tableData.filter(d => d.pagu > 0)} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.15)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={10} />
                                        <YAxis yAxisId="left" tickFormatter={(val) => `${(val / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                        <Legend wrapperStyle={{ paddingTop: '25px', fontWeight: 600, fontSize: '13px', color: '#475569' }} iconType="circle" />
                                        
                                        <Bar yAxisId="left" dataKey="pagu" fill="#3B82F6" name="Pagu Anggaran" radius={[6, 6, 0, 0]} barSize={40} />
                                        <Bar yAxisId="left" dataKey="realisasi" fill="#10B981" name="Nilai Realisasi" radius={[6, 6, 0, 0]} barSize={40} />
                                        <Line yAxisId="right" type="monotone" dataKey="penyerapan" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} name="Penyerapan (%)" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tabel Detail */}
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/80">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jenis Belanja</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagu Anggaran</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proporsi Pagu</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proporsi Serapan</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Penyerapan Aktual</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {qualityStats.tableData.map(item => (
                                        <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                                <span className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: PIE_COLORS[item.name] }}></span>
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-600 dark:text-gray-300">{formatCurrency(item.pagu)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-teal-600 dark:text-teal-400">{formatCurrency(item.realisasi)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-500">{item.persenPagu.toFixed(2)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-500">{item.persenRealisasi.toFixed(2)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black">
                                                <span className={`px-3 py-1.5 rounded-lg inline-block min-w-[70px] text-center ${
                                                    item.penyerapan >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    item.penyerapan >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {item.penyerapan.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Notes */}
                        <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs font-medium text-gray-500 dark:text-gray-400 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Belanja Modal (Investasi)</span>
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Belanja Pegawai (Rutin)</span>
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Barang & Jasa (Operasional)</span>
                            <span className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-6 ml-2">🏆 Skor {qualityStats.skorKualitas}/100 (Indeks Kualitas)</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Data Tidak Tersedia</p>
                        <p className="text-sm text-gray-500">Silakan unggah data anggaran dan realisasi terlebih dahulu atau ubah filter SKPD.</p>
                    </div>
                )}
            </div>
            
            {/* Modal Simulasi Alokasi Ideal */}
            {showSimulator && (
                <SimulasiAlokasiIdeal
                    data={qualityStats}
                    onClose={() => setShowSimulator(false)}
                    selectedYear={selectedYear}
                />
            )}
            
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-10px) translateX(6px); }
                    50% { transform: translateY(-5px) translateX(-6px); }
                    75% { transform: translateY(-15px) translateX(4px); }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
};

// ==============================================================================
// CUSTOM TOOLTIP COMPONENTS (diperlukan untuk chart)
// ==============================================================================
const CustomDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[200px] z-50">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{data.name}</p>
                </div>
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Nilai</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(data.value)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Proporsi</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                        {data.persenPagu ? `${data.persenPagu.toFixed(2)}% dari Pagu` : `${data.percent.toFixed(2)}%`}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex flex-col mb-2 last:mb-0">
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                {entry.name}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                {entry.name.includes('%') || entry.name.toLowerCase().includes('penyerapan') 
                                    ? `${Number(entry.value).toFixed(2)}%` 
                                    : formatCurrency(entry.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 flex flex-col justify-center scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-3 cursor-help group">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-snug break-words group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

const SectionTitle = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-teal-500 pb-2 inline-block">
        {children}
    </h2>
);

export default AnalisisKualitasBelanjaView;