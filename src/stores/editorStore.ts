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

const DEFAULT_EDITOR_CONTENT = `<h3>一、 大势所趋：AI 不是替代，而是杠杆</h3>
<p>当我们站在 2026 年的节点回望，技术的剧变并未消解人类对深度沉淀的渴望，反而让<strong>具有个人独特视角与温度的原创思想</strong>变得愈发稀缺。</p>
<blockquote>“势者，因势利导也。君子顺势而动，顺势而为。”</blockquote>
<p>在七维体系中，「势」解决的是“我如何借势？”的终极追问。面对智能浪潮，博客不再是碎片杂货铺，而是一套七维通达的个人思想庇护所。</p>
<h3>二、 告别信息浮躁，回归书页专注</h3>
<p>我们习惯了在无尽滚动的信息瀑布流中快速滑动屏幕，却未曾察觉这种交互模式是如何撕裂专注力的。</p>
<ul>
  <li><strong>有限开本</strong>：将长文裁切为固定的双页印张。</li>
  <li><strong>翻页交互</strong>：用手指点击或键盘方向键替代漫不经心的滑动。</li>
  <li><strong>沉浸心流</strong>：一页一境，给思维留白。</li>
</ul>`;

const todayStr = new Date().toISOString().slice(0, 10);
const initialPagination = paginateHtmlContent(DEFAULT_EDITOR_CONTENT);

export const initialEditorState: EditorState = {
  isOpen: false,
  articleId: null,
  title: '以势乘风：探究 AI 时代个人知识资产与行业周期的重塑',
  category: '势',
  tags: '趋势, 借势, AI',
  date: todayStr,
  content: DEFAULT_EDITOR_CONTENT,
  isSaving: false,
  isPublished: false,
  previewSpreads: initialPagination.spreads,
  totalPages: initialPagination.totalPages,
  totalSpreads: initialPagination.totalSpreads,
  wordCount: DEFAULT_EDITOR_CONTENT.replace(/<[^>]+>/g, '').length,
};

export const $editor = map<EditorState>(initialEditorState);

// 打开写作编辑器
export function openEditor(article?: ArticleItem) {
  if (article) {
    const content = article.content || `<p>${article.summary || ''}</p>`;
    const pagination = paginateHtmlContent(content);
    $editor.set({
      isOpen: true,
      articleId: article.id,
      title: article.title,
      category: article.dimensionChar || '道',
      tags: article.tags || '',
      date: article.date_str || todayStr,
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
    $editor.setKey('isOpen', true);
    $editor.setKey('articleId', null);
    $editor.setKey('albumId', null);
    $editor.setKey('albumOrder', 1);
    $editor.setKey('chapterLabel', '');
    $editor.setKey('tags', '');
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

