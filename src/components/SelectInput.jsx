import React from 'react';

const SelectInput = ({ label, value, onChange, options, placeholder, disabled = false, useObjectAsOption = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
      >
        <option value="">{placeholder}</option>
        {useObjectAsOption
          ? options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
          : options.map(opt => <option key={opt} value={opt}>{opt}</option>)
        }
      </select>
    </div>
  );
};

export default SelectInput;   // <--- WAJIB
