/**
 * Cloudflare D1 数据库认证模型自愈与热迁移初始化器
 * 在边缘运行时首个请求到达时，自动探测并增量补齐 users (password_hash, is_active) 及 activation_tokens 表
 * 避免因生产环境未手动执行 CLI 迁移而导致 500 异常
 */

import { countPlainChars } from './textStats';

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

    // 4. 确保 activation_tokens 关联表与索引存在
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

    if (!colNames.includes("tags")) {
      try {
        await db.prepare("ALTER TABLE articles ADD COLUMN tags TEXT DEFAULT ''").run();
      } catch (err: any) {
        console.warn("Notice: ALTER tags:", err?.message);
      }
    }

    // 正文字数（剥 HTML 标签后的字符数）。刻意不加 DEFAULT：历史行留 NULL 作为
    // 「尚未回填」的标记，回填因此可重复执行。若给了 DEFAULT 0，空文章与未回填
    // 的文章就无法区分，回填会反复空转。
    if (!colNames.includes("char_count")) {
      try {
        await db.prepare("ALTER TABLE articles ADD COLUMN char_count INTEGER").run();
      } catch (err: any) {
        console.warn("Notice: ALTER char_count:", err?.message);
      }
    }

    // 回填历史文章。D1 的 SQL 没有正则，剥不了标签，只能在边缘侧算一遍。
    // 分批进行以免首个请求把全部正文读进内存；每个 isolate 首次调用时跑一次，
    // 未跑完的部分留给后续 isolate 继续，直到 char_count 不再有 NULL。
    try {
      for (let round = 0; round < 20; round++) {
        const stale = await db.prepare(
          "SELECT id, content FROM articles WHERE char_count IS NULL LIMIT 100"
        ).all();
        const rows: any[] = stale?.results || [];
        if (rows.length === 0) break;
        await db.batch(
          rows.map((r: any) =>
            db.prepare("UPDATE articles SET char_count = ? WHERE id = ?")
              .bind(countPlainChars(r.content), r.id)
          )
        );
        if (rows.length < 100) break;
      }
    } catch (err: any) {
      console.warn("Notice: backfill char_count:", err?.message);
    }

    try {
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_articles_album_order ON articles(album_id, album_order ASC)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles(tags)").run();
      // 回填按 `WHERE char_count IS NULL LIMIT 100` 反复扫描，索引让它在收敛前不至于全表扫
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_articles_char_count ON articles(char_count)").run();
    } catch (_) {}

    blogSchemaEnsured = true;
  } catch (err) {
    console.error("Failed to ensureBlogSchema:", err);
  }
}
