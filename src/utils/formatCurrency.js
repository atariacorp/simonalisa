export const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'Rp 0';
    }
    
    // Format ke Rupiah
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value).replace(/^Rp\s+/, 'Rp ');
};

// Alias untuk kompatibilitas dengan kode yang mungkin menggunakan formatIDR
export const formatIDR = formatCurrency;