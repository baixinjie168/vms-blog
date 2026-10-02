-- ====================================================================
-- Version: v1.3.0
-- Timestamp: 20261002220000 (2026-10-02 22:00:00)
-- Description: 专栏专辑体系扩展与文章排序/章节支持
-- Tables: articles (新增 album_order, chapter_label), albums
-- Database: Cloudflare D1 (SQLite)
-- Target: 支持专栏专辑内文章有序编排 (第1讲/节/季)、文章收录与作者编辑删除权限
-- ====================================================================

-- 1. 为 articles 表增加专栏内章节序号 (album_order，默认第1讲) 与自定义章节名称 (chapter_label，如“第一讲”)
ALTER TABLE articles ADD COLUMN album_order INTEGER DEFAULT 1;
ALTER TABLE articles ADD COLUMN chapter_label TEXT DEFAULT '';

-- 2. 建立专栏文章复合排序索引，加速专栏内按章节正序拉取
CREATE INDEX IF NOT EXISTS idx_articles_album_order ON articles(album_id, album_order ASC);

-- 3. 对已有归属于专辑的文章赋予初始升序序号
UPDATE articles 
SET album_order = 1 
WHERE album_id IS NOT NULL AND (album_order IS NULL OR album_order = 0);
