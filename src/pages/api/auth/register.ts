import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { hashPassword, generateSecureToken } from "../../../utils/crypto";
import { renderActivationEmail } from "../../../utils/emailTemplate";
import { buildEmailMessage } from "../../../utils/emailMessage";

export const prerender = false;

// 邮箱校验正则
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 官方发信地址
const SENDER_EMAIL = "auth@250258.xyz";

// 预设管理员名单
const DEFAULT_ADMIN_EMAILS = ["admin@250258.xyz", "apple@250258.xyz"];

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = cfEnv;
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rawNickname = typeof body.nickname === "string" ? body.nickname.trim() : "";

    // 1. 基本参数合法性校验
    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "请输入有效的邮箱地址" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "密码长度至少需要 6 位字符" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (password.length > 64) {
      return new Response(JSON.stringify({ error: "密码长度不能超过 64 位字符" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = Math.floor(Date.now() / 1000);

    // 2. 检查用户是否已存在
    const existingUser = await env.DB.prepare(
      "SELECT id, email, nickname, is_active FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first<{
      id: string;
      email: string;
      nickname: string;
      is_active: number;
    }>();

    if (existingUser && existingUser.is_active === 1) {
      return new Response(JSON.stringify({
        error: "该邮箱已被注册，请直接使用账号密码登入",
        code: "USER_ALREADY_EXISTS"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 计算密码 PBKDF2 安全哈希
    const passwordHash = await hashPassword(password);
    let userId: string;
    let finalNickname: string;

    const configuredAdmins = (env as any).ADMIN_EMAIL
      ? (env as any).ADMIN_EMAIL.split(",").map((s: string) => s.trim().toLowerCase())
      : [];
    const isSystemAdmin = configuredAdmins.includes(email) || DEFAULT_ADMIN_EMAILS.includes(email);
    const assignedRole = isSystemAdmin ? "admin" : "reader";

    if (existingUser) {
      // 曾提交过注册但尚未激活：更新其密码与昵称
      userId = existingUser.id;
      finalNickname = rawNickname || existingUser.nickname;
      await env.DB.prepare(
        "UPDATE users SET password_hash = ?, nickname = ?, updated_at = ? WHERE id = ?"
      ).bind(passwordHash, finalNickname, now, userId).run();
    } else {
      // 全新注册：创建未激活读者记录
      const shortId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      userId = `usr_${shortId}`;
      finalNickname = rawNickname || `墨客_${shortId.slice(0, 4)}`;
      const avatarBgs = ["bg-stone-800", "bg-emerald-800", "bg-teal-800", "bg-amber-900", "bg-slate-800"];
      const randomBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

      await env.DB.prepare(
        `INSERT INTO users (id, email, nickname, bio, avatar_url, avatar_bg, role, password_hash, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 0, ?, ?)`
      ).bind(
        userId,
        email,
        finalNickname,
        "浮生研墨，漫步林泉。",
        randomBg,
        assignedRole,
        passwordHash,
        now,
        now
      ).run();
    }

    // 4. 生成 24 小时有效的激活令牌
    const activationToken = generateSecureToken(24);
    const expiresAt = now + 24 * 3600;

    // 清理该邮箱之前的待激活令牌
    await env.DB.prepare("DELETE FROM activation_tokens WHERE email = ?").bind(email).run();

    // 写入新激活令牌
    await env.DB.prepare(
      "INSERT INTO activation_tokens (token, user_id, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(activationToken, userId, email, expiresAt, now).run();

    // 5. 拼装激活链接 (自适应当前访问域名或端口)
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    const activationUrl = `${origin}/auth/activate?token=${activationToken}`;

    // 6. 发送激活邮件
    const emailHtml = renderActivationEmail({
      nickname: finalNickname,
      email,
      activationUrl,
      expiresInHours: 24
    });

    let mailSent = false;
    if (env.EMAIL_SERVICE && typeof env.EMAIL_SERVICE.send === "function") {
      try {
        const message = buildEmailMessage({
          from: SENDER_EMAIL,
          fromName: "VMS · 未鸣时",
          to: email,
          subject: "【VMS】激活您的数字花园研读账号",
          html: emailHtml
        });
        await env.EMAIL_SERVICE.send(message);
        mailSent = true;
      } catch (err) {
        console.error("Failed to send activation email via EMAIL_SERVICE:", err);
      }
    } else {
      console.warn("[VMS Auth Dev] EMAIL_SERVICE not bound. Activation URL:", activationUrl);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "激活邮件已成功发送至您的邮箱，请前往查收并激活账号",
      email,
      // 开发环境下额外返回激活链接方便离线测试
      devActivationUrl: !mailSent ? activationUrl : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Register error:", error);
    return new Response(JSON.stringify({
      error: "注册服务异常，请稍后重试",
      details: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
