/**
 * 《VMS》数据访问层与业务查询服务 (BlogService)
 * 基于 Cloudflare D1 (Serverless SQLite)，原生类型安全
 */

/**
 * 总字数展示的唯一口径：超过 1 万按「n.nw 字」缩写，否则原值加单位。
 * 所有出口共用此函数，避免同一份数据在不同卡片上显示成两个不同的数字。
 * 注意：数据源是 length(content)，含 HTML 标签，属估算值而非精确字数。
 */
function formatWordCount(chars: number): string {
  if (!chars || chars <= 0) return '0 字';
  return chars > 10000 ? `${(chars / 10000).toFixed(1)}w 字` : `${chars} 字`;
}

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
  isGuest?: boolean;
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
  album_order?: number;
  chapter_label?: string;
  tags?: string;
  read_time: number;
  word_count: string;
  views: number;
  published_at: number | null;
  created_at: number;
  date_str: string;
}

export interface ArticleQueryOptions {
  authorId?: string;       // 指定作者 ID
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

export const DEFAULT_ARTICLES: ArticleItem[] = [];

export class BlogService {
  /**
   * 获取用户个人独白名片与专属指标
   * 当指定 userId 时获取该用户的独白与文章统计；未登录 (userId 为空) 时返回马赛克化访客模型
   */
  static async getAuthorProfile(db?: D1Database | null, userId?: string): Promise<AuthorProfile> {
    if (!db || !userId) {
      return {
        id: "guest",
        nickname: "墨客 · 隐者",
        email: "",
        bio: "浮生研墨，漫步林泉。登入后可沉淀个人专属研读箴言与七维自洽认知...",
        avatar_url: null,
        avatar_bg: "bg-stone-800",
        role: "未登入",
        github_url: null,
        articleCount: 0,
        totalWords: "--",
        daysCount: 0,
        isGuest: true
      };
    }

    try {
      const user = await db.prepare(
        "SELECT id, nickname, email, bio, avatar_url, avatar_bg, role, github_url, created_at FROM users WHERE id = ? LIMIT 1"
      ).bind(userId).first<{
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

      if (!user) {
        return {
          id: "guest",
          nickname: "墨客 · 隐者",
          email: "",
          bio: "浮生研墨，漫步林泉。",
          avatar_url: null,
          avatar_bg: "bg-stone-800",
          role: "未登入",
          github_url: null,
          articleCount: 0,
          totalWords: "--",
          daysCount: 0,
          isGuest: true
        };
      }

      // 统计该登录作者的总文章数与估算总字数
      const stats = await db.prepare(
        "SELECT count(*) as count, coalesce(sum(length(content)), 0) as total_chars FROM articles WHERE author_id = ? AND is_published = 1"
      ).bind(userId).first<{ count: number; total_chars: number }>();

      const articleCount = stats?.count || 0;
      const totalChars = stats?.total_chars || 0;
      const totalWords = formatWordCount(totalChars);

      // 耕耘天数：从该用户注册时间算起
      const now = Math.floor(Date.now() / 1000);
      const startTimestamp = user.created_at || now;
      const daysCount = Math.max(1, Math.floor((now - startTimestamp) / 86400));

      return {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        bio: user.bio || "浮生研墨，漫步林泉。",
        avatar_url: user.avatar_url,
        avatar_bg: user.avatar_bg || "bg-stone-900",
        role: user.role === "admin" ? "博主管理员" : "研读墨客",
        github_url: user.github_url,
        articleCount,
        totalWords,
        daysCount,
        isGuest: false
      };
    } catch (e) {
      console.error("Failed to query author profile:", e);
      return {
        id: "guest",
        nickname: "墨客 · 隐者",
        email: "",
        bio: "浮生研墨，漫步林泉。",
        avatar_url: null,
        avatar_bg: "bg-stone-800",
        role: "未登入",
        github_url: null,
        articleCount: 0,
        totalWords: "--",
        daysCount: 0,
        isGuest: true
      };
    }
  }

  /**
   * 获取七大认知层级各维度的文章篇数统计 (按当前用户或访客)
   */
  static async getCategoryStats(db?: D1Database | null, authorId?: string): Promise<{
    dimensions: DimensionMeta[];
    totalArticles: number;
    isGuest?: boolean;
  }> {
    if (!db || !authorId) {
      const dimensions = Object.keys(DIMENSIONS).map((k) => ({
        ...DIMENSIONS[k],
        count: 0
      }));
      return {
        dimensions,
        totalArticles: 0,
        isGuest: true
      };
    }

    try {
      const rows = await db.prepare(
        "SELECT dimension, count(*) as count FROM articles WHERE author_id = ? AND is_published = 1 GROUP BY dimension"
      ).bind(authorId).all<{ dimension: string; count: number }>();

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
        totalArticles: total,
        isGuest: false
      };
    } catch (e) {
      console.error("Failed to query category stats:", e);
      const dimensions = Object.keys(DIMENSIONS).map((k) => ({
        ...DIMENSIONS[k],
        count: 0
      }));
      return {
        dimensions,
        totalArticles: 0,
        isGuest: true
      };
    }
  }

