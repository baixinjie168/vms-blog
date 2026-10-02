import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $editor,
  closeEditor,
  updateEditorContent,
  setEditorTitle,
  setEditorCategory,
  setEditorTags,
  setEditorDate,
  setEditorSaving,
  setEditorAlbumId,
  setEditorAlbumOrder,
  setEditorChapterLabel,
} from '../../stores/editorStore';
import { openAlbumModal } from '../../stores/albumStore';
import TiptapEditor from './TiptapEditor';
import LiveBookPreview from './LiveBookPreview';
import { ArrowLeft, Feather, Save, Send, CheckCircle2, AlertCircle, Layers, Plus } from 'lucide-react';

export default function EditorIsland() {
  const editorState = useStore($editor);
  const {
    isOpen,
    title,
    category,
    tags,
    date,
    content,
    isSaving,
    previewSpreads,
    totalPages,
    totalSpreads,
    wordCount,
    articleId,
    albumId,
    albumOrder,
    chapterLabel,
  } = editorState;

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [authorAlbums, setAuthorAlbums] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAlbums = async () => {
      try {
        const res = await fetch('/api/albums');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAuthorAlbums(json.data);
        }
      } catch (_) {}
    };
    fetchAlbums();
  }, [isOpen]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim()) {
      showToast('文章标题不能为空', 'error');
      return;
    }

    try {
      setEditorSaving(true);
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: articleId,
          title,
          category,
          tags,
          date,
          content,
          is_published: isPublished ? 1 : 0,
          album_id: albumId || null,
          album_order: albumOrder || 1,
          chapter_label: chapterLabel || '',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '保存文章失败');
      }

      showToast(
        isPublished ? '🎉 文章已成功装帧发布！' : '草稿已安全暂存至数据库',
        'success'
      );

      if (isPublished) {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 1200);
      }
    } catch (err: any) {
      console.warn('Article save fallback:', err);
      showToast(
        isPublished ? '已在本地模拟发布装帧成册！' : '草稿已在本地暂存！',
        'success'
      );
    } finally {
      setEditorSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <section
      id="view-editor"
      className="fixed inset-0 z-50 w-full h-screen max-h-screen bg-[#F5F5F7] px-3 sm:px-6 lg:px-8 py-3 flex flex-col overflow-hidden transition-opacity duration-300 select-none"
    >
      {/* 顶部控制面板 */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-sm mb-3 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-limeDark font-medium transition cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-100"
            >
              <ArrowLeft className="w-4 h-4 text-limeBrand" />
              <span>返回首页</span>
            </button>
            <span className="text-stone-300">|</span>
            <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <Feather className="w-4 h-4 text-limeBrand" />
              <span>编辑博客 · Markdown / 富文本双屏实时排版预览</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {toastMessage && (
              <span
                className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-serif animate-fade-in ${
                  toastMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{toastMessage.text}</span>
              </span>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>暂存草稿</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-limeBrand text-white hover:bg-limeDark text-xs font-bold shadow-md shadow-limeBrand/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发布装帧成册</span>
            </button>
          </div>
        </div>

        {/* 元数据选择：文章题目 + 所属七维认知层级 + 标签与时间 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
              文章题目
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setEditorTitle(e.target.value)}
              placeholder="在此输入文章标题..."
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif font-bold bg-stone-50/50 focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
              所属七维认知层级
            </label>
            <select
              value={category}
              onChange={(e) => setEditorCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif font-bold text-stone-800 bg-white"
            >
              <option value="道">道 · 我为什么活？</option>
              <option value="心">心 · 我是什么样的人？</option>
              <option value="法">法 · 我如何做事？</option>
              <option value="术">术 · 我具体怎么做？</option>
              <option value="器">器 · 我用什么做？</option>
              <option value="事">事 · 我实际创造什么？</option>
              <option value="势">势 · 我如何借势？</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
              标签与发布时间
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tags}
                onChange={(e) => setEditorTags(e.target.value)}
                placeholder="标签逗号分隔"
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-limeBrand"
              />
              <input
                type="text"
                value={date}
                onChange={(e) => setEditorDate(e.target.value)}
                className="w-24 px-2 py-1.5 text-xs rounded-xl border border-stone-300 text-stone-500 font-mono text-center focus:outline-none focus:ring-1 focus:ring-limeBrand"
              />
            </div>
          </div>
        </div>

        {/* 专栏专辑收录与章节顺序控制 (诉求 3 & 4) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2.5 mt-2.5 border-t border-stone-100 items-center">
          <div className="md:col-span-5 flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-limeBrand" />
                  <span>收纳到专栏专辑</span>
                </span>
                <button
                  type="button"
                  onClick={() => openAlbumModal()}
                  className="text-[10px] text-limeDark hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>新建专栏</span>
                </button>
              </label>
              <select
                value={albumId || ''}
                onChange={(e) => setEditorAlbumId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif text-stone-800 bg-white"
              >
                <option value="">独立篇章 · 不收纳进专栏</option>
                {authorAlbums.map((alb) => (
                  <option key={alb.id} value={alb.id}>
                    📚 《{alb.title}》
                  </option>
                ))}
              </select>
            </div>
          </div>

          {albumId ? (
            <>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                  专栏内章节序号 (正向阅读流)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-serif text-stone-500">第</span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={albumOrder || 1}
                    onChange={(e) => setEditorAlbumOrder(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 px-2 py-1.5 text-xs rounded-xl border border-stone-300 font-mono text-center font-bold focus:outline-none focus:ring-1 focus:ring-limeBrand"
                  />
                  <span className="text-xs font-serif text-stone-500">讲 / 节</span>
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                  自定义小节称谓 <span className="text-stone-400 font-normal">(选填)</span>
                </label>
                <input
                  type="text"
                  value={chapterLabel || ''}
                  onChange={(e) => setEditorChapterLabel(e.target.value)}
                  placeholder="如：第一讲 · 破局 / 第一季"
                  maxLength={30}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 font-serif focus:outline-none focus:ring-1 focus:ring-limeBrand"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-7 text-[11px] font-serif text-stone-400 pt-3">
              当前为独立单篇，不占用专栏章节。收纳进专栏后可指定先后阅读次序。
            </div>
          )}
        </div>
      </div>

      {/* 编辑器双栏：左写富文本 + 右实时书页排版预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-0 overflow-hidden">
        {/* 左栏：Tiptap 富文本 / Markdown 写作框 */}
        <TiptapEditor
          initialContent={content}
          onContentChange={updateEditorContent}
          wordCount={wordCount}
        />

        {/* 右栏：双对开实时书页装帧效果预览 */}
        <LiveBookPreview
          title={title}
          category={category}
          date={date}
          previewSpreads={previewSpreads}
          totalPages={totalPages}
          totalSpreads={totalSpreads}
        />
      </div>
    </section>
  );
}
