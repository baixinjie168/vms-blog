import React, { useState, useEffect } from 'react';
import { UserPlus, LogOut, X, Mail, KeyRound, CheckCircle2, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

export interface UserSession {
  id: string;
  email: string;
  nickname: string;
  role: 'admin' | 'reader';
  avatar_bg?: string;
}

export default function AuthModal() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 表单状态
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. 初始化检查登录态
  useEffect(() => {
    checkSession();
  }, []);

  // 2. 验证码倒计时定时器
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const checkSession = async () => {
    try {
      setLoadingUser(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      }
    } catch (e) {
      console.error('Failed to fetch session:', e);
    } finally {
      setLoadingUser(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('请输入有效的邮箱地址');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setSendingCode(true);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('验证码已发送至您的邮箱，5分钟内有效');
        setCountdown(60);
      } else {
        setErrorMsg(data.error || '发送验证码失败');
        if (data.retryAfter) {
          setCountdown(data.retryAfter);
        }
      }
    } catch (e: any) {
      setErrorMsg('网络请求失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  // 核验验证码并登录
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || code.length !== 6) {
      setErrorMsg('请输入 6 位数字验证码');
      return;
    }
    setErrorMsg('');
    setVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setIsOpen(false);
        setCode('');
        setEmail('');
        setErrorMsg('');
        setSuccessMsg('');
      } else {
        setErrorMsg(data.error || '验证码核验失败');
      }
    } catch (e) {
      setErrorMsg('核验请求异常，请稍后重试');
    } finally {
      setVerifying(false);
    }
  };

  // 安全登出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsDropdownOpen(false);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <>
      {/* 顶栏右侧按钮区 */}
      <div className="relative">
        {loadingUser ? (
          <div className="w-8 h-8 rounded-lg bg-stone-100 animate-pulse" />
        ) : user ? (
          /* 已登录读者徽章 */
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 p-1 pl-2 rounded-xl bg-white border border-stone-200/90 shadow-2xs hover:border-limeBrand transition"
            >
              <span className="text-xs font-serif font-bold text-stone-800 max-w-[100px] truncate">
                {user.nickname}
              </span>
              <div
                className={`w-6 h-6 rounded-lg ${user.avatar_bg || 'bg-stone-900'} text-white flex items-center justify-center text-xs font-serif font-bold shadow-xs`}
              >
                {user.nickname.slice(0, 1)}
              </div>
            </button>

            {/* 下拉浮层 */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-stone-900">
                      <span>{user.nickname}</span>
                      {user.role === 'admin' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-limeLight text-limeDark font-mono font-medium">
                          博主
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-serif transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>安全退出</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* 未登录：免密登入按钮 */
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-limeDark text-xs font-serif font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>免密登入</span>
          </button>
        )}
      </div>

      {/* 免密登录弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-[#FAF7EE] border border-[#E5E0D0] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 overflow-hidden z-10 animate-in zoom-in-95 duration-200 select-none">
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 弹窗头部 */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-limeBrand text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white mx-auto mb-3">
                V
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                读者研读免密登入
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-serif">
                输入邮箱获取 6 位数字验证码 · 登入注册二合一
              </p>
            </div>

            {/* 提示信息 */}
            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs text-center font-serif">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs text-center font-serif flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 登入表单 */}
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {/* 邮箱输入与发送按钮 */}
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1.5">
                  读者邮箱
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-name@example.com"
                      required
                      className="w-full bg-white text-xs px-3 py-2.5 pl-8 rounded-xl border border-stone-300 focus:outline-none focus:border-limeBrand focus:ring-1 focus:ring-limeBrand transition font-mono"
                    />
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0}
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-limeBrand text-stone-700 hover:text-limeDark text-xs font-serif font-bold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    {sendingCode ? (
                      <Loader2 className="w-3 h-3 animate-spin text-limeDark" />
                    ) : countdown > 0 ? (
                      <span className="font-mono text-limeDark">{countdown}s</span>
                    ) : (
                      <span>获取验证码</span>
                    )}
                  </button>
                </div>
              </div>

              {/* 验证码输入 */}
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1.5">
                  6 位数字验证码
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim().slice(0, 6))}
                    placeholder="输入 6 位验证码"
                    maxLength={6}
                    required
                    className="w-full bg-white text-center text-sm font-mono tracking-widest px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-limeBrand focus:ring-1 focus:ring-limeBrand transition"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 px-4 rounded-xl bg-limeBrand hover:bg-limeDark text-white font-serif font-bold text-xs shadow-sm transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>正在核验证明...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>核验身份并进入数字花园</span>
                  </>
                )}
              </button>
            </form>

            {/* 底部声明 */}
            <div className="mt-5 pt-3 border-t border-[#EBE6D8] text-[11px] text-stone-400 font-serif text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-limeBrand" />
              <span>新读者免密码自动建号 · 30天安心研读会话</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
