import React, { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookSpread } from '../../stores/readerStore';
import { DIMENSIONS } from '../../services/blogService';

interface LiveBookPreviewProps {
  title: string;
  category: string;
  date: string;
  previewSpreads: BookSpread[];
  totalPages: number;
  totalSpreads: number;
}

export default function LiveBookPreview({
  title,
  category,
  date,
  previewSpreads,
  totalPages,
  totalSpreads,
}: LiveBookPreviewProps) {
  const [spreadIndex, setSpreadIndex] = useState(0);

  // 保证跨度索引在有效边界内
  const safeIndex = Math.min(spreadIndex, Math.max(0, previewSpreads.length - 1));
  const currentSpread = previewSpreads[safeIndex] || previewSpreads[0];

  // 匹配七维分类元信息
  const dimKey = Object.keys(DIMENSIONS).find(
    (k) => DIMENSIONS[k].char === category || DIMENSIONS[k].name.startsWith(category)
  );
  const dim = dimKey ? DIMENSIONS[dimKey] : DIMENSIONS.shi_trend;

  return (
    <div className="flex flex-col bg-paper-100 rounded-2xl border border-stone-300 shadow-sm overflow-hidden h-full relative select-none">
      {/* 头部标题与印张估算 */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-stone-100/90 border-b border-stone-200 text-stone-700 text-xs flex-shrink-0">
        <div className="flex items-center gap-1.5 font-serif font-bold">
          <Eye className="w-3.5 h-3.5 text-limeBrand" />
          <span>书籍排版实时预览 (Book Live Preview)</span>
        </div>

        <div className="flex items-center space-x-2">
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 text-[11px] font-mono">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setSpreadIndex((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded hover:bg-stone-200 disabled:opacity-20 cursor-pointer"
                title="上一页"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-stone-500">
                {safeIndex + 1}/{totalPages}
              </span>
              <button
                type="button"
                disabled={safeIndex >= totalPages - 1}
                onClick={() => setSpreadIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                className="p-1 rounded hover:bg-stone-200 disabled:opacity-20 cursor-pointer"
                title="下一页"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <span className="text-[10px] font-mono text-stone-500 bg-white/80 px-2 py-0.5 rounded border border-stone-200 font-medium">
            单页排版：共 {totalPages} 页
          </span>
        </div>
      </div>

      {/* 单页实时装帧排版 */}
      <div className="flex-1 p-4 sm:p-5 font-serif overflow-y-auto hover-scrollbar bg-paper-100 flex flex-col justify-between">
        <div className="max-w-2xl mx-auto w-full">
          {/* 首页篇头（仅第 1 页呈现） */}
          {safeIndex === 0 && (
            <div className="mb-4 pb-3 border-b border-stone-200">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold ${dim.bg} ${dim.border} text-stone-700 border`}
              >
                {dim.name}
              </span>
              <h1 className="font-serif font-black text-lg sm:text-xl text-stone-900 mt-2 mb-1 leading-snug">
                {title || '待定题目'}
              </h1>
              <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2">
                <span>{date}</span>
                <span>·</span>
                <span>白心解 著</span>
                <span>·</span>
                <span>纸墨单页印张</span>
              </div>
            </div>
          )}

          {/* 单页装帧排版容器 */}
          <div className="bg-white/80 p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between min-h-[380px] relative">
            <div
              className="book-page-content text-stone-800 text-xs sm:text-[13px] leading-relaxed text-justify space-y-3 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: currentSpread?.leftContent || '' }}
            />
            <div className="pt-3 mt-auto border-t border-stone-100 text-[10px] font-mono text-stone-400 flex justify-between items-center select-none">
              <span className="font-bold">PAGE {currentSpread?.leftPageNum || safeIndex + 1} / {totalPages}</span>
              <span className="font-serif text-[9px] text-stone-300 tracking-wider">VMS · 纸墨单页典藏</span>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-4 pt-2 text-center text-[10px] text-stone-400 font-serif flex-shrink-0">
          —— 发布后将直接自动装帧进入全屏翻书阅读器 ——
        </div>
      </div>
    </div>
  );
}
