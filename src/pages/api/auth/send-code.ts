import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { renderOtpEmail } from "../../../utils/emailTemplate";
import { buildEmailMessage } from "../../../utils/emailMessage";

// 必须声明 SSR 动态渲染，交由 Cloudflare 边缘处理
export const prerender = false;

// 邮箱校验正则
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 发信地址固定为 250258.xyz 域名下的邮箱
const SENDER_EMAIL = "auth@250258.xyz";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 使用 Cloudflare Workers 规范 env 绑定
    const env = cfEnv;
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    // 1. 参数合法性校验
    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "请输入有效的邮箱地址" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = Math.floor(Date.now() / 1000);

    // 2. 频次与冷却防护：查询同邮箱 60 秒内是否已有有效验证码
    const existing = await env.DB.prepare(
      "SELECT created_at FROM verification_codes WHERE email = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
    ).bind(email, now).first<{ created_at: number }>();

    if (existing && now - existing.created_at < 60) {
      const waitSec = 60 - (now - existing.created_at);
      return new Response(JSON.stringify({
        error: `请求过于频繁，请等待 ${waitSec} 秒后重试`,
        retryAfter: waitSec
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 生成 6 位纯数字验证码与 5 分钟 (300秒) 有效期
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 300;
    const recordId = "code_" + crypto.randomUUID().replace(/-/g, "");

    // 4. 写入 D1 verification_codes 时效表
    await env.DB.prepare(
      "INSERT INTO verification_codes (id, email, code, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)"
    ).bind(recordId, email, code, expiresAt, now).run();

    // 5. 渲染精美书卷邮件 HTML
    const emailHtml = renderOtpEmail(code);

    // 6. 调用 Cloudflare Workers Email Sending (send_email) 原生发信
    const message = buildEmailMessage({
      from: SENDER_EMAIL,
      fromName: "VMS · 数字花园",
      to: email,
      subject: "【VMS】您的研读免密登录验证码",
      html: emailHtml
    });

    await env.EMAIL_SERVICE.send(message);

    return new Response(JSON.stringify({
      success: true,
      message: "验证码已成功发送至您的邮箱，5分钟内有效",
      expiresIn: 300
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Failed to send verification email:", error);
    return new Response(JSON.stringify({
      error: "邮件服务投递异常，请稍后重试",
      details: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
