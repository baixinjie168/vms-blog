import React, { useState } from 'react';
import { MessageSquareQuote, Heart, Edit3, Send } from 'lucide-react';
import type { BookSpread, ReaderComment, PaperTheme } from '../../stores/readerStore';

interface CommentsSidebarProps {
  comments: ReaderComment[];
  currentSpread: BookSpread;
  paperTheme: PaperTheme;
  onSetTheme: (theme: PaperTheme) => void;
  onLikeComment: (id: number) => void;
  onAddComment: (data: { content: string; quote?: string }) => void;
}

export default function CommentsSidebar({
  comments,
  currentSpread,
  paperTheme,
  onSetTheme,
  onLikeComment,
  onAddComment,
}: CommentsSidebarProps) {
  const [commentInput, setCommentInput] = useState('');
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);
  const isInk = paperTheme === 'ink';

  // 快捷引用当前页金句 / 正文划选语句
  const handleInsertQuote = () => {
    // 1. 优先获取用户在正文书页中鼠标或触摸划选的文本
    let selectedText = '';
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      selectedText = selection ? selection.toString().trim() : '';
    }

    if (selectedText) {
      const cleanQuote = selectedText.length > 80 ? `${selectedText.slice(0, 80)}...` : selectedText;
      setCommentInput(`评注引用 “${cleanQuote}”：\n`);
      setQuoteNotice('已提取划选金句');
      setTimeout(() => setQuoteNotice(null), 2500);
      return;
    }

    // 2. 若未划选，尝试提取当前对开页中具有启发性的核心提炼语句
    let fallbackQuote = '';
    if (typeof document !== 'undefined') {
      const leftEl = document.getElementById('content-left');
      const rightEl = document.getElementById('content-right');
      const quoteEl = (leftEl || rightEl)?.querySelector('blockquote, .italic, h3, p');
      if (quoteEl && quoteEl.textContent) {
        const text = quoteEl.textContent.trim().replace(/^“|”$/g, '');
        fallbackQuote = text.length > 60 ? `${text.slice(0, 60)}...` : text;
      }
    }

    if (fallbackQuote) {
      setCommentInput(`评注引用 “${fallbackQuote}”：\n`);
      setQuoteNotice('提示：也可在正文中直接划选任意文字');
      setTimeout(() => setQuoteNotice(null), 3000);
    } else {
      setCommentInput(`评注引用 当前页重点语句：\n`);
      setQuoteNotice('提示：可在正文中直接划选文字');
      setTimeout(() => setQuoteNotice(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentInput.trim();
    if (!trimmed) return;

    let quoteText: string | undefined = undefined;
    let cleanContent = trimmed;

    if (trimmed.startsWith('评注引用')) {
      const parts = trimmed.split('：\n');
      if (parts.length > 1) {
        quoteText = parts[0].replace('评注引用 ', '');
        cleanContent = parts.slice(1).join('：\n').trim();
      }
    }

    onAddComment({
      content: cleanContent,
      quote: quoteText,
    });

    setCommentInput('');
  };

  return (
    <aside
      id="reader-comments-sidebar"
      className={`rounded-2xl border shadow-sm p-3.5 flex flex-col justify-between h-full min-h-0 select-none overflow-hidden transition-colors duration-200 ${
        isInk
          ? 'bg-[#1e2124]/95 border-stone-700/80 text-stone-200'
          : 'bg-white/95 border-stone-200/90 text-stone-800'
      }`}
    >
      {/* 批注头部 + 纸张底色切换 */}
      <div
        className={`flex items-center justify-between pb-2.5 border-b flex-shrink-0 ${
          isInk ? 'border-stone-700/60' : 'border-stone-100'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          <MessageSquareQuote className="w-4 h-4 text-limeBrand" />
          <h3
            className={`font-serif font-bold text-xs tracking-wider ${
              isInk ? 'text-stone-200' : 'text-stone-800'
            }`}
          >
            卷册批注 · 评论
          </h3>
          <span
            id="comments-count-badge"
            className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#70C000]/15 text-[#4E8800] border border-[#70C000]/30 font-mono font-medium"
          >
            {comments.length} 条
          </span>
        </div>

        {/* 纸张底色切换 (微型色块) */}
        <div className="flex items-center space-x-1.5 pl-2">
          <button
            type="button"
            onClick={() => onSetTheme('ivory')}
            className={`w-4 h-4 rounded-full bg-[#FAF7EE] border shadow-2xs hover:scale-110 transition cursor-pointer ${
              paperTheme === 'ivory' ? 'ring-2 ring-limeBrand border-limeBrand scale-110' : 'border-stone-300'
            }`}
            title="牙白纸"
          />
          <button
            type="button"
            onClick={() => onSetTheme('bamboo')}
            className={`w-4 h-4 rounded-full bg-[#EBF1E8] border shadow-2xs hover:scale-110 transition cursor-pointer ${
              paperTheme === 'bamboo' ? 'ring-2 ring-limeBrand border-limeBrand scale-110' : 'border-stone-300'
            }`}
            title="竹青护眼"
          />
          <button
            type="button"
            onClick={() => onSetTheme('ink')}
            className={`w-4 h-4 rounded-full bg-[#242629] border shadow-2xs hover:scale-110 transition cursor-pointer ${
              paperTheme === 'ink' ? 'ring-2 ring-limeBrand border-limeBrand scale-110' : 'border-stone-600'
            }`}
            title="墨黑沉浸"
          />
        </div>
      </div>

      {/* 批注与评论列表 */}
      <div
        id="reader-comments-list"
        className="flex-1 min-h-0 overflow-y-auto hover-scrollbar py-1.5 space-y-2 pr-1"
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center text-xs font-serif text-stone-400 p-4">
            <MessageSquareQuote className="w-8 h-8 text-stone-300 mb-2 stroke-1" />
            <span className={`font-bold ${isInk ? 'text-stone-300' : 'text-stone-600'}`}>暂无卷册批注</span>
            <span className="text-[10px] text-stone-400 mt-1 max-w-[180px] leading-relaxed">
              可在正文中划选语句后点击“引用金句”，或直接在下方写下第一条研读心得
            </span>
          </div>
        ) : (
          comments.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isInk
                  ? 'bg-stone-800/80 hover:bg-stone-800 border-stone-700/70'
                  : 'bg-stone-50/80 hover:bg-stone-100/70 border-stone-200/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-4 h-4 rounded-full ${item.avatarBg} text-white flex items-center justify-center text-[8px] font-bold`}
                  >
                    {item.avatarChar}
                  </span>
                  <span
                    className={`font-serif font-bold text-[11px] ${
                      isInk ? 'text-stone-200' : 'text-stone-800'
                    }`}
                  >
                    {item.user}
                  </span>
                  {item.isAuthor && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-limeBrand text-white font-sans font-bold">
                      作者
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-stone-400">
                  {item.page} · {item.time}
                </span>
              </div>

              {/* 引述正文金句 */}
              {item.quote && (
                <div
                  className={`text-[10px] border-l-2 border-limeBrand px-2 py-1 rounded-r my-1 italic line-clamp-2 ${
                    isInk ? 'bg-stone-900/80 text-stone-400' : 'bg-white/80 text-stone-500'
                  }`}
                >
                  {item.quote}
                </div>
              )}

              <p
                className={`leading-relaxed font-serif text-[11px] my-1 ${
                  isInk ? 'text-stone-300' : 'text-stone-700'
                }`}
              >
                {item.content}
              </p>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onLikeComment(item.id)}
                  className={`inline-flex items-center gap-1 text-[10px] transition cursor-pointer ${
                    item.liked
                      ? 'text-limeDark font-bold'
                      : isInk
                      ? 'text-stone-500 hover:text-stone-300'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <Heart
                    className={`w-3 h-3 ${item.liked ? 'fill-limeBrand text-limeBrand' : ''}`}
                  />
                  <span>{item.likes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 发表批注 / 评论表单 */}
      <form
        onSubmit={handleSubmit}
        className={`pt-2 border-t flex-shrink-0 space-y-1.5 ${
          isInk ? 'border-stone-700/60' : 'border-stone-100'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] text-stone-400 font-serif">
          <span className="flex items-center gap-1">
            <Edit3 className="w-3 h-3 text-limeBrand" />
            <span>
              批注当前：
              <span
                id="comment-current-spread"
                className={`font-mono font-bold ${isInk ? 'text-stone-300' : 'text-stone-700'}`}
              >
                第 {currentSpread.leftPageNum}-{currentSpread.rightPageNum} 页
              </span>
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            {quoteNotice && (
              <span className="text-[9px] text-limeDark font-medium animate-pulse font-serif">
                {quoteNotice}
              </span>
            )}
            <button
              type="button"
              onClick={handleInsertQuote}
              className="text-limeDark text-[10px] hover:underline cursor-pointer font-medium"
              title="在正文中划选文字后点击可直接引用"
            >
              引用金句
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="写下您的心得评注或批注..."
            className={`w-full text-xs p-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-limeBrand resize-none font-serif leading-relaxed ${
              isInk
                ? 'bg-stone-800/60 focus:bg-stone-800 border-stone-700 text-stone-200 placeholder-stone-500'
                : 'bg-stone-50/60 focus:bg-white border-stone-200 text-stone-800 placeholder-stone-400'
            }`}
          />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center space-x-1 text-[10px] text-stone-400 font-serif">
            <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[8px] font-bold">
              墨
            </span>
            <span className={`font-medium ${isInk ? 'text-stone-300' : 'text-stone-600'}`}>
              墨客读者
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-limeBrand text-white hover:bg-limeDark text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>发表批注</span>
          </button>
        </div>
      </form>
    </aside>
  );
}
