import React from 'react';

// Helper function to format numbers to Indonesian Rupiah
export const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};
