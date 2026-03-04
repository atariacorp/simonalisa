import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, theme }) => {
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 3;
        const halfPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (currentPage > 2 + halfPages) {
                pageNumbers.push('...');
            }

            let start = Math.max(2, currentPage - halfPages);
            let end = Math.min(totalPages - 1, currentPage + halfPages);

            if (currentPage <= 2 + halfPages) {
                start = 2;
                end = maxPagesToShow + 1;
            }
            if (currentPage >= totalPages - 1 - halfPages) {
                start = totalPages - maxPagesToShow;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - 1 - halfPages) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    const pages = getPageNumbers();
    const buttonBaseClasses = "px-4 py-2 text-sm rounded-md transition-colors";
    const buttonIdleClasses = "bg-white dark:bg-gray-700 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600";
    const buttonActiveClasses = "bg-blue-600 text-white border border-blue-600";
    const buttonDisabledClasses = "opacity-50 cursor-not-allowed";

    return (
        <div className="flex justify-center items-center mt-6 space-x-2">
            <button 
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={currentPage === 1} 
                className={`${buttonBaseClasses} ${buttonIdleClasses} ${currentPage === 1 ? buttonDisabledClasses : ''}`}
            >
                Sebelumnya
            </button>
            {pages.map((page, index) =>
                typeof page === 'number' ? (
                    <button 
                        key={index} 
                        onClick={() => onPageChange(page)} 
                        className={`${buttonBaseClasses} ${currentPage === page ? buttonActiveClasses : buttonIdleClasses}`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">...</span>
                )
            )}
            <button 
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className={`${buttonBaseClasses} ${buttonIdleClasses} ${currentPage === totalPages ? buttonDisabledClasses : ''}`}
            >
                Selanjutnya
            </button>
        </div>
    );
};

export default Pagination;