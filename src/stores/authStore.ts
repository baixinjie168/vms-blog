import { atom } from 'nanostores';

export interface CurrentUserProfile {
  id: string;
  email: string;
  nickname: string;
  bio?: string;
  role: 'admin' | 'reader';
  avatar_bg?: string;
  articleCount?: number;
  totalWords?: string;
  daysCount?: number;
}

// 全局登录弹窗显隐控制原子 Store
export const $isAuthModalOpen = atom<boolean>(false);

// 全局当前登录用户信息原子 Store
export const $currentUser = atom<CurrentUserProfile | null>(null);

// 打开登录弹窗
export function openAuthModal() {
  $isAuthModalOpen.set(true);
}

// 关闭登录弹窗
export function closeAuthModal() {
  $isAuthModalOpen.set(false);
}

// 设置当前用户信息
export function setCurrentUser(user: CurrentUserProfile | null) {
  $currentUser.set(user);
}
