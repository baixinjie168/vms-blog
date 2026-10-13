-- ====================================================================
-- Version: v1.6.0
-- Timestamp: 20261013100000 (2026-10-13 10:00:00)
-- Description: 七维改版存量数据归一 (事→录、势→探)
-- Tables: articles (dimension 数据修正，无 schema 变更)
-- Database: Cloudflare D1 (SQLite)
-- Target: 将 2026-10-12 改版前写入的旧维度键统一为新键 lu/tan
-- ====================================================================

-- 改版前 normalizeDimension 把 事/势 分别落成 'shi_matter'/'shi_trend'。
-- 运行时读取路径已兼容旧键，但 GROUP BY dimension 会把新旧键分成两组，
-- 故在库里统一。幂等：重复执行命中 0 行。
--
-- 注意：运行时 ensureBlogSchema 已内置同一归一语句，首请求自动生效，
-- 本文件仅作为版本化记录与手动 CLI 修复手段。

UPDATE articles
SET dimension = CASE WHEN dimension IN ('shi_matter', 'matter', '事') THEN 'lu' ELSE 'tan' END
WHERE dimension IN ('shi_matter', 'matter', '事', 'shi_trend', 'trend', '势');
