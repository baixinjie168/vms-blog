/**
 * 基于原生 Web Crypto API (HMAC-SHA256) 的轻量 JWT 工具库
 * 零第三方依赖，原生无缝适配 Cloudflare Workers 边缘运行时
 */

export interface JwtPayload {
  sub: string;        // user_id (如 usr_abc123)
  email: string;      // 用户真实邮箱
  nickname: string;   // 读者或博主昵称
  role: 'admin' | 'reader';
  avatar_bg?: string;
  iat?: number;
  exp?: number;
}

export const DEFAULT_SECRET = "vms_digital_garden_jwt_edge_secret_key_2026";

/**
 * 将 UTF-8 文本转为 URL 安全的 Base64 字符串
 */
function base64UrlEncodeText(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 将 URL 安全的 Base64 字符串解码为 UTF-8 文本
 */
function base64UrlDecodeText(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * 将字节数组转为 URL 安全的 Base64 字符串（用于二进制签名）
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 将 URL 安全的 Base64 字符串解码为字节数组（用于验签二进制比对）
 */
function base64UrlToBytes(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 导入 HMAC 签名密钥
 */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * 签发 JWT 会话令牌
 */
export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret = DEFAULT_SECRET,
  expiresInSeconds = 30 * 24 * 3600 // 默认 30 天
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encHeader = base64UrlEncodeText(JSON.stringify(header));
  const encPayload = base64UrlEncodeText(JSON.stringify(fullPayload));
  const data = `${encHeader}.${encPayload}`;

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = bytesToBase64Url(new Uint8Array(signature));

  return `${data}.${sigB64}`;
}

/**
 * 校验 JWT 会话令牌并解析载荷
 */
export async function verifyJwt(
  token: string,
  secret = DEFAULT_SECRET
): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const data = `${headerB64}.${payloadB64}`;
    const key = await getHmacKey(secret);
    const sigBytes = base64UrlToBytes(sigB64);

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
    if (!isValid) return null;

    const payload: JwtPayload = JSON.parse(base64UrlDecodeText(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}
