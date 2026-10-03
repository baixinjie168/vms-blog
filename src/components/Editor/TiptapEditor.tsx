import React, { useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { PageBreak } from './PageBreakExtension';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Minus,
  Image as ImageIcon,
  BookOpen,
  Check,
} from 'lucide-react';

interface TiptapEditorProps {
  initialContent: string;
  onContentChange: (html: string) => void;
  wordCount: number;
}

export default function TiptapEditor({
  initialContent,
  onContentChange,
  wordCount,
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          levels: [2, 3, 4],
        },
      }),
      PageBreak,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: '在此书写 Markdown / 富文本内容，支持直接拖入/粘贴截图...',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-stone max-w-none focus:outline-none min-h-[420px] p-4 text-xs sm:text-sm leading-relaxed font-serif text-stone-800 selection:bg-limeBrand selection:text-white',
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

  if (!editor) {
    return (
      <div className="flex-1 p-8 text-center text-xs text-stone-400 font-serif">
        正在装载排版编辑器...
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-300 shadow-sm overflow-hidden h-full">
      {/* 快捷排版工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-50/90 border-b border-stone-200 text-stone-600 text-xs flex-shrink-0 select-none">
        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('bold') ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="加粗 (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('italic') ? 'bg-stone-200 text-stone-900 italic' : ''
            }`}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('heading', { level: 2 }) ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="二级标题 (##)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('heading', { level: 3 }) ? 'bg-stone-200 text-stone-900 font-bold' : ''
            }`}
            title="三级标题 (###)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('blockquote') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="引用金句 (>)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('codeBlock') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="代码块 (```)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('bulletList') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="无序列表 (-)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition ${
              editor.isActive('orderedList') ? 'bg-stone-200 text-stone-900' : ''
            }`}
            title="有序列表 (1.)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-stone-200 transition"
            title="分割线 (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
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
            className="p-1.5 rounded hover:bg-stone-200 text-limeDark hover:text-limeDark transition flex items-center gap-1 text-[11px] font-serif font-bold"
            title="手动插入装帧分页符（带页码分界线）"
          >
            <BookOpen className="w-3.5 h-3.5 text-limeBrand" />
            <span>装帧分页</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-stone-200 transition flex items-center gap-1 text-[11px]"
            title="上传并插入图片至 R2"
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
        </div>

        {/* 字数与渲染状态 */}
        <div className="flex items-center space-x-2.5 text-stone-400 font-mono text-[11px] flex-shrink-0">
          <span id="editor-word-count">字数: {wordCount}</span>
          <span className="text-emerald-600 flex items-center gap-1 font-medium">
            <Check className="w-3 h-3" />
            <span>实时切片</span>
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
