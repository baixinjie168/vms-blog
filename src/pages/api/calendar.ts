import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { BlogService } from '../../services/blogService';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB;
    const url = new URL(request.url);
    const now = new Date();
    const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1), 10);

    // 打点归属当前登录作者，与首页 SSR 的取数口径保持一致
    const sessionUser = (locals as any)?.user;
    const authorId = sessionUser?.id || sessionUser?.sub;
    const dots = await BlogService.getCalendarDots(db, year, month, authorId);
    return new Response(JSON.stringify({ success: true, year, month, dots }), {
      headers: {
        'Content-Type': 'application/json',
        // 内容随登录用户变化，禁用 public/s-maxage 共享缓存，否则会把他人日历缓存给访客
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Failed to fetch calendar dots' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
