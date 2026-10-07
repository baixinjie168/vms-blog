import { atom, map } from 'nanostores';
import type { ArticleItem } from '../services/blogService';
import { paginateHtmlContent, type ReaderFontSize, type TableDensity } from '../utils/paginationEngine';
import { countPlainChars } from '../utils/textStats';
import type { BookSpread } from './readerStore';

export interface EditorState {
  isOpen: boolean;
  articleId: number | null;
  title: string;
  category: string;
  tags: string;
  date: string;
  content: string;
  isSaving: boolean;
  isPublished: boolean;
  previewSpreads: BookSpread[];
  previewFontSize: ReaderFontSize;
  previewTableDensity: TableDensity;
  totalPages: number;
  totalSpreads: number;
  wordCount: number;
  albumId?: string | null;
  albumOrder?: number;
  chapterLabel?: string;
}

const todayStr = new Date().toISOString().slice(0, 10);
const emptyPagination = paginateHtmlContent('');

export const initialEditorState: EditorState = {
  isOpen: false,
  articleId: null,
  title: '',
  category: '道',
  tags: '',
  date: todayStr,
  content: '',
  isSaving: false,
  isPublished: false,
  previewSpreads: emptyPagination.spreads,
  previewFontSize: 'normal',
  previewTableDensity: 'normal',
  totalPages: emptyPagination.totalPages,
  totalSpreads: emptyPagination.totalSpreads,
  wordCount: 0,
  albumId: null,
  albumOrder: 1,
  chapterLabel: '',
};

export const $editor = map<EditorState>(initialEditorState);

// 打开写作编辑器
export async function openEditor(article?: ArticleItem) {
  const currentToday = new Date().toISOString().slice(0, 10);
  if (article) {
    let fullArticle = article;
    if (!fullArticle.content && fullArticle.slug) {
      try {
        const res = await fetch(`/api/articles?slug=${fullArticle.slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.article) {
            fullArticle = { ...fullArticle, ...json.article };
          }
        }
      } catch (e) {
        console.warn('Failed to fetch full article for editor:', e);
      }
    }
    const content = fullArticle.content || `<p>${fullArticle.summary || ''}</p>`;
    const { previewFontSize, previewTableDensity } = $editor.get();
    const pagination = paginateHtmlContent(content, {
      fontSize: previewFontSize,
      tableDensity: previewTableDensity,
    });
    $editor.set({
      isOpen: true,
      articleId: fullArticle.id,
      title: fullArticle.title,
      category: fullArticle.dimensionChar || '道',
      tags: fullArticle.tags || '',
      date: fullArticle.date_str || currentToday,
      content,
      isSaving: false,
      isPublished: true,
      previewSpreads: pagination.spreads,
      previewFontSize,
      previewTableDensity,
      totalPages: pagination.totalPages,
      totalSpreads: pagination.totalSpreads,
      wordCount: countPlainChars(content),
      albumId: fullArticle.album_id || null,
      albumOrder: fullArticle.album_order || 1,
      chapterLabel: fullArticle.chapter_label || '',
    });
  } else {
    const { previewFontSize, previewTableDensity } = $editor.get();
    const freshPagination = paginateHtmlContent('', {
      fontSize: previewFontSize,
      tableDensity: previewTableDensity,
    });
    $editor.set({
      isOpen: true,
      articleId: null,
      title: '',
      category: '道',
      tags: '',
      date: currentToday,
      content: '',
      isSaving: false,
      isPublished: false,
      previewSpreads: freshPagination.spreads,
      previewFontSize,
      previewTableDensity,
      totalPages: freshPagination.totalPages,
      totalSpreads: freshPagination.totalSpreads,
      wordCount: 0,
      albumId: null,
      albumOrder: 1,
      chapterLabel: '',
    });
  }

  if (typeof window !== 'undefined') {
    const homeEl = document.getElementById('view-home');
    if (homeEl) homeEl.classList.add('hidden');
    const readerEl = document.getElementById('view-reader');
    if (readerEl) readerEl.classList.add('hidden');
    const editorEl = document.getElementById('view-editor');
    if (editorEl) editorEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 关闭编辑器返回主页
export function closeEditor() {
  $editor.setKey('isOpen', false);

  if (typeof window !== 'undefined') {
    const editorEl = document.getElementById('view-editor');
    if (editorEl) editorEl.classList.add('hidden');
    const readerEl = document.getElementById('view-reader');
    if (readerEl) readerEl.classList.add('hidden');
    const homeEl = document.getElementById('view-home');
    if (homeEl) homeEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 实时更新正文内容
export function updateEditorContent(newContent: string) {
  const { previewFontSize, previewTableDensity } = $editor.get();
  const pagination = paginateHtmlContent(newContent, {
    fontSize: previewFontSize,
    tableDensity: previewTableDensity,
  });
  const textChars = countPlainChars(newContent);

  $editor.setKey('content', newContent);
  $editor.setKey('previewSpreads', pagination.spreads);
  $editor.setKey('totalPages', pagination.totalPages);
  $editor.setKey('totalSpreads', pagination.totalSpreads);
  $editor.setKey('wordCount', textChars);
}

// 切换编辑期预览字号大小
export function setEditorPreviewFontSize(fontSize: ReaderFontSize) {
  $editor.setKey('previewFontSize', fontSize);
  const { content, previewTableDensity } = $editor.get();
  const pagination = paginateHtmlContent(content, {
    fontSize,
    tableDensity: previewTableDensity,
  });
  $editor.setKey('previewSpreads', pagination.spreads);
  $editor.setKey('totalPages', pagination.totalPages);
  $editor.setKey('totalSpreads', pagination.totalSpreads);
}

// 切换编辑期预览表格行高密度
export function setEditorPreviewTableDensity(tableDensity: TableDensity) {
  $editor.setKey('previewTableDensity', tableDensity);
  const { content, previewFontSize } = $editor.get();
  const pagination = paginateHtmlContent(content, {
    fontSize: previewFontSize,
    tableDensity,
  });
  $editor.setKey('previewSpreads', pagination.spreads);
  $editor.setKey('totalPages', pagination.totalPages);
  $editor.setKey('totalSpreads', pagination.totalSpreads);
}

// 更新元数据字段
export function setEditorTitle(title: string) {
  $editor.setKey('title', title);
}

export function setEditorCategory(cat: string) {
  $editor.setKey('category', cat);
}

export function setEditorTags(tags: string) {
  $editor.setKey('tags', tags);
}

export function setEditorDate(date: string) {
  $editor.setKey('date', date);
}

export function setEditorSaving(isSaving: boolean) {
  $editor.setKey('isSaving', isSaving);
}

export function setEditorAlbumId(albumId: string | null) {
  $editor.setKey('albumId', albumId);
}

export function setEditorAlbumOrder(order: number) {
  $editor.setKey('albumOrder', order);
}

export function setEditorChapterLabel(label: string) {
  $editor.setKey('chapterLabel', label);
}

