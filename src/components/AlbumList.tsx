import React from 'react';
import { useStore } from '@nanostores/react';
import { Layers } from 'lucide-react';
import { $filter, filterByAlbum } from '../stores/filterStore';
import type { AlbumItem } from '../services/blogService';

interface AlbumListProps {
  albums: AlbumItem[];
}

export default function AlbumList({ albums = [] }: AlbumListProps) {
  const filter = useStore($filter);
  const isAlbumMode = filter.mode === 'album';

  const spineColors: Record<string, string> = {
    道: 'bg-orient-dao',
    心: 'bg-orient-xin',
    法: 'bg-orient-fa',
    术: 'bg-limeBrand',
    器: 'bg-orient-qi',
    事: 'bg-orient-matter',
    势: 'bg-orient-trend',
  };

  const badgeVisuals: Record<string, string> = {
    道: 'bg-orient-dao/15 text-orient-dao border-orient-dao/30',
    心: 'bg-orient-xin/15 text-orient-xin border-orient-xin/30',
    法: 'bg-orient-fa/15 text-orient-fa border-orient-fa/30',
    术: 'bg-limeLight text-limeDark border-limeBrand/30',
    器: 'bg-orient-qi/15 text-orient-qi border-orient-qi/30',
    事: 'bg-orient-matter/15 text-orient-matter border-orient-matter/30',
    势: 'bg-orient-trend/15 text-orient-trend border-orient-trend/30',
  };

  return (
    <div
      id="album-container-card"
      className={`bg-white rounded-2xl p-3 border shadow-sm overflow-hidden flex flex-col justify-between flex-1 min-h-0 transition-all duration-200 select-none ${
        isAlbumMode
          ? 'border-limeBrand ring-2 ring-limeBrand/20'
          : 'border-stone-200/90'
      }`}
    >
      {/* 头部标题与专题总数 */}
      <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded-md bg-limeLight text-limeDark flex items-center justify-center">
            <Layers className="w-3 h-3 text-limeBrand" />
          </div>
          <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 tracking-wider">
            专栏专辑
          </h3>
        </div>
        <span
          id="album-facet-badge"
          className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium transition-all ${
            isAlbumMode
              ? 'bg-limeBrand text-white shadow-2xs font-semibold'
              : 'bg-stone-100 text-stone-600 border border-stone-200/70'
          }`}
        >
          {isAlbumMode ? '● 专栏筛选中' : `${albums.length} 个深度专题`}
        </span>
      </div>

      {/* 专辑卡片流：支持悬停微显细轨滚动条 */}
      <div
        id="album-cards-list"
        className="flex-1 min-h-0 space-y-2 py-1.5 pr-1 hover-scrollbar overflow-y-auto"
      >
        {albums.map((album) => {
          const isActive = filter.mode === 'album' && filter.albumSlug === album.slug;
          const cat = album.category || '术';
          const catLabel = album.catLabel || `${cat} · 专题`;
          const spineColor = spineColors[cat] || 'bg-limeBrand';
          const badgeColor = badgeVisuals[cat] || 'bg-limeLight text-limeDark border-limeBrand/30';
          const isOngoing = album.status.includes('连载');

          return (
            <div
              key={album.id || album.slug}
              onClick={() => filterByAlbum(album.slug, album.title)}
              className={`album-card group relative rounded-xl p-2.5 sm:p-3 border transition-all duration-200 shadow-2xs cursor-pointer overflow-hidden select-none flex-shrink-0 flex flex-col justify-center ${
                isActive
                  ? 'border-limeBrand bg-white ring-2 ring-limeBrand/30 shadow-xs translate-x-0.5'
                  : 'bg-stone-50/70 hover:bg-white border-stone-200/90 hover:border-limeBrand/50 hover:shadow-xs'
              }`}
            >
              {/* 左侧函套书脊色带 */}
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                  isActive ? 'w-2 bg-limeBrand' : `w-1.5 ${spineColor} group-hover:w-2`
                }`}
              />

              <div className="pl-2 pr-0.5">
                {/* 顶部所属维度与连载状态 */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-serif font-bold border ${badgeColor}`}>
                    {catLabel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                        isOngoing
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                          : 'text-amber-700 bg-amber-50 border-amber-200/60'
                      }`}
                    >
                      {album.status}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-limeBrand animate-pulse" />
                    )}
                  </div>
                </div>

                {/* 标题 */}
                <h4
                  className={`font-serif font-bold text-xs sm:text-sm transition-colors leading-snug mb-0.5 line-clamp-1 ${
                    isActive ? 'text-limeDark font-black' : 'text-stone-900 group-hover:text-limeDark'
                  }`}
                >
                  {album.title}
                </h4>

                {/* 简介导言 */}
                <p className="text-[11px] text-stone-500 font-serif leading-relaxed line-clamp-2">
                  {album.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部伴读说明 */}
      <div className="pt-1.5 border-t border-stone-100 text-[9px] font-serif text-stone-400 text-center flex-shrink-0">
        “成册装帧 · 跨卷连读 · 深入系统”
      </div>
    </div>
  );
}
