-- ====================================================================
-- Version: v1.1.0
-- Timestamp: 20261001083000 (2026-10-01 08:30:00)
-- Description: 《VMS》阶段三测试与基线种子数据 (博主资料、7大专栏专辑与18篇七维经典博文)
-- Target: Cloudflare D1 (SQLite) - 供首页三栏工作台与双对开翻书慢读开箱即用
-- ====================================================================

-- 1. 初始化博主主体信息 (users)
INSERT OR REPLACE INTO users (
  id, 
  email, 
  nickname, 
  bio, 
  avatar_url, 
  avatar_bg, 
  role, 
  github_url, 
  created_at, 
  updated_at
)
VALUES (
  'usr_author_bai',
  'admin@250258.xyz',
  '白心解',
  '以道明向，以心修己，以法立律，以术精工，以器致远，以事立业，以势乘风。',
  NULL,
  'bg-stone-900',
  'admin',
  'https://github.com/baixinjie168',
  1750000000,
  1750000000
);

-- 2. 初始化 7 大深度精品专栏专辑 (albums)
INSERT OR REPLACE INTO albums (
  id, 
  author_id, 
  slug, 
  title, 
  description, 
  cover_image, 
  sort_order, 
  is_published, 
  created_at, 
  updated_at
)
VALUES 
(
  'alb_qlib',
  'usr_author_bai',
  'qlib-quant',
  'Qlib 量化投研全栈实战',
  '从零搭建微软 Qlib 框架本地高频投研环境，系统拆解 Alpha158/360 因子工程挖掘、时序机器学习选股模型与真实回测滑点交易闭环。',
  NULL,
  1,
  1,
  1750100000,
  1750100000
),
(
  'alb_arch',
  'usr_author_bai',
  'architectural-thinking',
  '架构思辨录',
  '大厂复杂系统解耦、高可用演进与核心权衡的真实工程手记。探究分布式事务、领域驱动与系统韧性设计。',
  NULL,
  2,
  1,
  1750200000,
  1750200000
),
(
  'alb_life',
  'usr_author_bai',
  'late-pregnancy-notes',
  '孕晚期与新生守护指南',
  '生命孕育与家庭重大里程碑实录。系统总结 32 周至临产全流程注意事项，涵盖关键产检指标速查与新生儿极简护理。',
  NULL,
  3,
  1,
  1750300000,
  1750300000
),
(
  'alb_agent',
  'usr_author_bai',
  'llm-agent-system',
  '大模型 Agent 架构与系统实践',
  '解构自主 Agent 的核心工作流。探讨从单次 Prompt 到 ReAct 循环、精准工具调用、动态向量记忆库以及多智能体协作实践。',
  NULL,
  4,
  1,
  1750400000,
  1750400000
),
(
  'alb_model',
  'usr_author_bai',
  'mental-model-systems',
  '第一性原理与抗风险决策系统',
  '融合查理·芒格多元思维模型与塔勒布反脆弱，剥离经验主义幻觉，用物理学第一性原理回归事物本源，构筑个人抗风险决策网络。',
  NULL,
  5,
  1,
  1750500000,
  1750500000
),
(
  'alb_fe',
  'usr_author_bai',
  'paper-ink-rendering',
  '现代前端与纸墨装帧渲染',
  '消灭无限垂直滚动条！探索基于 CSS Multi-column、DOM 微任务计算的分页渲染算法与 100vh 零长视窗排版。',
  NULL,
  6,
  1,
  1750600000,
  1750600000
),
(
  'alb_growth',
  'usr_author_bai',
  'long-term-mindset',
  '长期主义心智跃迁记',
  '向内审视，聚焦习惯回路的生物学重塑与深度心流时间箱。在纷繁复杂的外部噪声中把握底层不变的规律。',
  NULL,
  7,
  1,
  1750700000,
  1750700000
);

-- 3. 初始文章表保持纯净留空，等待博主创作新篇章
