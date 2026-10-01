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
          {totalSpreads > 1 && (
            <div className="flex items-center space-x-1 text-[11px] font-mono">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setSpreadIndex((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded hover:bg-stone-200 disabled:opacity-20 cursor-pointer"
                title="上一印张"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-stone-500">
                {safeIndex + 1}/{totalSpreads}
              </span>
              <button
                type="button"
                disabled={safeIndex >= totalSpreads - 1}
                onClick={() => setSpreadIndex((prev) => Math.min(totalSpreads - 1, prev + 1))}
                className="p-1 rounded hover:bg-stone-200 disabled:opacity-20 cursor-pointer"
                title="下一印张"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <span className="text-[10px] font-mono text-stone-500 bg-white/80 px-2 py-0.5 rounded border border-stone-200 font-medium">
            自动估算：约 {totalSpreads} 印张 ({totalPages} 页面)
          </span>
        </div>
      </div>

      {/* 书页对开实时装帧排版 */}
      <div className="flex-1 p-4 sm:p-5 font-serif overflow-y-auto hover-scrollbar bg-paper-100 flex flex-col justify-between">
        <div className="max-w-xl mx-auto w-full">
          {/* 首页篇头（仅第一印张呈现） */}
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
                <span>纸墨印张仿真</span>
              </div>
            </div>
          )}

          {/* 对开双页面排版容器 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 p-4 rounded-xl border border-stone-200/90 shadow-xs relative">
            {/* 左页 */}
            <div className="flex flex-col justify-between min-h-[300px] border-b md:border-b-0 md:border-r border-stone-200 pb-3 md:pb-0 md:pr-3">
              <div
                className="text-stone-800 text-xs leading-relaxed text-justify space-y-2 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentSpread?.leftContent || '' }}
              />
              <div className="pt-2 mt-auto text-[9px] font-mono text-stone-400 flex justify-between">
                <span>PAGE {currentSpread?.leftPageNum || 1}</span>
                <span className="font-serif text-[8px] text-stone-300">VMS · 纸墨装帧</span>
              </div>
            </div>

            {/* 右页 */}
            <div className="flex flex-col justify-between min-h-[300px] md:pl-1">
              <div
                className="text-stone-800 text-xs leading-relaxed text-justify space-y-2 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentSpread?.rightContent || '' }}
              />
              <div className="pt-2 mt-auto text-[9px] font-mono text-stone-400 flex justify-between">
                <span className="font-serif text-[8px] text-stone-300">纸墨开本</span>
                <span>PAGE {currentSpread?.rightPageNum || 2}</span>
              </div>
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
