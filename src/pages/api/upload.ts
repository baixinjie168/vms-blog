import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

export const prerender = false;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || locals.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "无权访问，请以博主身份登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

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
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return new Response(JSON.stringify({ error: "仅支持 JPG, PNG, WebP, GIF, SVG 图片" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : ".png";
    const fileKey = `uploads/${yearMonth}/${crypto.randomUUID().replace(/-/g, "")}${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    await env.ASSETS_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: { contentType: mimeType },
      customMetadata: {
        uploaderId: locals.user.sub,
        uploaderEmail: locals.user.email
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
