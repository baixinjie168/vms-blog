-- ====================================================================
-- Version: v1.5.0
-- Timestamp: 20261007090000 (2026-10-07 09:00:00)
-- Description: 正文字数独立成列，修正「字数」把 HTML 标签计入的虚高
-- Tables: articles (新增 char_count)
-- Database: Cloudflare D1 (SQLite)
-- Target: 卡片、博主简介、专栏合计展示真实字数（剥标签后的字符数）
-- ====================================================================

-- 1. 新增正文字数列。刻意不给 DEFAULT：历史行留 NULL 表示「尚未回填」，
--    运行时 ensureBlogSchema 据此分批回填。D1 的 SQL 无正则，无法在库内剥标签，
--    因此回填在 Worker 端用与写入路径同一套 textStats.countPlainChars 计算。
ALTER TABLE articles ADD COLUMN char_count INTEGER;

-- 2. 便于按字数排序/统计（当前读取路径均为 coalesce(char_count, length(content))）
CREATE INDEX IF NOT EXISTS idx_articles_char_count ON articles(char_count);
