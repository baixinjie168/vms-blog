import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { ensureBlogSchema } from '../../utils/dbInit';
import { BlogService, normalizeDimension } from '../../services/blogService';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB;
    await ensureBlogSchema(db);

    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    if (slug && db) {
      const article = await BlogService.getArticleBySlug(db, slug);
      if (!article) {
        return new Response(JSON.stringify({ success: false, error: '文章不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, article }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const category = url.searchParams.get('category') || undefined;
    const albumSlug = url.searchParams.get('album') || undefined;
    const date = url.searchParams.get('date') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '9', 10);
    const allAuthor = url.searchParams.get('allAuthor') === 'true';

    const sessionUser = (locals as any)?.user;
    const authorId = url.searchParams.get('authorId') || (sessionUser ? (sessionUser.id || sessionUser.sub) : undefined);

    // 若用于专辑管理弹窗中展示当前作者的所有已有文章
    if (allAuthor && authorId && db) {
      const rows = await db.prepare(`
        SELECT a.id, a.title, a.slug, a.dimension, a.album_id, a.album_order, a.chapter_label, a.tags, a.created_at,
               alb.title as album_title
        FROM articles a
        LEFT JOIN albums alb ON a.album_id = alb.id
        WHERE a.author_id = ? AND a.is_published = 1
        ORDER BY a.created_at DESC
      `).bind(authorId).all();

      return new Response(JSON.stringify({ success: true, data: rows.results || [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    await ensureBlogSchema(db);

    const sessionUser = (locals as any)?.user;
    if (!sessionUser) {
      return new Response(JSON.stringify({ success: false, error: '请先登入作者账号' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { id, title, category, tags, content, is_published, album_id, album_order, chapter_label } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ success: false, error: '文章标题不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dimension = normalizeDimension(category) || 'shi_trend';
    const cleanTags = typeof tags === 'string' ? tags.trim() : '';
    const plainText = (content || '').replace(/<[^>]+>/g, '').trim();
    const charCount = plainText.length;
    const readTime = Math.max(2, Math.round(charCount / 400));
    const summary = plainText.slice(0, 140) + (plainText.length > 140 ? '...' : '');

    const now = Math.floor(Date.now() / 1000);
    const authorId = sessionUser.id || sessionUser.sub;
    const published = is_published ? 1 : 0;
    const validAlbumId = album_id && typeof album_id === 'string' && album_id.trim() ? album_id.trim() : null;

    if (db) {
      if (id) {
        // 更新已有文章：校验作者本人或管理员权限
        const existing = await db.prepare(
          "SELECT id, author_id FROM articles WHERE id = ? LIMIT 1"
        ).bind(id).first<any>();

        if (!existing) {
          return new Response(JSON.stringify({ success: false, error: '文章不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const isOwner = existing.author_id === authorId || sessionUser.role === 'admin';
        if (!isOwner) {
          return new Response(JSON.stringify({ success: false, error: '无权编辑他人文章' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const finalOrder = album_order ? Number(album_order) : (existing.album_order || 1);
        const finalChapter = typeof chapter_label === 'string' ? chapter_label.trim() : '';

        await db.prepare(`
          UPDATE articles
          SET title = ?, summary = ?, content = ?, dimension = ?, album_id = ?, album_order = ?, chapter_label = ?, tags = ?, read_time = ?, is_published = ?, updated_at = ?
          WHERE id = ?
        `).bind(
          title.trim(),
          summary,
          content,
          dimension,
          validAlbumId,
          finalOrder,
          finalChapter,
          cleanTags,
          readTime,
          published,
          now,
          id
        ).run();

        return new Response(JSON.stringify({
          success: true,
          message: '文章已成功更新装帧',
          data: { id, title: title.trim(), is_published: published, album_id: validAlbumId, album_order: finalOrder, tags: cleanTags }
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 创建新文章
      let assignedOrder = 1;
      if (validAlbumId) {
        if (album_order) {
          assignedOrder = Number(album_order);
        } else {
          const maxOrderRow = await db.prepare(
            "SELECT COALESCE(MAX(album_order), 0) as max_ord FROM articles WHERE album_id = ?"
          ).bind(validAlbumId).first<{ max_ord: number }>();
          assignedOrder = (maxOrderRow?.max_ord || 0) + 1;
        }
      }
      const finalChapter = typeof chapter_label === 'string' ? chapter_label.trim() : '';

      const slug = `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const result = await db.prepare(`
        INSERT INTO articles (author_id, slug, title, summary, content, dimension, album_id, album_order, chapter_label, tags, read_time, views, is_published, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      `).bind(
        authorId,
        slug,
        title.trim(),
        summary,
        content,
        dimension,
        validAlbumId,
        assignedOrder,
        finalChapter,
        cleanTags,
        readTime,
        published,
        published ? now : null,
        now,
        now
      ).run();

      const newId = result.meta?.last_row_id || Date.now();

      return new Response(JSON.stringify({
        success: true,
        message: '文章已成功发表装帧成册',
        data: {
          id: newId,
          slug,
          title: title.trim(),
          is_published: published,
          album_id: validAlbumId,
          album_order: assignedOrder,
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

// 3. 删除文章接口 (作者权限校验 + 安全从 D1 抹除)
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB;
    const sessionUser = (locals as any)?.user;
    if (!sessionUser) {
      return new Response(JSON.stringify({ success: false, error: '请先登入作者账号' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    const id = idStr ? Number(idStr) : null;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少待删除文章 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authorId = sessionUser.id || sessionUser.sub;

    if (db) {
      const existing = await db.prepare(
        "SELECT id, author_id, title FROM articles WHERE id = ? LIMIT 1"
      ).bind(id).first<any>();

      if (!existing) {
        return new Response(JSON.stringify({ success: false, error: '文章不存在或已被删除' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const isOwner = existing.author_id === authorId || sessionUser.role === 'admin';
      if (!isOwner) {
        return new Response(JSON.stringify({ success: false, error: '无权删除他人文章' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 执行删除 (外键约束将自动级联清理 annotations 批注)
      await db.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: '卷帙文章已成功从书箧中抹除',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Delete article failed:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || '删除文章失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

