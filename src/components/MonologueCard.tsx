import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { toggleSwapCards } from '../stores/filterStore';
import type { AuthorProfile } from '../services/blogService';

interface MonologueCardProps {
  profile?: Partial<AuthorProfile>;
}

export default function MonologueCard({ profile = {} }: MonologueCardProps) {
  const nickname = profile.nickname || '白心解';
  const role = profile.role === 'admin' ? '独立博主' : (profile.role || '独立博主');
  const bio = profile.bio || '以道明向，以心修己，以法立律，以术精工，以器致远，以事立业，以势乘风。';
  const articleCount = profile.articleCount ?? 168;
  const totalWords = profile.totalWords || '34.2w';
  const daysCount = profile.daysCount ?? 430;
  const avatarChar = nickname.slice(0, 1) || '白';

  return (
    <div
      id="monologue-card"
      className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-sm relative overflow-hidden h-[190px] xl:h-[200px] flex flex-col justify-between flex-shrink-0 select-none transition-all duration-200"
    >
      {/* 头部信息与互换按钮 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-serif text-lg font-black shadow-md border border-stone-700">
              {avatarChar}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-limeBrand border-2 border-white rounded-full"
              title="在线写作中"
            />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
              <span>{nickname}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-sans">
                {role}
              </span>
            </h3>
            <p className="text-[10px] text-stone-400 font-serif">知行合一 · 七维自洽</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSwapCards}
          className="p-1 rounded text-stone-300 hover:text-limeDark hover:bg-stone-100 transition cursor-pointer"
          title="与日历互换位置"
        >
          <ArrowLeftRight className="w-3 h-3" />
        </button>
      </div>

      {/* 独白箴言 */}
      <div className="text-[10px] sm:text-[11px] text-stone-600 leading-relaxed bg-[#F5F5F7] p-2 rounded-xl border border-stone-200/60 font-serif line-clamp-2 my-0.5">
        “{bio}”
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-3 gap-1 text-center py-1 border-t border-stone-100 text-stone-700 flex-shrink-0">
        <div>
          <div className="font-serif font-bold text-xs sm:text-sm text-stone-900">
            {articleCount}
          </div>
          <div className="text-[9px] text-stone-400">文章总数</div>
        </div>
        <div>
          <div className="font-serif font-bold text-xs sm:text-sm text-stone-900">
            {totalWords}
          </div>
          <div className="text-[9px] text-stone-400">总字数</div>
        </div>
        <div>
          <div className="font-serif font-bold text-xs sm:text-sm text-stone-900">
            {daysCount}
          </div>
          <div className="text-[9px] text-stone-400">耕耘天数</div>
        </div>
      </div>
    </div>
  );
}
