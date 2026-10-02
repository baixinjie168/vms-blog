import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { BlogService } from '../../services/blogService';

export const prerender = false;

// 简单 IP 内存频控 (1分钟最多2条批注)
const ipRateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRateLimitMap.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < 60_000);
  if (valid.length >= 2) {
    return false;
  }
  valid.push(now);
  ipRateLimitMap.set(ip, valid);
  return true;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = cfEnv?.DB;
    const url = new URL(request.url);
    const articleIdStr = url.searchParams.get('articleId');
    const articleId = articleIdStr ? parseInt(articleIdStr, 10) : undefined;

    const annotations = await BlogService.getAnnotations(db, articleId);

    return new Response(JSON.stringify({ success: true, data: annotations }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || '获取批注失败' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const db = cfEnv?.DB;
    const ip = clientAddress || request.headers.get('cf-connecting-ip') || '127.0.0.1';

    const body = await request.json();
    const { action, annotationId, articleId, pageIndex, quoteText, content } = body;

    // 处理点赞行为
    if (action === 'like') {
      if (!annotationId) {
        return new Response(JSON.stringify({ success: false, error: '缺少批注 ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (db) {
        const likes = await BlogService.likeAnnotation(db, annotationId);
        return new Response(JSON.stringify({ success: true, likes }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, likes: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 频控防刷拦截
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ success: false, error: '发表过频，请稍候再试（1分钟内限 2 条）' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 校验批注内容
    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(JSON.stringify({ success: false, error: '批注内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (content.length > 500) {
      return new Response(JSON.stringify({ success: false, error: '批注内容超出 500 字上限' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 防 XSS 过滤
    const sanitizedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const currentUser = (locals as any)?.user;
    const userId = currentUser?.id || 'usr_reader_guest';

    if (db) {
      const res = await BlogService.createAnnotation(db, {
        articleId: Number(articleId) || 1,
        userId,
        pageIndex: Number(pageIndex) || 1,
        quoteText: quoteText ? String(quoteText).slice(0, 120) : undefined,
        content: sanitizedContent,
      });

      return new Response(JSON.stringify({ success: true, data: res }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 本地开发无 D1 时降级回显
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: `ann_mock_${Date.now()}`,
          created_at: Math.floor(Date.now() / 1000),
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || '发表批注失败' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
