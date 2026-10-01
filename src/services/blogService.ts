/**
 * 《VMS》数据访问层与业务查询服务 (BlogService)
 * 基于 Cloudflare D1 (Serverless SQLite)，原生类型安全
 */

export interface AuthorProfile {
  id: string;
  nickname: string;
  email: string;
  bio: string;
  avatar_url: string | null;
  avatar_bg: string;
  role: string;
  github_url: string | null;
  articleCount: number;
  totalWords: string;
  daysCount: number;
}

export interface DimensionMeta {
  key: string;               // 数据库键名: 'dao' | 'xin' | 'fa' | 'shu' | 'qi' | 'shi_matter' | 'shi_trend'
  char: string;              // 简短汉字: '道' | '心' | '法' | '术' | '器' | '事' | '势'
  name: string;              // 维度全名: '道 · 我为什么活？'
  question: string;          // 核心问题: '我为什么活？'
  scope: string;             // 范畴领域: '世界观 · 价值观 · 意义'
  sealChar: string;          // 篆刻印章字
  color: string;             // 品牌主题色
  bg: string;                // 背景浅淡样式类
  border: string;            // 边框微显样式类
  count?: number;            // 涵盖文章数
}

export const DIMENSIONS: Record<string, DimensionMeta> = {
  dao: {
    key: "dao",
    char: "道",
    name: "道 · 我为什么活？",
    question: "我为什么活？",
    scope: "世界观 · 价值观 · 意义",
    sealChar: "道",
    color: "#8C5A2B",
    bg: "bg-[#8C5A2B]/15",
    border: "border-[#8C5A2B]/30"
  },
  xin: {
    key: "xin",
    char: "心",
    name: "心 · 我是什么样的人？",
    question: "我是什么样的人？",
    scope: "认知 · 情绪 · 人格自律",
    sealChar: "心",
    color: "#A03C32",
    bg: "bg-[#A03C32]/15",
    border: "border-[#A03C32]/30"
  },
  fa: {
    key: "fa",
    char: "法",
    name: "法 · 我如何做事？",
    question: "我如何做事？",
    scope: "方法论 · 原则 · 决策系统",
    sealChar: "法",
    color: "#3B6E8C",
    bg: "bg-[#3B6E8C]/15",
    border: "border-[#3B6E8C]/30"
  },
  shu: {
    key: "shu",
    char: "术",
    name: "术 · 我具体怎么做？",
    question: "我具体怎么做？",
    scope: "专业技能 · 架构 · 编程管理",
    sealChar: "术",
    color: "#4A7C59",
    bg: "bg-[#4A7C59]/15",
    border: "border-[#4A7C59]/30"
  },
  qi: {
    key: "qi",
    char: "器",
    name: "器 · 我用什么做？",
    question: "我用什么做？",
    scope: "工具 · 技术 · AI · 软件资源",
    sealChar: "器",
    color: "#6B5B95",
    bg: "bg-[#6B5B95]/15",
    border: "border-[#6B5B95]/30"
  },
  shi_matter: {
    key: "shi_matter",
    char: "事",
    name: "事 · 我实际创造什么？",
    question: "我实际创造什么？",
    scope: "工作事业 · 作品财富 · 贡献",
    sealChar: "事",
    color: "#B8860B",
    bg: "bg-[#B8860B]/15",
    border: "border-[#B8860B]/30"
  },
  shi_trend: {
    key: "shi_trend",
    char: "势",
    name: "势 · 我如何借势？",
    question: "我如何借势？",
    scope: "时代浪潮 · 行业技术 · 人脉",
    sealChar: "势",
    color: "#2E8B57",
    bg: "bg-[#2E8B57]/15",
    border: "border-[#2E8B57]/30"
  }
};

/**
 * 将中文字符或别名归一化为数据库存取的维度 key
 */
export function normalizeDimension(input?: string | null): string | null {
  if (!input || input === "all" || input === "全") return null;
  const trimmed = input.trim().toLowerCase();
  
  if (trimmed === "道" || trimmed === "dao") return "dao";
  if (trimmed === "心" || trimmed === "xin") return "xin";
  if (trimmed === "法" || trimmed === "fa") return "fa";
  if (trimmed === "术" || trimmed === "shu") return "shu";
  if (trimmed === "器" || trimmed === "qi") return "qi";
  if (trimmed === "事" || trimmed === "matter" || trimmed === "shi_matter") return "shi_matter";
  if (trimmed === "势" || trimmed === "trend" || trimmed === "shi_trend") return "shi_trend";
  
  return null;
}

export interface AlbumItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  sort_order: number;
  articleCount: number;
  totalWords: string;
  sealChar: string;
  status: string;
  created_at: number;
}

