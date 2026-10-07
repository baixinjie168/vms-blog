import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

export const prerender = false;

// MIME 白名单 → 落盘扩展名。刻意排除 image/svg+xml：
// SVG 可内嵌 <script>，而本接口经由 /api/assets 同源回源，会构成存储型 XSS。
const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const sessionUser = (locals as any)?.user;
    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "请先登入作者账号" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const uploaderId = sessionUser.id || sessionUser.sub;
    const uploaderEmail = sessionUser.email || '';

    const env = cfEnv;
    if (!env.ASSETS_BUCKET) {
      return new Response(JSON.stringify({ error: "R2 存储桶 ASSETS_BUCKET 未绑定" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "请上传有效的图片文件 (字段名需为 'file')" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "图片超出 5MB 限制" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const mimeType = file.type || "application/octet-stream";
    const ext = ALLOWED_MIME_TYPES.get(mimeType);
    if (!ext) {
      return new Response(JSON.stringify({ error: "仅支持 JPG, PNG, WebP, GIF 图片" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    // 扩展名取自已校验的 MIME 类型，不信任客户端文件名
    const fileKey = `uploads/${yearMonth}/${crypto.randomUUID().replace(/-/g, "")}${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    await env.ASSETS_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: { contentType: mimeType },
      customMetadata: {
        uploaderId,
        uploaderEmail
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "图片上传成功",
      url: `/api/assets/${fileKey}`,
      key: fileKey,
      size: file.size
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Upload failed:", error);
    return new Response(JSON.stringify({
      error: "图片写入 R2 异常",
      details: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
