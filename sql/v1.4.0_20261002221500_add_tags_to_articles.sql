-- ==============================================================================
-- 迁移版本: v1.4.0_20261002221500_add_tags_to_articles.sql
-- 业务场景: 为 articles 表增加 tags 标签字段，支持文章多维度标签收纳与检索
-- 创建时间: 2026-10-02 22:15:00
-- ==============================================================================

-- 1. 为 articles 文章表添加 tags 字段 (纯文本字符串，逗号分隔，如 "趋势, 思考, 架构")
ALTER TABLE articles ADD COLUMN tags TEXT DEFAULT '';

-- 2. 补充索引优化 (提高按标签或全文筛选的效率)
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles(tags);
