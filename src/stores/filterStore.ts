import { atom, map } from 'nanostores';

export type FilterMode = 'all' | 'category' | 'album' | 'date' | 'search';

export interface FilterState {
  mode: FilterMode;
  category: string | null;      // '道' | '心' | '法' | '术' | '器' | '事' | '势' | null
  albumSlug: string | null;     // 'qlib-quant', 'architectural-thinking', etc.
  albumTitle: string | null;    // 专辑中文名称
  date: string | null;          // 'YYYY-MM-DD'
  searchKeyword: string;
  page: number;
  pageSize: number;
}

export const initialFilterState: FilterState = {
  mode: 'all',
  category: null,
  albumSlug: null,
  albumTitle: null,
  date: null,
  searchKeyword: '',
  page: 1,
  pageSize: 9,
};

// 核心筛选与分页响应式原子 Store
export const $filter = map<FilterState>(initialFilterState);

// 左右卡片互换状态 (持久化至 localStorage)
const getInitialSwapState = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('vms_cards_swapped') === 'true';
    } catch {
      return false;
    }
  }
  return false;
};

export const $isSwapped = atom<boolean>(getInitialSwapState());

// 切换左右卡片互换
export function toggleSwapCards() {
  const next = !$isSwapped.get();
  $isSwapped.set(next);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('vms_cards_swapped', String(next));
    } catch {}
  }
}

// 筛选：按七大认知分类
export function filterByCategory(category: string | 'all') {
  if (category === 'all') {
    $filter.set({
      ...initialFilterState,
      page: 1,
    });
  } else {
    $filter.set({
      mode: 'category',
      category,
      albumSlug: null,
      albumTitle: null,
      date: null,
      searchKeyword: '',
      page: 1,
      pageSize: 9,
    });
  }
}

// 筛选：按专栏专辑
export function filterByAlbum(slug: string, title?: string) {
  $filter.set({
    mode: 'album',
    category: null,
    albumSlug: slug,
    albumTitle: title || slug,
    date: null,
    searchKeyword: '',
    page: 1,
    pageSize: 9,
  });
}

// 筛选：按具体成文日期
export function filterByDate(dateStr: string) {
  $filter.set({
    mode: 'date',
    category: null,
    albumSlug: null,
    albumTitle: null,
    date: dateStr,
    searchKeyword: '',
    page: 1,
    pageSize: 9,
  });
}

// 筛选：全局关键字检索
export function filterBySearch(keyword: string) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    $filter.set({
      ...initialFilterState,
      page: 1,
    });
  } else {
    $filter.set({
      mode: 'search',
      category: null,
      albumSlug: null,
      albumTitle: null,
      date: null,
      searchKeyword: trimmed,
      page: 1,
      pageSize: 9,
    });
  }
}

// 分页切换
export function setPage(page: number) {
  $filter.setKey('page', page);
}

// 重置回全部文章
export function resetFilter() {
  $filter.set({
    ...initialFilterState,
    page: 1,
  });
}
