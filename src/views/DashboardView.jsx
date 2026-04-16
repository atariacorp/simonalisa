import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, Line, Sector, AreaChart
} from 'recharts';
import {
  ArrowDownCircle, Receipt, Globe, MinusCircle, Loader, Loader2,
  CalendarClock, Bot, Sparkles, AlertTriangle, RefreshCw,
  Activity, CheckCircle, ChevronRight, Info, LayoutGrid, Lightbulb,
  PieChart as PieChartIcon, TrendingUp, TrendingDown, DollarSign,
  Building2, Calendar, Filter, Search, Download, Eye, EyeOff,
  Award, Crown, Briefcase, Zap, Target, Shield, AlertOctagon,
  Gauge, Brain, Coins, Scale, Rocket, Star, Users, Database,
  ChevronUp, ChevronDown, FileText, Hash, CreditCard, ArrowUpRight,
  ArrowDownRight, Clock, Lock, Unlock, Globe as GlobeIcon, BookOpen,
  Sparkles as SparklesIcon, Trophy, Medal, Gem, Diamond, Flower2,
  Wallet, Receipt as ReceiptIcon, Landmark, PiggyBank, Layers3,
  Sigma, Divide, Minus, Plus, Equal, Infinity, CircleDot,
  MousePointer, ZoomIn, Check, CheckSquare, Square, Trash2,
  CalendarDays, BarChart as BarChartIcon, LineChart, TrendingUp as TrendingUpIcon,
  Maximize2, Minimize2, List, Grid, PieChart as PieChartIcon2,
  AlertCircle, ThumbsUp, ThumbsDown, Flag, Star as StarIcon
} from 'lucide-react';

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
const ECHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// ============= COMPONENT: EXECUTIVE SUMMARY CARDS =============
const ExecutiveSummaryCard = ({ title, value, subtitle, icon, color, trend, trendValue, onClick }) => {
  const colorStyles = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-3 md:p-5 border ${style.border} shadow-sm hover:shadow-lg transition-all cursor-pointer group`}
    >
      <div className="flex justify-between items-start mb-2 md:mb-3">
        <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${style.bg} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 md:gap-1 text-[9px] md:text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp size={12} className="md:w-3 md:h-3" /> : <TrendingDown size={12} className="md:w-3 md:h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-sm md:text-xl lg:text-2xl font-black text-gray-800 dark:text-white mt-1 break-words">{value}</p>
      {subtitle && <p className="text-[8px] md:text-[10px] text-gray-400 mt-0.5 md:mt-1">{subtitle}</p>}
    </div>
  );
};

// ============= COMPONENT: RISK GAUGE =============
const RiskGauge = ({ percentage, title }) => {
  const getColor = (val) => {
    if (val >= 85) return 'bg-emerald-500';
    if (val >= 70) return 'bg-green-400';
    if (val >= 50) return 'bg-yellow-500';
    if (val >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatus = (val) => {
    if (val >= 85) return 'Sangat Baik';
    if (val >= 70) return 'Baik';
    if (val >= 50) return 'Cukup';
    if (val >= 30) return 'Kurang';
    return 'Kritis';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] md:text-xs">
        <span className="font-medium text-gray-600 dark:text-gray-400">{title}</span>
        <span className={`font-bold ${getColor(percentage) === 'bg-red-500' ? 'text-red-600' : 'text-green-600'}`}>
          {getStatus(percentage)} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2">
        <div className={`h-1.5 md:h-2 rounded-full ${getColor(percentage)} transition-all duration-1000`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
    </div>
  );
};

// ============= COMPONENT: TOP PERFORMERS LIST =============
const TopPerformersList = ({ data, title, icon, type, onItemClick }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 md:p-4">
      <h4 className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
        {icon}
        {title}
      </h4>
      <div className="space-y-1.5 md:space-y-2">
        {data.slice(0, 5).map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => onItemClick && onItemClick(item)}
            className="flex items-center justify-between p-1.5 md:p-2 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
              <span className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[9px] md:text-xs font-bold ${
                idx === 0 ? 'bg-yellow-500 text-white' : 
                idx === 1 ? 'bg-gray-400 text-white' : 
                idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {idx + 1}
              </span>
              <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1" title={item.nama}>
                {item.nama.length > 30 ? item.nama.substring(0, 30) + '...' : item.nama}
              </span>
            </div>
            <div className="text-right">
              {type === 'percentage' ? (
                <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full ${
                  item.penyerapan >= 85 ? 'bg-green-100 text-green-700' :
                  item.penyerapan >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.penyerapan.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300">
                  {formatCompactCurrency(item.anggaran)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============= COMPONENT: KPI CARD =============
const KPICard = ({ label, value, change, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-3 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-1.5 md:gap-2 mb-1">
        <div className={`p-1 rounded ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
          {icon}
        </div>
        <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs md:text-sm font-bold text-gray-800 dark:text-white">{value}</p>
      {change !== undefined && (
        <p className={`text-[7px] md:text-[9px] ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-0.5`}>
          {change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          {Math.abs(change)}% dari target
        </p>
      )}
    </div>
  );
};

// ============= COMPONENT: ALERT ITEM =============
const AlertItem = ({ type, message, action, onAction }) => {
  const typeStyles = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <AlertCircle size={14} className="text-red-500" /> },
    warning: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: <AlertTriangle size={14} className="text-orange-500" /> },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: <Info size={14} className="text-blue-500" /> },
    success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: <CheckCircle size={14} className="text-green-500" /> },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className={`flex items-center justify-between p-2 md:p-3 rounded-lg ${style.bg} border ${style.border}`}>
      <div className="flex items-center gap-2 md:gap-3 flex-1">
        {style.icon}
        <p className="text-[9px] md:text-xs text-gray-700 dark:text-gray-300 flex-1">{message}</p>
      </div>
      {action && (
        <button onClick={onAction} className="text-[8px] md:text-[10px] font-medium text-blue-600 hover:text-blue-700">
          {action}
        </button>
      )}
    </div>
  );
};

