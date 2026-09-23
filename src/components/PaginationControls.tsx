import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = 'records'
}) => {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between pt-3 text-[11px] text-gray-500 font-mono">
        <span>Showing {totalItems} {itemName} (Past 1 Hour)</span>
        <span className="text-emerald-400/80 font-semibold">1-Hour Retention Active</span>
      </div>
    );
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers (up to 5 pages shown)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePageClick = (p: number) => {
    if (p !== currentPage && p >= 1 && p <= totalPages) {
      triggerHaptic('light');
      onPageChange(p);
    }
  };

  return (
    <div className="pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
      {/* Items count summary */}
      <div className="text-[11px] text-gray-400 font-mono">
        Showing <span className="text-white font-bold">{startItem}–{endItem}</span> of{' '}
        <span className="text-amber-400 font-bold">{totalItems}</span> {itemName}{' '}
        <span className="text-gray-500 text-[10px]">(Past 60m)</span>
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition border border-gray-800"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition border border-gray-800"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-600 font-mono text-[11px]">
                  …
                </span>
              );
            }
            const pageNum = Number(p);
            const isActive = pageNum === currentPage;
            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => handlePageClick(pageNum)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-500/20 font-black'
                    : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition border border-gray-800"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition border border-gray-800"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
