import type { APIRoute } from "astro";
import { verifyJwt } from "../../../utils/jwt";
import { env as cfEnv } from "cloudflare:workers";

export const prerender = false;

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const GET: APIRoute = async ({ request }) => {
  const token = parseCookie(request.headers.get("cookie"), "vms_session");
  if (!token) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const payload = await verifyJwt(token, (cfEnv as any).JWT_SECRET || undefined);
  if (!payload) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({
    user: {
      id: payload.sub,
      email: payload.email,
      nickname: payload.nickname,
      role: payload.role,
      avatar_bg: payload.avatar_bg
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
