import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookSpread, PaperTheme } from '../../stores/readerStore';

interface BookCanvasProps {
  spread: BookSpread;
  currentSpreadIndex: number;
  totalSpreads: number;
  paperTheme: PaperTheme;
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
  onPrev,
  onNext,
  onClose,
  onRewind,
}: BookCanvasProps) {
  const isFirstSpread = currentSpreadIndex === 0;
  const isLastSpread = currentSpreadIndex === totalSpreads - 1;
  const rightPageRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const [mobileActiveHalf, setMobileActiveHalf] = useState<'left' | 'right'>('left');

  // 跨度切换时移动端默认显示左半页
  useEffect(() => {
    setMobileActiveHalf('left');
  }, [currentSpreadIndex]);

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
    const rightEl = rightPageRef.current;
    if (!rightEl) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#book-finish-back-btn')) {
        onClose();
      } else if (target.closest('#book-finish-rewind-btn')) {
        onRewind();
      }
    };

    rightEl.addEventListener('click', handleClick);
    return () => {
      rightEl.removeEventListener('click', handleClick);
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
      {/* 书籍本体 */}
      <div
        ref={bookContainerRef}
        id="book-container"
        style={{ backgroundColor: themeStyles.bg, color: themeStyles.text }}
        className={`relative w-full max-w-4xl xl:max-w-[980px] 2xl:max-w-[1040px] h-full rounded-2xl shadow-2xl border ${themeStyles.border} flex overflow-hidden book-spine-shadow transition-all duration-300 select-none`}
      >
        {/* 左侧翻页边翼 (常驻显示，边缘自带优雅纸墨渐变过渡色) */}
        <div
          id="reader-prev-zone"
          onClick={!isFirstSpread ? onPrev : undefined}
          className={`absolute left-0 top-0 bottom-0 w-12 sm:w-14 z-30 flex items-center justify-start pl-1.5 sm:pl-2 group transition-all duration-300 bg-gradient-to-r from-stone-400/15 via-stone-200/5 to-transparent select-none ${
            isFirstSpread ? 'pointer-events-none' : 'cursor-pointer'
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
          className={`absolute right-0 top-0 bottom-0 w-12 sm:w-14 z-30 flex items-center justify-end pr-1.5 sm:pr-2 group transition-all duration-300 bg-gradient-to-l from-stone-400/15 via-stone-200/5 to-transparent select-none ${
            isLastSpread ? 'pointer-events-none' : 'cursor-pointer'
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

        {/* 移动端对开单页分段指示器 (仅在 md 以下小屏幕呈现) */}
        <div className="flex md:hidden items-center justify-center gap-1.5 py-1 px-2 border-b border-stone-200/50 bg-stone-100/40 text-[10px] font-mono select-none w-full flex-shrink-0 z-20">
          <button
            type="button"
            onClick={() => setMobileActiveHalf('left')}
            className={`px-2.5 py-0.5 rounded cursor-pointer transition ${
              mobileActiveHalf === 'left' ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500'
            }`}
          >
            左面对开 · P.{spread.leftPageNum}
          </button>
          <span className="text-stone-300">|</span>
          <button
            type="button"
            onClick={() => setMobileActiveHalf('right')}
            className={`px-2.5 py-0.5 rounded cursor-pointer transition ${
              mobileActiveHalf === 'right' ? 'bg-limeBrand text-white font-bold shadow-2xs' : 'text-stone-500'
            }`}
          >
            右面对开 · P.{spread.rightPageNum}
          </button>
        </div>

        {/* 左半页 (桌面端双页对开，移动端根据切换展示) */}
        <div
          id="page-left"
          className={`${
            mobileActiveHalf === 'left' ? 'flex' : 'hidden'
          } md:flex flex-col flex-1 pl-12 pr-6 lg:pl-14 lg:pr-8 pt-6 pb-3 border-r ${themeStyles.pageSpineBorder} left-page-spine relative overflow-hidden select-none`}
        >
          <div
            id="content-left"
            className="flex-1 font-serif leading-relaxed text-justify overflow-hidden flex flex-col justify-start"
            dangerouslySetInnerHTML={{ __html: spread.leftContent }}
          />

          {/* 底部优雅极简角标页码 */}
          <div
            className={`pt-1.5 mt-auto flex items-center justify-between text-[11px] font-mono ${themeStyles.bottomMeta} flex-shrink-0 select-none`}
          >
            <span id="page-num-left" className="font-bold">
              PAGE {spread.leftPageNum}
            </span>
            <span className={`text-[9px] font-serif ${themeStyles.watermark} tracking-widest`}>
              VMS · 纸墨装帧
            </span>
          </div>
        </div>

        {/* 中央书脊仿真折痕 */}
        <div className="hidden md:block w-px bg-stone-300/60 shadow-[0_0_12px_rgba(0,0,0,0.2)] z-10" />

        {/* 右半页 (桌面端双页对开，移动端根据切换展示) */}
        <div
          ref={rightPageRef}
          id="page-right"
          className={`${
            mobileActiveHalf === 'right' ? 'flex' : 'hidden'
          } md:flex flex-col flex-1 pr-12 pl-6 lg:pr-14 lg:pl-8 pt-6 pb-3 right-page-spine relative overflow-hidden select-none`}
        >
          <div
            id="content-right"
            className="flex-1 font-serif leading-relaxed text-justify overflow-hidden flex flex-col justify-start"
            dangerouslySetInnerHTML={{ __html: spread.rightContent }}
          />

          {/* 底部优雅极简角标页码 */}
          <div
            className={`pt-1.5 mt-auto flex items-center justify-between text-[11px] font-mono ${themeStyles.bottomMeta} flex-shrink-0 select-none`}
          >
            <span className={`text-[9px] font-serif ${themeStyles.watermark} tracking-widest`}>
              纸墨开本
            </span>
            <span id="page-num-right" className="font-bold">
              PAGE {spread.rightPageNum}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
