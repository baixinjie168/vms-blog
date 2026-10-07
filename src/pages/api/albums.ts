import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { ensureBlogSchema } from '../../utils/dbInit';
import { BlogService, normalizeDimension } from '../../services/blogService';

export const prerender = false;

// 1. 获取专栏专辑列表 (支持按当前作者或全局公开)
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.DB;
    await ensureBlogSchema(db);

    const sessionUser = (locals as any)?.user;
    const url = new URL(request.url);
    const authorId = url.searchParams.get('authorId') || (sessionUser ? sessionUser.id : undefined);
    const withArticles = url.searchParams.get('withArticles') === 'true';

    if (!db) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const albums = await BlogService.getAlbums(db, authorId);

    // 若需要附加专栏内各文章的章节顺序清单
    if (withArticles && albums.length > 0) {
      const albumsWithArticles = await Promise.all(
        albums.map(async (alb) => {
          const articlesRes = await db.prepare(`
            SELECT id, title, slug, dimension, album_order, chapter_label, is_published, created_at
            FROM articles
            WHERE album_id = ? AND is_published = 1
            ORDER BY album_order ASC, created_at ASC
          `).bind(alb.id).all();

          return {
            ...alb,
            articles: articlesRes?.results || [],
          };
        })
      );

      return new Response(JSON.stringify({ success: true, data: albumsWithArticles }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: albums }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Fetch albums failed:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || '获取专栏失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// 2. 创建新专栏专辑 (支持批量归入并按序编排已有文章)
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
    const { title, description, category, articleIds } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ success: false, error: '专辑名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authorId = sessionUser.id || sessionUser.sub;
    const shortId = Math.random().toString(36).substring(2, 7);
    const now = Math.floor(Date.now() / 1000);
    const albumId = `alb_${Date.now().toString(36)}_${shortId}`;
    const slug = `alb-${Date.now().toString(36)}-${shortId}`;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        data: { id: albumId, slug, title: title.trim(), description: description || '' }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 写入专栏专辑表
    await db.prepare(`
      INSERT INTO albums (id, author_id, slug, title, description, cover_image, sort_order, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NULL, 1, 1, ?, ?)
    `).bind(
      albumId,
      authorId,
      slug,
      title.trim(),
      (description || '').trim(),
      now,
      now
    ).run();

    // 批量归入作者选择的已有文章，并严格按先后顺序分配 album_order (1, 2, 3...)
    if (Array.isArray(articleIds) && articleIds.length > 0) {
      for (let i = 0; i < articleIds.length; i++) {
        const artId = Number(articleIds[i]);
        const orderIndex = i + 1;
        await db.prepare(`
          UPDATE articles 
          SET album_id = ?, album_order = ?, updated_at = ?
          WHERE id = ? AND (author_id = ? OR ? = 'admin')
        `).bind(albumId, orderIndex, now, artId, authorId, sessionUser.role || '').run();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: '专栏专辑已成功装帧创建',
      data: {
        id: albumId,
        slug,
        title: title.trim(),
        description: description || '',
        articleCount: Array.isArray(articleIds) ? articleIds.length : 0,
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Create album failed:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || '创建专辑失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// 3. 更新专栏专辑元数据与文章章节顺序
export const PUT: APIRoute = async ({ request, locals }) => {
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
    const { id, title, description, articleIds } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少专辑 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authorId = sessionUser.id || sessionUser.sub;
    const now = Math.floor(Date.now() / 1000);

    if (db) {
      // 检查专辑权限
      const album = await db.prepare(
        "SELECT id, author_id FROM albums WHERE id = ? LIMIT 1"
      ).bind(id).first<any>();

      if (!album) {
        return new Response(JSON.stringify({ success: false, error: '专辑不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (album.author_id !== authorId && sessionUser.role !== 'admin') {
        return new Response(JSON.stringify({ success: false, error: '无权修改他人专栏专辑' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 更新基本信息
      await db.prepare(`
        UPDATE albums
        SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = ?
        WHERE id = ?
      `).bind(title ? title.trim() : null, description ? description.trim() : null, now, id).run();

      // 如果更新了文章收录与排序
      if (Array.isArray(articleIds)) {
        // 先将原属于该专辑但本次未勾选的文章移出专辑
        await db.prepare(`
          UPDATE articles
          SET album_id = NULL, album_order = 1, updated_at = ?
          WHERE album_id = ? AND (author_id = ? OR ? = 'admin')
        `).bind(now, id, authorId, sessionUser.role || '').run();

        // 重新按最新顺序分配序号
        for (let i = 0; i < articleIds.length; i++) {
          const artId = Number(articleIds[i]);
          const orderIndex = i + 1;
          await db.prepare(`
            UPDATE articles 
            SET album_id = ?, album_order = ?, updated_at = ?
            WHERE id = ? AND (author_id = ? OR ? = 'admin')
          `).bind(id, orderIndex, now, artId, authorId, sessionUser.role || '').run();
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: '专栏编排已更新' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Update album failed:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || '更新专辑失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// 4. 解散/删除专栏专辑 (安全解构：文章自动保留在个人独立书箧中，不误删文章)
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
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少专辑 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authorId = sessionUser.id || sessionUser.sub;

    if (db) {
      const album = await db.prepare(
        "SELECT id, author_id FROM albums WHERE id = ? LIMIT 1"
      ).bind(id).first<any>();

      if (!album) {
        return new Response(JSON.stringify({ success: false, error: '专辑不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (album.author_id !== authorId && sessionUser.role !== 'admin') {
        return new Response(JSON.stringify({ success: false, error: '无权删除他人专栏专辑' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const now = Math.floor(Date.now() / 1000);
      // 1. 安全解除文章关联
      await db.prepare(`
        UPDATE articles SET album_id = NULL, album_order = 1, updated_at = ? WHERE album_id = ?
      `).bind(now, id).run();

      // 2. 移除专辑主体
      await db.prepare("DELETE FROM albums WHERE id = ?").bind(id).run();
    }

    return new Response(JSON.stringify({ success: true, message: '专栏专辑已解散，所属卷帙已保留在个人独立书箧中' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Delete album failed:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || '删除专辑失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
