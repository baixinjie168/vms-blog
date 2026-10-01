import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LogIn,
  UserPlus,
  LogOut,
  X,
  Mail,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Send,
  User
} from 'lucide-react';

export interface UserSession {
  id: string;
  email: string;
  nickname: string;
  role: 'admin' | 'reader';
  avatar_bg?: string;
}

export default function AuthModal() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 弹窗状态：'login' (密码登入) | 'register' (邮箱注册) | 'activation-sent' (激活邮件已发送提示)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'activation-sent'>('login');

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // 注册表单
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // 通用状态
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // 1. 初始化客户端挂载与检查登录会话
  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  // 2. 监听 ESC 快捷键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 3. 重新发送激活邮件倒计时
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // 账号密码登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      setErrorMsg('请输入有效的登录邮箱');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('请输入登录密码');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        setIsOpen(false);
        setLoginEmail('');
        setLoginPassword('');
      } else if (data.needActivation) {
        setLastSentEmail(data.email || loginEmail);
        setErrorMsg(data.error || '账号尚未完成邮箱激活');
      } else {
        setErrorMsg(data.error || '账号或密码错误，请重新核验');
      }
    } catch (e) {
      setErrorMsg('登录请求异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 注册新墨客账号
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setErrorMsg('请输入有效的邮箱地址');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('密码长度至少需要 6 位字符');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('两次输入的密码不一致，请仔细核对');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          nickname: regNickname.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setLastSentEmail(regEmail);
        setActiveTab('activation-sent');
        setResendCooldown(60);
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setErrorMsg(data.error || '注册失败，请稍后重试');
      }
    } catch (e) {
      setErrorMsg('注册服务请求异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 重新发送激活邮件
  const handleResendActivation = async (targetEmail?: string) => {
    const emailToSend = targetEmail || lastSentEmail || loginEmail;
    if (!emailToSend) {
      setErrorMsg('缺少待激活邮箱地址');
      return;
    }

    clearMessages();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('激活邮件已重新投递，请查收');
        setResendCooldown(60);
        setActiveTab('activation-sent');
      } else {
        setErrorMsg(data.error || '重新发送失败');
        if (data.retryAfter) {
          setResendCooldown(data.retryAfter);
        }
      }
    } catch (e) {
      setErrorMsg('重发请求异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 安全退出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsDropdownOpen(false);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // 渲染居中弹窗主体 (利用 createPortal 挂载到 document.body，规避 Header backdrop-filter 包含块陷阱)
  const renderModal = () => {
    if (!isOpen || !mounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        {/* 背景遮罩点击关闭 */}
        <div
          className="fixed inset-0"
          onClick={() => setIsOpen(false)}
        />

        {/* 弹窗内容卡片 */}
        <div className="relative bg-[#FAF7EE] border border-[#E5E0D0] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-200 select-none">
          {/* 关闭按钮 */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            title="关闭窗口 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 弹窗顶栏 */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#70C000] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white mx-auto mb-3">
              V
            </div>
            <h3 className="font-serif font-black text-lg text-stone-900">
              {activeTab === 'login'
                ? '读者登入'
                : activeTab === 'register'
                ? '注册新墨客'
                : '查收激活邮件'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 font-serif">
              {activeTab === 'login'
                ? '使用已激活的邮箱账号与密码登录数字花园'
                : activeTab === 'register'
                ? '填写真实邮箱注册，邮件激活后即可随时漫步与批注'
                : '研读之门已就绪，请前往邮箱点击链接激活'}
            </p>
          </div>

          {/* 选项卡切换 (在登录与注册之间) */}
          {activeTab !== 'activation-sent' && (
            <div className="flex bg-[#EBE6D8] p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  clearMessages();
                }}
                className={`flex-1 py-1.5 text-xs font-serif font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>账号登入</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  clearMessages();
                }}
                className={`flex-1 py-1.5 text-xs font-serif font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>注册账号</span>
              </button>
            </div>
          )}

          {/* 提示信息 */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-serif leading-relaxed">
              <div>{errorMsg}</div>
              {/* 若因未激活报错，提供一键重发按钮 */}
              {lastSentEmail && (
                <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-stone-600">未收到激活邮件？</span>
                  <button
                    type="button"
                    onClick={() => handleResendActivation(lastSentEmail)}
                    disabled={submitting || resendCooldown > 0}
                    className="text-xs font-bold text-[#70C000] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `重发需等 ${resendCooldown}s` : '重新发送激活邮件'}
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-serif flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 模式一：账号密码登录 */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1.5">
                  读者邮箱
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your-name@example.com"
                    required
                    className="w-full bg-white text-xs px-3 py-2.5 pl-8 rounded-xl border border-stone-300 focus:outline-none focus:border-[#70C000] focus:ring-1 focus:ring-[#70C000] transition font-mono"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1.5">
                  登录密码
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                    className="w-full bg-white text-xs px-3 py-2.5 pl-8 pr-9 rounded-xl border border-stone-300 focus:outline-none focus:border-[#70C000] focus:ring-1 focus:ring-[#70C000] transition font-mono"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 transition"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#70C000] hover:bg-[#559400] text-white font-serif font-bold text-xs shadow-sm transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>正在核验账号...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>安全登入数字花园</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    clearMessages();
                  }}
                  className="text-xs text-stone-500 hover:text-[#70C000] font-serif transition"
                >
                  尚未拥有账号？<span className="font-bold underline">立即注册新账号</span>
                </button>
              </div>
            </form>
          )}

          {/* 模式二：邮箱注册与设置密码 */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  读者邮箱 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="your-name@example.com"
                    required
                    className="w-full bg-white text-xs px-3 py-2 pl-8 rounded-xl border border-stone-300 focus:outline-none focus:border-[#70C000] focus:ring-1 focus:ring-[#70C000] transition font-mono"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  读者昵称 <span className="text-stone-400 font-normal">(选填)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    placeholder="如：墨客·行者 (默认根据邮箱生成)"
                    maxLength={20}
                    className="w-full bg-white text-xs px-3 py-2 pl-8 rounded-xl border border-stone-300 focus:outline-none focus:border-[#70C000] focus:ring-1 focus:ring-[#70C000] transition font-serif"
                  />
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  设置密码 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="至少 6 位字符"
                    required
                    minLength={6}
                    maxLength={64}
                    className="w-full bg-white text-xs px-3 py-2 pl-8 pr-9 rounded-xl border border-stone-300 focus:outline-none focus:border-[#70C000] focus:ring-1 focus:ring-[#70C000] transition font-mono"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 transition"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  确认密码 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="再次输入上述密码"
                    required
                    minLength={6}
                    maxLength={64}
                    className="w-full bg-white text-xs px-3 py-2 pl-8 rounded-xl border border-stone-300 focus:outline-none focus:border-[#70C000] focus:ring-1 focus:ring-[#70C000] transition font-mono"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#70C000] hover:bg-[#559400] text-white font-serif font-bold text-xs shadow-sm transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>正在创建账号并投递邮件...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>注册并发送激活邮件</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    clearMessages();
                  }}
                  className="text-xs text-stone-500 hover:text-[#70C000] font-serif transition"
                >
                  已有研读账号？<span className="font-bold underline">直接密码登入</span>
                </button>
              </div>
            </form>
          )}

          {/* 模式三：激活邮件已发送提示卡片 */}
          {activeTab === 'activation-sent' && (
            <div className="py-2 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>

              <div>
                <h4 className="font-serif font-bold text-base text-stone-900 mb-1">
                  激活邮件已送达
                </h4>
                <p className="text-xs font-serif text-stone-600 leading-relaxed max-w-xs mx-auto">
                  我们已向 <span className="font-mono font-bold text-stone-900">{lastSentEmail}</span> 发送了专属激活链接。
                </p>
              </div>

              <div className="p-3 bg-[#EFECE1] border border-[#E5E0D0] rounded-xl text-left text-xs text-stone-600 space-y-1 font-serif">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <Sparkles className="w-3.5 h-3.5 text-[#70C000]" />
                  <span>后续研读指引：</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-500">
                  1. 前往邮箱查收并点击【激活账号】链接。<br />
                  2. 链接点击后将自动完成激活并为您登入。<br />
                  3. 链接有效期为 24 小时。
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleResendActivation(lastSentEmail)}
                  disabled={submitting || resendCooldown > 0}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-stone-300 hover:border-[#70C000] text-stone-700 hover:text-[#559400] text-xs font-serif font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {resendCooldown > 0 ? (
                    <span className="font-mono text-stone-500">
                      重新发送 ({resendCooldown}s)
                    </span>
                  ) : (
                    <>
                      <Send className="w-3 h-3 text-[#70C000]" />
                      <span>未收到邮件？点击重新发送</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    clearMessages();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-transparent hover:bg-stone-200/50 text-stone-600 text-xs font-serif transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回密码登入</span>
                </button>
              </div>
            </div>
          )}

          {/* 底部装饰注脚 */}
          <div className="mt-5 pt-3 border-t border-[#EBE6D8] text-[11px] text-stone-400 font-serif text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#70C000]" />
            <span>邮箱验证激活 · 密码加密护航 · 30天安心研读</span>
          </div>
        </div>
      </div>,
      document.body
    );
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
              className="flex items-center space-x-2 p-1 pl-2 rounded-xl bg-white border border-stone-200/90 shadow-2xs hover:border-[#70C000] transition cursor-pointer"
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
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
                  <div className="px-3.5 py-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-stone-900">
                      <span>{user.nickname}</span>
                      {user.role === 'admin' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-100 text-[#559400] font-mono font-medium">
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-serif transition cursor-pointer"
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
          /* 未登录：登入 / 注册按钮 */
          <button
            onClick={() => {
              setActiveTab('login');
              clearMessages();
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-[#559400] text-xs font-serif font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>读者登入</span>
          </button>
        )}
      </div>

      {/* 弹窗通过 Portal 渲染在 document.body 上，严格保证视口绝对居中 */}
      {renderModal()}
    </>
  );
}
