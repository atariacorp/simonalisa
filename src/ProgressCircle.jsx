import React from 'react';

const ProgressCircle = ({ percentage, threshold, type }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const isExceeding = type === 'pegawai' ? percentage > threshold : percentage < threshold;
  const strokeColor = percentage === 0 ? '#d1d5db' : (isExceeding ? '#EF4444' : '#10B981');
  const progress = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="50%" cy="50%" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="transparent" className="dark:stroke-gray-700" />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={strokeColor}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span className="absolute text-3xl font-bold" style={{ color: strokeColor }}>
        {percentage.toFixed(2)}%
      </span>
    </div>
  );
};

export default ProgressCircle;   // <--- WAJIB