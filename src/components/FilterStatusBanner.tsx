import React from 'react';
import { useStore } from '@nanostores/react';
import { ArrowLeft, X } from 'lucide-react';
import { $filter, filterByCategory, resetFilter } from '../stores/filterStore';
import { DIMENSIONS, normalizeDimension } from '../services/blogService';

interface FilterStatusBannerProps {
  totalCount?: number;
}

export default function FilterStatusBanner({ totalCount = 18 }: FilterStatusBannerProps) {
  const filter = useStore($filter);

  // 获取当前分类维度元信息
  const normDim = normalizeDimension(filter.category) || 'dao';
  const dimMeta = DIMENSIONS[normDim] || DIMENSIONS.dao;

  return (
    <div
      id="filter-status-banner"
      className="bg-white rounded-2xl px-3.5 py-1.5 border border-stone-200/90 shadow-sm flex items-center justify-between flex-shrink-0 min-h-[46px] h-[46px] select-none transition-all duration-200"
    >
      {/* 左侧：当前筛选维度标题、徽标与哲学释义 */}
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        {filter.mode === 'album' ? (
          <>
            <span className="px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-limeLight text-limeDark border border-limeBrand/30 flex-shrink-0">
              专栏专辑
            </span>
            <div className="flex items-center space-x-1.5 min-w-0">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
                《{filter.albumTitle || filter.albumSlug}》
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 font-serif truncate hidden md:inline max-w-[320px] xl:max-w-[420px]">
              —— 深度系统研读 · 成册跨卷连读
            </span>
          </>
        ) : filter.mode === 'category' && filter.category && filter.category !== 'all' ? (
          <>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold ${dimMeta.bg} ${dimMeta.border} border flex-shrink-0`}
            >
              {filter.category} · 认知层
            </span>
            <div className="flex items-center space-x-1.5 min-w-0">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
                {dimMeta.question}
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 font-serif truncate hidden md:inline max-w-[340px] xl:max-w-[460px]">
              —— {dimMeta.scope}
            </span>
          </>
        ) : filter.mode === 'date' ? (
          <>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-limeLight text-limeDark border border-limeBrand/30 flex-shrink-0">
              知行时令
            </span>
            <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
              成文时令归档（{filter.date}）
            </h3>
          </>
        ) : filter.mode === 'search' ? (
          <>
            <span className="px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-amber-100 text-amber-800 border border-amber-300/40 flex-shrink-0">
              全文检索
            </span>
            <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
              关键词：“{filter.searchKeyword}”
            </h3>
          </>
        ) : (
          <>
            <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center font-serif text-[10px] font-bold flex-shrink-0">
              全
            </span>
            <div className="flex items-center space-x-1.5 min-w-0">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
                知行卷帙 · 七大认知维度全景
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 font-serif truncate hidden md:inline max-w-[340px] xl:max-w-[460px]">
              —— “格物致知 · 诚意正心 · 修身齐家 · 知行合一”
            </span>
          </>
        )}
      </div>

      {/* 右侧：统计指标与快捷重置操作 */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {filter.mode === 'album' ? (
          <>
            <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
              当前收录 {totalCount} 篇
            </span>
            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-[11px] text-stone-600 transition cursor-pointer"
              title="返回全部分类"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>返回分类</span>
            </button>
          </>
        ) : filter.mode === 'category' && filter.category && filter.category !== 'all' ? (
          <>
            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              当前收录 {totalCount} 篇
            </span>
            <button
              type="button"
              onClick={() => filterByCategory('all')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-[11px] text-stone-600 transition cursor-pointer"
              title="查看全部全景"
            >
              <X className="w-3 h-3" />
              <span>看全部</span>
            </button>
          </>
        ) : filter.mode === 'date' ? (
          <>
            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              匹配 {totalCount} 篇
            </span>
            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-[11px] text-stone-600 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>重置时令</span>
            </button>
          </>
        ) : filter.mode === 'search' ? (
          <>
            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              找到 {totalCount} 篇
            </span>
            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-[11px] text-stone-600 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>清除检索</span>
            </button>
          </>
        ) : (
          <>
            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              全景 {totalCount} 篇 · 7大维度
            </span>
            <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
              每页 9 篇
            </span>
          </>
        )}
      </div>
    </div>
  );
}
