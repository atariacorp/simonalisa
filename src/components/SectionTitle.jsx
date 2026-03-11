import React from 'react';

const SectionTitle = ({ children }) => {
  return (
    <div className="relative mb-8 group">
      <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white transition-all">
        {children}
      </h2>
      <div className="absolute -bottom-2 left-0 h-1.5 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all group-hover:w-24"></div>
    </div>
  );
};

export default SectionTitle;