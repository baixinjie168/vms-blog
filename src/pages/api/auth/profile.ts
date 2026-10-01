import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { signJwt } from "../../../utils/jwt";

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv?.DB ? cfEnv : (locals as any)?.runtime?.env;
    const sessionUser = (locals as any)?.user;
    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = sessionUser.id || sessionUser.sub;
    const body = await request.json().catch(() => ({}));
    const rawNickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const rawBio = typeof body.bio === "string" ? body.bio.trim() : "";

    if (!rawNickname) {
      return new Response(JSON.stringify({ error: "用户昵称不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = Math.floor(Date.now() / 1000);

    // 更新用户资料
    if (env?.DB) {
      await env.DB.prepare(
        "UPDATE users SET nickname = ?, bio = ?, updated_at = ? WHERE id = ?"
      ).bind(rawNickname, rawBio, now, userId).run();
    }

    // 重新签发含新昵称的会话令牌
    const token = await signJwt({
      sub: userId,
      email: sessionUser.email,
      nickname: rawNickname,
      role: sessionUser.role,
      avatar_bg: sessionUser.avatar_bg
    }, (env as any).JWT_SECRET || undefined, 30 * 24 * 3600);

    const isProd = process.env.NODE_ENV === "production";
    const cookieHeader = `vms_session=${token}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=2592000`;

    return new Response(JSON.stringify({
      success: true,
      message: "个人独白与资料更新成功",
      user: {
        id: userId,
        email: sessionUser.email,
        nickname: rawNickname,
        bio: rawBio,
        role: sessionUser.role,
        avatar_bg: sessionUser.avatar_bg
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader
      }
    });

  } catch (err: any) {
    console.error("Update profile error:", err);
    return new Response(JSON.stringify({
      error: "更新资料服务异常",
      details: err?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
