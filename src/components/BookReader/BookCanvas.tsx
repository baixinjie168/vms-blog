import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, TableProperties } from 'lucide-react';
import type { BookSpread, PaperTheme, ReaderFontSize, TableDensity } from '../../stores/readerStore';

interface BookCanvasProps {
  spread: BookSpread;
  currentSpreadIndex: number;
  totalSpreads: number;
  paperTheme: PaperTheme;
  fontSize: ReaderFontSize;
  tableDensity: TableDensity;
  onSetFontSize: (size: ReaderFontSize) => void;
  onSetTableDensity: (density: TableDensity) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onRewind: () => void;
}

export default function BookCanvas({
  spread,
  currentSpreadIndex,
  totalSpreads,
  paperTheme,
  fontSize,
  tableDensity,
  onSetFontSize,
  onSetTableDensity,
  onPrev,
  onNext,
  onClose,
  onRewind,
}: BookCanvasProps) {
  const isFirstSpread = currentSpreadIndex === 0;
  const isLastSpread = currentSpreadIndex === totalSpreads - 1;
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);

  // 纸张色温材质主题样式
  const themeStyles = {
    ivory: {
      bg: '#FAF7EE',
      text: '#222222',
      border: 'border-[#e2ded2]',
      pageSpineBorder: 'border-[#dfdad0]',
      btnBg: 'bg-white/90 hover:bg-white text-stone-700 hover:text-limeDark border-stone-300/80',
      bottomMeta: 'text-stone-400/80',
      watermark: 'text-stone-300/90',
    },
    bamboo: {
      bg: '#EBF1E8',
      text: '#253526',
      border: 'border-[#d4ddd1]',
      pageSpineBorder: 'border-[#cdd8ca]',
      btnBg: 'bg-[#f0f7ee]/90 hover:bg-[#f0f7ee] text-[#253526] hover:text-limeDark border-[#c5d3c1]',
      bottomMeta: 'text-[#5a6e5b]/80',
      watermark: 'text-[#829983]/90',
    },
    ink: {
      bg: '#202226',
      text: '#E2E4E8',
      border: 'border-stone-700/80',
      pageSpineBorder: 'border-stone-700',
      btnBg: 'bg-stone-800/90 hover:bg-stone-800 text-stone-200 hover:text-limeBrand border-stone-700',
      bottomMeta: 'text-stone-500',
      watermark: 'text-stone-600',
    },
  }[paperTheme];

  // 监听末页交互按钮点击 (事件委托)
  useEffect(() => {
    const pageEl = pageContainerRef.current;
    if (!pageEl) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#book-finish-back-btn')) {
        onClose();
      } else if (target.closest('#book-finish-rewind-btn')) {
        onRewind();
      }
    };

    pageEl.addEventListener('click', handleClick);
    return () => {
      pageEl.removeEventListener('click', handleClick);
    };
  }, [onClose, onRewind, currentSpreadIndex]);

  // 翻页微动效反馈
  useEffect(() => {
    const book = bookContainerRef.current;
    if (!book) return;
    book.classList.add('opacity-90', 'scale-[0.995]');
    const timer = setTimeout(() => {
      book.classList.remove('opacity-90', 'scale-[0.995]');
    }, 150);
    return () => clearTimeout(timer);
  }, [currentSpreadIndex]);

  return (
    <div
      id="reader-book-wrapper"
      className="relative bg-stone-800/10 p-1 sm:p-2 rounded-3xl border border-stone-300/80 shadow-xl flex-1 min-h-0 flex flex-col justify-center items-center overflow-hidden h-full"
    >
      {/* 单页书籍画卷本体 */}
      <div
        ref={bookContainerRef}
        id="book-container"
        style={{ backgroundColor: themeStyles.bg, color: themeStyles.text }}
        className={`relative w-full max-w-3xl xl:max-w-4xl 2xl:max-w-[1020px] h-full rounded-2xl shadow-2xl border ${themeStyles.border} flex flex-col overflow-hidden transition-all duration-300 reader-font-${fontSize} ${
          tableDensity === 'compact' ? 'reader-table-compact' : tableDensity === 'relaxed' ? 'reader-table-relaxed' : ''
        }`}
      >
        {/* 左侧翻页边翼 (常驻显示，边缘自带优雅纸墨渐变过渡色) */}
        <div
          id="reader-prev-zone"
          onClick={!isFirstSpread ? onPrev : undefined}
          className={`absolute left-0 top-0 bottom-0 w-12 sm:w-16 z-30 flex items-center justify-start pl-1.5 sm:pl-2.5 group transition-all duration-300 bg-gradient-to-r from-stone-400/15 via-stone-200/5 to-transparent select-none ${
            isFirstSpread ? 'pointer-events-none opacity-30' : 'cursor-pointer'
          }`}
          title={isFirstSpread ? '已是第一页' : '翻至上一页 (快捷键: ←)'}
        >
          <button
            id="reader-prev-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isFirstSpread) onPrev();
            }}
            disabled={isFirstSpread}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-1.5 rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 select-none backdrop-blur-sm ${
              themeStyles.btnBg
            } ${
              isFirstSpread
                ? 'opacity-25 cursor-not-allowed pointer-events-none'
                : 'hover:border-limeBrand hover:shadow-md cursor-pointer group-hover:scale-105 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5 text-stone-500 group-hover:text-limeDark transition-transform group-hover:-translate-x-0.5" />
            <span className="text-[10px] font-serif font-bold tracking-widest [writing-mode:vertical-rl]">
              上页
            </span>
          </button>
        </div>

        {/* 右侧翻页边翼 (常驻显示，边缘自带优雅纸墨渐变过渡色) */}
        <div
          id="reader-next-zone"
          onClick={!isLastSpread ? onNext : undefined}
          className={`absolute right-0 top-0 bottom-0 w-12 sm:w-16 z-30 flex items-center justify-end pr-1.5 sm:pr-2.5 group transition-all duration-300 bg-gradient-to-l from-stone-400/15 via-stone-200/5 to-transparent select-none ${
            isLastSpread ? 'pointer-events-none opacity-30' : 'cursor-pointer'
          }`}
          title={isLastSpread ? '已是最后一页' : '翻至下一页 (快捷键: →)'}
        >
          <button
            id="reader-next-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isLastSpread) onNext();
            }}
            disabled={isLastSpread}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-1.5 rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 select-none backdrop-blur-sm ${
              themeStyles.btnBg
            } ${
              isLastSpread
                ? 'opacity-25 cursor-not-allowed pointer-events-none'
                : 'hover:border-limeBrand hover:shadow-md cursor-pointer group-hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-[10px] font-serif font-bold tracking-widest [writing-mode:vertical-rl]">
              下页
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-limeDark transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 单页典藏大视窗容器 */}
        <div
          ref={pageContainerRef}
          id="page-left"
          className="flex-1 flex flex-col w-full h-full pl-14 pr-14 sm:pl-18 sm:pr-18 md:pl-20 md:pr-20 pt-8 pb-4 relative overflow-hidden select-text"
        >
          {/* 页面右上角快速排版调节胶囊 */}
          <div className="absolute top-2 right-14 sm:right-18 md:right-20 z-20 flex items-center gap-1.5 bg-stone-200/50 hover:bg-stone-200/80 rounded-full px-2 py-0.5 backdrop-blur-xs transition select-none text-[10px]">
            {/* 字号快捷调节 */}
            <div className="flex items-center space-x-0.5">
              <button
                type="button"
                onClick={() => onSetFontSize('small')}
                className={`px-1.5 py-0.5 rounded-full font-mono cursor-pointer transition ${
                  fontSize === 'small' ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="切换为小号字 (一页容纳更多内容)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => onSetFontSize('normal')}
                className={`px-1.5 py-0.5 rounded-full font-mono cursor-pointer transition ${
                  fontSize === 'normal' ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="切换为标准书卷字号"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => onSetFontSize('large')}
                className={`px-1.5 py-0.5 rounded-full font-mono cursor-pointer transition ${
                  fontSize === 'large' ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="切换为大号字 (舒适大字阅读)"
              >
                A+
              </button>
            </div>

            <span className="w-px h-2.5 bg-stone-300" />

            {/* 表格行高快捷切换 */}
            <button
              type="button"
              onClick={() => onSetTableDensity(tableDensity === 'compact' ? 'normal' : 'compact')}
              className={`px-1.5 py-0.5 rounded-full cursor-pointer transition flex items-center gap-1 ${
                tableDensity === 'compact' ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title={tableDensity === 'compact' ? '当前为紧凑表格 (点击恢复标准)' : '点击切换为紧凑表格行高'}
            >
              <TableProperties className="w-3 h-3" />
              <span className="text-[9px]">{tableDensity === 'compact' ? '紧凑表' : '标准表'}</span>
            </button>
          </div>

          <div
            id="content-left"
            className="book-page-content flex-1 font-serif leading-relaxed text-justify overflow-y-auto hover-scrollbar select-text cursor-text pr-1"
            dangerouslySetInnerHTML={{ __html: spread.leftContent }}
          />

          {/* 底部优雅极简角标页码 */}
          <div
            className={`pt-2 mt-auto border-t border-stone-200/40 flex items-center justify-between text-[11px] font-mono ${themeStyles.bottomMeta} flex-shrink-0 select-none`}
          >
            <span id="page-num-left" className="font-bold flex items-center gap-1.5">
              <span>PAGE {spread.leftPageNum}</span>
              <span className="opacity-50 font-normal">/ {totalSpreads}</span>
            </span>
            <span className={`text-[9px] font-serif ${themeStyles.watermark} tracking-widest`}>
              VMS · 纸墨单页典藏
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
