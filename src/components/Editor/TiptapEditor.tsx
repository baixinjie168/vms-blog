import React, { useRef, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from '@tiptap/markdown';
import { PageBreak } from './PageBreakExtension';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  SquareCode,
  List,
  ListOrdered,
  Minus,
  Image as ImageIcon,
  BookOpen,
  Check,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  Table as TableIcon,
  Trash,
} from 'lucide-react';

interface TiptapEditorProps {
  initialContent: string;
  onContentChange: (html: string) => void;
  wordCount: number;
}

/** GFM 表格分隔行，如 |---|:--:|---| */
const MARKDOWN_TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

/**
 * 判定粘贴内容是否为 Markdown 管道表格。
 * 以「分隔行」为触发条件——它几乎不可能出现在普通文本里，
 * 因此不必担心随手粘贴的散文被当成 markdown 解析。
 * 分隔行还必须含竖线：单独的 `---` 是分割线，不是单列表格。
 */
function looksLikeMarkdownTable(text: string): boolean {
  const lines = text.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].includes('|')) continue;
    if (!MARKDOWN_TABLE_DELIMITER.test(lines[i])) continue;
    if (lines[i - 1].includes('|')) return true; // 上一行须是表头
  }
  return false;
}

export default function TiptapEditor({
  initialContent,
  onContentChange,
  wordCount,
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表格插入面板：StarterKit 不含表格、也未装 markdown 扩展，
  // 所以粘贴管道语法不会转成表格——必须由这里提供唯一的插入入口。
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ rows: 0, cols: 0 });
  const tableMenuRef = useRef<HTMLDivElement>(null);

  // 上传图片至 Cloudflare R2 (/api/upload)
  const handleUploadImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '图片上传失败，请确认是否已以博主身份登录');
      }

      return json.url as string;
    } catch (err: any) {
      console.warn('Upload to R2 fallback:', err);
      // 本地无 R2 时降级转为 Base64 或占位图
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        },
      }),
      PageBreak,
      // 表格：StarterKit 刻意不含表格，需显式注册官方扩展（Tiptap 3 已合并为单包）
      TableKit.configure({
        table: { resizable: true },
      }),
      // Markdown 解析器：本身不注册任何输入/粘贴规则，仅让 insertContent/setContent
      // 支持 contentType: 'markdown'（不传该选项时行为与原来完全一致）。
      // 表格扩展自带的 markdownTokenizer 正好由它驱动。
      Markdown,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: '在此书写 Markdown / 富文本内容，支持直接拖入/粘贴截图，选中文字可唤出浮动格式栏...',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'tiptap-content focus:outline-none min-h-[460px] p-5 text-sm sm:text-base leading-relaxed font-serif text-stone-800 selection:bg-limeBrand selection:text-white',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleUploadImage(file).then((url) => {
              if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                handleUploadImage(file).then((url) => {
                  if (url && editor) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                });
                return true;
              }
            }
          }
        }

        // Markdown 管道表格：Tiptap 默认不会把纯文本 markdown 转成节点，
        // 必须显式传 contentType: 'markdown' 才会交给 MarkdownManager 解析。
        // 仅命中表格时拦截，其余纯文本粘贴维持原样。
        const pastedText = event.clipboardData?.getData('text/plain') ?? '';
        if (pastedText && looksLikeMarkdownTable(pastedText) && editor) {
          event.preventDefault();
          editor.chain().focus().insertContent(pastedText, { contentType: 'markdown' }).run();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  // 监听外部内容重置与文章切换
  useEffect(() => {
    if (!editor) return;
    if (initialContent === '' && editor.isEmpty) return;
    if (editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent || '');
    }
  }, [initialContent, editor]);

  // 点击面板外部或按 Esc 关闭表格面板
  useEffect(() => {
    if (!tableMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setTableMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTableMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [tableMenuOpen]);

  // 按网格尺寸插入表格，首行固定为表头
  const insertTable = (rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableMenuOpen(false);
    setHoverGrid({ rows: 0, cols: 0 });
  };

  // 表格增删操作：均依赖光标所在单元格，故不在表格内时统一置灰
  const tableOps = [
    { key: 'row-before', label: '上方插入行', run: () => editor?.chain().focus().addRowBefore().run() },
    { key: 'row-after', label: '下方插入行', run: () => editor?.chain().focus().addRowAfter().run() },
    { key: 'row-delete', label: '删除本行', run: () => editor?.chain().focus().deleteRow().run() },
    { key: 'col-before', label: '左侧插入列', run: () => editor?.chain().focus().addColumnBefore().run() },
    { key: 'col-after', label: '右侧插入列', run: () => editor?.chain().focus().addColumnAfter().run() },
    { key: 'col-delete', label: '删除本列', run: () => editor?.chain().focus().deleteColumn().run() },
    { key: 'merge', label: '合并/拆分', run: () => editor?.chain().focus().mergeOrSplit().run() },
    { key: 'header', label: '切换表头行', run: () => editor?.chain().focus().toggleHeaderRow().run() },
  ];

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const url = await handleUploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('请输入超链接网址 (URL):', previousUrl || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const finalUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  };

  if (!editor) {
    return (
      <div className="flex-1 p-8 text-center text-xs text-stone-400 font-serif">
        正在装载排版编辑器...
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-300 shadow-sm overflow-hidden h-full relative">
      {/* Tiptap 浮动划词气泡工具栏 (Bubble Menu) - onMouseDown 阻止失焦 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 p-1 bg-stone-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-stone-700/60 text-xs z-50 select-none animate-fade-in"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('bold') ? 'bg-limeBrand text-white font-bold' : 'text-stone-300'
            }`}
            title="加粗 (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('italic') ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('underline') ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="下划线 (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('strike') ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="删除线"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('code') ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="行内代码"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-3.5 bg-stone-700 mx-0.5" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-1.5 py-1 rounded-lg hover:bg-stone-800 transition text-[11px] font-bold ${
              editor.isActive('heading', { level: 1 }) ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="一级标题"
          >
            H1
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-1.5 py-1 rounded-lg hover:bg-stone-800 transition text-[11px] font-bold ${
              editor.isActive('heading', { level: 2 }) ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="二级标题"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-1.5 py-1 rounded-lg hover:bg-stone-800 transition text-[11px] font-bold ${
              editor.isActive('heading', { level: 3 }) ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="三级标题"
          >
            H3
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('blockquote') ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="引用金句"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSetLink}
            className={`p-1.5 rounded-lg hover:bg-stone-800 transition ${
              editor.isActive('link') ? 'bg-limeBrand text-white' : 'text-stone-300'
            }`}
            title="插入/修改链接"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* 顶部排版工具栏 - 所有按钮均通过 onMouseDown 阻止选区失焦 */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-50/90 border-b border-stone-200 text-stone-600 text-xs flex-shrink-0 select-none">
        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
          {/* 历史记录：撤销 / 重做 */}
          <button
            type="button"
            disabled={!editor.can().undo()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded hover:bg-stone-200 text-stone-600 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!editor.can().redo()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded hover:bg-stone-200 text-stone-600 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-stone-200 mx-0.5" />

          {/* 标题层级 (H1 / H2 / H3) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('heading', { level: 1 }) ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="一级篇目标题 (#)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('heading', { level: 2 }) ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="二级章节标题 (##)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('heading', { level: 3 }) ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="三级小节标题 (###)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-stone-200 mx-0.5" />

          {/* 行内文字格式 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('bold') ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="加粗 (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('italic') ? 'bg-stone-200 text-stone-900 italic' : ''
            }`}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('underline') ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="下划线 (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('strike') ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="删除线"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('code') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="行内代码 (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-stone-200 mx-0.5" />

          {/* 块级段落元素：引用 / 代码块 / 列表 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('blockquote') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="引用金句 (>)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('codeBlock') ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="代码块 (```)"
          >
            <SquareCode className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('bulletList') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="无序列表 (-)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('orderedList') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="有序列表 (1.)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-stone-200 transition cursor-pointer"
            title="普通分割线 (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* 表格：插入与行列增删（StarterKit 不含表格、也未装 markdown 扩展，此处是唯一入口） */}
          <div className="relative" ref={tableMenuRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTableMenuOpen((open) => !open)}
              className={`p-1.5 rounded hover:bg-stone-200 transition flex items-center gap-1 text-[11px] cursor-pointer ${
                editor.isActive('table') || tableMenuOpen ? 'bg-stone-200 text-stone-900 font-bold' : ''
              }`}
              title="插入表格 / 增删行列"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>表格</span>
            </button>

            {tableMenuOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-xl border border-stone-200 bg-white p-2.5 shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-stone-700">插入表格</span>
                  <span className="font-mono text-[11px] text-limeDark">
                    {hoverGrid.rows > 0 ? `${hoverGrid.rows} × ${hoverGrid.cols}` : '选择行列'}
                  </span>
                </div>

                {/* 尺寸网格：悬停预览，点击即插入 */}
                <div
                  className="grid grid-cols-8 gap-0.5 w-fit mb-2.5"
                  onMouseLeave={() => setHoverGrid({ rows: 0, cols: 0 })}
                >
                  {Array.from({ length: 6 }, (_, r) =>
                    Array.from({ length: 8 }, (_, c) => {
                      const inRange = r < hoverGrid.rows && c < hoverGrid.cols;
                      return (
                        <button
                          key={`${r}-${c}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setHoverGrid({ rows: r + 1, cols: c + 1 })}
                          onClick={() => insertTable(r + 1, c + 1)}
                          className={`w-4 h-4 rounded-[3px] border transition cursor-pointer ${
                            inRange
                              ? 'bg-limeBrand/25 border-limeBrand'
                              : 'bg-stone-50 border-stone-200 hover:border-limeBrand'
                          }`}
                          title={`插入 ${r + 1} 行 × ${c + 1} 列`}
                        />
                      );
                    })
                  )}
                </div>

                <div className="h-px bg-stone-200 mb-2" />

                {/* 增删操作：面板保持开启，便于连续调整 */}
                <div className="grid grid-cols-2 gap-1">
                  {tableOps.map((op) => (
                    <button
                      key={op.key}
                      type="button"
                      disabled={!editor.isActive('table')}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={op.run}
                      className="px-1.5 py-1 rounded-md text-[11px] text-left text-stone-600 hover:bg-stone-100 transition disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-stone-200 my-2" />

                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setTableMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[11px] text-cinnabar hover:bg-red-50 transition disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>删除整个表格</span>
                </button>
              </div>
            )}
          </div>

          <span className="w-px h-4 bg-stone-200 mx-0.5" />

          {/* 链接管理 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSetLink}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive('link') ? 'bg-stone-200 text-limeDark font-bold' : ''
            }`}
            title="插入/修改超链接"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              title="清除超链接"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 装帧分页 (专属动态页码横线) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertContent([
                  { type: 'pageBreak' },
                  { type: 'paragraph' },
                ])
                .run();
            }}
            className="p-1.5 rounded hover:bg-stone-200 text-limeDark hover:text-limeDark transition flex items-center gap-1 text-[11px] font-serif font-bold cursor-pointer"
            title="手动插入装帧分页符（带页码分界线）"
          >
            <BookOpen className="w-3.5 h-3.5 text-limeBrand" />
            <span>装帧分页</span>
          </button>

          {/* 传图至 Cloudflare R2 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-stone-200 transition flex items-center gap-1 text-[11px] cursor-pointer"
            title="上传并插入图片至 Cloudflare R2"
          >
            <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
            <span>传图</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileInputChange}
          />

          {/* 清除格式 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            title="清除所选区域格式"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 字数与引擎状态 */}
        <div className="flex items-center space-x-2.5 text-stone-400 font-mono text-[11px] flex-shrink-0">
          <span id="editor-word-count">字数: {wordCount}</span>
          <span className="text-limeDark bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium text-[10px]">
            <Check className="w-3 h-3 text-limeBrand" />
            <span>Tiptap 引擎</span>
          </span>
        </div>
      </div>

      {/* 富文本编辑区 */}
      <div className="flex-1 overflow-y-auto hover-scrollbar bg-stone-50/20">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
