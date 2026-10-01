import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { verifyPassword } from "../../../utils/crypto";
import { signJwt } from "../../../utils/jwt";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = cfEnv;
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "请输入邮箱与登录密码" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. 查询用户
    const user = await env.DB.prepare(
      "SELECT id, email, nickname, bio, avatar_url, avatar_bg, role, password_hash, is_active, created_at FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first<{
      id: string;
      email: string;
      nickname: string;
      bio: string;
      avatar_url: string | null;
      avatar_bg: string;
      role: "admin" | "reader";
      password_hash: string | null;
      is_active: number;
      created_at: number;
    }>();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号或密码错误" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 检查激活状态
    if (user.is_active !== 1) {
      return new Response(JSON.stringify({
        error: "该账号尚未激活，请前往您的注册邮箱点击激活链接",
        needActivation: true,
        email: user.email
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 校验密码
    if (!user.password_hash) {
      return new Response(JSON.stringify({
        error: "该账号尚未设置密码，请联系管理员或重新注册"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "账号或密码错误" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. 签发 30 天 HttpOnly 会话 Cookie
    const token = await signJwt({
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      avatar_bg: user.avatar_bg
    }, (env as any).JWT_SECRET || undefined, 30 * 24 * 3600);

    const isProd = process.env.NODE_ENV === "production";
    const cookieHeader = `vms_session=${token}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=2592000`;

    return new Response(JSON.stringify({
      success: true,
      message: "登入成功，欢迎漫步数字花园",
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        avatar_bg: user.avatar_bg
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader
      }
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({
      error: "登录服务异常，请稍后重试",
      details: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