export interface ArticleItem {
  id: number;
  author_id: string;
  author_nickname?: string;
  slug: string;
  title: string;
  summary: string | null;
  content?: string;
  cover_image: string | null;
  dimension: string;
  dimensionChar: string;
  dimensionName: string;
  dimensionQuestion: string;
  dimensionScope: string;
  dimensionColor: string;
  dimensionBg: string;
  dimensionBorder: string;
  album_id: string | null;
  album_slug?: string | null;
  album_title?: string | null;
  read_time: number;
  word_count: string;
  views: number;
  published_at: number | null;
  created_at: number;
  date_str: string;
}

export interface ArticleQueryOptions {
  category?: string;       // 分类: 'dao' | '道' | 'all'
  albumSlug?: string;      // 专栏别名: 'qlib-quant'
  date?: string;           // 日期: '2026-09-26'
  search?: string;         // 关键字搜索
  page?: number;           // 页码，默认 1
  pageSize?: number;       // 每页数量，默认 9
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_ALBUMS: AlbumItem[] = [
  {
    id: "alb_qlib",
    slug: "qlib-quant",
    title: "Qlib 量化投研全栈实战",
    description: "从零搭建微软 Qlib 框架本地高频投研环境，系统拆解 Alpha158/360 因子工程挖掘、时序机器学习选股模型与真实回测滑点交易闭环。",
    cover_image: null,
    sort_order: 1,
    articleCount: 8,
    totalWords: "4.2w 字",
    sealChar: "量",
    status: "连载中 · 8讲",
    created_at: 1750100000,
    category: "术",
    catLabel: "术 · 量化"
  },
  {
    id: "alb_life",
    slug: "late-pregnancy-notes",
    title: "孕晚期全攻略与注意事项",
    description: "生命孕育与家庭重大里程碑实录。系统总结 32 周至临产全流程注意事项，涵盖关键产检指标速查、科学数胎动心法、三甲医院待产包极简清单与入出院全动线备忘。",
    cover_image: null,
    sort_order: 2,
    articleCount: 6,
    totalWords: "2.8w 字",
    sealChar: "生",
    status: "已完结 · 6卷",
    created_at: 1750300000,
    category: "事",
    catLabel: "事 · 生命"
  },
  {
    id: "alb_agent",
    slug: "llm-agent-system",
    title: "大模型 Agent 架构与系统实践",
    description: "解构自主 Agent 的核心工作流。探讨从单次 Prompt 到 ReAct 循环、精准工具调用（Tool Use）、动态向量记忆库以及面向复杂任务的多智能体协作实践。",
    cover_image: null,
    sort_order: 3,
    articleCount: 5,
    totalWords: "3.1w 字",
    sealChar: "智",
    status: "连载中 · 5讲",
    created_at: 1750400000,
    category: "器",
    catLabel: "器 · 智能"
  },
  {
    id: "alb_model",
    slug: "mental-model-systems",
    title: "第一性原理与抗风险决策系统",
    description: "融合查理·芒格多元思维模型与塔勒布反脆弱，剥离经验主义幻觉，用物理学第一性原理回归事物本源，构筑个人抗风险决策网络。",
    cover_image: null,
    sort_order: 4,
    articleCount: 7,
    totalWords: "3.6w 字",
    sealChar: "律",
    status: "已完结 · 7卷",
    created_at: 1750500000,
    category: "心",
    catLabel: "心 · 认知"
  },
  {
    id: "alb_arch",
    slug: "architectural-thinking",
    title: "架构思辨录：高可用与权衡艺术",
    description: "大厂复杂系统解耦、高可用演进与核心权衡的真实工程手记。探究分布式事务、领域驱动与系统韧性设计。",
    cover_image: null,
    sort_order: 5,
    articleCount: 6,
    totalWords: "3.4w 字",
    sealChar: "构",
    status: "连载中 · 6讲",
    created_at: 1750200000,
    category: "法",
    catLabel: "法 · 架构"
  },
  {
    id: "alb_fe",
    slug: "paper-ink-rendering",
    title: "现代前端与纸墨装帧渲染",
    description: "消灭无限垂直滚动条！探索基于 CSS Multi-column、DOM 微任务计算的分页渲染算法与 100vh 零长视窗排版。",
    cover_image: null,
    sort_order: 6,
    articleCount: 4,
    totalWords: "2.1w 字",
    sealChar: "墨",
    status: "连载中 · 4讲",
    created_at: 1750600000,
    category: "术",
    catLabel: "术 · 前端"
  },
  {
    id: "alb_growth",
    slug: "long-term-mindset",
    title: "长期主义心智跃迁记",
    description: "向内审视，聚焦习惯回路的生物学重塑与深度心流时间箱。在纷繁复杂的外部噪声中把握底层不变的规律。",
    cover_image: null,
    sort_order: 7,
    articleCount: 5,
    totalWords: "2.9w 字",
    sealChar: "跃",
    status: "已完结 · 5卷",
    created_at: 1750700000,
    category: "道",
    catLabel: "道 · 心智"
  }
];

export const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 1,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "building-long-term-digital-garden",
    title: "构建长期主义数字花园：从信息投喂到终极意义探索",
    summary: "世界观、价值观与人生终局探寻。在算法投喂的汪洋中，锚定自己存在的根本意义，抵御精神熵增...",
    cover_image: null,
    dimension: "dao",
    dimensionChar: "道",
    dimensionName: "道 · 我为什么活？",
    dimensionQuestion: "我为什么活？",
    dimensionScope: "世界观 · 价值观 · 意义",
    dimensionColor: "#8C5A2B",
    dimensionBg: "bg-[#8C5A2B]/15",
    dimensionBorder: "border-[#8C5A2B]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 8,
    word_count: "2,840字",
    views: 342,
    published_at: 1790380800,
    created_at: 1790380800,
    date_str: "2026-09-26"
  },
  {
    id: 2,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "flow-and-emotional-discipline",
    title: "心流与情绪自律：在信息躁动时代重塑内在秩序",
    summary: "认知觉察、情绪掌控与自律意志磨砺。向内审视，清楚自己的边界与脾性，在浮华中保持澄澈心性...",
    cover_image: null,
    dimension: "xin",
    dimensionChar: "心",
    dimensionName: "心 · 我是什么样的人？",
    dimensionQuestion: "我是什么样的人？",
    dimensionScope: "认知 · 情绪 · 人格自律",
    dimensionColor: "#A03C32",
    dimensionBg: "bg-[#A03C32]/15",
    dimensionBorder: "border-[#A03C32]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 9,
    word_count: "3,210字",
    views: 289,
    published_at: 1789948800,
    created_at: 1789948800,
    date_str: "2026-09-21"
  },
  {
    id: 3,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "zero-scroll-paper-ink-design-system",
    title: "基于有限视窗的无滚动翻页设计系统：解构纸墨心流",
    summary: "方法论、底层原则与决策模型。借鉴实体书印张与双对页系统，在数字交互中构建从容阅读规则范式...",
    cover_image: null,
    dimension: "fa",
    dimensionChar: "法",
    dimensionName: "法 · 我如何做事？",
    dimensionQuestion: "我如何做事？",
    dimensionScope: "方法论 · 原则 · 决策系统",
    dimensionColor: "#3B6E8C",
    dimensionBg: "bg-[#3B6E8C]/15",
    dimensionBorder: "border-[#3B6E8C]/30",
    album_id: "alb_fe",
    album_slug: "paper-ink-rendering",
    album_title: "现代前端与纸墨装帧渲染",
    read_time: 12,
    word_count: "3,500字",
    views: 512,
    published_at: 1789689600,
    created_at: 1789689600,
    date_str: "2026-09-18"
  },
  {
    id: 4,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "css-multi-column-and-page-break",
    title: "CSS Multi-column 与 Page Break 翻书调优实战工法",
    summary: "专业编程技能与排版工法实践。深入剖析纯 CSS 与 DOM 计算的分页算法细节，消灭无限长滚动条...",
    cover_image: null,
    dimension: "shu",
    dimensionChar: "术",
    dimensionName: "术 · 我具体怎么做？",
    dimensionQuestion: "我具体怎么做？",
    dimensionScope: "专业技能 · 架构 · 编程管理",
    dimensionColor: "#4A7C59",
    dimensionBg: "bg-[#4A7C59]/15",
    dimensionBorder: "border-[#4A7C59]/30",
    album_id: "alb_fe",
    album_slug: "paper-ink-rendering",
    album_title: "现代前端与纸墨装帧渲染",
    read_time: 10,
    word_count: "3,100字",
    views: 420,
    published_at: 1788998400,
    created_at: 1788998400,
    date_str: "2026-09-15"
  },
  {
    id: 5,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "quiet-digital-arsenal-2026",
    title: "打造极致安静的数字武器库：我的软硬件与 AI 装备 2026",
    summary: "利器工具、AI技术协同与生产力装备。精简配置清单，去除噪音干扰，构建本地优先的数字武器库...",
    cover_image: null,
    dimension: "qi",
    dimensionChar: "器",
    dimensionName: "器 · 我用什么做？",
    dimensionQuestion: "我用什么做？",
    dimensionScope: "工具 · 技术 · AI · 软件资源",
    dimensionColor: "#6B5B95",
    dimensionBg: "bg-[#6B5B95]/15",
    dimensionBorder: "border-[#6B5B95]/30",
    album_id: "alb_agent",
    album_slug: "llm-agent-system",
    album_title: "大模型 Agent 架构与系统实践",
    read_time: 7,
    word_count: "2,600字",
    views: 310,
    published_at: 1788566400,
    created_at: 1788566400,
    date_str: "2026-09-10"
  },
  {
    id: 6,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "from-input-to-output-tangible-works",
    title: "从输入到产出：将零散思绪装帧成可传承的真实作品",
    summary: "工作事业、数字作品构建与社会价值沉淀。拒绝空谈理论，通过持续的书写与交付，创造切实的成果与财富...",
    cover_image: null,
    dimension: "shi_matter",
    dimensionChar: "事",
    dimensionName: "事 · 我实际创造什么？",
    dimensionQuestion: "我实际创造什么？",
    dimensionScope: "工作事业 · 作品财富 · 贡献",
    dimensionColor: "#B8860B",
    dimensionBg: "bg-[#B8860B]/15",
    dimensionBorder: "border-[#B8860B]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 10,
    word_count: "3,200字",
    views: 395,
    published_at: 1787875200,
    created_at: 1787875200,
    date_str: "2026-09-05"
  },
  {
    id: 7,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "ai-era-knowledge-assets-and-cycles",
    title: "以势乘风：探究 AI 时代个人知识资产与行业周期的重塑",
    summary: "时代浪潮、技术脉搏与宏观周期顺应。在智能重塑的洪流中，因势利导，借助时代杠杆放大个体价值...",
    cover_image: null,
    dimension: "shi_trend",
    dimensionChar: "势",
    dimensionName: "势 · 我如何借势？",
    dimensionQuestion: "我如何借势？",
    dimensionScope: "时代浪潮 · 行业技术 · 人脉",
    dimensionColor: "#2E8B57",
    dimensionBg: "bg-[#2E8B57]/15",
    dimensionBorder: "border-[#2E8B57]/30",
    album_id: "alb_model",
    album_slug: "mental-model-systems",
    album_title: "第一性原理与抗风险决策系统",
    read_time: 11,
    word_count: "3,800字",
    views: 460,
    published_at: 1786752000,
    created_at: 1786752000,
    date_str: "2026-08-30"
  },
  {
    id: 8,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "revisiting-common-sense-principles",
    title: "重识常识：在纷繁复杂的噪声中把握底层不变的事物",
    summary: "越是剧烈变革的时代，不变的底层常识越具威力。梳理哲学常识与终局视角，为所有决策建立稳固基底...",
    cover_image: null,
    dimension: "dao",
    dimensionChar: "道",
    dimensionName: "道 · 我为什么活？",
    dimensionQuestion: "我为什么活？",
    dimensionScope: "世界观 · 价值观 · 意义",
    dimensionColor: "#8C5A2B",
    dimensionBg: "bg-[#8C5A2B]/15",
    dimensionBorder: "border-[#8C5A2B]/30",
    album_id: "alb_model",
    album_slug: "mental-model-systems",
    album_title: "第一性原理与抗风险决策系统",
    read_time: 7,
    word_count: "2,500字",
    views: 275,
    published_at: 1785628800,
    created_at: 1785628800,
    date_str: "2026-08-25"
  },
  {
    id: 9,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "first-principles-and-decision-trees",
    title: "第一性原理与决策树：如何建立抗风险的思维模型",
    summary: "从单点攻坚到抽象原则沉淀。解构马斯克第一性原理在个人知识工程与软件架构中的落地路径与闭环...",
    cover_image: null,
    dimension: "fa",
    dimensionChar: "法",
    dimensionName: "法 · 我如何做事？",
    dimensionQuestion: "我如何做事？",
    dimensionScope: "方法论 · 原则 · 决策系统",
    dimensionColor: "#3B6E8C",
    dimensionBg: "bg-[#3B6E8C]/15",
    dimensionBorder: "border-[#3B6E8C]/30",
    album_id: "alb_model",
    album_slug: "mental-model-systems",
    album_title: "第一性原理与抗风险决策系统",
    read_time: 9,
    word_count: "3,000字",
    views: 380,
    published_at: 1784505600,
    created_at: 1784505600,
    date_str: "2026-08-20"
  },
  {
    id: 10,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "biological-remodeling-of-habit-loops",
    title: "习惯回路的生物学重塑：微习惯如何撼动长期意志",
    summary: "多巴胺奖励回路与微小阻力设计。在无声的微小行动中积蓄意志力复利，重构日常行为自动化系统...",
    cover_image: null,
    dimension: "xin",
    dimensionChar: "心",
    dimensionName: "心 · 我是什么样的人？",
    dimensionQuestion: "我是什么样的人？",
    dimensionScope: "认知 · 情绪 · 人格自律",
    dimensionColor: "#A03C32",
    dimensionBg: "bg-[#A03C32]/15",
    dimensionBorder: "border-[#A03C32]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 8,
    word_count: "2,900字",
    views: 330,
    published_at: 1783814400,
    created_at: 1783814400,
    date_str: "2026-08-15"
  },
  {
    id: 11,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "modern-frontend-rendering-performance",
    title: "现代前端性能调优精义：从 DOM 渲染树到 GPU 离屏合成",
    summary: "重绘回流本质探究与 60FPS 顺滑体验实践。将复杂的排版计算推至微任务与 WebWorker，消除页面卡顿...",
    cover_image: null,
    dimension: "shu",
    dimensionChar: "术",
    dimensionName: "术 · 我具体怎么做？",
    dimensionQuestion: "我具体怎么做？",
    dimensionScope: "专业技能 · 架构 · 编程管理",
    dimensionColor: "#4A7C59",
    dimensionBg: "bg-[#4A7C59]/15",
    dimensionBorder: "border-[#4A7C59]/30",
    album_id: "alb_fe",
    album_slug: "paper-ink-rendering",
    album_title: "现代前端与纸墨装帧渲染",
    read_time: 11,
    word_count: "3,600字",
    views: 410,
    published_at: 1782345600,
    created_at: 1782345600,
    date_str: "2026-08-10"
  },
  {
    id: 12,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "local-first-llm-private-knowledge-vault",
    title: "本地优先与端侧 LLM：构建永不失联的私有知识底座",
    summary: "用 Ollama 本地运行开源模型，结合 SQLite-vec 向量检索，搭建断网可用的个人第二大脑与知识沉淀室...",
    cover_image: null,
    dimension: "qi",
    dimensionChar: "器",
    dimensionName: "器 · 我用什么做？",
    dimensionQuestion: "我用什么做？",
    dimensionScope: "工具 · 技术 · AI · 软件资源",
    dimensionColor: "#6B5B95",
    dimensionBg: "bg-[#6B5B95]/15",
    dimensionBorder: "border-[#6B5B95]/30",
    album_id: "alb_agent",
    album_slug: "llm-agent-system",
    album_title: "大模型 Agent 架构与系统实践",
    read_time: 7,
    word_count: "2,700字",
    views: 290,
    published_at: 1781395200,
    created_at: 1781395200,
    date_str: "2026-08-05"
  },
  {
    id: 13,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "indie-product-commercialization-learnings",
    title: "独立产品的商业化闭环：从小切口到高复购的交付心得",
    summary: "拒绝虚荣指标，聚焦真实买单意愿与现金流。从痛点验证、MVP开发到定价策略的独立开发全复盘...",
    cover_image: null,
    dimension: "shi_matter",
    dimensionChar: "事",
    dimensionName: "事 · 我实际创造什么？",
    dimensionQuestion: "我实际创造什么？",
    dimensionScope: "工作事业 · 作品财富 · 贡献",
    dimensionColor: "#B8860B",
    dimensionBg: "bg-[#B8860B]/15",
    dimensionBorder: "border-[#B8860B]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 13,
    word_count: "4,100字",
    views: 530,
    published_at: 1780099200,
    created_at: 1780099200,
    date_str: "2026-07-28"
  },
  {
    id: 14,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "macro-liquidity-and-k-waves",
    title: "宏观流动性与科技康波周期：个人资本配置的借势心法",
    summary: "理解全球流动性潮汐与算力周期的互哺。不做逆风狂徒，因应宏观周期调整个人职业杠杆与资产组合...",
    cover_image: null,
    dimension: "shi_trend",
    dimensionChar: "势",
    dimensionName: "势 · 我如何借势？",
    dimensionQuestion: "我如何借势？",
    dimensionScope: "时代浪潮 · 行业技术 · 人脉",
    dimensionColor: "#2E8B57",
    dimensionBg: "bg-[#2E8B57]/15",
    dimensionBorder: "border-[#2E8B57]/30",
    album_id: "alb_model",
    album_slug: "mental-model-systems",
    album_title: "第一性原理与抗风险决策系统",
    read_time: 11,
    word_count: "3,700字",
    views: 480,
    published_at: 1779062400,
    created_at: 1779062400,
    date_str: "2026-07-20"
  },
  {
    id: 15,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "being-towards-death-and-ultimate-calm",
    title: "向死而生与终极豁达：在有限生命中寻求自洽与宁静",
    summary: "海德格尔与斯多葛哲学的个人回响。正视肉身的有限性，将每一天视作独立的完整乐章，回归质朴从容...",
    cover_image: null,
    dimension: "dao",
    dimensionChar: "道",
    dimensionName: "道 · 我为什么活？",
    dimensionQuestion: "我为什么活？",
    dimensionScope: "世界观 · 价值观 · 意义",
    dimensionColor: "#8C5A2B",
    dimensionBg: "bg-[#8C5A2B]/15",
    dimensionBorder: "border-[#8C5A2B]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 8,
    word_count: "2,800字",
    views: 305,
    published_at: 1777680000,
    created_at: 1777680000,
    date_str: "2026-07-15"
  },
  {
    id: 16,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "cultivating-psychological-resilience-notes",
    title: "钝感力修炼札记：将外界评判转化为纯粹能量的心理防线",
    summary: "戒掉情绪内耗与讨好型人格。在纷繁的外部喧嚣中建立心理防火墙，把注意力集中在自己的创作与成长中...",
    cover_image: null,
    dimension: "xin",
    dimensionChar: "心",
    dimensionName: "心 · 我是什么样的人？",
    dimensionQuestion: "我是什么样的人？",
    dimensionScope: "认知 · 情绪 · 人格自律",
    dimensionColor: "#A03C32",
    dimensionBg: "bg-[#A03C32]/15",
    dimensionBorder: "border-[#A03C32]/30",
    album_id: "alb_growth",
    album_slug: "long-term-mindset",
    album_title: "长期主义心智跃迁记",
    read_time: 9,
    word_count: "3,100字",
    views: 340,
    published_at: 1776643200,
    created_at: 1776643200,
    date_str: "2026-07-10"
  },
  {
    id: 17,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "qlib-factor-mining-alpha158",
    title: "Qlib 因子挖掘工程：Alpha158 在 A 股量化中的实战调优",
    summary: "从零搭建本地量化沙盒，深度解析 Alpha158/360 因子有效性衰减检验与时序模型调优...",
    cover_image: null,
    dimension: "shu",
    dimensionChar: "术",
    dimensionName: "术 · 我具体怎么做？",
    dimensionQuestion: "我具体怎么做？",
    dimensionScope: "专业技能 · 架构 · 编程管理",
    dimensionColor: "#4A7C59",
    dimensionBg: "bg-[#4A7C59]/15",
    dimensionBorder: "border-[#4A7C59]/30",
    album_id: "alb_qlib",
    album_slug: "qlib-quant",
    album_title: "Qlib 量化投研全栈实战",
    read_time: 14,
    word_count: "4,500字",
    views: 680,
    published_at: 1775347200,
    created_at: 1775347200,
    date_str: "2026-07-05"
  },
  {
    id: 18,
    author_id: "usr_author_bai",
    author_nickname: "白心解",
    slug: "late-pregnancy-checklist-and-birth-plan",
    title: "三甲医院极简待产包与孕晚期核心产检解读",
    summary: "剔除 80% 智商税鸡肋单品，科学数胎动心法与临产征兆大辨析，守护家庭新生命的诞生...",
    cover_image: null,
    dimension: "shi_matter",
    dimensionChar: "事",
    dimensionName: "事 · 我实际创造什么？",
    dimensionQuestion: "我实际创造什么？",
    dimensionScope: "工作事业 · 作品财富 · 贡献",
    dimensionColor: "#B8860B",
    dimensionBg: "bg-[#B8860B]/15",
    dimensionBorder: "border-[#B8860B]/30",
    album_id: "alb_life",
    album_slug: "late-pregnancy-notes",
    album_title: "孕晚期全攻略与注意事项",
    read_time: 12,
    word_count: "3,800字",
    views: 520,
    published_at: 1774742400,
    created_at: 1774742400,
    date_str: "2026-06-28"
  }
];

