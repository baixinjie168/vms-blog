import { buildEmailMessage } from "./emailMessage";

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
}

export interface MailSendResult {
  success: boolean;
  provider: "resend" | "cloudflare" | "none";
  error?: string;
  isUnverifiedDestination?: boolean;
}

/**
 * 统一多通道邮件发送工具
 * 优先级 1: Resend HTTP API (若配置了 RESEND_API_KEY，支持任意收件人地址无白名单限制)
 * 优先级 2: Cloudflare Workers 原生 send_email 绑定 (EMAIL_SERVICE)
 */
export async function sendEmailUnified(
  env: any,
  payload: MailPayload
): Promise<MailSendResult> {
  const { to, subject, html, fromName = "VMS · 未鸣时", fromEmail = "auth@250258.xyz" } = payload;
  const resendApiKey =
    env?.RESEND_API_KEY ||
    env?.runtime?.env?.RESEND_API_KEY ||
    (typeof process !== "undefined" ? process.env?.RESEND_API_KEY : undefined);

  // 1. 若配置了 Resend 密钥，优先通过 Resend API 发送（可直达外部邮箱，无 Cloudflare 免费版白名单限制）
  if (resendApiKey && typeof resendApiKey === "string" && resendApiKey.trim()) {
    try {
      const apiKey = resendApiKey.trim();
      const customFrom = env?.RESEND_FROM || `${fromName} <${fromEmail}>`;

      let res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: customFrom,
          to: [to],
          subject,
          html,
        }),
      });

      let data: any = await res.json().catch(() => ({}));

      // 如果提示自定义发信域名尚未在 Resend 控制台验证，自动降级使用 Resend 沙盒通道 onboarding@resend.dev 重试
      if (!res.ok && data?.message && data.message.includes("domain") && data.message.includes("not verified")) {
        console.warn(`[Resend] Custom domain '${fromEmail}' is not yet verified in Resend. Retrying with 'onboarding@resend.dev'...`);
        res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <onboarding@resend.dev>`,
            to: [to],
            subject,
            html,
          }),
        });
        data = await res.json().catch(() => ({}));
      }

      if (res.ok && data?.id) {
        console.log(`[Resend] Activation email sent successfully to ${to}, id: ${data.id}`);
        return { success: true, provider: "resend" };
      }
      console.warn("Resend email send error:", data);
    } catch (err: any) {
      console.warn("Failed to send email via Resend:", err?.message || err);
    }
  }

  // 2. 尝试使用 Cloudflare Workers 原生 EMAIL_SERVICE 绑定
  if (env?.EMAIL_SERVICE && typeof env.EMAIL_SERVICE.send === "function") {
    try {
      const message = buildEmailMessage({
        from: fromEmail,
        fromName,
        to,
        subject,
        html,
      });

      await env.EMAIL_SERVICE.send(message);
      return { success: true, provider: "cloudflare" };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn("Notice: EMAIL_SERVICE.send failed:", errMsg);

      const isUnverified = errMsg.includes("destination address is not a verified address");
      return {
        success: false,
        provider: "cloudflare",
        error: errMsg,
        isUnverifiedDestination: isUnverified,
      };
    }
  }

  // 3. 无可用发信通道
  return {
    success: false,
    provider: "none",
    error: "No available email service configured",
  };
}
