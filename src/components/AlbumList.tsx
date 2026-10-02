import React from 'react';
import { useStore } from '@nanostores/react';
import { Layers, Lock, PenSquare, Plus, Edit3 } from 'lucide-react';
import { $filter, filterByAlbum } from '../stores/filterStore';
import { openAuthModal } from '../stores/authStore';
import { openEditor } from '../stores/editorStore';
import { openAlbumModal } from '../stores/albumStore';
import type { AlbumItem } from '../services/blogService';

interface AlbumListProps {
  albums: AlbumItem[];
  isGuest?: boolean;
}

export default function AlbumList({ albums = [], isGuest = false }: AlbumListProps) {
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
      className={`bg-white rounded-2xl p-3 border shadow-sm overflow-hidden flex flex-col justify-between flex-1 min-h-0 transition-all duration-200 select-none relative ${
        isAlbumMode
          ? 'border-limeBrand ring-2 ring-limeBrand/20'
          : 'border-stone-200/90'
      }`}
    >
      {/* 访客未登录：专栏专辑全区域虚拟化磨砂遮罩 */}
      {isGuest && (
        <div className="absolute inset-0 z-20 bg-stone-900/10 backdrop-blur-[3.5px] flex flex-col items-center justify-center p-4 text-center select-none transition-all">
          <div className="w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-stone-700 mb-2.5 border border-stone-200">
            <Lock className="w-5 h-5 text-limeBrand" />
          </div>
          <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-900 mb-1.5">
            专栏专辑已全域虚化隐匿
          </h4>
          <p className="text-[11px] font-serif text-stone-600 max-w-[210px] leading-relaxed mb-3.5">
            专栏与深度专题为创作沉淀专属空间。登入后探索并归纳您的系统长卷。
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-limeDark text-white text-xs font-serif font-bold shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <span>立即登入开启专栏</span>
            <span className="text-[10px] text-lime-300">&rarr;</span>
          </button>
        </div>
      )}

      {/* 内部卡片内容：未登录时整体高斯模糊+半透明作为精美背景 */}
      <div className={`flex flex-col h-full justify-between flex-1 min-h-0 ${isGuest ? 'filter blur-[3.5px] opacity-35 pointer-events-none select-none' : ''}`}>
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
          <div className="flex items-center space-x-1.5">
            {!isGuest && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAlbumModal();
                }}
                className="px-2 py-0.5 rounded-lg bg-limeLight hover:bg-limeBrand text-limeDark hover:text-white border border-limeBrand/30 text-[10px] font-serif font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                title="新建专栏专辑"
              >
                <Plus className="w-3 h-3" />
                <span>新建</span>
              </button>
            )}
            <span
              id="album-facet-badge"
              className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium transition-all ${
                isAlbumMode
                  ? 'bg-limeBrand text-white shadow-2xs font-semibold'
                  : 'bg-stone-100 text-stone-600 border border-stone-200/70'
              }`}
            >
              {isAlbumMode ? '● 专栏筛选中' : `${albums.length} 个专题`}
            </span>
          </div>
        </div>

        {/* 专辑卡片流 或 登录后新作者暂无专栏的空态 */}
        {!isGuest && albums.length === 0 ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 text-center select-none">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-2.5">
              <Layers className="w-5 h-5 text-stone-400" />
            </div>
            <h4 className="font-serif font-bold text-xs text-stone-700 mb-1">
              深度专题虚席以待
            </h4>
            <p className="font-serif text-[11px] text-stone-400 leading-relaxed max-w-[200px] mb-3">
              您尚未创建任何专栏专辑。可创立专栏，将已有卷帙按序归纳成册。
            </p>
            <button
              type="button"
              onClick={() => openAlbumModal()}
              className="px-3.5 py-1.5 rounded-xl bg-limeBrand hover:bg-limeDark text-white text-[11px] font-serif font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建第一部专栏专辑</span>
            </button>
          </div>
        ) : (
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
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium bg-stone-100/80 text-stone-500 border-stone-200/50">
                          {album.article_count ?? 0} 讲
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-limeBrand animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* 标题与编辑按钮 */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`font-serif font-bold text-xs sm:text-sm transition-colors leading-snug line-clamp-1 flex-1 ${
                          isActive ? 'text-limeDark font-black' : 'text-stone-900 group-hover:text-limeDark'
                        }`}
                      >
                        {album.title}
                      </h4>
                      {!isGuest && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAlbumModal(album);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-stone-200/60 text-stone-400 hover:text-limeDark transition cursor-pointer flex-shrink-0"
                          title="编排修改此专栏"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* 简介导言 */}
                    <p className="text-[11px] text-stone-500 font-serif leading-relaxed line-clamp-2">
                      {album.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部伴读说明 */}
        <div className="pt-1.5 border-t border-stone-100 text-[9px] font-serif text-stone-400 text-center flex-shrink-0">
          “成册装帧 · 跨卷连读 · 深入系统”
        </div>
      </div>
    </div>
  );
}
