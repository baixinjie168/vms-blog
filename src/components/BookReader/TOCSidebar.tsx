import React from 'react';
import { ArrowLeft, ListTree, Edit3 } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { $currentUser } from '../../stores/authStore';
import { openEditor } from '../../stores/editorStore';
import type { ArticleItem } from '../../services/blogService';
import type { BookSpread, TOCItem, PaperTheme } from '../../stores/readerStore';

interface TOCSidebarProps {
  article: ArticleItem | null;
  spreads: BookSpread[];
  currentSpreadIndex: number;
  toc: TOCItem[];
  paperTheme: PaperTheme;
  onClose: () => void;
  onJumpPage: (page: number) => void;
}

export default function TOCSidebar({
  article,
  spreads,
  currentSpreadIndex,
  toc,
  paperTheme,
  onClose,
  onJumpPage,
}: TOCSidebarProps) {
  const currentUser = useStore($currentUser);
  const currentSpread = spreads[currentSpreadIndex] || spreads[0] || { leftPageNum: 1, rightPageNum: 1 };
  const totalSpreads = spreads.length || 1;
  const totalPages = totalSpreads;
  const progressPercent = Math.min(100, Math.round(((currentSpreadIndex + 1) / totalSpreads) * 100));

  const isInk = paperTheme === 'ink';

  const categoryName = article?.dimensionName || (article?.dimensionChar ? `${article.dimensionChar} · 认知体系` : '道 · 我为什么活？');
  const categoryBg = article?.dimensionBg || 'bg-limeLight/40';
  const categoryBorder = article?.dimensionBorder || 'border-limeBrand/30';

  const canManage = Boolean(
    currentUser &&
    article &&
    (article.author_id === currentUser.id || currentUser.role === 'admin')
  );

  return (
    <aside
      id="reader-toc-sidebar"
      className={`rounded-2xl border shadow-sm p-3.5 flex flex-col justify-between h-full min-h-0 select-none overflow-hidden transition-colors duration-200 ${
        isInk
          ? 'bg-[#1e2124]/95 border-stone-700/80 text-stone-200'
          : 'bg-white/95 border-stone-200/90 text-stone-800'
      }`}
    >
      {/* 顶部收纳区：返回主页 + 编辑 + 维度标签 + 文章主标题 + 紧凑阅读进度 */}
      <div className={`space-y-2.5 pb-2.5 border-b flex-shrink-0 ${isInk ? 'border-stone-700/60' : 'border-stone-100'}`}>
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-1.5 text-xs font-medium transition py-1 px-2 -ml-2 rounded-lg cursor-pointer ${
              isInk
                ? 'text-stone-300 hover:text-white hover:bg-stone-800'
                : 'text-stone-600 hover:text-limeDark hover:bg-stone-100/80'
            }`}
            title="返回文集工作台"
          >
            <ArrowLeft className="w-4 h-4 text-limeBrand" />
            <span>返回文集</span>
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  if (article) {
                    onClose();
                    openEditor(article);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium border cursor-pointer transition ${
                  isInk
                    ? 'border-stone-700 bg-stone-800/90 text-limeLight hover:bg-stone-700'
                    : 'border-limeBrand/40 bg-limeLight/60 text-limeDark hover:bg-limeLight'
                }`}
                title="编辑此篇卷帙"
              >
                <Edit3 className="w-3 h-3 text-limeBrand" />
                <span>编辑</span>
              </button>
            )}
            <span
              id="reader-cat-tag"
              className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold border flex-shrink-0 ${
                isInk
                  ? 'bg-stone-800 text-stone-300 border-stone-700'
                  : `${categoryBg} text-limeDark ${categoryBorder}`
              }`}
            >
              {categoryName}
            </span>
          </div>
        </div>

        <div>
          {article?.album_id && (
            <div className="mb-1">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isInk
                    ? 'bg-stone-800 text-limeLight border border-stone-700'
                    : 'bg-limeLight text-limeDark border border-limeBrand/30'
                }`}
              >
                {article.chapter_label || `第 ${article.album_order || 1} 讲`}
              </span>
            </div>
          )}
          <h2
            id="reader-article-title"
            className={`text-xs sm:text-[13px] font-serif font-bold line-clamp-2 leading-snug ${
              isInk ? 'text-stone-100' : 'text-stone-800'
            }`}
            title={article?.title || '卷帙文章'}
          >
            {article?.title || '卷帙篇目'}
          </h2>
        </div>

        {/* 紧凑型阅读进度条 */}
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-mono ${
            isInk
              ? 'bg-stone-800/80 border-stone-700 text-stone-300'
              : 'bg-stone-50/90 border-stone-200/80 text-stone-600'
          }`}
        >
          <span id="reading-progress-text">
            第 {currentSpreadIndex + 1} / {totalPages} 页
          </span>
          <div className="flex items-center space-x-2">
            <div className={`w-14 h-1.5 rounded-full overflow-hidden ${isInk ? 'bg-stone-700' : 'bg-stone-200'}`}>
              <div
                id="reading-progress-bar"
                className="bg-limeBrand h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span
              id="reading-percent-text"
              className={`text-[10px] font-bold ${isInk ? 'text-stone-400' : 'text-stone-400'}`}
            >
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 目录头部 */}
      <div className="flex items-center justify-between pt-2 pb-1 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <ListTree className="w-3.5 h-3.5 text-limeBrand" />
          <h3
            className={`font-serif font-bold text-xs tracking-wider ${
              isInk ? 'text-stone-200' : 'text-stone-800'
            }`}
          >
            卷帙大纲 · 目录
          </h3>
        </div>
        <span
          id="toc-heading-count"
          className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
            isInk ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {toc.length} 个章节
        </span>
      </div>

      {/* 目录层级树 (根据 Markdown #/##/### 层次缩进渲染) */}
      <div
        id="reader-toc-list"
        className="flex-1 min-h-0 overflow-y-auto hover-scrollbar py-1 space-y-0.5 pr-1"
      >
        {toc.map((item, idx) => {
          const isCurrentActive = item.page === (currentSpreadIndex + 1);

          let levelClass = '';
          let prefixIcon = '';
          if (item.level === 1) {
            levelClass = 'font-bold text-xs sm:text-[13px] pl-1.5 py-1 border-l-2';
            prefixIcon = '#';
          } else if (item.level === 2) {
            levelClass = 'font-medium text-xs pl-3.5 py-0.5 border-l-2';
            prefixIcon = '##';
          } else {
            levelClass = 'text-[11px] pl-6 py-0.5 border-l';
            prefixIcon = '•';
          }

          let activeClass = '';
          if (isCurrentActive) {
            activeClass = isInk
              ? 'bg-limeBrand/20 text-limeLight border-limeBrand font-bold shadow-xs'
              : 'bg-[#70C000]/15 text-[#4E8800] border-limeBrand font-bold shadow-xs';
          } else {
            activeClass = isInk
              ? 'border-transparent text-stone-400 hover:bg-stone-800/80 hover:text-stone-100'
              : 'border-transparent text-stone-600 hover:bg-stone-100/80 hover:text-stone-900';
          }

          return (
            <div
              key={idx}
              onClick={() => onJumpPage(item.page)}
              className={`group flex items-center justify-between rounded-lg px-2 cursor-pointer transition-all duration-150 select-none ${levelClass} ${activeClass}`}
            >
              <div className="flex items-center min-w-0 pr-1">
                <span
                  className={`font-mono mr-1 text-[10px] ${
                    isCurrentActive ? 'text-limeBrand font-bold' : 'text-stone-400'
                  }`}
                >
                  {prefixIcon}
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              <span
                className={`font-mono text-[9px] flex-shrink-0 ${
                  isCurrentActive ? 'text-limeBrand font-bold' : 'text-stone-400'
                }`}
              >
                P.{item.page}
              </span>
            </div>
          );
        })}
      </div>

      {/* 底部导读提示 */}
      <div
        className={`pt-2 border-t text-[9px] font-serif text-center flex-shrink-0 ${
          isInk ? 'border-stone-700/60 text-stone-500' : 'border-stone-100 text-stone-400'
        }`}
      >
        “点击章节跳页 · 随阅随亮”
      </div>
    </aside>
  );
}
