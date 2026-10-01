import React, { useEffect } from 'react';
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

export default function BookReader() {
  const readerState = useStore($reader);
  const { isOpen, article, currentSpreadIndex, paperTheme, spreads, toc, comments } = readerState;

  // 全局事件监听：响应由中栏文章卡片或其他交互派发的 vms:open-reader 事件
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug?: string; id?: number; title?: string }>;
      const { slug, id, title } = customEvent.detail || {};

      let targetArticle: ArticleItem | undefined;
      if (slug) {
        targetArticle = DEFAULT_ARTICLES.find((a) => a.slug === slug);
      }
      if (!targetArticle && id) {
        targetArticle = DEFAULT_ARTICLES.find((a) => a.id === id);
      }
      if (!targetArticle) {
        // 回退默认或根据参数虚拟构造
        targetArticle = DEFAULT_ARTICLES[0];
      }

      openBookReader(targetArticle);
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
      // 忽略在评论输入框内的按键
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
        closeBookReader();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const currentSpread = spreads[currentSpreadIndex] || spreads[0];

  return (
    <section
      id="view-reader"
      className="fixed inset-0 z-50 w-full h-screen max-h-screen px-2.5 sm:px-4 lg:px-6 py-2.5 sm:py-3.5 flex flex-col overflow-hidden transition-opacity duration-300 bg-stone-900/10 backdrop-blur-xs select-none"
    >
      {/* 核心阅读三栏布局：左侧 Markdown 目录树 + 中间双对页实体翻书 + 右侧批注与评论区 */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_290px] xl:grid-cols-[280px_1fr_320px] gap-2.5 sm:gap-3.5 w-full h-full min-h-0 items-stretch overflow-hidden">
        {/* 左栏：卷帙大纲 · 目录树 */}
        <TOCSidebar
          article={article}
          spreads={spreads}
          currentSpreadIndex={currentSpreadIndex}
          toc={toc}
          paperTheme={paperTheme}
          onClose={closeBookReader}
          onJumpPage={jumpToPage}
        />

        {/* 中栏：双开本翻书主体 */}
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

        {/* 右栏：批注评论与纸张色温 */}
        <CommentsSidebar
          comments={comments}
          currentSpread={currentSpread}
          paperTheme={paperTheme}
          onSetTheme={setPaperTheme}
          onLikeComment={likeComment}
          onAddComment={addComment}
        />
      </div>
    </section>
  );
}
