import { EmailMessage } from "cloudflare:email";

export interface SendMailOptions {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  html: string;
}

/**
 * 将 UTF-8 字符串转为 Base64，兼顾纯 Worker 与 Node 运行时
 */
function encodeUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 组装符合 RFC 822 规范的邮件报文并封装为 Cloudflare EmailMessage
 */
export function buildEmailMessage(options: SendMailOptions): EmailMessage {
  const fromName = options.fromName || "VMS · 数字花园";
  const encodedFromName = `=?UTF-8?B?${encodeUtf8Base64(fromName)}?=`;
  const encodedSubject = `=?UTF-8?B?${encodeUtf8Base64(options.subject)}?=`;

  const domain = options.from.split('@')[1] || '250258.xyz';
  const messageId = `<${crypto.randomUUID()}@${domain}>`;

  const rawHeaders = [
    `Message-ID: ${messageId}`,
    `From: ${encodedFromName} <${options.from}>`,
    `To: <${options.to}>`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    `Date: ${new Date().toUTCString()}`,
    ``,
    options.html
  ].join("\r\n");

  return new EmailMessage(options.from, options.to, rawHeaders);
}
