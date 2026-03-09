import React from 'react';
import { formatCurrency } from './utils/formatCurrency';

const StatCard = ({ icon, title, target, realisasi, percentage, colorClass, rkud, nonRkud, rkudPercentage, nonRkudPercentage }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-between min-h-[220px]">
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className={`p-2 rounded-full bg-${colorClass}-100 dark:bg-${colorClass}-900/50`}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      {title === 'Belanja Daerah' ? (
        <>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(target)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pagu Anggaran</p>
          <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Realisasi Riil (RKUD): <span className="font-semibold float-right">{formatCurrency(rkud)} ({rkudPercentage.toFixed(2)}%)</span></p>
            <p>Realisasi Riil (Non RKUD): <span className="font-semibold float-right">{formatCurrency(nonRkud)} ({nonRkudPercentage.toFixed(2)}%)</span></p>
            <p className="font-bold">Total Realisasi Riil: <span className="font-bold float-right">{formatCurrency(realisasi)} ({percentage.toFixed(2)}%)</span></p>
          </div>
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(target)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Realisasi Riil {formatCurrency(realisasi)}</p>
        </>
      )}
    </div>
    <div className="mt-6">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`h-2 bg-${colorClass}-500 rounded-full`} style={{ width: `${percentage > 100 ? 100 : percentage}%` }}></div>
      </div>
      <p className={`text-right mt-2 font-bold text-sm text-${colorClass}-600 dark:text-${colorClass}-400`}>{percentage.toFixed(2)}%</p>
    </div>
  </div>
);

export default StatCard;
