import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $filter, setPage } from '../stores/filterStore';
import FilterStatusBanner from './FilterStatusBanner';
import ArticleGrid from './ArticleGrid';
import PaginationBar from './PaginationBar';
import type { ArticleItem } from '../services/blogService';

interface CenterColumnProps {
  initialArticles?: ArticleItem[];
  initialTotal?: number;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function CenterColumn({
  initialArticles = [],
  initialTotal = 18,
  currentUserId,
  isAdmin = false,
}: CenterColumnProps) {
  const filter = useStore($filter);
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const isFirstRender = useRef(true);

  const handleArticleDeleted = (deletedId: number | string) => {
    setArticles((prev) =>
      prev.filter(
        (a) =>
          String(a.id) !== String(deletedId) &&
          Number(a.id) !== Number(deletedId)
      )
    );
    setTotal((prev) => Math.max(0, prev - 1));
  };

  // 监听全局响应式筛选状态，无刷新动态获取匹配卷帙
  useEffect(() => {
    // 首次挂载时如果处于初始状态且已有服务端直出数据，无需重复 fetch
    if (
      isFirstRender.current &&
      filter.mode === 'all' &&
      filter.page === 1 &&
      initialArticles.length > 0
    ) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;

    let isMounted = true;
    const fetchFilteredArticles = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (filter.mode === 'category' && filter.category && filter.category !== 'all') {
          params.set('category', filter.category);
        } else if (filter.mode === 'album' && filter.albumSlug) {
          params.set('album', filter.albumSlug);
        } else if (filter.mode === 'date' && filter.date) {
          params.set('date', filter.date);
        } else if (filter.mode === 'search' && filter.searchKeyword) {
          params.set('search', filter.searchKeyword);
        }

        params.set('page', String(filter.page || 1));
        params.set('pageSize', '9');

        const res = await fetch(`/api/articles?${params.toString()}`);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();

        if (isMounted && json.success) {
          setArticles(json.data || []);
          setTotal(json.total ?? (json.data ? json.data.length : 0));
        }
      } catch (err) {
        console.error('Failed to query articles:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFilteredArticles();

    return () => {
      isMounted = false;
    };
  }, [
    filter.mode,
    filter.category,
    filter.albumSlug,
    filter.date,
    filter.searchKeyword,
    filter.page,
  ]);

  return (
    <section className="flex flex-col min-w-0 h-full min-h-0 justify-between gap-2 flex-1">
      {/* 1. 顶部 46px 细长横向状态条 (高度严格固定) */}
      <FilterStatusBanner totalCount={total} />

      {/* 2. 核心 9 张经典装帧卡片矩阵 (3x3 自适应撑满屏幕) */}
      <ArticleGrid
        articles={articles}
        loading={loading}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onArticleDeleted={handleArticleDeleted}
      />

      {/* 3. 底部 38px 细长横向分页条 */}
      <PaginationBar
        total={total}
        page={filter.page}
        pageSize={9}
        onPageChange={setPage}
      />
    </section>
  );
}