export class BlogService {
  /**
   * 获取博主个人独白名片与全局指标
   */
  static async getAuthorProfile(db: D1Database): Promise<AuthorProfile> {
    const user = await db.prepare(
      "SELECT id, nickname, email, bio, avatar_url, avatar_bg, role, github_url, created_at FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1"
    ).first<{
      id: string;
      nickname: string;
      email: string;
      bio: string;
      avatar_url: string | null;
      avatar_bg: string;
      role: string;
      github_url: string | null;
      created_at: number;
    }>();

    // 统计总文章数与估算总字数
    const stats = await db.prepare(
      "SELECT count(*) as count, coalesce(sum(length(content)), 0) as total_chars FROM articles WHERE is_published = 1"
    ).first<{ count: number; total_chars: number }>();

    const articleCount = stats?.count || 168;
    const totalChars = stats?.total_chars || 342000;
    const totalWords = totalChars > 10000 
      ? (totalChars / 10000).toFixed(1) + "w" 
      : `${totalChars}`;

    // 耕耘天数：从博主注册时间算起，基线为 430 天
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = user?.created_at || (now - 430 * 86400);
    const daysCount = Math.max(1, Math.floor((now - startTimestamp) / 86400));

    return {
      id: user?.id || "usr_author_bai",
      nickname: user?.nickname || "白心解",
      email: user?.email || "admin@250258.xyz",
      bio: user?.bio || "以道明向，以心修己，以法立律，以术精工，以器致远，以事立业，以势乘风。",
      avatar_url: user?.avatar_url || null,
      avatar_bg: user?.avatar_bg || "bg-stone-900",
      role: user?.role || "admin",
      github_url: user?.github_url || "https://github.com/baixinjie168",
      articleCount,
      totalWords,
      daysCount: Math.max(430, daysCount)
    };
  }

