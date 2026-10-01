import { defineMiddleware } from "astro:middleware";
import { verifyJwt } from "./utils/jwt";
import { env as cfEnv } from "cloudflare:workers";

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.request.headers.get("cookie");
  const token = parseCookie(cookie, "vms_session");

  if (token) {
    const payload = await verifyJwt(token, (cfEnv as any)?.JWT_SECRET || undefined);
    context.locals.user = payload ? { ...payload, id: payload.sub } : null;
  } else {
    context.locals.user = null;
  }

  const url = new URL(context.request.url);

  // 严格拦截写保护路由（如 /api/upload 传图）
  if (url.pathname.startsWith("/api/upload")) {
    if (!context.locals.user || context.locals.user.role !== "admin") {
      return new Response(JSON.stringify({
        error: "鉴权失败：仅博主管理员拥有资源上传权限",
        code: "UNAUTHORIZED_ADMIN"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return next();
});
