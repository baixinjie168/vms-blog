import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { generateSecureToken } from "../../../utils/crypto";
import { renderActivationEmail } from "../../../utils/emailTemplate";
import { buildEmailMessage } from "../../../utils/emailMessage";
import { ensureAuthSchema } from "../../../utils/dbInit";

export const prerender = false;

const SENDER_EMAIL = "auth@250258.xyz";

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = cfEnv;
    await ensureAuthSchema(env.DB);

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return new Response(JSON.stringify({ error: "请输入有效的邮箱地址" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = Math.floor(Date.now() / 1000);

    // 1. 查询用户状态
    const user = await env.DB.prepare(
      "SELECT id, email, nickname, is_active FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first<{
      id: string;
      email: string;
      nickname: string;
      is_active: number;
    }>();

    if (!user) {
      return new Response(JSON.stringify({ error: "未找到该邮箱的注册记录，请先注册" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (user.is_active === 1) {
      return new Response(JSON.stringify({
        error: "该账号已处于激活状态，请直接使用密码登入",
        alreadyActive: true
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 冷却保护：检查最近 60 秒内是否已生成过激活令牌
    const recentToken = await env.DB.prepare(
      "SELECT created_at FROM activation_tokens WHERE email = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(email).first<{ created_at: number }>();

    if (recentToken && now - recentToken.created_at < 60) {
      const waitSec = 60 - (now - recentToken.created_at);
      return new Response(JSON.stringify({
        error: `请求过于频繁，请等待 ${waitSec} 秒后重试`,
        retryAfter: waitSec
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 重新生成 24 小时令牌
    const activationToken = generateSecureToken(24);
    const expiresAt = now + 24 * 3600;

    await env.DB.prepare("DELETE FROM activation_tokens WHERE email = ?").bind(email).run();
    await env.DB.prepare(
      "INSERT INTO activation_tokens (token, user_id, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(activationToken, user.id, email, expiresAt, now).run();

    // 4. 组装激活链接与邮件
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    const activationUrl = `${origin}/auth/activate?token=${activationToken}`;

    const emailHtml = renderActivationEmail({
      nickname: user.nickname,
      email: user.email,
      activationUrl,
      expiresInHours: 24
    });

    let mailSent = false;
    if (env.EMAIL_SERVICE && typeof env.EMAIL_SERVICE.send === "function") {
      try {
        const message = buildEmailMessage({
          from: SENDER_EMAIL,
          fromName: "VMS · 未鸣时",
          to: user.email,
          subject: "【VMS】重新发送：激活您的数字花园研读账号",
          html: emailHtml
        });
        await env.EMAIL_SERVICE.send(message);
        mailSent = true;
      } catch (err) {
        console.error("Failed to resend activation email:", err);
      }
    } else {
      console.warn("[VMS Auth Dev] Resend Activation URL:", activationUrl);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "激活邮件已重新发送至您的邮箱，请注意查收",
      devActivationUrl: !mailSent ? activationUrl : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Resend activation error:", error);
    return new Response(JSON.stringify({
      error: "重新发送激活邮件服务异常",
      details: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
