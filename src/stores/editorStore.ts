import { atom, map } from 'nanostores';
import { $currentUser, setCurrentUser, openAuthModal } from './authStore';
import type { ArticleItem } from '../services/blogService';
import { paginateHtmlContent, type ReaderFontSize, type TableDensity } from '../utils/paginationEngine';
import { countPlainChars } from '../utils/textStats';
import type { BookSpread } from './readerStore';

export interface EditorState {
  isOpen: boolean;
  articleId: number | null;
  title: string;
  summary: string;
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
  summary: '',
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
    // 检查历史文章摘要是否为老版本代码机械截取的前 140 字正文。若是，则视为空，避免自动残留
    const contentPlain = (content || '').replace(/<[^>]+>/g, '').trim();
    const rawSum = (fullArticle.summary || '').trim();
    const isAutoSliced = Boolean(rawSum) && Boolean(contentPlain) && contentPlain.startsWith(rawSum.replace(/\.\.\.$/, '').trim());
    const validSummary = isAutoSliced ? '' : rawSum;

    const { previewFontSize, previewTableDensity } = $editor.get();
    const pagination = paginateHtmlContent(content, {
      fontSize: previewFontSize,
      tableDensity: previewTableDensity,
    });
    $editor.set({
      isOpen: true,
      articleId: fullArticle.id,
      title: fullArticle.title,
      summary: validSummary,
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
      summary: '',
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
    // 独立 /editor 路由页：返回首页需真实跳转
    if (window.location.pathname.startsWith('/editor')) {
      window.location.href = '/';
      return;
    }
    const editorEl = document.getElementById('view-editor');
    if (editorEl) editorEl.classList.add('hidden');
    const readerEl = document.getElementById('view-reader');
    if (readerEl) readerEl.classList.add('hidden');
    const homeEl = document.getElementById('view-home');
    if (homeEl) homeEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 登录校验：store 未水合时回源会话接口；未登录则唤起登录弹窗
async function ensureLoggedIn(): Promise<boolean> {
  if ($currentUser.get()) return true;
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json().catch(() => null);
    if (res.ok && data?.user) {
      setCurrentUser(data.user);
      return true;
    }
  } catch (e) {
    console.warn('Session check failed:', e);
  }
  openAuthModal();
  return false;
}

// 写作入口统一闸口：未登录弹出登录框；已登录跳转独立编辑页 /editor
export async function requestEditor(article?: ArticleItem) {
  const ok = await ensureLoggedIn();
  if (!ok || typeof window === 'undefined') return;
  const qs = article?.slug ? `?slug=${encodeURIComponent(article.slug)}` : '';
  window.location.href = `/editor${qs}`;
}

// /editor 独立页引导：校验登录后按 ?slug= 载入待编文章；无 slug 则恢复最近暂存草稿，否则新开空白稿
export async function bootEditorPage() {
  const ok = await ensureLoggedIn();
  if (!ok || typeof window === 'undefined') return;
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (slug) {
    try {
      const res = await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json?.success && json.article) {
        await openEditor(json.article);
        return;
      }
    } catch (e) {
      console.warn('Failed to load article for editor page:', e);
    }
  }
  // 无 ?slug=：尝试恢复最近一次暂存的草稿（未发布），没有则空白新稿
  try {
    const res = await fetch('/api/articles?draft=1');
    const json = await res.json();
    if (json?.success && json.article) {
      await openEditor(json.article);
      return;
    }
  } catch (e) {
    console.warn('Failed to restore latest draft:', e);
  }
  await openEditor();
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

export function setEditorSummary(summary: string) {
  $editor.setKey('summary', summary);
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

