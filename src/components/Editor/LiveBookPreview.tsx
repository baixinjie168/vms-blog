import React, { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@nanostores/react';
import type { BookSpread } from '../../stores/readerStore';
import {
  $editor,
  setEditorPreviewFontSize,
  setEditorPreviewTableDensity,
} from '../../stores/editorStore';

interface LiveBookPreviewProps {
  previewSpreads: BookSpread[];
  totalPages: number;
  totalSpreads: number;
}

export default function LiveBookPreview({
  previewSpreads,
  totalPages,
  totalSpreads,
}: LiveBookPreviewProps) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const editorState = useStore($editor);
  const { previewFontSize, previewTableDensity } = editorState;

  // 保证跨度索引在有效边界内
  const safeIndex = Math.min(spreadIndex, Math.max(0, previewSpreads.length - 1));
  const currentSpread = previewSpreads[safeIndex] || previewSpreads[0];

  return (
    <div className="flex flex-col bg-paper-100 rounded-2xl border border-stone-300 shadow-sm overflow-hidden h-full relative select-none">
      {/* 头部标题与印张估算 */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-stone-100/90 border-b border-stone-200 text-stone-700 text-xs flex-shrink-0">
        <div className="flex items-center gap-1.5 font-serif font-bold">
          <Eye className="w-3.5 h-3.5 text-limeBrand" />
          <span>文章预览</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* 字号切换 */}
          <div className="hidden sm:flex items-center space-x-0.5 bg-stone-200/60 rounded px-1.5 py-0.5 text-[10px]">
            <span className="text-stone-400 font-serif mr-0.5">字号</span>
            {(['small', 'normal', 'large'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setEditorPreviewFontSize(s)}
                className={`px-1 py-0.2 rounded font-mono transition cursor-pointer ${
                  previewFontSize === s ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title={s === 'small' ? '小字预览 (容纳更多)' : s === 'normal' ? '标准字' : '大字预览'}
              >
                {s === 'small' ? '小' : s === 'normal' ? '中' : '大'}
              </button>
            ))}
          </div>

          {/* 表格行高切换 */}
          <div className="hidden sm:flex items-center space-x-0.5 bg-stone-200/60 rounded px-1.5 py-0.5 text-[10px]">
            <span className="text-stone-400 font-serif mr-0.5">表格</span>
            {(['compact', 'normal'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setEditorPreviewTableDensity(d)}
                className={`px-1 py-0.2 rounded font-serif transition cursor-pointer ${
                  previewTableDensity === d ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title={d === 'compact' ? '紧凑表格行高' : '标准表格行高'}
              >
                {d === 'compact' ? '紧凑' : '标准'}
              </button>
            ))}
          </div>

          {/* 翻页器 */}
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
            共 {totalPages} 页
          </span>
        </div>
      </div>

      {/* 单页实时装帧排版 */}
      <div className="flex-1 p-4 sm:p-5 font-serif overflow-y-auto hover-scrollbar bg-paper-100 flex flex-col justify-between">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {/* 单页装帧排版容器：随预览区纵向拉伸，与左侧编辑框保持等高 */}
          <div className={`bg-white/80 p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between min-h-[380px] flex-1 relative reader-font-${previewFontSize} ${
            previewTableDensity === 'compact' ? 'reader-table-compact' : ''
          }`}>
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
      </div>
    </div>
  );
}
