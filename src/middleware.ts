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

  // 鉴权放行：/api/upload 允许作者正常上传配图至 R2 存储桶，避免本地 Base64 膨胀超出 D1 存储限制
  return next();
});
