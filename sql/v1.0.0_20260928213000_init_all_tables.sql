-- ====================================================================
-- Version: v1.0.0
-- Timestamp: 20260928213000 (2026-09-28 21:30:00)
-- Description: 《VMS》全量数据表初始化 (全栈数字花园完整模型 - 实体归属完备版)
-- Tables: users, verification_codes, albums, articles, annotations, annotation_likes, bookmarks
-- Database: Cloudflare D1 (SQLite)
-- Target: 阶段二全量数据底座与 Drizzle ORM 模型对齐
-- ====================================================================

-- 1. 用户主体表 (免密轻量版)
-- 包含个人独白名片 (bio) 与头像，供主页右栏博主名片与读者身份联动
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                       -- 用户唯一 ID (如: usr_abc123)
  email TEXT UNIQUE NOT NULL,                -- 唯一真实邮箱
  nickname TEXT NOT NULL,                    -- 读者/博主昵称 (如: 墨客·行者)
  bio TEXT DEFAULT '',                       -- 个人独白/座右铭 (对应主页右栏独白卡片)
  avatar_url TEXT,                           -- 自定义头像 URL (可托管于 R2)
  avatar_bg TEXT DEFAULT 'bg-stone-800',     -- 头像随机底色
  role TEXT DEFAULT 'reader',                -- 权限: 'admin' (博主) | 'reader' (墨客读者)
  github_url TEXT,                           -- 个人 GitHub / 社交链接
  created_at INTEGER NOT NULL,               -- 注册时间戳 (秒级 Unix)
  updated_at INTEGER NOT NULL                -- 更新时间戳 (秒级 Unix)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. 验证码防爆破与时效表 (5分钟时效 + 最多3次重试防爆破)
CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY,                       -- 记录唯一 ID (如: code_xyz789)
  email TEXT NOT NULL,                       -- 目标邮箱
  code TEXT NOT NULL,                        -- 6 位纯数字验证码
  expires_at INTEGER NOT NULL,               -- 过期时间戳 (创建时间 + 300s)
  attempts INTEGER DEFAULT 0,                -- 输错尝试计数 (超过 3 次作废)
  created_at INTEGER NOT NULL                -- 创建时间戳 (秒级 Unix)
);
CREATE INDEX IF NOT EXISTS idx_verify_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verify_expires ON verification_codes(expires_at);

-- 3. 专栏与专辑表 (Albums)
-- 明确关联创建者 author_id，支持博主主页专栏筛选与未来共建人专栏扩展
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,                       -- 专辑 ID (如: alb_mindset)
  author_id TEXT NOT NULL,                   -- 创建者/博主用户 ID
  slug TEXT UNIQUE NOT NULL,                 -- URL 路径别名 (如: architectural-thinking)
  title TEXT NOT NULL,                       -- 专辑标题 (如: 架构思辨录)
  description TEXT,                          -- 导读与简介 (右栏专栏流与中栏顶部导读展示)
  cover_image TEXT,                          -- 封面图 URL (存储于 R2)
  sort_order INTEGER DEFAULT 0,              -- 排序权重
  is_published INTEGER DEFAULT 1,            -- 是否公开 (0: 草稿, 1: 已发布)
  created_at INTEGER NOT NULL,               -- 创建时间戳
  updated_at INTEGER NOT NULL,               -- 更新时间戳
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_albums_author ON albums(author_id);
CREATE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);

-- 4. 博客文章主体表 (Articles)
-- 明确关联创作者 author_id；支持七维认知体系 (道心法术器事势) 与日历成文打点统计
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,      -- 文章自增 ID
  author_id TEXT NOT NULL,                   -- 作者/博主用户 ID (关联 users.id)
  slug TEXT UNIQUE NOT NULL,                 -- 访问别名 (如: on-digital-gardening)
  title TEXT NOT NULL,                       -- 文章标题
  summary TEXT,                              -- 摘要简介 (用于中栏卡片展示)
  content TEXT NOT NULL,                     -- 正文内容 (Markdown / HTML / Tiptap JSON AST)
  cover_image TEXT,                          -- 封面配图 (存储于 R2)
  dimension TEXT NOT NULL,                   -- 七大认知维度: 'dao'|'xin'|'fa'|'shu'|'qi'|'shi_matter'|'shi_trend'
  album_id TEXT,                             -- 所属专辑 ID (可为空)
  read_time INTEGER DEFAULT 5,               -- 预估研读耗时 (分钟)
  views INTEGER DEFAULT 0,                   -- 浏览次数统计
  is_published INTEGER DEFAULT 0,            -- 发布状态 (0: 草稿, 1: 已发布)
  published_at INTEGER,                      -- 首次发布时间戳
  created_at INTEGER NOT NULL,               -- 创建时间戳 (用于文渊日历月视图成卷打点)
  updated_at INTEGER NOT NULL,               -- 更新时间戳
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_dim ON articles(dimension);
CREATE INDEX IF NOT EXISTS idx_articles_album ON articles(album_id);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_calendar ON articles(author_id, created_at);

-- 5. 读者研读批注流表 (Annotations)
-- 关联双页对开页码 (page_index) 与特定引用文字
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,                       -- 批注 ID (如: ann_123456)
  article_id INTEGER NOT NULL,               -- 所属文章 ID
  user_id TEXT NOT NULL,                     -- 批注者用户 ID
  page_index INTEGER DEFAULT 1,              -- 关联翻书对开页码 (第几对页)
  quote_text TEXT,                           -- 读者选中的引用金句
  content TEXT NOT NULL,                     -- 批注心得正文 (防 XSS 过滤)
  likes INTEGER DEFAULT 0,                   -- 墨客点赞计数 (只读聚合缓存)
  is_pinned INTEGER DEFAULT 0,               -- 博主是否置顶为精选金句 (0: 否, 1: 是)
  created_at INTEGER NOT NULL,               -- 发表时间戳
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ann_article_page ON annotations(article_id, page_index);
CREATE INDEX IF NOT EXISTS idx_ann_user ON annotations(user_id);

-- 6. 批注点赞记录表 (Annotation Likes)
-- 原子防重复点赞记录表，防止同一用户对同一条批注重复刷赞
CREATE TABLE IF NOT EXISTS annotation_likes (
  id TEXT PRIMARY KEY,                       -- 点赞记录 ID
  annotation_id TEXT NOT NULL,               -- 目标批注 ID
  user_id TEXT NOT NULL,                     -- 点赞用户 ID
  created_at INTEGER NOT NULL,               -- 点赞时间戳
  UNIQUE(annotation_id, user_id),
  FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ann_likes_user ON annotation_likes(user_id);

-- 7. 用户个人书箧收藏表 (Bookmarks)
-- 包含 last_page_index 记录读者上次读到的翻书对开页码，充当真实实体书签记忆
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,                       -- 记录 ID
  user_id TEXT NOT NULL,                     -- 用户 ID
  article_id INTEGER NOT NULL,               -- 收藏的文章 ID
  last_page_index INTEGER DEFAULT 1,         -- 上次阅读停留的翻书对开页码 (书签功能)
  created_at INTEGER NOT NULL,               -- 收藏时间戳
  updated_at INTEGER NOT NULL,               -- 上次阅读翻动时间戳
  UNIQUE(user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
