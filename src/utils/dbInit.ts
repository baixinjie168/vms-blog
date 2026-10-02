/**
 * Cloudflare D1 数据库认证模型自愈与热迁移初始化器
 * 在边缘运行时首个请求到达时，自动探测并增量补齐 users (password_hash, is_active) 及 activation_tokens 表
 * 避免因生产环境未手动执行 CLI 迁移而导致 500 异常
 */

let schemaEnsured = false;

export async function ensureAuthSchema(db: any): Promise<void> {
  if (schemaEnsured || !db) return;

  try {
    // 1. 获取 users 表的现有列
    const colsResult = await db.prepare("PRAGMA table_info(users)").all();
    const colNames: string[] = (colsResult?.results || []).map((c: any) => c.name);

    // 2. 若缺少 password_hash 列，动态追加
    if (!colNames.includes("password_hash")) {
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN password_hash TEXT").run();
      } catch (err: any) {
        console.warn("Notice: ALTER password_hash:", err?.message);
      }
    }

    // 3. 若缺少 is_active 列，动态追加并激活老用户
    if (!colNames.includes("is_active")) {
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 0").run();
        await db.prepare("UPDATE users SET is_active = 1 WHERE is_active = 0").run();
      } catch (err: any) {
        console.warn("Notice: ALTER is_active:", err?.message);
      }
    }

    // 4. 确保博主管理员初始密码就绪 (Admin#2026!)
    try {
      await db.prepare(`
        UPDATE users 
        SET password_hash = 'pbkdf2:sha256:100000:1f308d9dd56eea4e08d0489b65e961df:70685f66832f69a4405e69ebe3c817685355822dc4aa4fcd503a3c395c4f97f6' 
        WHERE email = 'admin@250258.xyz' AND (password_hash IS NULL OR password_hash = '')
      `).run();
    } catch (_) {}

    // 5. 确保 activation_tokens 关联表与索引存在
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS activation_tokens (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `).run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_activation_tokens_user ON activation_tokens(user_id)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_activation_tokens_email ON activation_tokens(email)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_activation_tokens_expires ON activation_tokens(expires_at)").run();
    } catch (err: any) {
      console.warn("Notice: CREATE activation_tokens:", err?.message);
    }

    schemaEnsured = true;
  } catch (err) {
    console.error("Failed to ensureAuthSchema:", err);
  }
}

let blogSchemaEnsured = false;

export async function ensureBlogSchema(db: any): Promise<void> {
  if (blogSchemaEnsured || !db) return;

  try {
    const colsResult = await db.prepare("PRAGMA table_info(articles)").all();
    const colNames: string[] = (colsResult?.results || []).map((c: any) => c.name);

    if (!colNames.includes("album_order")) {
      try {
        await db.prepare("ALTER TABLE articles ADD COLUMN album_order INTEGER DEFAULT 1").run();
      } catch (err: any) {
        console.warn("Notice: ALTER album_order:", err?.message);
      }
    }

    if (!colNames.includes("chapter_label")) {
      try {
        await db.prepare("ALTER TABLE articles ADD COLUMN chapter_label TEXT DEFAULT ''").run();
      } catch (err: any) {
        console.warn("Notice: ALTER chapter_label:", err?.message);
      }
    }

    try {
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_articles_album_order ON articles(album_id, album_order ASC)").run();
    } catch (_) {}

    blogSchemaEnsured = true;
  } catch (err) {
    console.error("Failed to ensureBlogSchema:", err);
  }
}
