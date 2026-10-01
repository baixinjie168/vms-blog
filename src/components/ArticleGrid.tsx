import React from 'react';
import { useStore } from '@nanostores/react';
import { BookOpen, ArrowRight, PenSquare } from 'lucide-react';
import { $filter, filterByCategory } from '../stores/filterStore';
import { openBookReader } from '../stores/readerStore';
import { openEditor } from '../stores/editorStore';
import type { ArticleItem } from '../services/blogService';

interface ArticleGridProps {
  articles: ArticleItem[];
  loading?: boolean;
  onOpenArticle?: (article: ArticleItem) => void;
}

export default function ArticleGrid({
  articles = [],
  loading = false,
  onOpenArticle,
}: ArticleGridProps) {
  const filter = useStore($filter);

  const handleCardClick = (article: ArticleItem) => {
    if (onOpenArticle) {
      onOpenArticle(article);
    } else {
      openBookReader(article);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vms:open-reader', {
            detail: { slug: article.slug, id: article.id, title: article.title, article },
          })
        );
      }
    }
  };

  if (loading) {
    return (
      <div
        id="nine-cards-container"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 flex-1 min-h-0 content-stretch"
      >
        {Array.from({ length: 9 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white/80 rounded-2xl border border-stone-200/80 p-3 h-full flex flex-col justify-between animate-pulse"
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="w-16 h-4 bg-stone-200 rounded" />
                <div className="w-16 h-3 bg-stone-100 rounded" />
              </div>
              <div className="w-3/4 h-4 bg-stone-200 rounded pt-1" />
              <div className="w-full h-8 bg-stone-100 rounded" />
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-100">
              <div className="w-20 h-3 bg-stone-200 rounded" />
              <div className="w-14 h-3 bg-stone-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    const isFiltered = filter.mode !== 'all' && (filter.category || filter.albumSlug || filter.searchKeyword || filter.date);

    return (
      <div
        id="nine-cards-container"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 flex-1 min-h-0 content-stretch"
      >
        <div className="col-span-full h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-stone-200/90 text-stone-400 select-none">
          <BookOpen className="w-10 h-10 text-stone-300 mb-3" />
          <p className="font-serif text-sm font-bold text-stone-800">
            {isFiltered ? '此维度下暂无匹配卷帙' : '研读长卷虚席以待 · 您的专属空间尚无文章'}
          </p>
          <p className="font-serif text-xs text-stone-400 mt-1 max-w-sm">
            {isFiltered
              ? '可尝试清除搜索词或切换到其他七维认知层级'
              : '以道明向，以心修己，以法立律。立即撰写发表属于您的第一篇认知卷帙，装帧成册。'}
          </p>
          <div className="flex items-center gap-2 mt-4">
            {isFiltered ? (
              <button
                type="button"
                onClick={() => filterByCategory('all')}
                className="px-4 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-serif hover:bg-stone-800 transition cursor-pointer shadow-xs"
              >
                查看全部卷帙
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openEditor()}
                className="px-4 py-1.5 rounded-xl bg-limeBrand hover:bg-limeDark text-white text-xs font-serif font-bold transition cursor-pointer shadow-md shadow-limeBrand/20 flex items-center gap-1.5 active:scale-95"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>✍️ 立即开始第一篇创作</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="nine-cards-container"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 flex-1 min-h-0 content-stretch"
    >
      {articles.map((item, index) => {
        return (
          <article
            key={item.id || item.slug || index}
            id={`nine-card-${index}`}
            onClick={() => handleCardClick(item)}
            className="book-card-spine bg-white rounded-2xl border border-stone-200/90 p-2.5 sm:p-3 h-full flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-200 select-none hover:shadow-md hover:border-limeBrand/50 group"
          >
            {/* 右上角淡彩水印印章 */}
            <div
              className={`absolute -right-3 -top-3 w-16 h-16 pointer-events-none rounded-full ${
                item.dimensionBg || 'bg-stone-100'
              } opacity-20`}
            />

            {/* 卡片上部分：分类徽标、创作时间、题目、摘要 */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-serif font-bold border ${
                    item.dimensionBg || 'bg-stone-100'
                  } ${item.dimensionBorder || 'border-stone-200'} text-stone-700`}
                >
                  {item.dimensionChar} · {item.dimensionQuestion || item.dimensionName}
                </span>
                <span className="text-[10px] font-mono text-stone-400">{item.date_str}</span>
              </div>

              {/* 书籍封面立体感标题 */}
              <h4 className="font-serif font-bold text-xs sm:text-[13px] text-stone-900 group-hover:text-limeDark transition-colors leading-snug mb-1 line-clamp-1">
                {item.title}
              </h4>

              {/* 摘要文字 */}
              <p className="text-[10px] sm:text-[11px] text-stone-500 font-serif leading-relaxed line-clamp-2 mb-1">
                {item.summary}
              </p>
            </div>

            {/* 卡片下部分：装帧页码与翻书按钮 */}
            <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 relative z-10 flex-shrink-0">
              <span className="font-mono text-[10px] text-stone-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-limeBrand" />
                <span>
                  {item.read_time} 分钟 · 约{item.word_count}
                </span>
              </span>
              <span className="text-limeDark font-bold text-[10px] flex items-center gap-1 group-hover:underline">
                <span>翻阅书卷</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