  /**
   * 获取专栏专辑列表 (带当前登录用户的文章数量统计)
   */
  static async getAlbums(db?: D1Database | null, authorId?: string): Promise<AlbumItem[]> {
    if (!db) return authorId ? [] : DEFAULT_ALBUMS;

    try {
      let rows: any;
      if (authorId) {
        // 当前登录用户的专属专辑统计：严格限定 a.author_id = ?
        rows = await db.prepare(`
          SELECT 
            a.id, a.slug, a.title, a.description, a.cover_image, a.sort_order, a.created_at,
            count(art.id) as article_count,
            coalesce(sum(length(art.content)), 0) as total_chars
          FROM albums a
          LEFT JOIN articles art ON a.id = art.album_id AND art.author_id = ? AND art.is_published = 1
          WHERE a.author_id = ? AND a.is_published = 1
          GROUP BY a.id
          ORDER BY a.sort_order ASC, a.created_at DESC
        `).bind(authorId, authorId).all();

        // 新注册用户无任何专栏，严格返回空数组
        if (!rows?.results || rows.results.length === 0) {
          return [];
        }
      } else {
        // 未登录访客场景：查询全局公开专辑列表（用于全区域虚化预览底色）
        rows = await db.prepare(`
          SELECT 
            a.id, a.slug, a.title, a.description, a.cover_image, a.sort_order, a.created_at,
            0 as article_count,
            0 as total_chars
          FROM albums a
          WHERE a.is_published = 1
          ORDER BY a.sort_order ASC, a.created_at DESC
        `).all();

        if (!rows?.results || rows.results.length === 0) {
          return DEFAULT_ALBUMS;
        }
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

      return rows.results.map((r: any) => {
        const totalWords = formatWordCount(r.total_chars);

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
      console.error('Failed to query albums:', e);
      return authorId ? [] : DEFAULT_ALBUMS;
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

      // 0. 作者限定 (当前登录作者专属文章流)
      if (options.authorId) {
        conditions.push("a.author_id = ?");
        params.push(options.authorId);
      }

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

      // 如果当前登录作者尚未发表文章，直接返回空结果；访客且全局无文章时回退到内置体系
      if (total === 0) {
        if (options.authorId) {
          return { data: [], total: 0, page: 1, pageSize, totalPages: 1 };
        }
        if (!options.search && !options.albumSlug && !options.date) {
          return filterFallback();
        }
      }

      const totalPages = Math.ceil(total / pageSize) || 1;
      const orderByClause = options.albumSlug
        ? "ORDER BY a.album_order ASC, a.created_at ASC, a.id ASC"
        : "ORDER BY a.created_at DESC, a.id DESC";

      // 分页查询文章列表
      const querySql = `
        SELECT 
          a.id, a.author_id, u.nickname as author_nickname, a.slug, a.title, a.summary, a.content,
          a.cover_image, a.dimension, a.album_id, a.album_order, a.chapter_label, a.tags, a.read_time, a.views,
          a.published_at, a.created_at, length(a.content) as content_length,
          alb.slug as album_slug, alb.title as album_title,
          strftime('%Y-%m-%d', datetime(a.created_at, 'unixepoch', 'localtime')) as date_str
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN albums alb ON a.album_id = alb.id
        WHERE ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?
      `;

      const rows = await db.prepare(querySql).bind(...params, pageSize, offset).all<any>();

      const data: ArticleItem[] = (rows.results || []).map((r) => {
        const norm = normalizeDimension(r.dimension) || "dao";
        const meta = DIMENSIONS[norm] || DIMENSIONS.dao;
        const chars = r.content_length || (r.content ? r.content.length : 3000);
        const wordCount = `${chars.toLocaleString()}字`;

        return {
          id: r.id,
          author_id: r.author_id,
          author_nickname: r.author_nickname || "白心解",
          slug: r.slug,
          title: r.title,
          summary: r.summary,
          content: r.content || '',
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
          album_order: r.album_order || 1,
          chapter_label: r.chapter_label || '',
          tags: r.tags || '',
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
        a.cover_image, a.dimension, a.album_id, a.album_order, a.chapter_label, a.tags, a.read_time, a.views,
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
      album_order: r.album_order || 1,
      chapter_label: r.chapter_label || '',
      tags: r.tags || '',
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
    db?: D1Database | null,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1, // 1-12
    authorId?: string
  ): Promise<Record<string, number>> {
    if (!db || !authorId) return {};

    // 构造月份起止时间戳
    const start = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const end = Math.floor(new Date(year, month, 1).getTime() / 1000) - 1;

    try {
      const rows = await db.prepare(`
        SELECT 
          strftime('%Y-%m-%d', datetime(created_at, 'unixepoch', 'localtime')) as day_str,
          count(*) as count
        FROM articles
        WHERE author_id = ? AND is_published = 1 AND created_at >= ? AND created_at <= ?
        GROUP BY day_str
      `).bind(authorId, start, end).all<{ day_str: string; count: number }>();

      const dots: Record<string, number> = {};
      for (const r of rows.results || []) {
        if (r.day_str) {
          dots[r.day_str] = r.count;
        }
      }

      return dots;
    } catch (e) {
      console.error('Failed to query calendar dots:', e);
      return {};
    }
  }

  /**
   * 获取指定文章的读者研读批注流
   */
  static async getAnnotations(
    db?: D1Database | null,
    articleId?: number
  ): Promise<any[]> {
    if (!db) {
      return [];
    }

    try {
      const query = articleId
        ? `SELECT a.*, u.nickname as user_nickname, u.avatar_bg as user_avatar_bg, u.role as user_role
           FROM annotations a
           LEFT JOIN users u ON a.user_id = u.id
           WHERE a.article_id = ?
           ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT 50`
        : `SELECT a.*, u.nickname as user_nickname, u.avatar_bg as user_avatar_bg, u.role as user_role
           FROM annotations a
           LEFT JOIN users u ON a.user_id = u.id
           ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT 50`;

      const stmt = articleId ? db.prepare(query).bind(articleId) : db.prepare(query);
      const rows = await stmt.all<any>();

      return (rows.results || []).map((r) => ({
        id: r.id,
        user: r.user_nickname || '墨客读者',
        avatarBg: r.user_avatar_bg || 'bg-stone-800',
        avatarChar: (r.user_nickname || '墨').slice(0, 1),
        isAuthor: r.user_role === 'admin',
        page: `第 ${r.page_index || 1} 页`,
        time: new Date(r.created_at * 1000).toLocaleString('zh-CN', {
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
        quote: r.quote_text || '',
        content: r.content,
        likes: r.likes || 0,
        liked: false,
      }));
    } catch (e) {
      console.error('Failed to get annotations from D1:', e);
      return [];
    }
  }

  /**
   * 提交新批注
   */
  static async createAnnotation(
    db: D1Database,
    data: {
      articleId: number;
      userId: string;
      pageIndex?: number;
      quoteText?: string;
      content: string;
    }
  ): Promise<any> {
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Math.floor(Date.now() / 1000);

    if (data.userId === 'usr_reader_guest') {
      try {
        await db.prepare(`
          INSERT OR IGNORE INTO users (id, nickname, email, role, avatar_bg, created_at, updated_at)
          VALUES ('usr_reader_guest', '墨客读者', 'guest@250258.xyz', 'guest', 'bg-stone-800', 1750000000, 1750000000)
        `).run();
      } catch (_) {}
    }

    await db.prepare(`
      INSERT INTO annotations (id, article_id, user_id, page_index, quote_text, content, likes, is_pinned, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).bind(
      id,
      data.articleId,
      data.userId,
      data.pageIndex || 1,
      data.quoteText || null,
      data.content,
      now
    ).run();

    return { id, created_at: now };
  }

  /**
   * 点赞批注
   */
  static async likeAnnotation(db: D1Database, annotationId: string): Promise<number> {
    await db.prepare(`
      UPDATE annotations SET likes = likes + 1 WHERE id = ?
    `).bind(annotationId).run();

    const row = await db.prepare(`
      SELECT likes FROM annotations WHERE id = ?
    `).bind(annotationId).first<{ likes: number }>();

    return row?.likes ?? 1;
  }
}
