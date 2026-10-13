import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  total: number;
  page: number;
  pageSize?: number;
  middleLabel?: string;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({
  total,
  page,
  pageSize = 9,
  middleLabel,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return (
    <div
      id="content-pagination-bar"
      className="bg-white rounded-xl px-4 py-1 border border-stone-200/90 shadow-sm flex items-center justify-between flex-shrink-0 h-[38px] min-h-[38px] select-none text-xs"
    >
      {/* 左侧：收录总篇数 */}
      <span className="text-stone-500 font-mono text-[11px] flex-shrink-0">
        共 <span className="font-bold text-stone-800">{total}</span> 篇
      </span>

      {/* 中部：当前维度/专辑上下文 */}
      <div className="flex-1 flex justify-center min-w-0 px-2">
        {middleLabel && (
          <span
            className="font-serif font-bold text-[11px] sm:text-xs text-stone-900 truncate"
            title={middleLabel}
          >
            {middleLabel}
          </span>
        )}
      </div>

      {/* 右侧：上一页 / 下一页 */}
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-2 py-0.5 rounded-lg border border-stone-200 text-stone-600 text-xs font-serif transition flex items-center gap-1 cursor-pointer ${
            currentPage <= 1
              ? 'opacity-40 cursor-not-allowed bg-stone-50'
              : 'hover:bg-stone-100 active:scale-95'
          }`}
          title="上一页"
        >
          <ChevronLeft className="w-3 h-3" />
          <span className="hidden sm:inline">上一页</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-2 py-0.5 rounded-lg border border-stone-200 text-stone-600 text-xs font-serif transition flex items-center gap-1 cursor-pointer ${
            currentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed bg-stone-50'
              : 'hover:bg-stone-100 active:scale-95'
          }`}
          title="下一页"
        >
          <span className="hidden sm:inline">下一页</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
