import React from 'react';
import { useStore } from '@nanostores/react';
import { Compass, Lock } from 'lucide-react';
import { $filter, filterByCategory } from '../stores/filterStore';
import { openAuthModal } from '../stores/authStore';
import type { DimensionMeta } from '../services/blogService';

interface CognitiveLevelsProps {
  dimensions: DimensionMeta[];
  totalArticles: number;
  isGuest?: boolean;
}

export default function CognitiveLevels({ dimensions, totalArticles, isGuest = false }: CognitiveLevelsProps) {
  const filter = useStore($filter);
  const isCategoryMode = filter.mode === 'category' || filter.mode === 'all';

  // 映射各维度配色与元信息
  const dimVisuals: Record<
    string,
    {
      badgeBg: string;
      badgeText: string;
      hoverBorder: string;
      activeBg: string;
      activeBorder: string;
      activeText: string;
    }
  > = {
    道: {
      badgeBg: 'bg-orient-dao/15',
      badgeText: 'text-orient-dao',
      hoverBorder: 'hover:border-orient-dao/40',
      activeBg: 'bg-orient-dao/10',
      activeBorder: 'border-orient-dao',
      activeText: 'text-orient-dao',
    },
    心: {
      badgeBg: 'bg-orient-xin/15',
      badgeText: 'text-orient-xin',
      hoverBorder: 'hover:border-orient-xin/40',
      activeBg: 'bg-orient-xin/10',
      activeBorder: 'border-orient-xin',
      activeText: 'text-orient-xin',
    },
    法: {
      badgeBg: 'bg-orient-fa/15',
      badgeText: 'text-orient-fa',
      hoverBorder: 'hover:border-orient-fa/40',
      activeBg: 'bg-orient-fa/10',
      activeBorder: 'border-orient-fa',
      activeText: 'text-orient-fa',
    },
    术: {
      badgeBg: 'bg-limeLight',
      badgeText: 'text-limeDark',
      hoverBorder: 'hover:border-limeBrand/40',
      activeBg: 'bg-limeLight',
      activeBorder: 'border-limeBrand',
      activeText: 'text-limeDark',
    },
    器: {
      badgeBg: 'bg-orient-qi/15',
      badgeText: 'text-orient-qi',
      hoverBorder: 'hover:border-orient-qi/40',
      activeBg: 'bg-orient-qi/10',
      activeBorder: 'border-orient-qi',
      activeText: 'text-orient-qi',
    },
    事: {
      badgeBg: 'bg-orient-matter/15',
      badgeText: 'text-orient-matter',
      hoverBorder: 'hover:border-orient-matter/40',
      activeBg: 'bg-orient-matter/10',
      activeBorder: 'border-orient-matter',
      activeText: 'text-orient-matter',
    },
    势: {
      badgeBg: 'bg-orient-trend/15',
      badgeText: 'text-orient-trend',
      hoverBorder: 'hover:border-orient-trend/40',
      activeBg: 'bg-orient-trend/10',
      activeBorder: 'border-orient-trend',
      activeText: 'text-orient-trend',
    },
  };

  const isAllActive = filter.mode === 'all' || (!filter.category && filter.mode !== 'album' && filter.mode !== 'date' && filter.mode !== 'search');

  return (
    <div
      id="cognitive-hierarchy-container"
      className={`bg-white rounded-2xl p-3 border shadow-sm overflow-hidden flex flex-col justify-between flex-1 min-h-0 transition-all duration-200 select-none ${
        filter.mode === 'category'
          ? 'border-stone-400/80 ring-2 ring-stone-900/5'
          : 'border-stone-200/90'
      }`}
    >
      {/* 头部标题与当前状态指示 */}
      <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-limeBrand" />
          <h3 className="font-serif font-bold text-xs text-stone-800 tracking-wider">七大认知层级</h3>
        </div>
        <span
          id="cat-facet-badge"
          className={`text-[9px] px-2 py-0.5 rounded-full font-serif font-bold shadow-2xs transition-all ${
            isCategoryMode
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-500 hover:text-stone-800'
          }`}
        >
          {filter.mode === 'category' ? `● ${filter.category}维聚焦` : isAllActive ? '● 全景矩阵' : '点击切回'}
        </span>
      </div>

      {/* 分类按钮组 (自适应紧凑排布) */}
      <div id="category-buttons-list" className="space-y-1 py-0.5 flex-1 flex flex-col justify-between min-h-0">
        {/* 全部分类 */}
        <button
          type="button"
          data-cat="all"
          onClick={() => filterByCategory('all')}
          className={`group w-full py-1 px-2 rounded-lg text-xs font-serif transition flex items-center justify-between cursor-pointer ${
            isAllActive
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:bg-stone-100 border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center font-serif ${
                isAllActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              全
            </span>
            <span className="font-bold tracking-wide text-[11px]">全景大观</span>
          </div>
          <span
            className={`text-[9px] font-mono ${
              isAllActive ? 'opacity-80 text-white' : 'text-stone-400'
            }`}
          >
            {isGuest ? (
              <span className="blur-[1.5px] select-none opacity-60">-- 篇全景</span>
            ) : (
              `${totalArticles}篇全景`
            )}
          </span>
        </button>

        {/* 7 个具体层级 */}
        {dimensions.map((dim) => {
          const char = dim.char;
          const isActive = filter.mode === 'category' && filter.category === char;
          const visual = dimVisuals[char] || {
            badgeBg: 'bg-stone-100',
            badgeText: 'text-stone-700',
            hoverBorder: 'hover:border-stone-300',
            activeBg: 'bg-stone-100',
            activeBorder: 'border-stone-900',
            activeText: 'text-stone-900',
          };

          return (
            <button
              key={dim.key}
              type="button"
              data-cat={char}
              onClick={() => filterByCategory(char)}
              className={`group w-full py-0.5 px-2 rounded-lg text-xs font-serif transition flex items-center justify-between border cursor-pointer ${
                isActive
                  ? `${visual.activeBg} ${visual.activeBorder} ${visual.activeText} shadow-2xs font-semibold`
                  : `border-transparent text-stone-700 hover:bg-stone-50 ${visual.hoverBorder}`
              }`}
            >
              <div className="flex items-center space-x-1.5 text-left min-w-0">
                <span
                  className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center font-serif flex-shrink-0 ${visual.badgeBg} ${visual.badgeText}`}
                >
                  {char}
                </span>
                <div className="min-w-0">
                  <div
                    className={`font-bold text-[11px] truncate transition-colors ${
                      isActive ? visual.activeText : 'text-stone-800 group-hover:text-stone-950'
                    }`}
                  >
                    {dim.name}
                  </div>
                  <div className="text-[9px] text-stone-400 truncate max-w-[125px] xl:max-w-[145px]">
                    {dim.scope}
                  </div>
                </div>
              </div>
              <span
                className={`text-[9px] font-mono flex-shrink-0 pl-1 ${
                  isActive ? visual.activeText : 'text-stone-400'
                }`}
              >
                {isGuest ? (
                  <span className="blur-[1.5px] select-none opacity-60">-- 篇</span>
                ) : (
                  `${dim.count || 0}篇`
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部访客虚化指引 / 哲学导引 */}
      {isGuest ? (
        <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[9px] font-serif text-stone-400 flex-shrink-0">
          <span className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-stone-400" />
            <span>个人体系已虚化</span>
          </span>
          <button
            type="button"
            onClick={openAuthModal}
            className="text-limeDark font-bold hover:underline cursor-pointer"
          >
            登入查阅专属图谱 →
          </button>
        </div>
      ) : (
        <div className="pt-1 border-t border-stone-100 text-[9px] font-serif text-stone-400 text-center flex-shrink-0">
          “道心法术器事势 · 认知闭环”
        </div>
      )}
    </div>
  );
}
