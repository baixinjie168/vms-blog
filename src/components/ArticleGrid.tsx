import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { BookOpen, ArrowRight, PenSquare, Edit3, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { $filter, filterByCategory } from '../stores/filterStore';
import { openBookReader } from '../stores/readerStore';
import { openEditor } from '../stores/editorStore';
import { $currentUser } from '../stores/authStore';
import type { ArticleItem } from '../services/blogService';

interface ArticleGridProps {
  articles: ArticleItem[];
  loading?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onOpenArticle?: (article: ArticleItem) => void;
  onArticleDeleted?: (articleId: number | string) => void;
}

export default function ArticleGrid({
  articles = [],
  loading = false,
  currentUserId,
  isAdmin = false,
  onOpenArticle,
  onArticleDeleted,
}: ArticleGridProps) {
  const filter = useStore($filter);
  const currentUser = useStore($currentUser);
  const activeUserId = currentUserId || currentUser?.id;
  const isSuperAdmin = isAdmin || currentUser?.role === 'admin';

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (article: ArticleItem) => {
    const ok = window.confirm(`确定要将卷帙《${article.title}》从书箧中抹除吗？\n此操作不可逆。`);
    if (!ok) return;

    try {
      setDeletingId(article.id);
      const res = await fetch(`/api/articles?id=${article.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        // 若服务端返回 404 或已删除，同步从视图移除并平滑刷新
        if (res.status === 404 || json.error?.includes('不存在') || json.error?.includes('已删除')) {
          showToast(json.error || '文章已从书箧中抹除', 'success');
          if (onArticleDeleted) {
            onArticleDeleted(article.id);
          }
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }, 800);
          return;
        }
        showToast(json.error || '删除失败，请稍后重试', 'error');
        return;
      }

      // 1. 弹出成功提示
      showToast(`🎉 卷帙《${article.title}》已成功抹除`, 'success');

      // 2. 毫秒级即时从当前卡片列表移除
      if (onArticleDeleted) {
        onArticleDeleted(article.id);
      }

      // 3. 延迟 700ms 刷新页面，同步左栏七维认知数、右栏专辑文章数、个人名片统计与日历打点
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 700);
    } catch (err: any) {
      showToast(err?.message || '网络异常，删除失败', 'error');
    } finally {
      setDeletingId(null);
    }
  };

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

  const renderToast = () => {
    if (!toastMessage) return null;
    const isSuccess = toastMessage.type === 'success';
    return (
      <div
        className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-serif backdrop-blur-md transition-all select-none duration-200 animate-in fade-in slide-in-from-top-2 ${
          isSuccess
            ? 'bg-stone-900/95 border-emerald-500/40 text-white'
            : 'bg-stone-900/95 border-rose-500/40 text-white'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        )}
        <span>{toastMessage.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        {renderToast()}
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
      </>
    );
  }

  if (articles.length === 0) {
    const isFiltered = filter.mode !== 'all' && (filter.category || filter.albumSlug || filter.searchKeyword || filter.date);

    return (
      <>
        {renderToast()}
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
      </>
    );
  }

  return (
    <>
      {renderToast()}
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
              {(() => {
                const canManage = Boolean(
                  activeUserId &&
                  (item.author_id === activeUserId || isSuperAdmin)
                );

                return (
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 专栏内章节序号 (诉求 4) */}
                      {item.album_id && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-limeLight text-limeDark border border-limeBrand/30">
                          {item.chapter_label || `第 ${item.album_order || 1} 讲`}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-serif font-bold border ${
                          item.dimensionBg || 'bg-stone-100'
                        } ${item.dimensionBorder || 'border-stone-200'} text-stone-700`}
                      >
                        {item.dimensionChar} · {item.dimensionQuestion || item.dimensionName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-stone-400">{item.date_str}</span>

                      {/* 作者管理操作组 (诉求 1) */}
                      {canManage && (
                        <div className="flex items-center ml-0.5 space-x-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(item);
                            }}
                            className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-limeDark transition cursor-pointer"
                            title="编辑此篇卷帙"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            className="p-1 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer disabled:opacity-50"
                            title="抹除此篇卷帙"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 书籍封面立体感标题 */}
              <h4 className="font-serif font-bold text-xs sm:text-[13px] text-stone-900 group-hover:text-limeDark transition-colors leading-snug mb-1 line-clamp-1">
                {item.title}
              </h4>

              {/* 摘要文字 */}
              <p className="text-[10px] sm:text-[11px] text-stone-500 font-serif leading-relaxed line-clamp-2 mb-1">
                {item.summary}
              </p>

              {/* 卷帙标签 */}
              {item.tags && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {item.tags
                    .split(/[,，]/)
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((tag, tidx) => (
                      <span
                        key={tidx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100/90 text-stone-600 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              )}
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
    </>
  );
}