// ============= COMPONENT: CUSTOM HEATMAP =============
const CustomHeatmap = ({ data }) => {
  if (!data || !data.opd || data.opd.length === 0) return null;
  
  const getColorClass = (val) => {
    if (val === 0) return 'bg-gray-50 dark:bg-gray-800/50 text-transparent';
    if (val < 20) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
    if (val < 50) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
    if (val < 80) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
    return 'bg-green-500 dark:bg-green-600 text-white';
  };
  
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[600px] md:min-w-[800px]">
        <div className="flex mb-2">
          <div className="w-1/3 shrink-0 pr-2 md:pr-4 font-bold text-gray-500 text-[9px] md:text-xs uppercase">SKPD</div>
          <div className="w-2/3 flex gap-0.5 md:gap-1">
            {data.months.map(month => (
              <div key={month} className="flex-1 text-center font-semibold text-[8px] md:text-xs text-gray-500 pb-1">{month}</div>
            ))}
          </div>
        </div>
        <div className="space-y-0.5 md:space-y-1">
          {data.opd.map((opdName, rowIndex) => (
            <div key={opdName} className="flex group hover:bg-gray-50 rounded transition-colors items-center">
              <div className="w-1/3 shrink-0 pr-2 md:pr-4 py-1 md:py-2 text-[8px] md:text-sm font-medium text-gray-700 truncate" title={opdName}>
                {opdName.length > 25 ? opdName.substring(0, 25) + '...' : opdName}
              </div>
              <div className="w-2/3 flex gap-0.5 md:gap-1 h-6 md:h-8">
                {data.values[rowIndex].map((val, colIndex) => (
                  <div 
                    key={`${rowIndex}-${colIndex}`} 
                    className={`flex-1 flex items-center justify-center rounded text-[7px] md:text-[10px] font-bold ${getColorClass(val)}`} 
                    title={`${opdName} - ${data.months[colIndex]}: ${val}%`}
                  >
                    {val > 0 ? `${val}%` : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-2 md:gap-4 text-[8px] md:text-xs text-gray-500">
          <span className="flex items-center gap-1"><div className="w-2 h-2 md:w-3 md:h-3 rounded bg-gray-50 border"></div> 0%</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 md:w-3 md:h-3 rounded bg-red-100 border border-red-200"></div> &lt;20%</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 md:w-3 md:h-3 rounded bg-orange-100"></div> 20-49%</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 md:w-3 md:h-3 rounded bg-yellow-100"></div> 50-79%</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 md:w-3 md:h-3 rounded bg-green-500"></div> ≥80%</span>
        </div>
      </div>
    </div>
  );
};

// ============= COMPONENT: CUSTOM SUMBER DANA TOOLTIP =============
const CustomSumberDanaTooltip = ({ active, payload, totalAnggaran }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Pastikan data memiliki properti yang benar
    const pagu = data.value || 0;
    const realisasi = data.realisasi || 0;
    const persenPagu = totalAnggaran > 0 ? ((pagu / totalAnggaran) * 100).toFixed(2) : 0;
    const persenRealisasi = pagu > 0 ? ((realisasi / pagu) * 100).toFixed(2) : 0;
    
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[220px] md:min-w-[280px] z-50">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full" style={{ backgroundColor: payload[0].color }}></div>
          <p className="font-bold text-gray-800 dark:text-gray-100 text-[11px] md:text-sm break-words">{data.name}</p>
        </div>
        
        <div className="space-y-2 md:space-y-3">
          {/* PAGU */}
          <div>
            <div className="flex justify-between text-[10px] md:text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Pagu Anggaran</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(pagu)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(persenPagu, 100)}%` }}></div>
            </div>
            <p className="text-right text-[8px] md:text-[10px] text-gray-400 mt-0.5">{persenPagu}% dari total pagu</p>
          </div>
          
          {/* REALISASI */}
          <div>
            <div className="flex justify-between text-[10px] md:text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Nilai Realisasi</span>
              <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(realisasi)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(persenRealisasi, 100)}%` }}></div>
            </div>
            <p className="text-right text-[8px] md:text-[10px] text-gray-400 mt-0.5">Serapan: {persenRealisasi}%</p>
          </div>
          
          {/* SISA ANGGARAN */}
          <div className="pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
            <div className="flex justify-between text-[10px] md:text-xs">
              <span className="text-gray-500 dark:text-gray-400">Sisa Anggaran</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(pagu - realisasi)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ============= COMPONENT: CUSTOM LEGEND =============
const renderCustomLegend = (props) => {
  const { payload } = props;
  return (
    <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 space-y-1 md:space-y-2">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-start gap-1 md:gap-2 cursor-help" title={`${entry.value} - Pagu: ${formatCurrency(entry.payload.value)}`}>
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: entry.color }}></div>
          <span className="text-[8px] md:text-xs text-gray-600 dark:text-gray-400 leading-tight break-words">
            {entry.value.length > 40 ? entry.value.substring(0, 40) + '...' : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============= COMPONENT: RENDER ACTIVE SHAPE =============
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={4}
      style={{ filter: `drop-shadow(0px 2px 8px ${fill}80)` }}
    />
  );
};

// ============= COMPONENT: GEMINI ANALYSIS =============
const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, userCanUseAi, allData }) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAnalysis = async () => {
    if (disabledCondition) return;
    setLoading(true);
    setError(null);
    const prompt = getAnalysisPrompt("", allData);
    try {
      const response = await fetch('/api/gemini', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) 
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error("Server Error");
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "Gagal menghubungi AI");
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysis(text || "Gagal menghasilkan analisis.");
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/20 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-indigo-100 dark:border-indigo-900/50 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-indigo-600 p-2 md:p-3 rounded-xl md:rounded-2xl">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-xl text-gray-800 dark:text-gray-100 flex items-center gap-1 md:gap-2">
              AI Analisis Eksekutif <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            </h3>
            <p className="text-[9px] md:text-sm text-gray-500">Ringkasan cerdas performa APBD</p>
          </div>
        </div>
        <button 
          onClick={generateAnalysis} 
          disabled={loading || disabledCondition || (userCanUseAi === false)} 
          className={`flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-1.5 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all ${loading || disabledCondition || (userCanUseAi === false) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {loading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />}
          {analysis ? 'Analisis Ulang' : 'Mulai AI'}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-4 bg-red-100 text-red-700 rounded-xl mb-3 md:mb-4 text-[9px] md:text-sm">
          <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />{error}
        </div>
      )}
      {analysis ? (
        <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-gray-800/70 p-4 md:p-6 rounded-xl md:rounded-2xl text-[10px] md:text-sm">
          {analysis}
        </div>
      ) : (
        !loading && (
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 md:p-6 rounded-xl md:rounded-2xl text-center">
            <Info className="w-5 h-5 md:w-8 md:h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 text-[9px] md:text-sm">Tekan tombol di atas untuk analisis AI</p>
          </div>
        )
      )}
      {loading && (
        <div className="flex flex-col items-center py-6 md:py-12">
          <Loader2 className="w-6 h-6 md:w-10 md:h-10 text-indigo-500 animate-spin" />
          <p className="text-indigo-600 text-[9px] md:text-sm mt-2">Menganalisis data...</p>
        </div>
      )}
    </div>
  );
};

// ============= MAIN DASHBOARD VIEW =============
const DashboardView = ({ data = {}, theme, selectedYear, namaPemda, lastUpdate, userRole, includeNonRKUD, totalRealisasiNonRKUD = 0, userCanUseAi }) => {
  const { anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, realisasiNonRkud } = data;
  const [activeTab, setActiveTab] = useState('overview');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(-1);

  // Check if data is loading
  if (!anggaran || !pendapatan || !realisasi || !realisasiPendapatan) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader className="animate-spin text-blue-500" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">Memuat Data Dashboard Eksekutif...</p>
      </div>
    );
  }

  const lastUpdateString = lastUpdate 
    ? new Date(lastUpdate).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
      }) + ' WIB'
    : 'Belum Tersedia';

  // ============= MAIN CALCULATIONS =============
  const {
    totalAnggaran,
    totalPendapatan,
    totalRealisasiBelanja,
    totalGabunganBelanja,
    totalRealisasiPendapatan,
    totalPenerimaanPembiayaan,
    totalPengeluaranPembiayaan,
    sisaAnggaran,
    silpaProjection
  } = React.useMemo(() => {
    const totalAnggaran = (anggaran || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalPendapatan = (pendapatan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalRealisasiBelanja = Object.values(realisasi || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalGabunganBelanja = includeNonRKUD ? totalRealisasiBelanja + totalRealisasiNonRKUD : totalRealisasiBelanja;
    const totalRealisasiPendapatan = Object.values(realisasiPendapatan || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalPenerimaanPembiayaan = (penerimaanPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalPengeluaranPembiayaan = (pengeluaranPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
    const sisaAnggaran = totalAnggaran - totalGabunganBelanja;
    
    // Proyeksi SiLPA berdasarkan tren realisasi
    const currentMonth = new Date().getMonth();
    const monthProgress = (currentMonth + 1) / 12;
    const projectedSilpa = sisaAnggaran * (1 - monthProgress);
    
    return {
      totalAnggaran, totalPendapatan, totalRealisasiBelanja, totalGabunganBelanja,
      totalRealisasiPendapatan, totalPenerimaanPembiayaan, totalPengeluaranPembiayaan,
      sisaAnggaran, silpaProjection: projectedSilpa > 0 ? projectedSilpa : 0
    };
  }, [anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, includeNonRKUD, totalRealisasiNonRKUD]);

  // ============= DERIVED DATA =============
  const penyerapanAnggaranPercentage = totalAnggaran > 0 ? (totalGabunganBelanja / totalAnggaran) * 100 : 0;
  const pencapaianPendapatanPercentage = totalPendapatan > 0 ? (totalRealisasiPendapatan / totalPendapatan) * 100 : 0;
  const penyerapanRkudPercentage = totalAnggaran > 0 ? (totalRealisasiBelanja / totalAnggaran) * 100 : 0;
  const penyerapanNonRkudPercentage = totalAnggaran > 0 ? (totalRealisasiNonRKUD / totalAnggaran) * 100 : 0;
  
  // Defisit/Surplus
  const fiscalBalance = totalRealisasiPendapatan - totalGabunganBelanja;
  const isSurplus = fiscalBalance >= 0;

  // ============= TOP PERFORMERS =============
  const topSkpdByAnggaran = useMemo(() => {
    const skpdMap = new Map();
    (anggaran || []).forEach(item => {
      const skpd = item.NamaSKPD || 'Tanpa SKPD';
      skpdMap.set(skpd, (skpdMap.get(skpd) || 0) + (item.nilai || 0));
    });
    return Array.from(skpdMap, ([nama, anggaran]) => ({ nama, anggaran })).sort((a, b) => b.anggaran - a.anggaran);
  }, [anggaran]);

  const topSkpdByPenyerapan = useMemo(() => {
    const skpdAnggaran = new Map();
    const skpdRealisasi = new Map();
    
    (anggaran || []).forEach(item => {
      const skpd = item.NamaSKPD || 'Tanpa SKPD';
      skpdAnggaran.set(skpd, (skpdAnggaran.get(skpd) || 0) + (item.nilai || 0));
    });
    
    Object.values(realisasi || {}).flat().forEach(item => {
      const skpd = item.NamaSKPD || 'Tanpa SKPD';
      skpdRealisasi.set(skpd, (skpdRealisasi.get(skpd) || 0) + (item.nilai || 0));
    });
    
    const results = [];
    for (const [skpd, anggaran] of skpdAnggaran) {
      const realisasi = skpdRealisasi.get(skpd) || 0;
      const penyerapan = anggaran > 0 ? (realisasi / anggaran) * 100 : 0;
      results.push({ nama: skpd, anggaran, realisasi, penyerapan });
    }
    return results.sort((a, b) => b.penyerapan - a.penyerapan);
  }, [anggaran, realisasi]);

  const bottomSkpdByPenyerapan = useMemo(() => {
    return [...topSkpdByPenyerapan].sort((a, b) => a.penyerapan - b.penyerapan);
  }, [topSkpdByPenyerapan]);

  // ============= SUMBER DANA ANALYSIS (DIPERBAIKI) =============
const sumberDanaData = useMemo(() => {
  const danaMap = new Map();
  
  console.log('===== DEBUG SUMBER DANA DASHBOARD =====');
  
  // STEP 1: Ambil data pagu dari anggaran
  (anggaran || []).forEach(item => {
    const sumber = item.NamaSumberDana || item.SumberDana || item.sumber_dana || 'Tidak Diketahui';
    if (!danaMap.has(sumber)) {
      danaMap.set(sumber, { 
        name: sumber, 
        value: 0, 
        realisasi: 0,
        items: [] // Untuk tracking
      });
    }
    const nilaiAnggaran = item.nilai || 0;
    danaMap.get(sumber).value += nilaiAnggaran;
    danaMap.get(sumber).items.push({ type: 'anggaran', nilai: nilaiAnggaran });
  });
  
  // STEP 2: Ambil data realisasi dari realisasi RKUD
  const realisasiRKUD = Object.values(realisasi || {}).flat();
  console.log('Jumlah item realisasi RKUD:', realisasiRKUD.length);
  
  realisasiRKUD.forEach(item => {
    const sumber = item.NamaSumberDana || item.SumberDana || item.sumber_dana || 'Tidak Diketahui';
    if (!danaMap.has(sumber)) {
      danaMap.set(sumber, { 
        name: sumber, 
        value: 0, 
        realisasi: 0,
        items: []
      });
    }
    const nilaiRealisasi = item.nilai || item.realisasi || 0;
    danaMap.get(sumber).realisasi += nilaiRealisasi;
    danaMap.get(sumber).items.push({ type: 'realisasi', nilai: nilaiRealisasi });
  });
  
  // STEP 3: Ambil data realisasi dari realisasi Non-RKUD
  if (realisasiNonRkud) {
    const realisasiNonRKUD = Object.values(realisasiNonRkud || {}).flat();
    console.log('Jumlah item realisasi Non-RKUD:', realisasiNonRKUD.length);
    
    realisasiNonRKUD.forEach(item => {
      const sumber = item.NamaSumberDana || item.SumberDana || item.sumber_dana || 'Tidak Diketahui';
      if (!danaMap.has(sumber)) {
        danaMap.set(sumber, { 
          name: sumber, 
          value: 0, 
          realisasi: 0,
          items: []
        });
      }
      const nilaiRealisasi = item.nilai || item.realisasi || 0;
      danaMap.get(sumber).realisasi += nilaiRealisasi;
      danaMap.get(sumber).items.push({ type: 'realisasi_non_rkud', nilai: nilaiRealisasi });
    });
  }
  
  // STEP 4: Konversi ke array dan filter
  const result = Array.from(danaMap.values())
    .filter(item => item.value > 0)
    .map(({ name, value, realisasi }) => ({ name, value, realisasi }))
    .sort((a, b) => b.value - a.value);
  
  console.log('Hasil akhir sumberDanaData:', result.slice(0, 3));
  console.log('Total realisasi terhitung:', result.reduce((sum, item) => sum + item.realisasi, 0));
  
  return result;
}, [anggaran, realisasi, realisasiNonRkud]);

  // Konsentrasi Dana (Pareto)
  const top3SumberDanaPercentage = useMemo(() => {
    const top3 = sumberDanaData.slice(0, 3);
    const totalTop3 = top3.reduce((sum, item) => sum + item.value, 0);
    return totalAnggaran > 0 ? (totalTop3 / totalAnggaran) * 100 : 0;
  }, [sumberDanaData, totalAnggaran]);

  // ============= RISK ASSESSMENT =============
  const riskLevel = useMemo(() => {
    if (penyerapanAnggaranPercentage >= 85) return { level: 'Rendah', color: 'green', icon: <ThumbsUp size={14} /> };
    if (penyerapanAnggaranPercentage >= 70) return { level: 'Sedang', color: 'yellow', icon: <Activity size={14} /> };
    if (penyerapanAnggaranPercentage >= 50) return { level: 'Tinggi', color: 'orange', icon: <AlertTriangle size={14} /> };
    return { level: 'Kritis', color: 'red', icon: <AlertCircle size={14} /> };
  }, [penyerapanAnggaranPercentage]);

  const criticalSkpdCount = useMemo(() => {
    return bottomSkpdByPenyerapan.filter(skpd => skpd.penyerapan < 30).length;
  }, [bottomSkpdByPenyerapan]);

  // ============= TREND INDICATORS =============
  const getMonthlyTrend = () => {
    const monthlyData = [];
    const currentMonth = new Date().getMonth();
    for (let i = 0; i <= currentMonth; i++) {
      const monthName = MONTHS_ARRAY[i];
      const monthRealisasi = Object.values(realisasi || {})[i] || [];
      const total = monthRealisasi.reduce((sum, item) => sum + (item.nilai || 0), 0);
      monthlyData.push({ bulan: monthName.substring(0, 3), realisasi: total });
    }
    return monthlyData;
  };

  const monthlyTrend = getMonthlyTrend();
  const trendDirection = monthlyTrend.length >= 2 && monthlyTrend[monthlyTrend.length - 1].realisasi > monthlyTrend[monthlyTrend.length - 2].realisasi ? 'up' : 'down';
  const trendPercentage = monthlyTrend.length >= 2 && monthlyTrend[monthlyTrend.length - 2].realisasi > 0 
    ? ((monthlyTrend[monthlyTrend.length - 1].realisasi - monthlyTrend[monthlyTrend.length - 2].realisasi) / monthlyTrend[monthlyTrend.length - 2].realisasi) * 100 
    : 0;

  // ============= HEATMAP DATA =============
  const heatmapData = useMemo(() => {
    if (!realisasi || Object.keys(realisasi).length === 0) return null;
    const bulanTersedia = Object.keys(realisasi);
    const mappingBulan = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 };
    const bulanTerurut = bulanTersedia.sort((a, b) => mappingBulan[a] - mappingBulan[b]);
    const bulanDisplay = { 'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar', 'April': 'Apr', 'Mei': 'Mei', 'Juni': 'Jun', 'Juli': 'Jul', 'Agustus': 'Agu', 'September': 'Sep', 'Oktober': 'Okt', 'November': 'Nov', 'Desember': 'Des' };
    const months = bulanTerurut.map(b => bulanDisplay[b] || b.substring(0, 3));
    const skpdSet = new Set();
    Object.entries(realisasi).forEach(([bulan, items]) => { if (Array.isArray(items)) items.forEach(item => { if (item.NamaSKPD) skpdSet.add(item.NamaSKPD); }); });
    const skpdList = Array.from(skpdSet).slice(0, 15);
    if (skpdList.length === 0) return null;
    const paguPerSKPD = {};
    (anggaran || []).forEach(item => { const skpd = item.NamaSKPD || 'Tanpa SKPD'; paguPerSKPD[skpd] = (paguPerSKPD[skpd] || 0) + (item.nilai || 0); });
    const values = skpdList.map(skpd => {
      let akumulasi = 0;
      const pagu = paguPerSKPD[skpd] || 0;
      return bulanTerurut.map((namaBulan) => {
        const bulanItems = realisasi[namaBulan] || [];
        const realisasiBulanIni = bulanItems.filter(item => item.NamaSKPD === skpd).reduce((sum, item) => sum + (item.nilai || 0), 0);
        akumulasi += realisasiBulanIni;
        if (pagu > 0 && akumulasi > 0) return Math.min(100, Math.round((akumulasi / pagu) * 100));
        return 0;
      });
    });
    return { months, opd: skpdList, values };
  }, [realisasi, anggaran]);

  // ============= CHART DATA =============
  const apbdChartData = useMemo(() => [
    { name: 'Pendapatan', Target: totalPendapatan, Realisasi: totalRealisasiPendapatan, Persen: pencapaianPendapatanPercentage },
    { name: 'Belanja', Target: totalAnggaran, Realisasi: totalGabunganBelanja, Persen: penyerapanAnggaranPercentage },
    { name: 'Pembiayaan Netto', Target: totalPenerimaanPembiayaan - totalPengeluaranPembiayaan, Realisasi: 0, Persen: 0 }
  ], [totalPendapatan, totalRealisasiPendapatan, totalAnggaran, totalGabunganBelanja, totalPenerimaanPembiayaan, totalPengeluaranPembiayaan]);

  // ============= AI PROMPT =============
  const getDashboardAnalysisPrompt = (query, allData) => {
    const { totalPendapatan, totalRealisasiPendapatan, totalAnggaran, totalGabunganBelanja, totalRealisasiBelanja, totalRealisasiNonRKUD } = allData;
    const persenPendapatan = totalPendapatan > 0 ? ((totalRealisasiPendapatan / totalPendapatan) * 100).toFixed(2) : 0;
    const persenBelanja = totalAnggaran > 0 ? ((totalGabunganBelanja / totalAnggaran) * 100).toFixed(2) : 0;
    const sisaAnggaran = totalAnggaran - totalGabunganBelanja;
    const top3Skpd = topSkpdByAnggaran.slice(0, 3).map(s => `- ${s.nama}: ${formatCurrency(s.anggaran)}`).join('\n');
    const bottom3Skpd = bottomSkpdByPenyerapan.slice(0, 3).map(s => `- ${s.nama}: ${s.penyerapan.toFixed(1)}%`).join('\n');
    
    if (query && query.trim() !== '') {
      return `Jawab pertanyaan ini berdasarkan data APBD ${namaPemda || 'Pemerintah Daerah'} tahun ${selectedYear}:
      
DATA TERKINI:
- Pendapatan: Target ${formatCurrency(totalPendapatan)} | Realisasi ${formatCurrency(totalRealisasiPendapatan)} (${persenPendapatan}%)
- Belanja: Pagu ${formatCurrency(totalAnggaran)} | Realisasi ${formatCurrency(totalGabunganBelanja)} (${persenBelanja}%)
- Sisa Anggaran: ${formatCurrency(sisaAnggaran)}
- ${criticalSkpdCount} SKPD dengan penyerapan kritis (<30%)

PERTANYAAN: ${query}

Berikan jawaban yang spesifik, profesional, dan berdasarkan data di atas.`;
    }
    
    return `ANALISIS EKSEKUTIF APBD ${namaPemda || 'Pemerintah Daerah'} TAHUN ${selectedYear}

RINGKASAN EKSEKUTIF:
┌────────────────────────────┬─────────────────┬─────────────────┬──────────┐
│ Komponen                   │ Target/Pagu     │ Realisasi       │ % Capaian│
├────────────────────────────┼─────────────────┼─────────────────┼──────────┤
│ Pendapatan Daerah          │ ${formatCurrency(totalPendapatan)} │ ${formatCurrency(totalRealisasiPendapatan)} │ ${persenPendapatan}%     │
│ Belanja Daerah             │ ${formatCurrency(totalAnggaran)} │ ${formatCurrency(totalGabunganBelanja)} │ ${persenBelanja}%     │
│ Sisa Anggaran (SiLPA)      │ -               │ ${formatCurrency(sisaAnggaran)} │ -        │
└────────────────────────────┴─────────────────┴─────────────────┴──────────┘

TOP 3 SKPD DENGAN ANGGARAN TERBESAR:
${top3Skpd}

SKPD DENGAN PENYERAPAN TERENDAH (RISIKO TINGGI):
${bottom3Skpd}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. EARLY WARNING SYSTEM: Identifikasi 3 risiko fiskal paling kritis berdasarkan data di atas.
2. EVALUASI KINERJA: Apakah realisasi pendapatan dan belanja sesuai dengan target? Apa penyebabnya?
3. REKOMENDASI STRATEGIS: 3 langkah konkret untuk Kepala Daerah/Sekda.
4. POIN RAPAT PIMPINAN: 3 poin penting yang harus disampaikan dalam evaluasi keuangan daerah.

Gunakan bahasa profesional, langsung ke inti, dengan pendekatan strategis.`;
  };

  // ============= HANDLERS =============
  const handleSkpdClick = (skpd) => {
    console.log('Navigate to SKPD detail:', skpd);
    // Bisa diarahkan ke halaman analisis SKPD
  };

  // ============= RENDER =============
  return (
    <div className="space-y-4 md:space-y-8 max-w-full p-2 md:p-6 bg-gray-50/30 dark:bg-transparent min-h-screen">
      {/* DEFINISI GRADIENT SVG */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.8}/>
            <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4}/>
          </linearGradient>
          <linearGradient id="colorHorizontalBarRed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.8}/>
            <stop offset="100%" stopColor="#EF4444" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="colorHorizontalBarGreen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.8}/>
            <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
          </linearGradient>
        </defs>
      </svg>

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20"></div>
        <div className="flex items-center gap-3 md:gap-5 relative z-10">
          <div className="bg-white/20 p-2 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-md">
            <CalendarClock className="w-6 h-6 md:w-8 md:h-10 text-white" />
          </div>
          <div>
            <p className="text-blue-100 text-[10px] md:text-sm font-medium uppercase tracking-widest mb-0.5 md:mb-1 flex items-center gap-1 md:gap-2">
              <Activity size={12} className="md:w-4 md:h-4" /> Status Data Dashboard
            </p>
            <h2 className="text-sm md:text-2xl lg:text-3xl font-black tracking-tight">
              Terakhir Diperbarui: <span className="text-yellow-300">{lastUpdateString}</span>
            </h2>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 bg-black/20 hover:bg-black/30 transition-colors px-3 md:px-6 py-1.5 md:py-3 rounded-lg md:rounded-xl">
          <div className="relative flex h-2 w-2 md:h-3 md:w-3">
            <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative rounded-full h-2 w-2 md:h-3 md:w-3 bg-green-500"></span>
          </div>
          <span className="text-[10px] md:text-sm font-bold tracking-wide">SINKRONISASI AKTIF</span>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <ExecutiveSummaryCard 
          title="Total Anggaran" 
          value={formatCurrency(totalAnggaran)} 
          subtitle={`${sumberDanaData.length} sumber dana`}
          icon={<Coins size={16} className="md:w-5 md:h-5" />} 
          color="blue"
          trend={penyerapanAnggaranPercentage}
        />
        <ExecutiveSummaryCard 
          title="Realisasi Belanja" 
          value={formatCurrency(totalGabunganBelanja)} 
          subtitle={`${penyerapanAnggaranPercentage.toFixed(1)}% dari pagu`}
          icon={<ReceiptIcon size={16} className="md:w-5 md:h-5" />} 
          color="green"
        />
        <ExecutiveSummaryCard 
          title="Pendapatan Daerah" 
          value={formatCurrency(totalRealisasiPendapatan)} 
          subtitle={`${pencapaianPendapatanPercentage.toFixed(1)}% dari target`}
          icon={<TrendingUp size={16} className="md:w-5 md:h-5" />} 
          color="purple"
        />
        <ExecutiveSummaryCard 
          title="SiLPA (Estimasi)" 
          value={formatCurrency(silpaProjection)} 
          subtitle={`Sisa anggaran ${formatCurrency(sisaAnggaran)}`}
          icon={<PiggyBank size={16} className="md:w-5 md:h-5" />} 
          color="orange"
        />
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <KPICard label="Fiscal Balance" value={isSurplus ? 'Surplus' : 'Defisit'} icon={isSurplus ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />} color="blue" />
        <KPICard label="Risk Level" value={riskLevel.level} icon={riskLevel.icon} color={riskLevel.color} />
        <KPICard label="SKPD Kritis" value={`${criticalSkpdCount} SKPD`} icon={<AlertCircle size={12} />} color="red" />
        <KPICard label="Sumber Dana" value={`${sumberDanaData.length} jenis`} icon={<Database size={12} />} color="purple" />
        <KPICard label="Konsentrasi Top 3" value={`${top3SumberDanaPercentage.toFixed(1)}%`} icon={<PieChartIcon size={12} />} color="orange" />
      </div>

      {/* ALERTS SECTION */}
<div className="space-y-2">
  <h3 className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <AlertTriangle size={14} className="md:w-4 md:h-4" /> Peringatan & Rekomendasi
  </h3>
  
  {penyerapanAnggaranPercentage < 50 && (
    <AlertItem 
      type="critical" 
      message={`Penyerapan anggaran baru mencapai ${penyerapanAnggaranPercentage.toFixed(1)}%. Risiko tidak tercapainya target belanja.`} 
      action="Lihat Detail" 
      onAction={() => setActiveTab('heatmap')}   // ← Berpindah ke Heatmap
    />
  )}
  
  {pencapaianPendapatanPercentage < 50 && (
    <AlertItem 
      type="warning" 
      message={`Pendapatan daerah baru terealisasi ${pencapaianPendapatanPercentage.toFixed(1)}%. Perlu akselerasi ekstensifikasi pajak.`} 
      action="Analisis" 
      onAction={() => setActiveTab('insights')}   // ← Berpindah ke Insights
    />
  )}
  
  {criticalSkpdCount > 0 && (
    <AlertItem 
      type="warning" 
      message={`Terdapat ${criticalSkpdCount} SKPD dengan penyerapan kritis (<30%). Segera evaluasi kinerja SKPD tersebut.`} 
      action="Lihat SKPD" 
      onAction={() => setActiveTab('heatmap')}   // ← Berpindah ke Heatmap
    />
  )}
  
  {sisaAnggaran > totalAnggaran * 0.3 && (
    <AlertItem 
      type="info" 
      message={`Sisa anggaran cukup besar (${((sisaAnggaran / totalAnggaran) * 100).toFixed(1)}%). Proyeksi SiLPA perlu diantisipasi.`} 
      action="Proyeksi" 
      onAction={() => setActiveTab('insights')}   // ← Berpindah ke Insights
    />
  )}
</div>

      {/* TREND INDICATOR - PERBAIKAN */}
<div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700">
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 md:mb-4">
    <h3 className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
      <TrendingUp size={14} className="md:w-4 md:h-4" /> Tren Realisasi Bulanan
    </h3>
    <div className={`flex items-center gap-1 md:gap-2 text-[9px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full ${trendDirection === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {trendDirection === 'up' ? <TrendingUp size={12} className="md:w-3 md:h-3" /> : <TrendingDown size={12} className="md:w-3 md:h-3" />}
      {trendDirection === 'up' ? 'Meningkat' : 'Menurun'} {Math.abs(trendPercentage).toFixed(1)}% dari bulan lalu
    </div>
  </div>
  <div className="h-32 md:h-48 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={monthlyTrend}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={(v) => formatCompactCurrency(v)} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => formatCurrency(v)} />
        <Area type="monotone" dataKey="realisasi" stroke="#3B82F6" fill="url(#colorRealisasi)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>

      {/* AI ANALYSIS SECTION */}
      <div className="relative">
        <div className="flex justify-end mb-2">
          <button onClick={() => setShowAnalysis(!showAnalysis)} className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-[9px] md:text-sm font-medium bg-white/50 rounded-lg md:rounded-xl hover:bg-white transition-all">
            {showAnalysis ? <>🗂️ Sembunyikan AI</> : <>🤖 Tampilkan AI</>}
          </button>
        </div>
        {showAnalysis && (
          <GeminiAnalysis 
            getAnalysisPrompt={getDashboardAnalysisPrompt} 
            disabledCondition={totalAnggaran === 0 && totalPendapatan === 0} 
            userCanUseAi={userCanUseAi}
            allData={{ totalPendapatan, totalRealisasiPendapatan, totalAnggaran, totalGabunganBelanja, totalRealisasiBelanja, totalRealisasiNonRKUD }}
          />
        )}
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex justify-start mb-4 md:mb-8 overflow-x-auto pb-1">
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl md:rounded-2xl inline-flex gap-1 shadow-sm">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-1 md:gap-2 py-1.5 md:py-2.5 px-3 md:px-6 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Activity size={14} className="md:w-4 md:h-4" /> Ringkasan
          </button>
          <button onClick={() => setActiveTab('heatmap')} className={`flex items-center gap-1 md:gap-2 py-1.5 md:py-2.5 px-3 md:px-6 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all ${activeTab === 'heatmap' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutGrid size={14} className="md:w-4 md:h-4" /> Heatmap SKPD
          </button>
          <button onClick={() => setActiveTab('insights')} className={`flex items-center gap-1 md:gap-2 py-1.5 md:py-2.5 px-3 md:px-6 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all ${activeTab === 'insights' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Lightbulb size={14} className="md:w-4 md:h-4" /> Insights
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in duration-500">
        {activeTab === 'overview' && (
          <>
            {/* MAIN CHARTS */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 md:mb-8">
              <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white mb-4 md:mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-3 md:pl-4">
                <BarChartIcon size={16} className="md:w-5 md:h-5" /> Struktur APBD vs Realisasi
              </h3>
              <div className="h-80 md:h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={apbdChartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
                    <Bar dataKey="Target" fill="url(#colorTarget)" name="Target/Pagu" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="Realisasi" fill="url(#colorRealisasi)" name="Realisasi" radius={[6, 6, 0, 0]} barSize={40} />
                    <Line type="monotone" dataKey="Realisasi" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TOP PERFORMERS & RISK SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="space-y-4 md:space-y-6">
                <TopPerformersList data={topSkpdByAnggaran} title="Top 5 SKPD dengan Anggaran Terbesar" icon={<Award size={14} className="md:w-4 md:h-4 text-yellow-500" />} type="anggaran" onItemClick={handleSkpdClick} />
                <TopPerformersList data={topSkpdByPenyerapan} title="Top 5 SKPD dengan Penyerapan Tertinggi" icon={<TrendingUp size={14} className="md:w-4 md:h-4 text-green-500" />} type="percentage" onItemClick={handleSkpdClick} />
              </div>
              <div className="space-y-4 md:space-y-6">
                <TopPerformersList data={bottomSkpdByPenyerapan} title="5 SKPD dengan Penyerapan Terendah (Risiko)" icon={<AlertTriangle size={14} className="md:w-4 md:h-4 text-red-500" />} type="percentage" onItemClick={handleSkpdClick} />
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 md:p-4">
                  <h4 className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
                    <PieChartIcon size={14} className="md:w-4 md:h-4" /> Distribusi Sumber Dana
                  </h4>
                  <div className="h-48 md:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sumberDanaData.slice(0, 6)} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {sumberDanaData.slice(0, 6).map((entry, index) => <Cell key={`cell-${index}`} fill={ECHART_COLORS[index % ECHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-[8px] md:text-[10px] text-gray-500 mt-2">
                    Top 3 sumber dana menguasai {top3SumberDanaPercentage.toFixed(1)}% dari total anggaran
                  </p>
                </div>
              </div>
            </div>

            {/* SUMBER DANA DETAIL CHART */}
<div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
    <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
      <PieChartIcon size={16} className="md:w-5 md:h-5 text-purple-500" /> 
      Pagu & Realisasi Berdasarkan Sumber Dana
    </h3>
  </div>
  <div className="h-80 md:h-[450px] w-full flex justify-center">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        {/* PASTIKAN Tooltip menggunakan komponen yang sudah diperbaiki */}
        <Tooltip content={<CustomSumberDanaTooltip totalAnggaran={totalAnggaran} />} />
        <Legend content={renderCustomLegend} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ width: '45%', fontSize: '10px' }} />
        <Pie 
          data={sumberDanaData} 
          cx="40%" 
          cy="50%" 
          innerRadius={80} 
          outerRadius={130} 
          paddingAngle={3} 
          cornerRadius={6} 
          dataKey="value" 
          stroke="none" 
          activeIndex={activeIndex} 
          activeShape={renderActiveShape} 
          onMouseEnter={onPieEnter} 
          onMouseLeave={onPieLeave}
        >
          {sumberDanaData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={ECHART_COLORS[index % ECHART_COLORS.length]} 
              style={{ outline: 'none', cursor: 'pointer' }} 
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>
          </>
        )}

        {activeTab === 'heatmap' && (
          <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="text-blue-500" size={16} /> Heatmap Penyerapan per SKPD
                </h3>
                <p className="text-[10px] md:text-sm text-gray-500 mt-1">
                  Visualisasi tren kumulatif realisasi anggaran {selectedYear ? `Tahun ${selectedYear}` : ''}
                </p>
              </div>
            </div>
            <div className="mb-6 md:mb-8 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200 p-3 md:p-6 rounded-xl md:rounded-2xl">
              <h4 className="flex items-center gap-1 md:gap-2 font-bold text-blue-800 dark:text-blue-300 mb-2 text-xs md:text-lg">
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" /> Panduan Strategis Eksekutif
              </h4>
              <ul className="list-disc list-inside text-[9px] md:text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li><strong>Deteksi Dini:</strong> Perhatikan SKPD dengan warna <span className="inline-block px-1 md:px-2 py-0.5 bg-red-100 text-red-700 rounded text-[8px] md:text-xs font-bold mx-1">Merah (&lt;20%)</span> atau <span className="inline-block px-1 md:px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[8px] md:text-xs font-bold mx-1">Oranye</span> yang bertahan melewati kuartal kedua/ketiga.</li>
                <li><strong>Analisis Tren:</strong> Jika persentase bulan ke bulan tidak berubah, SKPD kemungkinan terkendala proses lelang atau administrasi.</li>
                <li><strong>Tindak Lanjut:</strong> Gunakan data ini sebagai bahan evaluasi kinerja SKPD dalam Rapat Pimpinan.</li>
              </ul>
            </div>
            {heatmapData && heatmapData.opd.length > 0 ? (
              <CustomHeatmap data={heatmapData} />
            ) : (
              <div className="text-center py-12 md:py-24 bg-gray-50 dark:bg-gray-900/30 rounded-xl md:rounded-2xl">
                <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-orange-400 mx-auto mb-2 md:mb-4" />
                <p className="text-sm md:text-lg font-bold text-gray-700 dark:text-gray-300">Data Realisasi Bulanan Belum Tersedia</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4 md:space-y-6">
            {/* RISK GAUGE */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg">
              <h3 className="text-sm md:text-lg font-bold text-gray-800 dark:text-white mb-3 md:mb-5 flex items-center gap-2">
                <Gauge size={16} className="md:w-5 md:h-5" /> Indikator Risiko Fiskal
              </h3>
              <div className="space-y-3 md:space-y-4">
                <RiskGauge percentage={penyerapanAnggaranPercentage} title="Penyerapan Anggaran" />
                <RiskGauge percentage={pencapaianPendapatanPercentage} title="Pencapaian Pendapatan" />
                <RiskGauge percentage={((sisaAnggaran / totalAnggaran) * 100)} title="Potensi SiLPA" />
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-blue-100 dark:border-blue-800">
              <h3 className="text-sm md:text-lg font-bold text-blue-800 dark:text-blue-300 mb-3 md:mb-5 flex items-center gap-2">
                <Lightbulb size={16} className="md:w-5 md:h-5 text-yellow-500" /> Rekomendasi Strategis
              </h3>
              <ul className="space-y-2 md:space-y-3">
                {penyerapanAnggaranPercentage < 70 && (
                  <li className="flex items-start gap-2 md:gap-3 text-[10px] md:text-sm">
                    <span className="text-red-500 font-bold">•</span> 
                    <span>Akselerasi realisasi belanja melalui percepatan lelang dan pelaksanaan kegiatan fisik.</span>
                  </li>
                )}
                {pencapaianPendapatanPercentage < 70 && (
                  <li className="flex items-start gap-2 md:gap-3 text-[10px] md:text-sm">
                    <span className="text-orange-500 font-bold">•</span> 
                    <span>Intensifikasi dan ekstensifikasi pendapatan daerah melalui optimalisasi pajak daerah dan retribusi.</span>
                  </li>
                )}
                {criticalSkpdCount > 0 && (
                  <li className="flex items-start gap-2 md:gap-3 text-[10px] md:text-sm">
                    <span className="text-red-500 font-bold">•</span> 
                    <span>Evaluasi khusus terhadap {criticalSkpdCount} SKPD dengan penyerapan di bawah 30%.</span>
                  </li>
                )}
                <li className="flex items-start gap-2 md:gap-3 text-[10px] md:text-sm">
                  <span className="text-blue-500 font-bold">•</span> 
                  <span>Monitoring mingguan realisasi anggaran untuk mengantisipasi potensi SiLPA di akhir tahun.</span>
                </li>
              </ul>
            </div>

            {/* QUICK STATS SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl md:rounded-2xl text-center shadow-sm">
                <p className="text-gray-500 text-[8px] md:text-xs">Rata-rata Penyerapan SKPD</p>
                <p className="text-sm md:text-2xl font-bold text-gray-800">
                  {(topSkpdByPenyerapan.reduce((sum, s) => sum + s.penyerapan, 0) / topSkpdByPenyerapan.length || 0).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl md:rounded-2xl text-center shadow-sm">
                <p className="text-gray-500 text-[8px] md:text-xs">SKPD Penyerapan &gt;80%</p>
                <p className="text-sm md:text-2xl font-bold text-green-600">
                  {topSkpdByPenyerapan.filter(s => s.penyerapan >= 80).length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl md:rounded-2xl text-center shadow-sm">
                <p className="text-gray-500 text-[8px] md:text-xs">SKPD Penyerapan &lt;30%</p>
                <p className="text-sm md:text-2xl font-bold text-red-600">{criticalSkpdCount}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl md:rounded-2xl text-center shadow-sm">
                <p className="text-gray-500 text-[8px] md:text-xs">Sumber Dana Aktif</p>
                <p className="text-sm md:text-2xl font-bold text-purple-600">{sumberDanaData.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;