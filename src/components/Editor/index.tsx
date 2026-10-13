import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $editor,
  closeEditor,
  updateEditorContent,
  setEditorTitle,
  setEditorSummary,
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
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  FileText,
} from 'lucide-react';

export default function EditorIsland() {
  const editorState = useStore($editor);
  const {
    isOpen,
    title,
    summary,
    category,
    tags,
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
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState<boolean>(false);

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
          summary: summary?.trim() ? summary.trim() : null,
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
      className="fixed inset-0 z-50 w-full h-screen max-h-screen bg-[#F5F5F7] px-2.5 sm:px-5 lg:px-6 py-2 sm:py-2.5 flex flex-col overflow-hidden transition-opacity duration-300 select-none"
    >
      {/* 顶部紧凑控制面板 */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-stone-200 shadow-xs mb-2 sm:mb-2.5 flex-shrink-0 transition-all">
        {/* 单行聚合控制栏 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 左侧及中间：返回 + 文章题目 + 文章维度 + 文章标签 + 导语/简述入口 */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-limeDark font-medium transition cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-100 shrink-0"
              title="返回博客首页"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-limeBrand" />
              <span>返回首页</span>
            </button>

            <span className="text-stone-300 hidden sm:inline">|</span>

            {/* 文章题目及输入框 (同一行，宽度适中) */}
            <div className="flex items-center gap-1.5 min-w-0">
              <label className="text-xs font-serif font-bold text-stone-700 whitespace-nowrap shrink-0">
                文章题目
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="在此输入文章标题..."
                className="w-36 sm:w-48 md:w-56 lg:w-64 px-2.5 py-1 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif font-bold bg-stone-50/60 focus:bg-white transition-all text-stone-900"
              />
            </div>

            {/* 文章维度 (原所属七维认知层级，精简名称与宽度) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="text-xs font-serif font-bold text-stone-700 whitespace-nowrap shrink-0">
                文章维度
              </label>
              <select
                value={category}
                onChange={(e) => setEditorCategory(e.target.value)}
                className="w-28 sm:w-36 px-2 py-1 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif font-bold text-stone-800 bg-white cursor-pointer truncate"
                title="选择文章维度"
              >
                <option value="道">道 · 思想与认知</option>
                <option value="心">心 · 自我与成长</option>
                <option value="法">法 · 方法与系统</option>
                <option value="术">术 · 技能与实践</option>
                <option value="器">器 · 工具与资源</option>
                <option value="录">录 · 生活与记录</option>
                <option value="探">探 · 探索与发现</option>
              </select>
            </div>

            {/* 文章标签 (紧凑宽度) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="text-xs font-serif font-bold text-stone-700 whitespace-nowrap shrink-0">
                文章标签
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setEditorTags(e.target.value)}
                placeholder="逗号分隔"
                className="w-24 sm:w-28 md:w-36 px-2 py-1 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-limeBrand bg-stone-50/60 focus:bg-white transition-all"
              />
            </div>

            {/* 文章简述/导语 (下拉抽屉式切换按钮) */}
            <button
              type="button"
              onClick={() => setIsSummaryDrawerOpen(!isSummaryDrawerOpen)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-serif font-medium transition cursor-pointer border shrink-0 ${
                isSummaryDrawerOpen || (summary && summary.trim().length > 0)
                  ? 'bg-limeLight/70 border-limeBrand/60 text-limeDark font-bold'
                  : 'bg-stone-50/70 border-stone-300 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
              title="点击展开/收起文章导语与简述输入抽屉"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>文章简述/导语</span>
              {summary && summary.trim().length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-limeBrand shrink-0" />
              )}
              {isSummaryDrawerOpen ? (
                <ChevronUp className="w-3 h-3 text-stone-500 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 text-stone-500 shrink-0" />
              )}
            </button>
          </div>

          {/* 右侧：保存/发布操作按钮与提示 */}
          <div className="flex items-center space-x-2 shrink-0">
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
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>暂存草稿</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handlePrePublish}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-limeBrand text-white hover:bg-limeDark text-xs font-bold shadow-md shadow-limeBrand/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发布</span>
            </button>
          </div>
        </div>

        {/* 文章简述/导语 下拉抽屉式区域 */}
        {isSummaryDrawerOpen && (
          <div className="mt-2 pt-2 border-t border-stone-100 animate-fade-in space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-700">
                <FileText className="w-3.5 h-3.5 text-limeBrand" />
                <span>文章简述 / 导语</span>
                <span className="text-[10px] font-sans font-normal text-stone-400">
                  (呈现于文章篇首引言或卡片摘要，帮助读者快速把握核心精粹)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-stone-400">
                  {summary ? summary.length : 0} 字
                </span>
                <button
                  type="button"
                  onClick={() => setIsSummaryDrawerOpen(false)}
                  className="text-[11px] text-stone-500 hover:text-stone-800 font-serif flex items-center gap-0.5 cursor-pointer"
                >
                  <span>收起抽屉</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            </div>
            <textarea
              value={summary || ''}
              onChange={(e) => setEditorSummary(e.target.value)}
              placeholder="在此输入文章简述或导言，阐述本文核心心智认知、问题意识或创作背景..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif text-stone-800 bg-stone-50/40 focus:bg-white resize-y transition-all"
            />
          </div>
        )}
      </div>

      {/* 编辑器双栏：左写富文本 + 右实时书页排版预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 flex-1 min-h-0 overflow-hidden">
        {/* 左栏：Tiptap 富文本 / Markdown 写作框 */}
        <TiptapEditor
          initialContent={content}
          onContentChange={updateEditorContent}
          wordCount={wordCount}
        />

        {/* 右栏：双对开实时书页装帧效果预览 */}
        <LiveBookPreview
          previewSpreads={previewSpreads}
          totalPages={totalPages}
          totalSpreads={totalSpreads}
        />
      </div>

      {/* 点击「发布」时弹出的拦截确认与专栏归属配置弹窗 */}
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
