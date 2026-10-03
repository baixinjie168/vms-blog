import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  $reader,
  openBookReader,
  closeBookReader,
  nextSpread,
  prevSpread,
  jumpToPage,
  setPaperTheme,
  likeComment,
  addComment,
} from '../../stores/readerStore';
import { DEFAULT_ARTICLES, type ArticleItem } from '../../services/blogService';
import TOCSidebar from './TOCSidebar';
import BookCanvas from './BookCanvas';
import CommentsSidebar from './CommentsSidebar';
import { ArrowLeft, ListTree, MessageSquareQuote, X } from 'lucide-react';

export default function BookReader() {
  const readerState = useStore($reader);
  const { isOpen, article, currentSpreadIndex, paperTheme, spreads, toc, comments } = readerState;

  // 移动端专用抽屉控制: 'none' | 'toc' | 'comments'
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'toc' | 'comments'>('none');

  // 移动端触摸滑动手势支持
  const touchStartX = useRef<number | null>(null);

  // 全局事件监听：响应由中栏文章卡片或其他交互派发的 vms:open-reader 事件
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug?: string; id?: number; title?: string }>;
      const { slug, id, title, article } = customEvent.detail || {};

      let targetArticle: ArticleItem | undefined = article;
      if (!targetArticle && slug) {
        targetArticle = DEFAULT_ARTICLES.find((a) => a.slug === slug);
      }
      if (!targetArticle && id) {
        targetArticle = DEFAULT_ARTICLES.find((a) => a.id === id);
      }
      if (!targetArticle && DEFAULT_ARTICLES.length > 0) {
        targetArticle = DEFAULT_ARTICLES[0];
      }

      if (targetArticle) {
        openBookReader(targetArticle);
      }
      setMobileDrawer('none');
    };

    window.addEventListener('vms:open-reader', handleOpenEvent);
    return () => {
      window.removeEventListener('vms:open-reader', handleOpenEvent);
    };
  }, []);

  // 键盘快捷键监听：左右键翻页、Esc 键退出
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSpread();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSpread();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (mobileDrawer !== 'none') {
          setMobileDrawer('none');
        } else {
          closeBookReader();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, mobileDrawer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        prevSpread(); // 向右划 -> 上一页
      } else {
        nextSpread(); // 向左划 -> 下一页
      }
    }
    touchStartX.current = null;
  };

  if (!isOpen) {
    return null;
  }

  const currentSpread = spreads[currentSpreadIndex] || spreads[0];

  return (
    <section
      id="view-reader"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 w-full h-screen max-h-screen px-2 sm:px-4 lg:px-6 py-2 sm:py-3.5 flex flex-col overflow-hidden transition-opacity duration-300 bg-stone-900/10 backdrop-blur-xs"
    >
      {/* 移动端专属浮动控制条 (仅在 lg 屏幕以下显示) */}
      <div className="flex lg:hidden items-center justify-between bg-white/95 px-3 py-1.5 rounded-xl border border-stone-200/90 shadow-xs mb-2 flex-shrink-0 text-xs font-serif">
        <button
          type="button"
          onClick={closeBookReader}
          className="inline-flex items-center gap-1 text-stone-600 hover:text-limeDark font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-limeBrand" />
          <span>书架</span>
        </button>

        <span className="font-bold text-stone-800 line-clamp-1 max-w-[160px] text-center">
          {article?.title || 'VMS · 卷帙'}
        </span>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setMobileDrawer((prev) => (prev === 'toc' ? 'none' : 'toc'))}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              mobileDrawer === 'toc'
                ? 'bg-limeLight text-limeDark border-limeBrand/30 font-bold'
                : 'text-stone-600 hover:bg-stone-100 border-stone-200'
            }`}
            title="卷帙大纲"
          >
            <ListTree className="w-4 h-4 text-limeBrand" />
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawer((prev) => (prev === 'comments' ? 'none' : 'comments'))}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              mobileDrawer === 'comments'
                ? 'bg-limeLight text-limeDark border-limeBrand/30 font-bold'
                : 'text-stone-600 hover:bg-stone-100 border-stone-200'
            }`}
            title="卷册批注"
          >
            <MessageSquareQuote className="w-4 h-4 text-limeBrand" />
          </button>
        </div>
      </div>

      {/* 核心阅读三栏布局：桌面端等宽展开，移动端主体沉浸展开 */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_290px] xl:grid-cols-[280px_1fr_320px] gap-2.5 sm:gap-3.5 w-full h-full min-h-0 items-stretch overflow-hidden relative">
        {/* 左栏：卷帙大纲 · 目录树 (桌面常驻，移动端侧边抽屉) */}
        <div
          className={`lg:static lg:block h-full min-h-0 ${
            mobileDrawer === 'toc'
              ? 'fixed inset-y-0 left-0 z-40 w-[290px] max-w-[85vw] p-2 bg-stone-900/40 backdrop-blur-xs flex flex-col animate-slide-right'
              : 'hidden'
          }`}
        >
          <div className="h-full relative">
            {mobileDrawer === 'toc' && (
              <button
                type="button"
                onClick={() => setMobileDrawer('none')}
                className="lg:hidden absolute right-2 top-2 z-50 p-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <TOCSidebar
              article={article}
              spreads={spreads}
              currentSpreadIndex={currentSpreadIndex}
              toc={toc}
              paperTheme={paperTheme}
              onClose={closeBookReader}
              onJumpPage={(p) => {
                jumpToPage(p);
                setMobileDrawer('none');
              }}
            />
          </div>
        </div>

        {/* 中栏：双开本翻书主体 (移动端与桌面端自适应撑满) */}
        <BookCanvas
          spread={currentSpread}
          currentSpreadIndex={currentSpreadIndex}
          totalSpreads={spreads.length}
          paperTheme={paperTheme}
          onPrev={prevSpread}
          onNext={nextSpread}
          onClose={closeBookReader}
          onRewind={() => jumpToPage(1)}
        />

        {/* 右栏：批注评论与纸张色温 (桌面常驻，移动端侧边抽屉) */}
        <div
          className={`lg:static lg:block h-full min-h-0 ${
            mobileDrawer === 'comments'
              ? 'fixed inset-y-0 right-0 z-40 w-[320px] max-w-[85vw] p-2 bg-stone-900/40 backdrop-blur-xs flex flex-col animate-slide-left'
              : 'hidden'
          }`}
        >
          <div className="h-full relative">
            {mobileDrawer === 'comments' && (
              <button
                type="button"
                onClick={() => setMobileDrawer('none')}
                className="lg:hidden absolute right-2 top-2 z-50 p-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <CommentsSidebar
              comments={comments}
              currentSpread={currentSpread}
              paperTheme={paperTheme}
              onSetTheme={setPaperTheme}
              onLikeComment={likeComment}
              onAddComment={addComment}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
