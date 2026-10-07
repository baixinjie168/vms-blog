import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const key = params.key;
    if (!key) {
      return new Response("Not Found", { status: 404 });
    }

    const env = cfEnv;
    if (!env.ASSETS_BUCKET) {
      return new Response("Storage Not Configured", { status: 500 });
    }

    const object = await env.ASSETS_BUCKET.get(key);

    if (!object) {
      return new Response("Asset Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    if (object.httpEtag) {
      headers.set("etag", object.httpEtag);
    }
    // 静态媒体资源设置 1 年强缓存，极大降低重复请求开销
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    // 禁止浏览器把不可信内容嗅探成 HTML/SVG 等可执行类型
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error("Asset proxy failed:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
