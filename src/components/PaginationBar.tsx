import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({
  total,
  page,
  pageSize = 9,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIdx = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(currentPage * pageSize, total);

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div
      id="content-pagination-bar"
      className="bg-white rounded-xl px-4 py-1 border border-stone-200/90 shadow-sm flex items-center justify-between flex-shrink-0 h-[38px] min-h-[38px] select-none text-xs"
    >
      {/* 左侧：卷帙条目索引范围 */}
      <div className="flex items-center space-x-2 text-stone-500 font-mono text-[11px]">
        <span className="hidden sm:inline">卷帙索引：</span>
        <span className="font-bold text-stone-800">
          {startIdx}-{endIdx}
        </span>
        <span>/</span>
        <span>共 {total} 篇</span>
        <span className="text-stone-300">|</span>
        <span className="text-stone-400 hidden md:inline">每页 {pageSize} 篇</span>
      </div>

      {/* 右侧：翻页按钮与页码 */}
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

        <div className="flex items-center space-x-1">
          {pages.map((p) => {
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-limeBrand text-white shadow-2xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

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
