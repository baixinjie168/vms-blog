import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { BlogService, normalizeDimension } from '../../services/blogService';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB;
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const albumSlug = url.searchParams.get('album') || undefined;
    const date = url.searchParams.get('date') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '9', 10);

    const sessionUser = (locals as any)?.user;
    const authorId = url.searchParams.get('authorId') || (sessionUser ? (sessionUser.id || sessionUser.sub) : undefined);

    const result = await BlogService.getArticles(db, {
      authorId,
      category,
      albumSlug,
      date,
      search,
      page,
      pageSize,
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': authorId ? 'private, no-cache' : 'public, max-age=30, s-maxage=60',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Failed to fetch articles' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB;
    const body = await request.json();
    const { id, title, category, date, content, is_published } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ success: false, error: '文章标题不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dimension = normalizeDimension(category) || 'shi_trend';
    const plainText = (content || '').replace(/<[^>]+>/g, '').trim();
    const charCount = plainText.length;
    const readTime = Math.max(2, Math.round(charCount / 400));
    const summary = plainText.slice(0, 140) + (plainText.length > 140 ? '...' : '');

    const now = Math.floor(Date.now() / 1000);
    const authorId = (locals as any)?.user?.id || (locals as any)?.user?.sub || 'usr_author_bai';
    const published = is_published ? 1 : 0;

    if (db) {
      if (id) {
        // 更新已有文章
        await db.prepare(`
          UPDATE articles
          SET title = ?, summary = ?, content = ?, dimension = ?, read_time = ?, is_published = ?, updated_at = ?
          WHERE id = ?
        `).bind(title.trim(), summary, content, dimension, readTime, published, now, id).run();

        return new Response(JSON.stringify({ success: true, data: { id, title, is_published: published } }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 创建新文章
      const slug = `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const result = await db.prepare(`
        INSERT INTO articles (author_id, slug, title, summary, content, dimension, read_time, views, is_published, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      `).bind(
        authorId,
        slug,
        title.trim(),
        summary,
        content,
        dimension,
        readTime,
        published,
        published ? now : null,
        now,
        now
      ).run();

      return new Response(JSON.stringify({
        success: true,
        data: {
          id: result.meta?.last_row_id || Date.now(),
          slug,
          title,
          is_published: published,
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 本地开发模拟回显
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: id || Date.now(),
        slug: `art_mock_${Date.now()}`,
        title,
        is_published: published,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Save article failed:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || '保存文章失败' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
