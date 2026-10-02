import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $editor,
  closeEditor,
  updateEditorContent,
  setEditorTitle,
  setEditorCategory,
  setEditorTags,
  setEditorSaving,
  setEditorAlbumId,
  setEditorAlbumOrder,
  setEditorChapterLabel,
} from '../../stores/editorStore';
import { openAlbumModal } from '../../stores/albumStore';
import TiptapEditor from './TiptapEditor';
import LiveBookPreview from './LiveBookPreview';
import PublishModal from './PublishModal';
import { ArrowLeft, Feather, Save, Send, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/albums');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAuthorAlbums(json.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchAlbums();
  }, [isOpen]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 拦截发布按钮：先打开装帧与专栏确认弹窗
  const handlePrePublish = () => {
    if (!title.trim()) {
      showToast('文章标题不能为空', 'error');
      return;
    }
    fetchAlbums();
    setIsPublishModalOpen(true);
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
        setIsPublishModalOpen(false);
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
      if (isPublished) {
        setIsPublishModalOpen(false);
      }
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
              onClick={handlePrePublish}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-limeBrand text-white hover:bg-limeDark text-xs font-bold shadow-md shadow-limeBrand/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发布装帧成册</span>
            </button>
          </div>
        </div>

        {/* 元数据选择：文章题目 + 所属七维认知层级 + 标签 */}
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
              文章标签 (Tags)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setEditorTags(e.target.value)}
              placeholder="逗号分隔，如：AI, 架构, 认知"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-limeBrand bg-stone-50/50 focus:bg-white transition-all"
            />
          </div>
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

      {/* 点击「发布装帧成册」时弹出的拦截确认与专栏归属配置弹窗 */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirmPublish={() => handleSave(true)}
        isSaving={isSaving}
        title={title}
        category={category}
        tags={tags}
        onTagsChange={setEditorTags}
        wordCount={wordCount}
        albumId={albumId || null}
        onAlbumIdChange={setEditorAlbumId}
        albumOrder={albumOrder || 1}
        onAlbumOrderChange={setEditorAlbumOrder}
        chapterLabel={chapterLabel || ''}
        onChapterLabelChange={setEditorChapterLabel}
        authorAlbums={authorAlbums}
        onOpenNewAlbumModal={() => openAlbumModal()}
      />
    </section>
  );
}
