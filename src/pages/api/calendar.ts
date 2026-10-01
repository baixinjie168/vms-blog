import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { BlogService } from '../../services/blogService';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB || (locals as any)?.runtime?.env?.DB;
    const url = new URL(request.url);
    const now = new Date();
    const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1), 10);

    const dots = await BlogService.getCalendarDots(db, year, month);
    return new Response(JSON.stringify({ success: true, year, month, dots }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Failed to fetch calendar dots' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
