-- ====================================================================
-- Version: v1.2.0
-- Timestamp: 20261002073000 (2026-10-02 07:30:00)
-- Description: 增加密码安全凭证与邮箱链接激活支持
-- Tables: users (新增 password_hash, is_active), activation_tokens (新建)
-- Database: Cloudflare D1 (SQLite)
-- Target: 支持读者邮箱注册、链接激活、密码安全认证与持久会话
-- ====================================================================

-- 1. 为 users 表追加密码哈希与激活状态字段
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 0;

-- 2. 将已有种子用户 (例如 admin@250258.xyz) 设置为激活状态
UPDATE users SET is_active = 1 WHERE is_active = 0;

-- 3. 为博主管理员账号预置初始安全密码: Admin#2026!
UPDATE users 
SET password_hash = 'pbkdf2:sha256:100000:1f308d9dd56eea4e08d0489b65e961df:70685f66832f69a4405e69ebe3c817685355822dc4aa4fcd503a3c395c4f97f6' 
WHERE email = 'admin@250258.xyz' AND (password_hash IS NULL OR password_hash = '');

-- 4. 创建账号激活凭证表 (activation_tokens)
CREATE TABLE IF NOT EXISTS activation_tokens (
  token TEXT PRIMARY KEY,                    -- 激活令牌 (32位十六进制高熵串)
  user_id TEXT NOT NULL,                     -- 关联合法用户 ID
  email TEXT NOT NULL,                       -- 目标激活邮箱
  expires_at INTEGER NOT NULL,               -- 过期时间戳 (默认 24 小时)
  created_at INTEGER NOT NULL,               -- 签发时间戳
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activation_tokens_user ON activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_email ON activation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_expires ON activation_tokens(expires_at);
