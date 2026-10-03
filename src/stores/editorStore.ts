import { atom, map } from 'nanostores';
import type { ArticleItem } from '../services/blogService';
import { paginateHtmlContent } from '../utils/paginationEngine';
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
  totalPages: emptyPagination.totalPages,
  totalSpreads: emptyPagination.totalSpreads,
  wordCount: 0,
  albumId: null,
  albumOrder: 1,
  chapterLabel: '',
};

export const $editor = map<EditorState>(initialEditorState);

// 打开写作编辑器
export function openEditor(article?: ArticleItem) {
  const currentToday = new Date().toISOString().slice(0, 10);
  if (article) {
    const content = article.content || `<p>${article.summary || ''}</p>`;
    const pagination = paginateHtmlContent(content);
    $editor.set({
      isOpen: true,
      articleId: article.id,
      title: article.title,
      category: article.dimensionChar || '道',
      tags: article.tags || '',
      date: article.date_str || currentToday,
      content,
      isSaving: false,
      isPublished: true,
      previewSpreads: pagination.spreads,
      totalPages: pagination.totalPages,
      totalSpreads: pagination.totalSpreads,
      wordCount: content.replace(/<[^>]+>/g, '').length,
      albumId: article.album_id || null,
      albumOrder: article.album_order || 1,
      chapterLabel: article.chapter_label || '',
    });
  } else {
    const freshPagination = paginateHtmlContent('');
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
  const pagination = paginateHtmlContent(newContent);
  const textChars = newContent.replace(/<[^>]+>/g, '').length;

  $editor.setKey('content', newContent);
  $editor.setKey('previewSpreads', pagination.spreads);
  $editor.setKey('totalPages', pagination.totalPages);
  $editor.setKey('totalSpreads', pagination.totalSpreads);
  $editor.setKey('wordCount', textChars);
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

