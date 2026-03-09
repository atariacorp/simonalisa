import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';

const HeatmapPenyerapan = ({ data, selectedYear, theme = 'light' }) => {
  const [sortBy, setSortBy] = useState('persentase'); // 'nama' atau 'persentase'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' atau 'desc'

  // Default data structure if no data provided
  const defaultData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    opd: ['OPD 1', 'OPD 2', 'OPD 3', 'OPD 4', 'OPD 5'],
    values: [
      [85, 78, 92, 65, 45, 30, 72, 88, 95, 82, 76, 91],
      [42, 55, 38, 72, 88, 94, 76, 45, 62, 71, 83, 47],
      [91, 72, 65, 48, 52, 35, 68, 95, 82, 71, 63, 55],
      [35, 42, 28, 55, 72, 68, 44, 38, 62, 75, 81, 49],
      [75, 82, 93, 68, 55, 42, 38, 72, 85, 78, 91, 67],
    ]
  };

  // Use provided data or fallback to default
  const chartData = data || defaultData;
  
  // Format Rupiah
  const formatRupiah = (angka) => {
    if (!angka && angka !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka).replace('Rp', 'Rp ');
  };

  // Fungsi untuk sorting OPD
  const getSortedData = () => {
    if (!chartData || !chartData.opd) return chartData;
    
    let sortedOpd = [...chartData.opd];
    let sortedValues = [...chartData.values];
    let sortedRealisasiData = chartData.realisasiData ? [...chartData.realisasiData] : null;
    let sortedSkpdSummary = chartData.skpdSummary ? [...chartData.skpdSummary] : null;
    
    if (sortBy === 'nama') {
      // Sort by nama SKPD
      const indices = sortedOpd
        .map((opd, index) => ({ opd, index }))
        .sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.opd.localeCompare(b.opd);
          } else {
            return b.opd.localeCompare(a.opd);
          }
        })
        .map(item => item.index);
      
      sortedOpd = indices.map(i => chartData.opd[i]);
      sortedValues = indices.map(i => chartData.values[i]);
      if (sortedRealisasiData) {
        sortedRealisasiData = indices.map(i => chartData.realisasiData[i]);
      }
      if (sortedSkpdSummary) {
        sortedSkpdSummary = indices.map(i => chartData.skpdSummary[i]);
      }
    } else if (sortBy === 'persentase' && chartData.skpdSummary) {
      // Sort by persentase total
      const indices = chartData.skpdSummary
        .map((summary, index) => ({ 
          persentase: summary.persentaseTotal || 0, 
          index 
        }))
        .sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.persentase - b.persentase;
          } else {
            return b.persentase - a.persentase;
          }
        })
        .map(item => item.index);
      
      sortedOpd = indices.map(i => chartData.opd[i]);
      sortedValues = indices.map(i => chartData.values[i]);
      if (sortedRealisasiData) {
        sortedRealisasiData = indices.map(i => chartData.realisasiData[i]);
      }
      if (sortedSkpdSummary) {
        sortedSkpdSummary = indices.map(i => chartData.skpdSummary[i]);
      }
    }
    
    return {
      ...chartData,
      opd: sortedOpd,
      values: sortedValues,
      realisasiData: sortedRealisasiData,
      skpdSummary: sortedSkpdSummary
    };
  };

  const sortedChartData = getSortedData();
  
  // Prepare data for heatmap
  const heatmapData = [];
  sortedChartData.opd.forEach((opd, opdIndex) => {
    sortedChartData.months.forEach((month, monthIndex) => {
      const value = sortedChartData.values[opdIndex][monthIndex];
      heatmapData.push([monthIndex, opdIndex, value]);
    });
  });

  // Hitung lebar grid berdasarkan jumlah OPD
  const gridLeft = sortedChartData.opd.length > 15 ? '25%' : (sortedChartData.opd.length > 10 ? '20%' : '15%');
  const gridBottom = '20%';

  const option = {
    tooltip: {
      position: 'top',
      formatter: function (params) {
        const month = sortedChartData.months[params.data[0]];
        const opd = sortedChartData.opd[params.data[1]];
        const value = params.data[2];
        
        // Ambil data realisasi jika tersedia
        let realisasiInfo = '';
        if (sortedChartData.realisasiData && 
            sortedChartData.realisasiData[params.data[1]] && 
            sortedChartData.realisasiData[params.data[1]][params.data[0]]) {
          
          const realData = sortedChartData.realisasiData[params.data[1]][params.data[0]].realisasi;
          const pagu = sortedChartData.paguData ? sortedChartData.paguData[opd] : 0;
          
          realisasiInfo = `<br/>💰 Realisasi Bulan Ini: ${formatRupiah(realData.bulanan)}
                           <br/>📊 Realisasi Kumulatif: ${formatRupiah(realData.kumulatif)}
                           <br/>🎯 Pagu Anggaran: ${formatRupiah(pagu)}`;
        }
        
        // Tambahkan total persentase jika ada summary
        let totalInfo = '';
        if (sortedChartData.skpdSummary && sortedChartData.skpdSummary[params.data[1]]) {
          const totalPersen = sortedChartData.skpdSummary[params.data[1]].persentaseTotal || 0;
          totalInfo = `<br/>📈 Total Penyerapan: ${totalPersen.toFixed(1)}%`;
        }
        
        return `${opd}<br/>${month} ${selectedYear || ''}<br/>Penyerapan: ${value}%${realisasiInfo}${totalInfo}`;
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      textStyle: {
        color: '#fff',
        fontSize: 12
      }
    },
    grid: {
      left: gridLeft,
      bottom: gridBottom,
      right: '5%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedChartData.months,
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: sortedChartData.months.length > 6 ? 30 : 0,
        fontWeight: 'bold',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'category',
      data: sortedChartData.opd,
      splitArea: {
        show: true
      },
      axisLabel: {
        fontWeight: 'bold',
        fontSize: sortedChartData.opd.length > 15 ? 9 : (sortedChartData.opd.length > 10 ? 10 : 11),
        width: sortedChartData.opd.length > 15 ? 150 : 130,
        overflow: 'truncate'
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#f44336', '#ff9800', '#4caf50']
      },
      text: ['Tinggi (70-100%)', 'Sedang (40-70%)', 'Rendah (0-40%)']
    },
    series: [{
      name: 'Penyerapan Anggaran',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: true,
        formatter: function (params) {
          return params.data[2] + '%';
        },
        fontSize: 9,
        fontWeight: 'bold',
        color: '#fff'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      {/* NARASI UNTUK PIMPINAN - DASHBOARD EKSEKUTIF */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-600 rounded-r-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg mb-1">
              PANTAUAN CEPAT PENYERAPAN ANGGARAN EKSEKUTIF
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              Heatmap ini menampilkan persentase realisasi anggaran setiap SKPD/OPD per bulan. 
              Gunakan untuk mengidentifikasi masalah, memantau tren, dan mengambil keputusan strategis.
            </p>
            
            {/* 3 Card Poin Penting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">SKPD PRIORITAS</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Fokus pada SKPD <span className="text-red-500 font-medium">MERAH</span> (≤40%). 
                  Segera intervensi!
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">TREN BULANAN</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Perhatikan perubahan warna. Tren menurun perlu diwaspadai.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">TARGET AKHIR TAHUN</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Target Desember: seluruh SKPD <span className="text-green-500 font-medium">HIJAU</span> (≥70%).
                </p>
              </div>
            </div>

            {/* Informasi Bulan yang Tersedia */}
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="font-bold">📅 DATA TERSEDIA:</span>
              <span>{sortedChartData.months.join(' • ')}</span>
            </div>

            {/* Tips Cepat */}
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="font-bold">⚡ 3 DETIK INSIGHT:</span>
              <span>Hitung jumlah SKPD merah → Kuning → Hijau. Prioritaskan yang merah!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header dengan Sorting */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-center md:text-left">
          Heatmap Penyerapan Anggaran {selectedYear ? `Tahun ${selectedYear}` : ''}
        </h2>
        
        <div className="flex gap-2 mt-2 md:mt-0">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="persentase">Urut by Persentase</option>
            <option value="nama">Urut by Nama SKPD</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600"
            title={sortOrder === 'asc' ? 'Urut Naik' : 'Urut Turun'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      <ReactECharts 
        option={option}
        style={{ height: '600px', width: '100%' }}
        theme={theme === 'dark' ? 'dark' : 'light'}
        opts={{ renderer: 'canvas' }}
      />
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Hijau (&gt;70%) | 
        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1 ml-2"></span> Kuning (40-70%) | 
        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1 ml-2"></span> Merah (&lt;40%)
        <br />
        <span className="text-xs">*Persentase penyerapan anggaran per OPD per bulan (kumulatif)</span>
      </p>

      {/* Catatan Kaki untuk Pimpinan */}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center border-t pt-2">
        <span className="mx-2">🟢 Hijau = Aman (≥70%)</span>
        <span className="mx-2">🟡 Kuning = Perhatikan (40-70%)</span>
        <span className="mx-2">🔴 Merah = Intervensi (≤40%)</span>
        <span className="mx-2">| Klik sel untuk detail realisasi</span>
      </div>
    </div>
  );
};

export default HeatmapPenyerapan;
