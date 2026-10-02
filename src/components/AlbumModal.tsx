import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $isAlbumModalOpen,
  $editingAlbum,
  closeAlbumModal
} from '../stores/albumStore';
import {
  Layers,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Search
} from 'lucide-react';

interface AuthorArticleOption {
  id: number;
  title: string;
  dimension: string;
  album_id: string | null;
  album_title?: string | null;
}

export default function AlbumModal() {
  const isOpen = useStore($isAlbumModalOpen);
  const editingAlbum = useStore($editingAlbum);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('术');
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [availableArticles, setAvailableArticles] = useState<AuthorArticleOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 模态框打开时初始化数据
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setCategory('术');
      setSelectedArticleIds([]);
      setSearchQuery('');
      setErrorMsg('');
      setSuccessMsg('');
      return;
    }

    if (editingAlbum) {
      setTitle(editingAlbum.title || '');
      setDescription(editingAlbum.description || '');
      setCategory(editingAlbum.category || '术');
    }

    // 获取作者的所有已有文章列表供勾选
    const fetchAuthorArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/articles?allAuthor=true');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAvailableArticles(json.data);

          if (editingAlbum) {
            // 如果是编辑模式，初始化已收录在当前专辑中的文章 ID
            const currentAlbumArtIds = json.data
              .filter((a: any) => a.album_id === editingAlbum.id)
              .sort((a: any, b: any) => (a.album_order || 1) - (b.album_order || 1))
              .map((a: any) => a.id);
            setSelectedArticleIds(currentAlbumArtIds);
          }
        }
      } catch (err) {
        console.error('Failed to load author articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorArticles();
  }, [isOpen, editingAlbum]);

  if (!isOpen) return null;

  // 切换文章选中状态
  const toggleArticleSelection = (id: number) => {
    setSelectedArticleIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 上移文章序号
  const moveArticleUp = (index: number) => {
    if (index <= 0) return;
    setSelectedArticleIds((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // 下移文章序号
  const moveArticleDown = (index: number) => {
    if (index >= selectedArticleIds.length - 1) return;
    setSelectedArticleIds((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // 移除选中的文章
  const removeSelectedArticle = (id: number) => {
    setSelectedArticleIds((prev) => prev.filter((item) => item !== id));
  };

  // 提交新建或保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('请输入专栏专辑名称');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const isEdit = Boolean(editingAlbum?.id);
      const url = '/api/albums';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        id: editingAlbum?.id,
        title: title.trim(),
        description: description.trim(),
        category,
        articleIds: selectedArticleIds,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '保存专辑失败');
      }

      setSuccessMsg(isEdit ? '专栏专辑已更新装帧' : '🎉 新专栏专辑已成功创立装帧成册！');
      setTimeout(() => {
        closeAlbumModal();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || '操作异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 解散专辑
  const handleDeleteAlbum = async () => {
    if (!editingAlbum?.id) return;
    const confirm = window.confirm(`确定要解散专栏专辑《${editingAlbum.title}》吗？\n（所属文章将自动保留在个人独立书箧中，不会被删除）`);
    if (!confirm) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/albums?id=${editingAlbum.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '解散专辑失败');

      setSuccessMsg('专栏专辑已安全解散');
      setTimeout(() => {
        closeAlbumModal();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || '删除失败');
      setSubmitting(false);
    }
  };

  // 过滤后的可选文章列表
  const filteredAvailableArticles = availableArticles.filter((art) => {
    if (!searchQuery.trim()) return true;
    return art.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-[#FAF7EE] w-full max-w-2xl rounded-2xl border border-[#E5E0D0] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* 头部标题 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 bg-white/70 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-limeLight text-limeDark flex items-center justify-center border border-limeBrand/30">
              <Layers className="w-4 h-4 text-limeBrand" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
                {editingAlbum ? '编排修改专栏专辑' : '新建专栏专辑 · 归纳长卷'}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-serif text-stone-500">
                提炼知识主脉络，汇编已有卷帙，赋予章节先后承接秩序
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAlbumModal}
            className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 消息提示 */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-serif flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-serif flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 表单内容区 */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {/* 1. 专辑标题与所属认知维度 */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
                专辑专栏名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：Qlib 量化投研全栈实战 / 大模型 Agent 架构实践"
                maxLength={40}
                required
                className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-limeBrand focus:ring-1 focus:ring-limeBrand font-serif font-bold text-stone-900"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
                所属认知层级
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-limeBrand focus:ring-1 focus:ring-limeBrand font-serif font-bold text-stone-800"
              >
                <option value="道">道 · 世界观/意义</option>
                <option value="心">心 · 认知/人格</option>
                <option value="法">法 · 方法/原则</option>
                <option value="术">术 · 专业/工程</option>
                <option value="器">器 · 工具/AI装备</option>
                <option value="事">事 · 事业/作品</option>
                <option value="势">势 · 周期/借势</option>
              </select>
            </div>
          </div>

          {/* 2. 专辑简要导言 */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
              专辑简要说明与导读 <span className="text-stone-400 font-normal">(用于专栏流导读与卷首卷语)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="简述本专辑的核心思考脉络、解决的深层命题与适读对象..."
              maxLength={240}
              className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-limeBrand focus:ring-1 focus:ring-limeBrand font-serif leading-relaxed text-stone-700 resize-none"
            />
          </div>

          {/* 3. 勾选已有文章归入专辑 */}
          <div className="border border-stone-200 bg-white/70 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-limeBrand" />
                  <span>选择收录已有文章</span>
                  <span className="text-[11px] font-normal text-stone-500">
                    （已选中 <strong className="font-mono text-limeDark">{selectedArticleIds.length}</strong> 篇）
                  </span>
                </h4>
              </div>

              {/* 搜索框 */}
              <div className="relative w-40 sm:w-48">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索您的文章..."
                  className="w-full bg-white text-[11px] pl-6 pr-2 py-1 rounded-lg border border-stone-200 focus:outline-none focus:border-limeBrand"
                />
                <Search className="w-3 h-3 text-stone-400 absolute left-2 top-2" />
              </div>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-stone-400 font-serif flex items-center justify-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-limeBrand" />
                <span>正在探寻您的文章书库...</span>
              </div>
            ) : availableArticles.length === 0 ? (
              <div className="py-5 text-center text-xs text-stone-400 font-serif">
                暂无已发表文章。您可先创立专辑骨架，稍后在撰写文章时直接选择本专辑。
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 hover-scrollbar">
                {filteredAvailableArticles.map((art) => {
                  const isChecked = selectedArticleIds.includes(art.id);
                  const isOtherAlbum = Boolean(art.album_id && art.album_id !== editingAlbum?.id);

                  return (
                    <label
                      key={art.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-limeLight/40 border-limeBrand/50 font-bold text-stone-900'
                          : 'bg-white border-stone-200/80 text-stone-700 hover:border-limeBrand/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleArticleSelection(art.id)}
                          className="rounded text-limeBrand focus:ring-limeBrand cursor-pointer"
                        />
                        <span className="truncate">{art.title}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {isOtherAlbum && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            原属: {art.album_title || '其他专栏'}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-stone-400">
                          ID: {art.id}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. 专栏内章节先后顺序编排 */}
          {selectedArticleIds.length > 0 && (
            <div className="border border-limeBrand/30 bg-limeLight/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-serif font-bold text-limeDark flex items-center gap-1.5">
                  <span>专栏章节先后顺序编排（从第 1 讲到第 {selectedArticleIds.length} 讲循序渐进）</span>
                </h4>
                <span className="text-[10px] text-stone-500 font-serif">
                  点击右侧上下箭头调整先后次序
                </span>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 hover-scrollbar">
                {selectedArticleIds.map((artId, index) => {
                  const art = availableArticles.find((a) => a.id === artId);
                  const isFirst = index === 0;
                  const isLast = index === selectedArticleIds.length - 1;

                  return (
                    <div
                      key={artId}
                      className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-limeBrand/30 text-xs shadow-2xs font-serif"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                        <span className="px-1.5 py-0.5 rounded bg-limeBrand text-white text-[10px] font-mono font-bold flex-shrink-0">
                          第 {index + 1} 讲
                        </span>
                        <span className="truncate font-bold text-stone-800 text-[11px]">
                          {art ? art.title : `文章 #${artId}`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveArticleUp(index)}
                          disabled={isFirst}
                          title="上移此讲"
                          className="p-1 rounded hover:bg-stone-100 text-stone-500 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveArticleDown(index)}
                          disabled={isLast}
                          title="下移此讲"
                          className="p-1 rounded hover:bg-stone-100 text-stone-500 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSelectedArticle(artId)}
                          title="从专辑移出"
                          className="p-1 rounded hover:bg-rose-50 text-rose-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* 底部按钮区 */}
        <div className="px-5 py-3 border-t border-stone-200/80 bg-white/70 flex items-center justify-between flex-shrink-0">
          <div>
            {editingAlbum?.id && (
              <button
                type="button"
                onClick={handleDeleteAlbum}
                disabled={submitting}
                className="text-xs text-rose-600 hover:text-rose-800 font-serif font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>解散本专栏</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={closeAlbumModal}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-600 hover:bg-stone-100 font-serif transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !title.trim()}
              className="px-4 py-1.5 rounded-xl bg-limeBrand hover:bg-limeDark text-white text-xs font-serif font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在装帧保存...</span>
                </>
              ) : (
                <span>装帧保存专栏专辑 &rarr;</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