  /**
   * 获取七大认知层级各维度的文章篇数统计
   */
  static async getCategoryStats(db: D1Database): Promise<{
    dimensions: DimensionMeta[];
    totalArticles: number;
  }> {
    const rows = await db.prepare(
      "SELECT dimension, count(*) as count FROM articles WHERE is_published = 1 GROUP BY dimension"
    ).all<{ dimension: string; count: number }>();

    const countsMap: Record<string, number> = {};
    let total = 0;
    for (const r of rows.results || []) {
      const norm = normalizeDimension(r.dimension) || r.dimension;
      countsMap[norm] = (countsMap[norm] || 0) + (r.count || 0);
      total += (r.count || 0);
    }

    const dimensions = Object.keys(DIMENSIONS).map((k) => {
      const meta = DIMENSIONS[k];
      return {
        ...meta,
        count: countsMap[k] || 0
      };
    });

    return {
      dimensions,
      totalArticles: total
    };
  }

  /**
   * 获取所有已发布的专栏专辑列表
   */
  static async getAlbums(db?: D1Database | null): Promise<AlbumItem[]> {
    if (!db) return DEFAULT_ALBUMS;

    try {
      const rows = await db.prepare(`
        SELECT 
          a.id, a.slug, a.title, a.description, a.cover_image, a.sort_order, a.created_at,
          count(art.id) as article_count,
          coalesce(sum(length(art.content)), 0) as total_chars
        FROM albums a
        LEFT JOIN articles art ON a.id = art.album_id AND art.is_published = 1
        WHERE a.is_published = 1
        GROUP BY a.id
        ORDER BY a.sort_order ASC, a.created_at DESC
      `).all<{
        id: string;
        slug: string;
        title: string;
        description: string | null;
        cover_image: string | null;
        sort_order: number;
        created_at: number;
        article_count: number;
        total_chars: number;
      }>();

      if (!rows?.results || rows.results.length === 0) {
        return DEFAULT_ALBUMS;
      }

      const sealChars: Record<string, string> = {
        alb_qlib: "量",
        alb_arch: "构",
        alb_life: "生",
        alb_agent: "智",
        alb_model: "律",
        alb_fe: "墨",
        alb_growth: "跃"
      };

      const catMapping: Record<string, { cat: string; label: string }> = {
        alb_qlib: { cat: "术", label: "术 · 量化" },
        alb_arch: { cat: "法", label: "法 · 架构" },
        alb_life: { cat: "事", label: "事 · 生命" },
        alb_agent: { cat: "器", label: "器 · 智能" },
        alb_model: { cat: "心", label: "心 · 认知" },
        alb_fe: { cat: "术", label: "术 · 前端" },
        alb_growth: { cat: "道", label: "道 · 心智" },
      };

      return rows.results.map((r) => {
        const totalWords = r.total_chars > 10000 
          ? (r.total_chars / 10000).toFixed(1) + "w 字"
          : `${Math.round(r.total_chars / 2)} 字`;

        const meta = catMapping[r.id] || { cat: "术", label: "术 · 卷册" };

        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          cover_image: r.cover_image,
          sort_order: r.sort_order,
          articleCount: r.article_count || 0,
          totalWords,
          sealChar: sealChars[r.id] || r.title.slice(0, 1),
          status: (r.article_count && r.article_count >= 5) ? `连载中 · ${r.article_count}讲` : "精选专辑",
          created_at: r.created_at,
          category: meta.cat,
          catLabel: meta.label,
        };
      });
    } catch (e) {
      console.error('Failed to query albums, returning fallback:', e);
      return DEFAULT_ALBUMS;
    }
  }

  /**
   * 多维度复合检索文章（按分类/专辑/日期/关键字），支持固定每页 9 篇
   */
  static async getArticles(
    db?: D1Database | null,
    options: ArticleQueryOptions = {}
  ): Promise<PaginatedResult<ArticleItem>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || 9;
    const offset = (page - 1) * pageSize;
    const normDim = normalizeDimension(options.category);

    const filterFallback = () => {
      let filtered = [...DEFAULT_ARTICLES];
      if (normDim) {
        filtered = filtered.filter((a) => a.dimension === normDim || a.dimensionChar === options.category);
      }
      if (options.albumSlug) {
        filtered = filtered.filter((a) => a.album_slug === options.albumSlug);
      }
      if (options.date) {
        filtered = filtered.filter((a) => a.date_str === options.date);
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        filtered = filtered.filter((a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q))
        );
      }
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const data = filtered.slice(offset, offset + pageSize);
      return { data, total, page, pageSize, totalPages };
    };

    if (!db) {
      return filterFallback();
    }

    try {
      const conditions: string[] = ["a.is_published = 1"];
      const params: any[] = [];

      // 1. 分类维度过滤 (道心法术器事势)
      if (normDim) {
        conditions.push("(a.dimension = ? OR a.dimension = ?)");
        params.push(normDim, DIMENSIONS[normDim]?.char || normDim);
      }

      // 2. 专栏专辑过滤
      if (options.albumSlug) {
        conditions.push("alb.slug = ?");
        params.push(options.albumSlug.trim());
      }

      // 3. 日期过滤 (YYYY-MM-DD)
      if (options.date) {
        conditions.push("strftime('%Y-%m-%d', datetime(a.created_at, 'unixepoch', 'localtime')) = ?");
        params.push(options.date.trim());
      }

      // 4. 关键字搜索
      if (options.search) {
        const term = `%${options.search.trim()}%`;
        conditions.push("(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)");
        params.push(term, term, term);
      }

      const whereClause = conditions.join(" AND ");

      // 统计总数
      const countSql = `
        SELECT count(*) as total 
        FROM articles a
        LEFT JOIN albums alb ON a.album_id = alb.id
        WHERE ${whereClause}
      `;
      const countRow = await db.prepare(countSql).bind(...params).first<{ total: number }>();
      const total = countRow?.total || 0;

      // 如果数据表中没有任何文章，回退到内置的 18 篇经典体系
      if (total === 0 && !options.search && !options.albumSlug && !options.date) {
        return filterFallback();
      }

      const totalPages = Math.ceil(total / pageSize) || 1;

      // 分页查询文章列表
      const querySql = `
        SELECT 
          a.id, a.author_id, u.nickname as author_nickname, a.slug, a.title, a.summary,
          a.cover_image, a.dimension, a.album_id, a.read_time, a.views,
          a.published_at, a.created_at, length(a.content) as content_length,
          alb.slug as album_slug, alb.title as album_title,
          strftime('%Y-%m-%d', datetime(a.created_at, 'unixepoch', 'localtime')) as date_str
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN albums alb ON a.album_id = alb.id
        WHERE ${whereClause}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await db.prepare(querySql).bind(...params, pageSize, offset).all<any>();

      const data: ArticleItem[] = (rows.results || []).map((r) => {
        const norm = normalizeDimension(r.dimension) || "dao";
        const meta = DIMENSIONS[norm] || DIMENSIONS.dao;
        const chars = r.content_length || 3000;
        const wordCount = `${chars.toLocaleString()}字`;

        return {
          id: r.id,
          author_id: r.author_id,
          author_nickname: r.author_nickname || "白心解",
          slug: r.slug,
          title: r.title,
          summary: r.summary,
          cover_image: r.cover_image,
          dimension: norm,
          dimensionChar: meta.char,
          dimensionName: meta.name,
          dimensionQuestion: meta.question,
          dimensionScope: meta.scope,
          dimensionColor: meta.color,
          dimensionBg: meta.bg,
          dimensionBorder: meta.border,
          album_id: r.album_id,
          album_slug: r.album_slug,
          album_title: r.album_title,
          read_time: r.read_time || Math.max(3, Math.round(chars / 400)),
          word_count: wordCount,
          views: r.views || 0,
          published_at: r.published_at,
          created_at: r.created_at,
          date_str: r.date_str || new Date(r.created_at * 1000).toISOString().slice(0, 10)
        };
      });

      return {
        data,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (e) {
      console.error('Failed to query articles, returning fallback:', e);
      return filterFallback();
    }
  }

  /**
   * 根据 slug 获取单篇博文详情（用于对开翻书阅读器）
   */
  static async getArticleBySlug(db: D1Database, slug: string): Promise<ArticleItem | null> {
    const r = await db.prepare(`
      SELECT 
        a.id, a.author_id, u.nickname as author_nickname, a.slug, a.title, a.summary, a.content,
        a.cover_image, a.dimension, a.album_id, a.read_time, a.views,
        a.published_at, a.created_at, length(a.content) as content_length,
        alb.slug as album_slug, alb.title as album_title,
        strftime('%Y-%m-%d', datetime(a.created_at, 'unixepoch', 'localtime')) as date_str
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN albums alb ON a.album_id = alb.id
      WHERE a.slug = ? AND a.is_published = 1
      LIMIT 1
    `).bind(slug).first<any>();

    if (!r) return null;

    const norm = normalizeDimension(r.dimension) || "dao";
    const meta = DIMENSIONS[norm] || DIMENSIONS.dao;
    const chars = r.content_length || (r.content ? r.content.length : 3000);

    return {
      id: r.id,
      author_id: r.author_id,
      author_nickname: r.author_nickname || "白心解",
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      content: r.content,
      cover_image: r.cover_image,
      dimension: norm,
      dimensionChar: meta.char,
      dimensionName: meta.name,
      dimensionQuestion: meta.question,
      dimensionScope: meta.scope,
      dimensionColor: meta.color,
      dimensionBg: meta.bg,
      dimensionBorder: meta.border,
      album_id: r.album_id,
      album_slug: r.album_slug,
      album_title: r.album_title,
      read_time: r.read_time || Math.max(3, Math.round(chars / 400)),
      word_count: `${chars.toLocaleString()}字`,
      views: r.views || 0,
      published_at: r.published_at,
      created_at: r.created_at,
      date_str: r.date_str || new Date(r.created_at * 1000).toISOString().slice(0, 10)
    };
  }

  /**
   * 获取指定年月的每天文章成文打点分布（用于文渊日历月视图）
   */
  static async getCalendarDots(
    db: D1Database,
    year: number,
    month: number // 1-12
  ): Promise<Record<string, number>> {
    // 构造月份起止时间戳
    const start = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const end = Math.floor(new Date(year, month, 1).getTime() / 1000) - 1;

    const rows = await db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', datetime(created_at, 'unixepoch', 'localtime')) as day_str,
        count(*) as count
      FROM articles
      WHERE is_published = 1 AND created_at >= ? AND created_at <= ?
      GROUP BY day_str
    `).bind(start, end).all<{ day_str: string; count: number }>();

    const dots: Record<string, number> = {};
    for (const r of rows.results || []) {
      if (r.day_str) {
        dots[r.day_str] = r.count;
      }
    }

    return dots;
  }
}
