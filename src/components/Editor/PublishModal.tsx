import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Send,
  Layers,
  FileText,
  Plus,
  Tag,
  Hash,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  isSaving: boolean;
  title: string;
  category: string;
  tags: string;
  onTagsChange: (tags: string) => void;
  wordCount: number;
  albumId: string | null;
  onAlbumIdChange: (id: string | null) => void;
  albumOrder: number;
  onAlbumOrderChange: (order: number) => void;
  chapterLabel: string;
  onChapterLabelChange: (label: string) => void;
  authorAlbums: Array<{ id: string; title: string }>;
  onOpenNewAlbumModal: () => void;
}

export default function PublishModal({
  isOpen,
  onClose,
  onConfirmPublish,
  isSaving,
  title,
  category,
  tags,
  onTagsChange,
  wordCount,
  albumId,
  onAlbumIdChange,
  albumOrder,
  onAlbumOrderChange,
  chapterLabel,
  onChapterLabelChange,
  authorAlbums,
  onOpenNewAlbumModal,
}: PublishModalProps) {
  if (!isOpen) return null;

  // 内部临时选中的专栏归属模式: 'none' (独立篇章) | 'album' (归入专栏)
  const [belongsToAlbum, setBelongsToAlbum] = useState<boolean>(Boolean(albumId));

  const handleToggleBelongsToAlbum = (toAlbum: boolean) => {
    setBelongsToAlbum(toAlbum);
    if (!toAlbum) {
      onAlbumIdChange(null);
    } else {
      if (!albumId && authorAlbums.length > 0) {
        onAlbumIdChange(authorAlbums[0].id);
      }
    }
  };

  const parsedTags = tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const estimatedReadTime = Math.max(2, Math.round(wordCount / 400));

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div
        className="bg-white rounded-3xl border border-stone-200/90 shadow-2xl max-w-lg w-full flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-limeLight text-limeDark flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-1.5">
                <span>装帧成册 · 确认公开发布</span>
                <Sparkles className="w-3.5 h-3.5 text-limeBrand" />
              </h3>
              <p className="text-[11px] text-stone-500 font-serif">
                即将公开发布此卷。请确认文章归属与专栏收纳配置：
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 弹窗主体内容滚动区 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 文章预览概要卡片 */}
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 font-bold">
                {category} · 认知体系
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>研读约 {estimatedReadTime} 分钟</span>
                </span>
                <span>·</span>
                <span>约 {wordCount.toLocaleString()} 字</span>
              </div>
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base line-clamp-1 leading-snug">
              《{title || '未命名卷帙'}》
            </h4>
          </div>


          {/* 核心诉求 1：专栏专辑收纳选项 (拦截并确认) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-serif font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-limeBrand" />
                <span>收纳到专栏专辑？</span>
              </span>
              <span className="text-[10px] font-sans text-stone-400 font-normal">
                {belongsToAlbum ? '已选择收纳入专栏' : '独立成卷，不入专栏'}
              </span>
            </label>

            {/* 两种归属模式选择卡片 */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleToggleBelongsToAlbum(false)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  !belongsToAlbum
                    ? 'border-limeBrand bg-limeLight/40 ring-1 ring-limeBrand'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-800">
                    <FileText className={`w-3.5 h-3.5 ${!belongsToAlbum ? 'text-limeDark' : 'text-stone-400'}`} />
                    <span>独立散篇</span>
                  </span>
                  {!belongsToAlbum && <CheckCircle2 className="w-3.5 h-3.5 text-limeBrand" />}
                </div>
                <p className="text-[10px] text-stone-500 font-serif">
                  作为独立文章发布，不收纳入任何专栏系列
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleToggleBelongsToAlbum(true)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  belongsToAlbum
                    ? 'border-limeBrand bg-limeLight/40 ring-1 ring-limeBrand'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-800">
                    <Layers className={`w-3.5 h-3.5 ${belongsToAlbum ? 'text-limeDark' : 'text-stone-400'}`} />
                    <span>归入专栏专辑</span>
                  </span>
                  {belongsToAlbum && <CheckCircle2 className="w-3.5 h-3.5 text-limeBrand" />}
                </div>
                <p className="text-[10px] text-stone-500 font-serif">
                  收录入系统专栏，按章节序列编排阅读
                </p>
              </button>
            </div>

            {/* 当选择归入专栏时展开详细配置 */}
            {belongsToAlbum && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-serif font-bold text-stone-700">
                      选择目标专栏专辑
                    </label>
                    <button
                      type="button"
                      onClick={onOpenNewAlbumModal}
                      className="text-[10px] text-limeDark hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>新建专栏</span>
                    </button>
                  </div>

                  <select
                    value={albumId || ''}
                    onChange={(e) => onAlbumIdChange(e.target.value ? e.target.value : null)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-limeBrand font-serif text-stone-800 bg-white"
                  >
                    <option value="">-- 请选择要收录的专栏专辑 --</option>
                    {authorAlbums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        📚 《{alb.title}》
                      </option>
                    ))}
                  </select>
                  {authorAlbums.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-serif mt-1">
                      ⚠️ 暂无专栏专辑，可点击上方「新建专栏」即刻创建！
                    </p>
                  )}
                </div>

                {albumId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                        章节序号 (阅读流编排)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-serif text-stone-500">第</span>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={albumOrder || 1}
                          onChange={(e) => onAlbumOrderChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-20 px-2 py-1.5 text-xs rounded-xl border border-stone-300 font-mono text-center font-bold focus:outline-none focus:ring-1 focus:ring-limeBrand bg-white"
                        />
                        <span className="text-xs font-serif text-stone-500">讲 / 节</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                        自定义小节称谓 (可选)
                      </label>
                      <input
                        type="text"
                        value={chapterLabel || ''}
                        onChange={(e) => onChapterLabelChange(e.target.value)}
                        placeholder="如: 第一讲·破局 或 第一季"
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 font-serif focus:outline-none focus:ring-1 focus:ring-limeBrand bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 核心诉求 2：标签配置确认 (无需日期) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-serif font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-limeBrand" />
                <span>文章标签 (Tags)</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400">逗号分隔</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="如：AI, 架构思辨, 知识管理, 认知"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-limeBrand bg-stone-50/50 focus:bg-white transition"
            />
            {parsedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parsedTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 text-[10px] font-mono"
                  >
                    <Hash className="w-2.5 h-2.5 text-limeBrand" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 font-serif">
                “为卷帙标记心智关键词，便于读者聚类翻阅检索”
              </p>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="px-5 py-3.5 border-t border-stone-100 flex items-center justify-between bg-stone-50/60 flex-shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            暂缓发布 · 继续修改
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onConfirmPublish}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-limeBrand text-white hover:bg-limeDark text-xs font-bold shadow-md shadow-limeBrand/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSaving ? '装帧入库中...' : '确认装帧 · 正式发布'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
