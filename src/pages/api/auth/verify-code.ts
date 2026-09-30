import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { signJwt } from "../../../utils/jwt";

export const prerender = false;

// 官方管理员名单 (填入您的个人真实邮箱，登入即自动获得 admin 权限)
const DEFAULT_ADMIN_EMAILS = ["admin@250258.xyz", "apple@250258.xyz"];

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = cfEnv;
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "请输入正确的邮箱与 6 位数字验证码" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = Math.floor(Date.now() / 1000);

    // 1. 查询该邮箱未过期的最新验证码
    const record = await env.DB.prepare(
      "SELECT * FROM verification_codes WHERE email = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
    ).bind(email, now).first<{
      id: string;
      code: string;
      expires_at: number;
      attempts: number;
    }>();

    if (!record) {
      return new Response(JSON.stringify({ error: "验证码不存在或已过期，请重新获取" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 输错次数保护 (防暴力破解)
    if (record.attempts >= 3) {
      await env.DB.prepare("DELETE FROM verification_codes WHERE id = ?").bind(record.id).run();
      return new Response(JSON.stringify({ error: "输错次数已达上限，该验证码已失效，请重新发送" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 校验验证码数值
    if (record.code !== code) {
      const nextAttempts = record.attempts + 1;
      await env.DB.prepare(
        "UPDATE verification_codes SET attempts = ? WHERE id = ?"
      ).bind(nextAttempts, record.id).run();

      const remaining = 3 - nextAttempts;
      return new Response(JSON.stringify({
        error: remaining > 0 ? `验证码错误，还可尝试 ${remaining} 次` : "验证码已输错 3 次作废，请重新获取",
        remainingAttempts: remaining
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. 验证成功，阅后即焚删除该验证码
    await env.DB.prepare("DELETE FROM verification_codes WHERE id = ?").bind(record.id).run();

    // 5. 查找或自动创建用户
    let user = await env.DB.prepare(
      "SELECT id, email, nickname, bio, avatar_url, avatar_bg, role, created_at FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first<{
      id: string;
      email: string;
      nickname: string;
      bio: string;
      avatar_url: string | null;
      avatar_bg: string;
      role: 'admin' | 'reader';
      created_at: number;
    }>();

    const configuredAdmins = (env as any).ADMIN_EMAIL
      ? (env as any).ADMIN_EMAIL.split(",").map((s: string) => s.trim().toLowerCase())
      : [];
    const isSystemAdmin = configuredAdmins.includes(email) || DEFAULT_ADMIN_EMAILS.includes(email);
    const assignedRole = isSystemAdmin ? 'admin' : 'reader';

    if (!user) {
      const shortId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const userId = `usr_${shortId}`;
      const defaultNickname = `墨客_${shortId.slice(0, 4)}`;
      const avatarBgs = ["bg-stone-800", "bg-emerald-800", "bg-teal-800", "bg-amber-900", "bg-slate-800"];
      const randomBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

      await env.DB.prepare(
        `INSERT INTO users (id, email, nickname, bio, avatar_url, avatar_bg, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)`
      ).bind(userId, email, defaultNickname, "浮生研墨，漫步林泉。", randomBg, assignedRole, now, now).run();

      user = {
        id: userId,
        email,
        nickname: defaultNickname,
        bio: "浮生研墨，漫步林泉。",
        avatar_url: null,
        avatar_bg: randomBg,
        role: assignedRole,
        created_at: now
      };
    } else if (isSystemAdmin && user.role !== 'admin') {
      await env.DB.prepare("UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?").bind(now, user.id).run();
      user.role = 'admin';
    }

    // 6. 签发 30 天 HttpOnly 会话 Cookie
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
      message: "身份核验成功，欢迎漫步数字花园",
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
    console.error("Verify code error:", error);
    return new Response(JSON.stringify({
      error: "服务器处理核验失败，请重试",
      details: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
