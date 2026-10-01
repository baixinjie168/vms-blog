import React, { useState } from 'react';
import { ArrowLeftRight, Lock, Edit3, Check, X, Loader2 } from 'lucide-react';
import { toggleSwapCards } from '../stores/filterStore';
import { openAuthModal } from '../stores/authStore';
import type { AuthorProfile } from '../services/blogService';

interface MonologueCardProps {
  profile?: Partial<AuthorProfile>;
  isGuest?: boolean;
}

export default function MonologueCard({ profile = {}, isGuest }: MonologueCardProps) {
  const guestMode = isGuest ?? profile.isGuest ?? false;

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname || (guestMode ? '墨客 · 隐者' : '白心解'));
  const [bio, setBio] = useState(
    profile.bio || (guestMode ? '浮生研墨，漫步林泉。登入后可沉淀个人专属研读箴言...' : '以道明向，以心修己，以法立律，以术精工，以器致远，以事立业，以势乘风。')
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const role = guestMode ? '未登入' : (profile.role === 'admin' ? '博主管理员' : '研读墨客');
  const articleCount = guestMode ? '--' : (profile.articleCount ?? 0);
  const totalWords = guestMode ? '--' : (profile.totalWords || '0');
  const daysCount = guestMode ? '--' : (profile.daysCount ?? 1);
  const avatarChar = guestMode ? '?' : (nickname.slice(0, 1) || '墨');
  const avatarBg = profile.avatar_bg || 'bg-stone-900';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setSaveError('昵称不能为空');
      return;
    }
    setSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), bio: bio.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditing(false);
      } else {
        setSaveError(data.error || '保存失败');
      }
    } catch {
      setSaveError('保存异常，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="monologue-card"
      className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-sm relative overflow-hidden h-[190px] xl:h-[200px] flex flex-col justify-between flex-shrink-0 select-none transition-all duration-200"
    >
      {/* 访客马赛克虚化全卡片遮罩 */}
      {guestMode && (
        <div className="absolute inset-0 z-20 bg-stone-900/10 backdrop-blur-[2.5px] flex flex-col items-center justify-center p-3 text-center transition-all select-none">
          <div className="w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-stone-700 mb-2 border border-stone-200">
            <Lock className="w-4 h-4 text-[#70C000]" />
          </div>
          <p className="text-xs font-serif font-bold text-stone-900 mb-1">
            个人专属名片已虚化隐匿
          </p>
          <p className="text-[10px] font-serif text-stone-500 mb-2.5">
            登入后展示您的专属独白、签名与文章统计
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-[#559400] text-white text-xs font-serif font-bold shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <span>立即登入开启名片</span>
            <span className="text-[10px] text-lime-300">&rarr;</span>
          </button>
        </div>
      )}

      {/* 头部信息与操作按钮 */}
      <div className={`flex items-center justify-between flex-shrink-0 ${guestMode ? 'filter blur-[1.5px] opacity-60' : ''}`}>
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl ${avatarBg} text-white flex items-center justify-center font-serif text-base font-bold shadow-md border border-stone-700`}
            >
              {avatarChar}
            </div>
            {!guestMode && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-limeBrand border-2 border-white rounded-full"
                title="在线研读中"
              />
            )}
          </div>
          <div>
            <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
              <span>{nickname}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${guestMode ? 'bg-stone-200 text-stone-500' : 'bg-limeLight text-limeDark font-bold'}`}>
                {role}
              </span>
            </h3>
            <p className="text-[10px] text-stone-400 font-serif">知行合一 · 七维自洽</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!guestMode && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
              title="编辑个人昵称与独白"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleSwapCards}
            className="p-1 rounded text-stone-300 hover:text-limeDark hover:bg-stone-100 transition cursor-pointer"
            title="与日历互换位置"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 独白箴言展示或编辑 */}
      {isEditing && !guestMode ? (
        <form onSubmit={handleSaveProfile} className="my-0.5 space-y-1.5 flex-1 flex flex-col justify-center">
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="您的昵称"
              maxLength={15}
              className="flex-1 bg-stone-50 text-[11px] font-serif px-2 py-1 rounded-lg border border-stone-300 focus:outline-none focus:border-[#70C000]"
            />
            <button
              type="submit"
              disabled={saving}
              className="p-1 rounded bg-[#70C000] text-white hover:bg-[#559400] transition cursor-pointer"
              title="保存"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 rounded text-stone-400 hover:bg-stone-100 transition cursor-pointer"
              title="取消"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="输入您的专属座右铭或个人独白..."
            maxLength={60}
            className="w-full bg-stone-50 text-[10px] font-serif px-2 py-1 rounded-lg border border-stone-300 focus:outline-none focus:border-[#70C000]"
          />
          {saveError && <div className="text-[9px] text-rose-500">{saveError}</div>}
        </form>
      ) : (
        <div
          className={`text-[10px] sm:text-[11px] text-stone-600 leading-relaxed bg-[#F5F5F7] p-2 rounded-xl border border-stone-200/60 font-serif line-clamp-2 my-0.5 transition-all ${
            guestMode ? 'filter blur-[1.5px] opacity-60' : ''
          }`}
        >
          “{bio}”
        </div>
      )}

      {/* 核心指标统计 */}
      <div
        className={`grid grid-cols-3 gap-1 text-center py-1 border-t border-stone-100 text-stone-700 flex-shrink-0 transition-all ${
          guestMode ? 'filter blur-[2px] opacity-50' : ''
        }`}
      >
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
