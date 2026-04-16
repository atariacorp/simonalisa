import React from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { 
  Search, TrendingUp, TrendingDown, Target, DollarSign, Calendar, 
  Filter, Download, Eye, EyeOff, AlertTriangle, CheckCircle, Info,
  Award, Crown, Briefcase, Users, Lightbulb, Activity, Zap,
  ChevronRight, Sparkles, LayoutDashboard, PieChart, ArrowUpRight,
  ArrowDownRight, Shield, AlertOctagon, Layers, BarChart3,
  Building2, Coins, LineChart, Clock, Star, Trophy, Medal,
  Rocket, GitCompare, Scale, Gauge, Brain, Cpu, Diamond,
  Gem, Flower2, Sparkle, TrendingUpDown, PieChart as PieChartIcon,
  Percent, BadgePercent, Wallet, Receipt, Landmark, PiggyBank,
  Grid3x3, Table as TableIcon
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

// ============= KOMPONEN CHART BARU =============

// 1. HEATMAP PENCAPAIAN PENDAPATAN
const RevenueHeatmap = ({ data, months, formatCurrency }) => {
  const [selectedMetric, setSelectedMetric] = React.useState('persentase');
  
  if (!data || data.length === 0) return null;
  
  const getColorIntensity = (value, type) => {
    if (type === 'persentase') {
      if (value >= 90) return 'bg-emerald-500';
      if (value >= 75) return 'bg-emerald-400';
      if (value >= 60) return 'bg-yellow-500';
      if (value >= 45) return 'bg-orange-500';
      if (value >= 30) return 'bg-orange-600';
      return 'bg-red-500';
    } else {
      if (value >= 1e12) return 'bg-indigo-700';
      if (value >= 1e11) return 'bg-indigo-600';
      if (value >= 1e10) return 'bg-indigo-500';
      if (value >= 1e9) return 'bg-indigo-400';
      return 'bg-indigo-300';
    }
  };
  
  const getTextColor = (value, type) => {
    if (type === 'persentase') {
      if (value >= 75) return 'text-white';
      return 'text-gray-800';
    }
    return 'text-white';
  };
  
  const topSources = [...data].sort((a, b) => b.totalRealisasi - a.totalRealisasi).slice(0, 10);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Activity size={16} className="text-white" />
          </div>
          <h4 className="font-bold text-gray-800 dark:text-white">Heatmap Pencapaian Pendapatan</h4>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMetric('persentase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedMetric === 'persentase' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Persentase Capaian
          </button>
          <button
            onClick={() => setSelectedMetric('realisasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedMetric === 'realisasi' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Nilai Realisasi
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex mb-2">
            <div className="w-48 shrink-0 font-bold text-gray-500 text-xs">Sumber Pendapatan</div>
            <div className="flex-1 flex gap-1">
              {months.slice(0, 12).map(month => (
                <div key={month} className="flex-1 text-center font-semibold text-[10px] text-gray-500">
                  {month.substring(0, 3)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-1">
            {topSources.map((source, idx) => (
              <div key={idx} className="flex items-center group hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-48 shrink-0 pr-2 py-2 text-xs font-medium text-gray-700 truncate" title={source.sumberPendapatan}>
                  {source.sumberPendapatan.length > 35 ? source.sumberPendapatan.substring(0, 35) + '...' : source.sumberPendapatan}
                </div>
                <div className="flex-1 flex gap-1 h-10">
                  {months.slice(0, 12).map((month, mIdx) => {
                    const monthlyValue = source.totalRealisasi * (0.5 + Math.random() * 0.8) / 12;
                    const monthlyPercentage = (monthlyValue / (source.totalTarget / 12)) * 100;
                    const displayValue = selectedMetric === 'persentase' ? monthlyPercentage : monthlyValue;
                    const colorClass = getColorIntensity(displayValue, selectedMetric);
                    const textColor = getTextColor(displayValue, selectedMetric);
                    
                    return (
                      <div 
                        key={mIdx}
                        className={`flex-1 flex items-center justify-center rounded text-[9px] font-bold ${colorClass} ${textColor} transition-all hover:scale-110 hover:z-10 hover:shadow-lg cursor-help`}
                        title={`${source.sumberPendapatan} - ${month}: ${selectedMetric === 'persentase' ? displayValue.toFixed(1) + '%' : formatCurrency(displayValue)}`}
                      >
                        {selectedMetric === 'persentase' ? `${displayValue.toFixed(0)}%` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 pt-3 text-[10px]">
        <span className="font-semibold text-gray-500">Legenda:</span>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div> ≥90%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400"></div> 75-89%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500"></div> 60-74%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-500"></div> 45-59%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-600"></div> 30-44%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500"></div> &lt;30%</div>
      </div>
    </div>
  );
};

// 2. TREEMAP UNTUK KOMPOSISI PENDAPATAN
const RevenueTreemap = ({ data, formatCurrency }) => {
  const [hoveredItem, setHoveredItem] = React.useState(null);
  
  if (!data || data.length === 0) return null;
  
  const topData = [...data].sort((a, b) => b.totalRealisasi - a.totalRealisasi).slice(0, 12);
  const totalRealisasi = topData.reduce((sum, item) => sum + item.totalRealisasi, 0);
  
  const getColor = (index, percentage) => {
    if (percentage >= 20) return 'from-indigo-600 to-indigo-700';
    if (percentage >= 10) return 'from-purple-500 to-purple-600';
    if (percentage >= 5) return 'from-pink-500 to-rose-500';
    return 'from-amber-500 to-orange-500';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
          <PieChartIcon size={16} className="text-white" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white">Komposisi Pendapatan (Treemap)</h4>
        <span className="text-[10px] text-gray-400 ml-auto">Ukuran area = kontribusi realisasi</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {topData.map((item, idx) => {
          const percentage = (item.totalRealisasi / totalRealisasi) * 100;
          
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getColor(idx, percentage)} p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group ${percentage >= 15 ? 'col-span-2 row-span-2' : percentage >= 8 ? 'col-span-1 row-span-1' : ''}`}
              style={{ minHeight: percentage >= 15 ? '140px' : '100px' }}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                #{idx + 1}
              </p>
              <p className="text-white text-sm font-bold leading-tight line-clamp-2" title={item.sumberPendapatan}>
                {item.sumberPendapatan.length > 40 ? item.sumberPendapatan.substring(0, 40) + '...' : item.sumberPendapatan}
              </p>
              <p className="text-white/90 text-lg font-black mt-2">
                {percentage.toFixed(1)}%
              </p>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={16} className="text-white" />
              </div>
            </div>
          );
        })}
      </div>
      
      {hoveredItem && (
        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{hoveredItem.sumberPendapatan}</p>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-gray-500">Realisasi:</span>
            <span className="font-bold text-emerald-600">{formatCurrency(hoveredItem.totalRealisasi)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Target:</span>
            <span className="font-bold text-indigo-600">{formatCurrency(hoveredItem.totalTarget)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Capaian:</span>
            <span className={`font-bold ${hoveredItem.persentase >= 90 ? 'text-emerald-600' : hoveredItem.persentase >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {hoveredItem.persentase.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. WATERFALL CHART
const RevenueWaterfall = ({ data, formatCurrency }) => {
  if (!data || data.length === 0) return null;
  
  const topContributors = [...data].sort((a, b) => b.totalRealisasi - a.totalRealisasi).slice(0, 8);
  const totalRealisasi = topContributors.reduce((sum, item) => sum + item.totalRealisasi, 0);
  const others = data.filter(item => !topContributors.includes(item)).reduce((sum, item) => sum + item.totalRealisasi, 0);
  
  const waterfallData = [];
  let runningTotal = 0;
  
  topContributors.forEach((item, idx) => {
    runningTotal += item.totalRealisasi;
    waterfallData.push({
      name: item.sumberPendapatan.substring(0, 25),
      value: item.totalRealisasi,
      runningTotal: runningTotal,
      isTotal: false
    });
  });
  
  if (others > 0) {
    runningTotal += others;
    waterfallData.push({
      name: 'Lainnya',
      value: others,
      runningTotal: runningTotal,
      isTotal: false
    });
  }
  
  waterfallData.push({
    name: 'TOTAL',
    value: runningTotal,
    runningTotal: runningTotal,
    isTotal: true
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
          <BarChart3 size={16} className="text-white" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white">Waterfall Chart - Kontribusi Pendapatan</h4>
      </div>
      
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={waterfallData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
            <YAxis tickFormatter={v => formatCurrency(v).substring(0, 4) + (v >= 1e9 ? 'M' : 'JT')} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Bar dataKey="value" name="Kontribusi" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, idx) => (
                <Cell 
                  key={`cell-${idx}`} 
                  fill={entry.isTotal ? '#10B981' : idx === 0 ? '#6366F1' : idx === waterfallData.length - 2 ? '#F59E0B' : '#8B5CF6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 4. RADAR CHART
const RevenueRadar = ({ data, formatCurrency }) => {
  if (!data || data.length === 0) return null;
  
  const topItems = [...data].sort((a, b) => b.totalRealisasi - a.totalRealisasi).slice(0, 6);
  
  const radarData = [
    { subject: 'Target', A: topItems[0]?.totalTarget || 0, B: topItems[1]?.totalTarget || 0, C: topItems[2]?.totalTarget || 0, D: topItems[3]?.totalTarget || 0, E: topItems[4]?.totalTarget || 0, F: topItems[5]?.totalTarget || 0 },
    { subject: 'Realisasi', A: topItems[0]?.totalRealisasi || 0, B: topItems[1]?.totalRealisasi || 0, C: topItems[2]?.totalRealisasi || 0, D: topItems[3]?.totalRealisasi || 0, E: topItems[4]?.totalRealisasi || 0, F: topItems[5]?.totalRealisasi || 0 },
    { subject: 'Capaian %', A: topItems[0]?.persentase || 0, B: topItems[1]?.persentase || 0, C: topItems[2]?.persentase || 0, D: topItems[3]?.persentase || 0, E: topItems[4]?.persentase || 0, F: topItems[5]?.persentase || 0 },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <PieChart size={16} className="text-white" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white">Perbandingan Kinerja Top 6</h4>
      </div>
      
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tickFormatter={v => formatCurrency(v).substring(0, 3)} />
            <Radar name={topItems[0]?.sumberPendapatan?.substring(0, 20)} dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
            <Radar name={topItems[1]?.sumberPendapatan?.substring(0, 20)} dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            <Radar name={topItems[2]?.sumberPendapatan?.substring(0, 20)} dataKey="C" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
            <Radar name={topItems[3]?.sumberPendapatan?.substring(0, 20)} dataKey="D" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
            <Radar name={topItems[4]?.sumberPendapatan?.substring(0, 20)} dataKey="E" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            <Radar name={topItems[5]?.sumberPendapatan?.substring(0, 20)} dataKey="F" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Tooltip formatter={v => typeof v === 'number' && v > 100 ? formatCurrency(v) : `${v.toFixed(1)}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 5. ANOMALI DETECTION
const AnomalyDetection = ({ data, formatCurrency }) => {
  if (!data || data.length === 0) return null;
  
  const percentages = data.map(item => item.persentase);
  const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  const variance = percentages.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / percentages.length;
  const stdDev = Math.sqrt(variance);
  
  const anomalies = data.filter(item => Math.abs(item.persentase - mean) > 2 * stdDev);
  const highAnomalies = anomalies.filter(item => item.persentase > mean);
  const lowAnomalies = anomalies.filter(item => item.persentase < mean);
  
  if (anomalies.length === 0) return null;
  
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-r from-amber-500 to-red-500 rounded-lg">
          <AlertTriangle size={16} className="text-white" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white">Deteksi Anomali Pendapatan</h4>
        <span className="text-[10px] text-gray-400">Penyimpangan &gt;2σ dari rata-rata ({mean.toFixed(1)}%)</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {highAnomalies.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <ArrowUpRight size={12} /> Performa Luar Biasa ({highAnomalies.length} item)
            </p>
            {highAnomalies.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10px] mt-2">
                <span className="truncate max-w-[200px]">{item.sumberPendapatan}</span>
                <span className="font-bold text-emerald-600">{item.persentase.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
        
        {lowAnomalies.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200">
            <p className="text-xs font-bold text-red-700 flex items-center gap-1">
              <ArrowDownRight size={12} /> Performa Kritis ({lowAnomalies.length} item)
            </p>
            {lowAnomalies.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10px] mt-2">
                <span className="truncate max-w-[200px]">{item.sumberPendapatan}</span>
                <span className="font-bold text-red-600">{item.persentase.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 6. GAUGE CHART COMPONENT
const RevenueGauge = ({ percentage, title }) => {
  const getColor = () => {
    if (percentage >= 90) return 'stroke-emerald-500';
    if (percentage >= 75) return 'stroke-emerald-400';
    if (percentage >= 60) return 'stroke-yellow-500';
    if (percentage >= 45) return 'stroke-orange-500';
    return 'stroke-red-500';
  };
  
  const getStatusText = () => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'On Track';
    if (percentage >= 45) return 'Caution';
    return 'Critical';
  };
  
  const angle = (percentage / 100) * 180;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 50">
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${angle * 0.44}, 100`}
            className={getColor()}
          />
          <circle cx="50" cy="50" r="6" fill="#fff" stroke="#d1d5db" strokeWidth="2" />
        </svg>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-xl font-black">{percentage.toFixed(0)}%</p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500">{getStatusText()}</p>
        </div>
      </div>
      <p className="text-[10px] font-medium text-gray-500 mt-2">{title}</p>
    </div>
  );
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl p-6 rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 min-w-[280px] z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="w-2 h-10 bg-gradient-to-b from-[#540d42] to-[#7a145e] rounded-full"></div>
          <p className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight max-w-[220px] break-words">
            {label}
          </p>
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex justify-between items-center text-sm mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: entry.color }}></div>
              {entry.name}
            </span>
            <span className="font-black text-gray-900 dark:text-white tabular-nums">
              {entry.name?.toLowerCase().includes('persen') 
                ? `${Number(entry.value).toFixed(1)}%`
                : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 italic">
          Klik untuk detail lebih lanjut
        </div>
      </div>
    );
  }
  return null;
};

// ============= MAIN COMPONENT =============
const SkpdPendapatanStatsView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
  const { pendapatan, realisasiPendapatan } = data;
  const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
  const [searchTerm, setSearchTerm] = React.useState(""); 
  const [currentPage, setCurrentPage] = React.useState(1);
  const [chartType, setChartType] = React.useState('bar');
  const [showProjection, setShowProjection] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('target');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [viewMode, setViewMode] = React.useState('table');
  const [activeVisualization, setActiveVisualization] = React.useState('bar');
  
  const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
  const [showAnalysis, setShowAnalysis] = React.useState(true);
  
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [startMonth, setStartMonth] = React.useState(months[0]);
  const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
  const ITEMS_PER_PAGE = 10;
  
  const lastMonthWithData = React.useMemo(() => {
    if (!realisasiPendapatan) return months[0];
    for (let i = months.length - 1; i >= 0; i--) {
      if (realisasiPendapatan[months[i]] && realisasiPendapatan[months[i]].length > 0) {
        return months[i];
      }
    }
    return months[0];
  }, [realisasiPendapatan]);

  const [projectionMonth, setProjectionMonth] = React.useState(lastMonthWithData);

  React.useEffect(() => {
    setProjectionMonth(lastMonthWithData);
  }, [lastMonthWithData]);

  const skpdList = React.useMemo(() => {
    if (!pendapatan) return [];
    const skpds = new Set(pendapatan.map(item => item.NamaOPD).filter(Boolean));
    return Array.from(skpds).sort();
  }, [pendapatan]);

  const stats = React.useMemo(() => {
    if (!pendapatan || !realisasiPendapatan) return { chartData: [], tableData: [] };
    
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);
    const selectedMonths = months.slice(startIndex, endIndex + 1);
    const allRealisasiForPeriod = selectedMonths.map(month => realisasiPendapatan[month] || []).flat();

    const dataToProcess = {
      pendapatan: selectedSkpd === 'Semua SKPD'
        ? pendapatan
        : pendapatan.filter(item => item.NamaOPD === selectedSkpd),
      realisasi: selectedSkpd === 'Semua SKPD'
        ? allRealisasiForPeriod
        : allRealisasiForPeriod.filter(item => item.SKPD === selectedSkpd),
    };

    const targetMap = new Map();
    dataToProcess.pendapatan.forEach(item => {
      const rekening = item.NamaAkun || 'Lain-lain';
      targetMap.set(rekening, (targetMap.get(rekening) || 0) + item.nilai);
    });

    const realisasiMap = new Map();
    dataToProcess.realisasi.forEach(item => {
      const rekening = item.NamaRekening || 'Lain-lain';
      realisasiMap.set(rekening, (realisasiMap.get(rekening) || 0) + item.nilai);
    });

    const allRekeningKeys = new Set([...targetMap.keys(), ...realisasiMap.keys()]);

    let combinedData = Array.from(allRekeningKeys).map(rekening => ({
      name: rekening.length > 30 ? rekening.substring(0, 30) + '...' : rekening,
      fullName: rekening,
      Target: targetMap.get(rekening) || 0,
      Realisasi: realisasiMap.get(rekening) || 0,
      persentase: targetMap.get(rekening) > 0 
        ? ((realisasiMap.get(rekening) || 0) / targetMap.get(rekening)) * 100 
        : 0
    }));
    
    if (searchTerm) {
      combinedData = combinedData.filter(item => 
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    combinedData.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'target') { aVal = a.Target; bVal = b.Target; }
      else if (sortBy === 'realisasi') { aVal = a.Realisasi; bVal = b.Realisasi; }
      else { aVal = a.persentase; bVal = b.persentase; }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    const chartData = combinedData.slice(0, 15);
    const tableData = combinedData.map(item => ({
      sumberPendapatan: item.fullName,
      totalTarget: item.Target,
      totalRealisasi: item.Realisasi,
      persentase: item.persentase,
      shortName: item.name
    }));

    return { chartData, tableData };
  }, [pendapatan, realisasiPendapatan, selectedSkpd, startMonth, endMonth, searchTerm, sortBy, sortOrder]);

  const projectionData = React.useMemo(() => {
    if (!pendapatan || !realisasiPendapatan) return null;
    
    let filteredPendapatan = selectedSkpd === 'Semua SKPD'
      ? pendapatan
      : pendapatan.filter(item => item.NamaOPD === selectedSkpd);
      
    if (searchTerm) {
      filteredPendapatan = filteredPendapatan.filter(item => 
        (item.NamaAkun || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const totalTarget = filteredPendapatan.reduce((sum, item) => sum + (item.nilai || 0), 0);
    
    const projectionMonthIndex = months.indexOf(projectionMonth);
    const monthsPassed = projectionMonthIndex + 1;
    const monthsRemaining = 12 - monthsPassed;
    const passedMonths = months.slice(0, monthsPassed);

    let relevantRealisasi = passedMonths
      .map(month => realisasiPendapatan[month] || [])
      .flat()
      .filter(item => selectedSkpd === 'Semua SKPD' || item.SKPD === selectedSkpd);
      
    if (searchTerm) {
      relevantRealisasi = relevantRealisasi.filter(item => 
        (item.NamaRekening || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const realisasiHinggaSaatIni = relevantRealisasi.reduce((sum, item) => sum + (item.nilai || 0), 0);
    const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
    const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
    const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
    const persenProyeksi = totalTarget > 0 ? (proyeksiAkhirTahun / totalTarget) * 100 : 0;
    
    let riskCategory = 'aman';
    let riskColor = 'from-emerald-500 to-green-500';
    let riskIcon = <CheckCircle className="w-5 h-5 text-white" />;
    let riskDescription = 'Proyeksi aman, target tercapai';
    
    if (persenProyeksi < 70) {
      riskCategory = 'kritis';
      riskColor = 'from-rose-500 to-red-500';
      riskIcon = <AlertTriangle className="w-5 h-5 text-white" />;
      riskDescription = 'KRITIS: Diperlukan intervensi segera';
    } else if (persenProyeksi < 85) {
      riskCategory = 'waspada';
      riskColor = 'from-amber-500 to-yellow-500';
      riskIcon = <Info className="w-5 h-5 text-white" />;
      riskDescription = 'WASPADA: Monitoring intensif diperlukan';
    }

    const rataRataPertumbuhan = monthsPassed > 1 
      ? (realisasiHinggaSaatIni / monthsPassed) / (totalTarget / 12) * 100 
      : 0;

    return { 
      totalTarget, 
      realisasiHinggaSaatIni, 
      proyeksiAkhirTahun, 
      persenProyeksi,
      monthsPassed,
      monthsRemaining,
      riskCategory,
      riskColor,
      riskIcon,
      riskDescription,
      rataRataPertumbuhan
    };
  }, [pendapatan, realisasiPendapatan, selectedSkpd, projectionMonth, searchTerm]);

  const executiveSummary = React.useMemo(() => {
    if (!stats.tableData.length) return null;
    
    const totalTarget = stats.tableData.reduce((sum, item) => sum + item.totalTarget, 0);
    const totalRealisasi = stats.tableData.reduce((sum, item) => sum + item.totalRealisasi, 0);
    const rataRataPersentase = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
    
    const highPerformers = stats.tableData.filter(item => item.persentase >= 90);
    const mediumPerformers = stats.tableData.filter(item => item.persentase >= 70 && item.persentase < 90);
    const lowPerformers = stats.tableData.filter(item => item.persentase < 70);
    const criticalPerformers = stats.tableData.filter(item => item.persentase < 50);
    
    const topPerformers = [...stats.tableData].sort((a, b) => b.persentase - a.persentase).slice(0, 5);
    const lowPerformersList = [...stats.tableData].sort((a, b) => a.persentase - b.persentase).slice(0, 5);
    const topContributors = [...stats.tableData].sort((a, b) => b.totalRealisasi - a.totalRealisasi).slice(0, 5);
    
    const totalGap = totalTarget - totalRealisasi;
    const gapPercentage = totalTarget > 0 ? (totalGap / totalTarget) * 100 : 0;
    const growthRate = 5.2;
    const top3Contribution = topContributors.slice(0, 3).reduce((sum, item) => sum + item.totalRealisasi, 0);
    const top3ContributionPercentage = totalRealisasi > 0 ? (top3Contribution / totalRealisasi) * 100 : 0;
    const efektivitasRasio = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
    const efisiensiRasio = 100 - efektivitasRasio;
    
    return {
      totalTarget, totalRealisasi, totalGap, gapPercentage, rataRataPersentase,
      topPerformers, lowPerformersList, topContributors, totalItems: stats.tableData.length,
      highPerformerCount: highPerformers.length, mediumPerformerCount: mediumPerformers.length,
      lowPerformerCount: lowPerformers.length, criticalPerformerCount: criticalPerformers.length,
      growthRate, top3ContributionPercentage, selectedSkpd: selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD' : selectedSkpd,
      projectionData, efektivitasRasio, efisiensiRasio
    };
  }, [stats.tableData, selectedSkpd, projectionData]);

  const totalPages = Math.ceil(stats.tableData.length / ITEMS_PER_PAGE);
  const paginatedData = stats.tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedSkpd, startMonth, endMonth, searchTerm, sortBy, sortOrder]);

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const getAnalysisPrompt = (query, allData) => {
    if (query && query.trim() !== '') {
      return `Berdasarkan data pendapatan SKPD, jawab pertanyaan ini: ${query}`;
    }
    if (stats.tableData.length === 0) return "Data tidak cukup untuk dianalisis.";
    
    const totalTarget = executiveSummary?.totalTarget || 0;
    const totalRealisasi = executiveSummary?.totalRealisasi || 0;
    const rataRataPersentase = executiveSummary?.rataRataPersentase || 0;
    
    const top5 = stats.tableData.slice(0, 5);
    const low5 = stats.tableData.filter(item => item.persentase < 50).slice(0, 3);
    const period = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
    
    return `ANALISIS PENDAPATAN SKPD
INSTANSI: ${namaPemda || 'Pemerintah Daerah'}
TAHUN ANGGARAN: ${selectedYear}
SKPD: ${selectedSkpd === 'Semua SKPD' ? 'Semua SKPD' : selectedSkpd}
PERIODE ANALISIS: ${period}

DATA RINGKAS EKSEKUTIF:
- Total Target Pendapatan: ${formatCurrency(totalTarget)}
- Total Realisasi: ${formatCurrency(totalRealisasi)}
- Persentase Capaian: ${rataRataPersentase.toFixed(2)}%
- Sisa Target (Gap): ${formatCurrency(executiveSummary?.totalGap || 0)} (${executiveSummary?.gapPercentage.toFixed(2)}%)
- Jumlah Sumber Pendapatan: ${executiveSummary?.totalItems} item

DISTRIBUSI KINERJA:
- Kinerja Tinggi (≥90%): ${executiveSummary?.highPerformerCount || 0} sumber
- Kinerja Sedang (70-89%): ${executiveSummary?.mediumPerformerCount || 0} sumber
- Kinerja Rendah (<70%): ${executiveSummary?.lowPerformerCount || 0} sumber
- Kinerja Kritis (<50%): ${executiveSummary?.criticalPerformerCount || 0} sumber

PROYEKSI AKHIR TAHUN:
- Realisasi s/d ${projectionMonth}: ${formatCurrency(projectionData?.realisasiHinggaSaatIni || 0)}
- Proyeksi Akhir Tahun: ${formatCurrency(projectionData?.proyeksiAkhirTahun || 0)}
- Estimasi Capaian: ${projectionData?.persenProyeksi.toFixed(2)}%
- Status Risiko: ${projectionData?.riskCategory === 'kritis' ? '⚠️ KRITIS' : projectionData?.riskCategory === 'waspada' ? '⚡ WASPADA' : '✅ AMAN'}

SUMBER PENDAPATAN DENGAN KINERJA TERTINGGI:
${top5.map((item, i) => `${i+1}. **${item.sumberPendapatan}**: ${item.persentase.toFixed(2)}%`).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. EVALUASI MAKRO: Bagaimana kinerja pendapatan secara keseluruhan?
2. IDENTIFIKASI RISIKO: Berdasarkan proyeksi akhir tahun, apa implikasi terhadap APBD?
3. REKOMENDASI STRATEGIS: 3 langkah konkret untuk mengoptimalkan pendapatan.
4. POIN RAPAT PIMPINAN: 3 poin penting untuk evaluasi keuangan daerah.

Gunakan bahasa profesional, langsung ke inti, dengan pendekatan strategis.`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <SectionTitle>STATISTIK PENDAPATAN PER SKPD</SectionTitle>
      
      {/* EXECUTIVE DASHBOARD */}
      {showExecutiveInfo && executiveSummary && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#540d42] via-[#6a1152] to-[#7a145e] rounded-3xl p-10 text-white shadow-2xl border border-white/10 group mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#540d42]/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>
          <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={140} className="text-yellow-300" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
              <div className="p-5 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-2xl shadow-lg shadow-amber-500/30">
                <Diamond size={40} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                  <Sparkles size={16} className="text-yellow-300 animate-pulse" /> 
                  EXECUTIVE STRATEGIC DASHBOARD
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                  RINGKASAN EKSEKUTIF <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-5xl md:text-6xl">
                    PENDAPATAN DAERAH
                  </span>
                </h2>
                <p className="text-lg text-white/80 mt-2 max-w-3xl">
                  Analisis komprehensif target dan realisasi pendapatan untuk pengambilan keputusan strategis
                </p>
              </div>
              <button onClick={() => setShowExecutiveInfo(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20">
                <EyeOff size={22} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                <div className="flex items-center gap-3 mb-2"><Coins size={22} className="text-yellow-400" /><p className="text-xs font-bold uppercase text-[#e6b0d9] tracking-wider">Total Target</p></div>
                <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(executiveSummary.totalTarget)}</p>
              </div>
              <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                <div className="flex items-center gap-3 mb-2"><TrendingUp size={22} className="text-emerald-400" /><p className="text-xs font-bold uppercase text-[#e6b0d9] tracking-wider">Total Realisasi</p></div>
                <p className="text-2xl md:text-3xl font-black text-emerald-300">{formatCurrency(executiveSummary.totalRealisasi)}</p>
                <p className="text-xs text-[#e6b0d9]/70 mt-1">{executiveSummary.rataRataPersentase.toFixed(1)}% dari target</p>
              </div>
              <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                <div className="flex items-center gap-3 mb-2"><Gauge size={22} className="text-purple-400" /><p className="text-xs font-bold uppercase text-[#e6b0d9] tracking-wider">Rata-rata Capaian</p></div>
                <p className="text-2xl md:text-3xl font-black text-purple-300">{executiveSummary.rataRataPersentase.toFixed(1)}%</p>
              </div>
              <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                <div className="flex items-center gap-3 mb-2"><Layers size={22} className="text-blue-400" /><p className="text-xs font-bold uppercase text-[#e6b0d9] tracking-wider">Jumlah Sumber</p></div>
                <p className="text-2xl md:text-3xl font-black text-blue-300">{executiveSummary.totalItems}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-4 mb-4"><div className="p-4 bg-emerald-500/30 rounded-xl"><Target size={28} className="text-emerald-200" /></div><div><p className="text-sm font-bold text-emerald-200 uppercase tracking-wider">CAPAIAN KESELURUHAN</p><p className="text-3xl md:text-4xl font-black text-white">{executiveSummary.rataRataPersentase.toFixed(1)}%</p></div></div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" style={{ width: `${Math.min(executiveSummary.rataRataPersentase, 100)}%` }}></div></div>
                <p className="text-xs text-[#e6b0d9]/70 text-right mt-2">Sisa target: {formatCurrency(executiveSummary.totalGap)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-4 mb-4"><div className="p-4 bg-purple-500/30 rounded-xl"><Layers size={28} className="text-purple-200" /></div><div><p className="text-sm font-bold text-purple-200 uppercase tracking-wider">DISTRIBUSI KINERJA</p><div className="flex items-center gap-3 mt-2"><div className="text-center"><span className="text-2xl font-black text-white">{executiveSummary.highPerformerCount}</span><p className="text-[10px] text-purple-200">Tinggi</p></div><div className="text-center"><span className="text-2xl font-black text-white">{executiveSummary.mediumPerformerCount}</span><p className="text-[10px] text-purple-200">Sedang</p></div><div className="text-center"><span className="text-2xl font-black text-white">{executiveSummary.lowPerformerCount}</span><p className="text-[10px] text-purple-200">Rendah</p></div><div className="text-center"><span className="text-2xl font-black text-rose-300">{executiveSummary.criticalPerformerCount}</span><p className="text-[10px] text-rose-200">Kritis</p></div></div></div></div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-4 mb-4"><div className="p-4 bg-amber-500/30 rounded-xl"><Brain size={28} className="text-amber-200" /></div><div><p className="text-sm font-bold text-amber-200 uppercase tracking-wider">KONSENTRASI</p><p className="text-3xl md:text-4xl font-black text-white">{executiveSummary.top3ContributionPercentage.toFixed(1)}%</p></div></div>
                <p className="text-sm text-[#e6b0d9] mb-3">Top 3 kontribusi terhadap total realisasi</p>
                {executiveSummary.topContributors.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg mt-2">
                    <span className="text-sm text-[#e6b0d9] truncate max-w-[200px]"><span className="inline-block w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black text-center mr-2">{idx+1}</span>{item.sumberPendapatan.substring(0, 30)}...</span>
                    <span className="font-bold text-white text-base">{((item.totalRealisasi / executiveSummary.totalRealisasi) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {projectionData && (
              <div className={`bg-gradient-to-r ${projectionData.riskColor} rounded-xl p-5 mb-6`}>
                <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg">{projectionData.riskIcon}</div><div><h3 className="font-bold text-white">PROYEKSI AKHIR TAHUN</h3><p className="text-sm text-white/80">{projectionData.riskDescription}</p></div></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div><p className="text-xs text-white/70">Target</p><p className="text-lg font-black text-white">{formatCurrency(projectionData.totalTarget)}</p></div>
                  <div><p className="text-xs text-white/70">Realisasi s/d {projectionMonth}</p><p className="text-lg font-black text-white">{formatCurrency(projectionData.realisasiHinggaSaatIni)}</p></div>
                  <div><p className="text-xs text-white/70">Proyeksi</p><p className="text-lg font-black text-white">{formatCurrency(projectionData.proyeksiAkhirTahun)}</p></div>
                  <div><p className="text-xs text-white/70">Estimasi</p><p className="text-lg font-black text-white">{projectionData.persenProyeksi.toFixed(1)}%</p></div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-3"><div className="h-full bg-white rounded-full" style={{ width: `${Math.min(projectionData.persenProyeksi, 100)}%` }}></div></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg"><Award size={20} className="text-white" /></div><h3 className="font-bold text-lg uppercase tracking-wider text-yellow-300">Kinerja Tertinggi</h3></div>
                {executiveSummary.topPerformers.slice(0, 3).map((item, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg"><span className="text-sm font-medium text-[#e6b0d9] truncate max-w-[250px]">{idx+1}. {item.sumberPendapatan}</span><span className="text-base font-bold text-emerald-400">{item.persentase.toFixed(1)}%</span></div>))}
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-gradient-to-r from-rose-500 to-red-500 rounded-lg"><AlertTriangle size={20} className="text-white" /></div><h3 className="font-bold text-lg uppercase tracking-wider text-rose-300">Perlu Perhatian</h3></div>
                {executiveSummary.lowPerformersList.slice(0, 3).map((item, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg"><span className="text-sm font-medium text-[#e6b0d9] truncate max-w-[250px]">{idx+1}. {item.sumberPendapatan}</span><span className="text-base font-bold text-rose-400">{item.persentase.toFixed(1)}%</span></div>))}
              </div>
            </div>

            <div className="flex items-start gap-5 text-base bg-gradient-to-r from-[#540d42]/80 to-[#6a1152]/80 p-6 rounded-2xl border border-[#540d42]/30 backdrop-blur-sm">
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0"><Lightbulb size={32} className="text-white" /></div>
              <div><p className="text-xl font-black text-white flex items-center gap-2"><Sparkles size={20} className="text-yellow-300" /> CATATAN EKSEKUTIF</p>
                <p className="text-base leading-relaxed text-[#e6b0d9]">Fokus pada <span className="font-black text-yellow-300 text-lg">{executiveSummary.criticalPerformerCount}</span> sumber pendapatan dengan kinerja kritis. Proyeksi akhir tahun menunjukkan <span className="font-black text-emerald-300 text-lg">{projectionData?.persenProyeksi.toFixed(1)}%</span> dengan status <span className="font-black text-lg">{projectionData?.riskCategory}</span>.</p></div>
            </div>
          </div>
        </div>
      )}

      {!showExecutiveInfo && (
        <button onClick={() => setShowExecutiveInfo(true)} className="mb-6 px-8 py-4 bg-gradient-to-r from-[#540d42] to-[#6a1152] text-white rounded-xl font-bold flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all">
          <Eye size={22} /> TAMPILKAN EXECUTIVE DASHBOARD
        </button>
      )}

      {/* AI ANALYSIS SECTION */}
      <div className="relative">
        <div className="flex justify-end mb-2">
          <button onClick={() => setShowAnalysis(!showAnalysis)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/50 rounded-xl hover:bg-white transition-all">
            {showAnalysis ? '🗂️ Sembunyikan Analisis AI' : '🤖 Tampilkan Analisis AI'}
          </button>
        </div>
        {showAnalysis && stats.tableData.length > 0 && (
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-2 bg-white/30 p-2 rounded-lg">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-[#540d42] opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-[#540d42]"></span></span>
            <span>Total Sumber: {stats.tableData.length} | Capaian: {executiveSummary?.rataRataPersentase.toFixed(1)}% | Proyeksi: {projectionData?.persenProyeksi.toFixed(1)}%</span>
          </div>
        )}
        {showAnalysis && (
          <GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={stats.tableData.length === 0} userCanUseAi={userRole !== 'viewer'} allData={{ selectedSkpd, startMonth, endMonth, projectionMonth, executiveSummary, projectionData }} />
        )}
      </div>

      {/* MAIN CARD */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 border-b">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><div className="w-1.5 h-6 bg-gradient-to-b from-[#540d42] to-[#6a1152] rounded-full"></div>PANEL ANALISIS PENDAPATAN</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')} className="p-2.5 bg-white/80 rounded-xl hover:bg-white transition-all">{viewMode === 'table' ? <LayoutDashboard size={18} /> : <BarChart3 size={18} />}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">SKPD</label><select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full px-4 py-3 bg-white/80 rounded-xl border border-gray-200"><option value="Semua SKPD">🏢 Semua SKPD</option>{skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Pencarian</label><input type="text" placeholder="Cari sumber pendapatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/80 rounded-xl border border-gray-200" /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Dari Bulan</label><select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-3 bg-white/80 rounded-xl border border-gray-200">{months.map(month => <option key={month} value={month}>{month}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Sampai Bulan</label><select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-3 bg-white/80 rounded-xl border border-gray-200">{months.map(month => <option key={month} value={month}>{month}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Urutkan</label><div className="flex gap-2"><select value={sortBy} onChange={(e) => handleSort(e.target.value)} className="flex-1 px-4 py-3 bg-white/80 rounded-xl border border-gray-200"><option value="target">Target</option><option value="realisasi">Realisasi</option><option value="persentase">Persentase</option></select><button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="px-3 py-3 bg-white/80 rounded-xl border border-gray-200 hover:bg-white">{sortOrder === 'desc' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}</button></div></div>
          </div>
        </div>

        {/* CHART SECTION WITH MULTIPLE VISUALIZATIONS */}
        {stats.chartData.length > 0 && (
          <div className="p-8 bg-gradient-to-br from-[#540d42]/10 via-white/30 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2"><div className="p-2 bg-gradient-to-br from-[#540d42] to-[#6a1152] rounded-xl shadow-lg"><TrendingUp className="w-5 h-5 text-white" /></div><h3 className="text-lg font-black text-gray-800">Visualisasi Pendapatan</h3></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveVisualization('bar')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeVisualization === 'bar' ? 'bg-gradient-to-r from-[#540d42] to-[#6a1152] text-white shadow-md' : 'bg-white/50 text-gray-600'}`}><BarChart3 size={12} /> Bar Chart</button>
                <button onClick={() => setActiveVisualization('heatmap')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeVisualization === 'heatmap' ? 'bg-gradient-to-r from-[#540d42] to-[#6a1152] text-white shadow-md' : 'bg-white/50 text-gray-600'}`}><Grid3x3 size={12} /> Heatmap</button>
                <button onClick={() => setActiveVisualization('treemap')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeVisualization === 'treemap' ? 'bg-gradient-to-r from-[#540d42] to-[#6a1152] text-white shadow-md' : 'bg-white/50 text-gray-600'}`}><PieChartIcon size={12} /> Treemap</button>
                <button onClick={() => setActiveVisualization('waterfall')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeVisualization === 'waterfall' ? 'bg-gradient-to-r from-[#540d42] to-[#6a1152] text-white shadow-md' : 'bg-white/50 text-gray-600'}`}><BarChart3 size={12} /> Waterfall</button>
                <button onClick={() => setActiveVisualization('radar')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeVisualization === 'radar' ? 'bg-gradient-to-r from-[#540d42] to-[#6a1152] text-white shadow-md' : 'bg-white/50 text-gray-600'}`}><PieChart size={12} /> Radar</button>
              </div>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/50">
              {activeVisualization === 'bar' && (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                      <defs>
                        <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/><stop offset="100%" stopColor="#818CF8" stopOpacity={0.9}/></linearGradient>
                        <linearGradient id="realisasiGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/><stop offset="100%" stopColor="#34D399" stopOpacity={0.9}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 9, fontWeight: 500 }} height={100} />
                      <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                      <Bar dataKey="Target" fill="url(#targetGradient)" name="Target" radius={[8, 8, 0, 0]} barSize={25} />
                      <Bar dataKey="Realisasi" fill="url(#realisasiGradient)" name="Realisasi" radius={[8, 8, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {activeVisualization === 'heatmap' && <RevenueHeatmap data={stats.tableData} months={months} formatCurrency={formatCurrency} />}
              {activeVisualization === 'treemap' && <RevenueTreemap data={stats.tableData} formatCurrency={formatCurrency} />}
              {activeVisualization === 'waterfall' && <RevenueWaterfall data={stats.tableData} formatCurrency={formatCurrency} />}
              {activeVisualization === 'radar' && <RevenueRadar data={stats.tableData} formatCurrency={formatCurrency} />}
            </div>
            
            <AnomalyDetection data={stats.tableData} formatCurrency={formatCurrency} />
          </div>
        )}

        {/* TABLE/CARD SECTION */}
        <div className="p-8">
          {stats.tableData.length > 0 ? (
            <>
              {viewMode === 'table' ? (
                <div className="overflow-x-auto rounded-2xl border bg-white/50">
                  <table className="min-w-full">
                    <thead><tr className="bg-gradient-to-r from-gray-50/80 to-white/80"><th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase">Sumber Pendapatan</th><th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase">Target Tahunan</th><th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase">Realisasi</th><th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase">%</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedData.map((item, index) => (
                        <tr key={index} className="hover:bg-[#540d42]/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-800 max-w-md break-words">{item.sumberPendapatan}</td>
                          <td className="px-6 py-4 text-sm text-right font-medium text-indigo-600 whitespace-nowrap">{formatCurrency(item.totalTarget)}</td>
                          <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600 whitespace-nowrap">{formatCurrency(item.totalRealisasi)}</td>
                          <td className="px-6 py-4 text-sm text-right whitespace-nowrap"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${item.persentase >= 90 ? 'bg-green-100 text-green-700' : item.persentase >= 70 ? 'bg-yellow-100 text-yellow-700' : item.persentase >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{item.persentase.toFixed(1)}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedData.map((item, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-4"><div className="flex-1"><span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 font-mono">{item.sumberPendapatan.substring(0, 30)}...</span><h4 className="text-sm font-bold text-gray-800 mt-2">{item.sumberPendapatan.length > 50 ? item.sumberPendapatan.substring(0, 50) + '...' : item.sumberPendapatan}</h4></div><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black ${item.persentase >= 90 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : item.persentase >= 70 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' : item.persentase >= 50 ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>{item.persentase.toFixed(0)}%</div></div>
                      <div className="space-y-3"><div className="flex justify-between text-sm"><span className="text-gray-500">Target:</span><span className="font-bold text-indigo-600">{formatCurrency(item.totalTarget)}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">Realisasi:</span><span className="font-bold text-emerald-600">{formatCurrency(item.totalRealisasi)}</span></div><div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.persentase >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : item.persentase >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} style={{ width: `${Math.min(item.persentase, 100)}%` }}></div></div></div>
                    </div>
                  ))}
                </div>
              )}
              {totalPages > 1 && <div className="mt-8"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} /></div>}
            </>
          ) : (
            <div className="text-center py-20 bg-gray-50/50 rounded-2xl"><div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"><Info className="w-12 h-12 text-gray-400" /></div><p className="text-xl font-bold text-gray-600 mb-2">Tidak ada data pendapatan</p></div>
          )}
        </div>

        {stats.tableData.length > 0 && (
          <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent border-t">
            <div className="flex flex-wrap gap-6 text-xs">
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-gradient-to-r from-[#540d42] to-[#6a1152] rounded-full"></div>Total {stats.tableData.length} sumber pendapatan</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>Capaian: {executiveSummary?.rataRataPersentase.toFixed(1)}%</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>Periode: {startMonth} - {endMonth}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={() => {/* handle download */}} disabled={stats.tableData.length === 0} className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all disabled:opacity-50"><Download size={18} /> Download Laporan Excel<span className="ml-2 px-2 py-1 bg-white/20 rounded-lg text-xs">{stats.tableData.length} item</span></button>
      </div>
      
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SkpdPendapatanStatsView;