/**
 * 原生 Web Crypto API 密码哈希与安全令牌工具库
 * 零第三方依赖，原生支持 Cloudflare Workers 边缘运行时与浏览器环境
 * 采用 PBKDF2 (HMAC-SHA256, 100,000 次迭代, 16 字节高熵加盐)
 */

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * 生成指定长度的密码学安全随机 Hex 令牌
 */
export function generateSecureToken(byteLength = 24): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return bytesToHex(bytes);
}

/**
 * 对用户密码进行 PBKDF2 安全加盐哈希
 * 存储格式: pbkdf2:sha256:<iterations>:<saltHex>:<hashHex>
 */
export async function hashPassword(password: string): Promise<string> {
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    256 // 256 bits = 32 bytes
  );

  const saltHex = bytesToHex(salt);
  const hashHex = bytesToHex(new Uint8Array(derived));

  return `pbkdf2:sha256:${iterations}:${saltHex}:${hashHex}`;
}

/**
 * 校验用户输入的明文密码与存储的哈希串是否匹配
 * 使用恒定时间逐位比较，抵御时序侧信道攻击
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    if (!storedHash || typeof storedHash !== "string") {
      return false;
    }

    const parts = storedHash.split(":");
    if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const salt = hexToBytes(parts[3]);
    const expectedHash = parts[4];

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      key,
      256
    );

    const actualHash = bytesToHex(new Uint8Array(derived));

    // 恒定时间比对
    if (actualHash.length !== expectedHash.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < actualHash.length; i++) {
      diff |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }

    return diff === 0;
  } catch (e) {
    console.error("verifyPassword error:", e);
    return false;
  }
}
