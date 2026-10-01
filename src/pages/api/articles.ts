import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { BlogService } from '../../services/blogService';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB || (locals as any)?.runtime?.env?.DB;
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const albumSlug = url.searchParams.get('album') || undefined;
    const date = url.searchParams.get('date') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '9', 10);

    const result = await BlogService.getArticles(db, {
      category,
      albumSlug,
      date,
      search,
      page,
      pageSize,
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Failed to fetch articles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
