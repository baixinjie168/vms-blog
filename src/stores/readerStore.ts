import { atom, map } from 'nanostores';
import type { ArticleItem } from '../services/blogService';
import { paginateHtmlContent } from '../utils/paginationEngine';

export type PaperTheme = 'ivory' | 'bamboo' | 'ink';

export interface TOCItem {
  level: number; // 1: H1, 2: H2, 3: H3
  title: string;
  page: number; // 1-indexed page
  tag?: string;
}

export interface BookSpread {
  leftPageNum: number;
  rightPageNum: number;
  leftContent: string;
  rightContent: string;
}

export interface ReaderComment {
  id: number;
  user: string;
  avatarBg: string;
  avatarChar: string;
  isAuthor?: boolean;
  page: string;
  time: string;
  quote?: string;
  content: string;
  likes: number;
  liked: boolean;
}

export interface ReaderState {
  isOpen: boolean;
  article: ArticleItem | null;
  currentSpreadIndex: number;
  paperTheme: PaperTheme;
  spreads: BookSpread[];
  toc: TOCItem[];
  comments: ReaderComment[];
}

// 旗舰文章精修 3 对页 (6 页面)
const DEFAULT_FLAGSHIP_SPREADS: BookSpread[] = [
  {
    leftPageNum: 1,
    rightPageNum: 2,
    leftContent: `
      <div class="space-y-4">
        <h1 class="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight leading-snug">
          构建长期主义数字花园：<br/>从信息投喂到终极意义探索
        </h1>
        <div class="text-xs text-limeDark font-serif italic py-1 border-l-2 border-limeBrand pl-3">
          “道者，令民与上同意也，故可以与之死，可以与之生，而不畏危也。” ——《孙子兵法》
        </div>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          在快节奏与算法主导的数字媒介中，我们的大脑每天都在经历剧烈的信息冲刷。短视频、碎片化快讯与信息流瀑布，让知识获取看似唾手可得，实则沉淀极浅。我们习惯了被动接收算法编织的认知茧房，却渐渐遗失了向内审视、严谨构建生命知识底座的耐心。
        </p>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          传统的个人博客常常演化成一种堆叠的线性流水账：读者不断向下滚动滚轮，眼球快速扫视，却往往在拉到页面底部时，除了手指的疲惫外一无所得。为了抵抗这种数字化浮躁，我们必须重新审视<strong class="font-bold text-stone-900">“书”这一存在了数千年的物理容器</strong>。
        </p>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          数字花园（Digital Garden）与快餐式文章的本质区别，在于它不是一次性的内容消费，而是一座持续播种、修剪与沉淀的思想常青林。每一次伏案梳理，都是在算法喧嚣的荒原上，为自己筑起坚实的心灵庇护所。
        </p>
      </div>
    `,
    rightContent: `
      <div class="space-y-4">
        <h3 class="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
          <span class="w-1.5 h-4 bg-orient-dao rounded-full inline-block"></span>
          一、 七维心智框架的贯通
        </h3>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          为了避免知识沉淀散乱无章，本站将所有思绪梳理并提炼为七个层层递进的生命系统支柱。这七大维度并非孤立的分类，而是环环相扣、相互滋养的心智飞轮：
        </p>
        <div class="grid grid-cols-2 gap-2 text-xs my-2">
          <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
            <span class="font-bold text-orient-dao">【道】</span> 我为什么活？世界观、价值观与人生终局
          </div>
          <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
            <span class="font-bold text-orient-xin">【心】</span> 我是什么样的人？认知、情绪、意志与自律
          </div>
          <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
            <span class="font-bold text-orient-fa">【法】</span> 我如何做事？方法论、底层原则与决策模型
          </div>
          <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
            <span class="font-bold text-limeDark">【术】</span> 我具体怎么做？专业技能、工程工法与排版
          </div>
          <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
            <span class="font-bold text-orient-qi">【器】</span> 我用什么做？AI大模型、软件设备与生产力协同
          </div>
          <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200">
            <span class="font-bold text-orient-matter">【事】</span> 我实际创造什么？工作事业、作品交付与价值
          </div>
        </div>
        <div class="p-2 rounded-xl bg-stone-100/90 border border-stone-200 text-xs">
          <span class="font-bold text-orient-trend">【势】</span> 我如何借势？时代浪潮、行业脉搏、资本与组织网络
        </div>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          从以道明向、以心修己，到以法立律、以术精工，再到以器致远、以事立业与以势乘风。在这套闭环体系中，每一篇文章都精准锚定在心智矩阵的特定坐标上。
        </p>
      </div>
    `,
  },
  {
    leftPageNum: 3,
    rightPageNum: 4,
    leftContent: `
      <div class="space-y-4">
        <h3 class="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
          <span class="w-1.5 h-4 bg-orient-dao rounded-full inline-block"></span>
          二、 为什么坚决拒绝无尽垂直滚动条？
        </h3>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          滚动条是现代 UI 交互史上最伟大的发明之一，但对于深度研读与严肃沉淀而言，它也是专注力的头号杀手。
        </p>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          当一篇文章具有无限向下延伸的可能时，读者的大脑会不由自主地产生预期的焦虑：“这篇到底有多长？我还要滑多久？”。而纸质书籍则通过实体厚度与固定开本，给读者建立了极其强烈的空间位置锚点与掌控感。
        </p>
        <div class="p-3 bg-stone-100/80 rounded-xl border border-stone-200/80 my-2">
          <div class="font-bold text-xs text-stone-800 mb-1.5">双页翻书的心流心智模型：</div>
          <ul class="list-disc list-inside text-xs text-stone-600 space-y-1">
            <li><strong>边界清晰</strong>：每一面书页只有固定的容量，容量满了就必须翻页，给予思维明确的完结反馈。</li>
            <li><strong>呼吸节奏</strong>：手指点击或按键翻页的动作，构成了一次微小的认知缓冲期，让上一页的思考充分沉淀。</li>
            <li><strong>空间记忆（Spatial Memory）</strong>：回忆知识时，人类大脑本能地依赖物理空间定位，想起“某段话在左下角”。</li>
          </ul>
        </div>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          通过有限视窗双对页装帧，屏幕不再是一条冰冷滑动的资讯传送带，而是一本静待慢读、触手可及的典藏线装长卷。
        </p>
      </div>
    `,
    rightContent: `
      <div class="space-y-4">
        <h3 class="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
          <span class="w-1.5 h-4 bg-orient-dao rounded-full inline-block"></span>
          三、 翻书体验的数字化实现机制
        </h3>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          在技术实现上，我们彻底抛弃将整个文章内容一口气挂载到无限长 DOM 树的做法。相反，我们通过计算可视视窗尺寸结合流式结构切片分发：
        </p>
        <pre class="bg-stone-900 text-stone-100 p-3 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
// 结构化双页对开排版引擎核心心法
function layoutBookSpreads(astNodes, pageCapacity) {
  const pages = measureAndPaginate(astNodes, pageCapacity);
  return pages.reduce((spreads, page, idx) => {
    if (idx % 2 === 0) spreads.push({ left: page, right: pages[idx + 1] });
    return spreads;
  }, []);
}</pre>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          双对页仿真不仅还原了中缝折痕（Spine crease）与微弱内卷阴影，更辅以纸张色温选择（牙白纸、竹青护眼、墨黑沉浸），彻底告别白底黑字的冰冷荧幕感。
        </p>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          无论是使用外接键盘的方向键（← / →），还是轻点书页两侧的优雅翻页边翼，整个翻阅过程流畅自然，如同翻动上等宣纸印张。
        </p>
      </div>
    `,
  },
  {
    leftPageNum: 5,
    rightPageNum: 6,
    leftContent: `
      <div class="space-y-4">
        <h3 class="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
          <span class="w-1.5 h-4 bg-orient-dao rounded-full inline-block"></span>
          四、 结语：让博客成为时间的容器
        </h3>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          一座真正有生命力的个人博客，不在于多么频繁地追逐热点，而在于它是否经得起时间的冲刷。
        </p>
        <p class="text-sm text-stone-700 leading-relaxed indent-8">
          在这里，每一篇博文皆标注了创作时间，以七维框架守护思想的秩序。每次伏案书写，都在为你的思想大厦添上一块端正的青砖。
        </p>
        <div class="mt-8 text-center">
          <div class="inline-block p-4 border-2 border-stone-300 rounded-2xl bg-white shadow-sm">
            <div class="font-serif font-bold text-stone-800 text-sm">「明道 · 澄心 · 立法 · 精术 · 善器 · 成事 · 乘势」</div>
            <div class="text-[11px] text-stone-400 mt-1 font-serif">—— 全文完 · 感谢慢读 ——</div>
          </div>
        </div>
      </div>
    `,
    rightContent: `
      <div class="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white/50">
        <div class="w-14 h-14 rounded-full bg-limeLight text-limeDark flex items-center justify-center font-serif text-2xl font-bold mb-3 shadow-inner">
          道
        </div>
        <h4 class="font-serif font-bold text-stone-900 text-base mb-1">阅读完毕 · 沉思回味</h4>
        <p class="text-xs text-stone-500 max-w-xs mb-6 font-serif">
          您已读完本文。您可以返回文集列表，或探索其他七维层级。
        </p>
        <div class="flex flex-col gap-2 w-full max-w-xs text-xs">
          <button id="book-finish-back-btn" class="w-full py-2 rounded-xl bg-stone-900 text-white font-medium hover:bg-limeDark transition cursor-pointer shadow-xs">
            返回文集列表
          </button>
          <button id="book-finish-rewind-btn" class="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer">
            重新翻阅第一页
          </button>
        </div>
      </div>
    `,
  },
];

const DEFAULT_FLAGSHIP_TOC: TOCItem[] = [
  { level: 1, title: '构建长期主义数字花园', page: 1, tag: '篇目' },
  { level: 2, title: '一、 七维心智框架的贯通', page: 2, tag: '章一' },
  { level: 3, title: '1.1 认知跃迁与生命支柱', page: 2, tag: '小节' },
  { level: 3, title: '1.2 七大维度的莫比乌斯环', page: 2, tag: '小节' },
  { level: 2, title: '二、 坚决拒绝无尽垂直滚动条', page: 3, tag: '章二' },
  { level: 3, title: '2.1 翻书心流心智模型', page: 3, tag: '小节' },
  { level: 3, title: '2.2 空间记忆与边界感知', page: 3, tag: '小节' },
  { level: 2, title: '三、 翻书体验数字化实现机制', page: 4, tag: '章三' },
  { level: 3, title: '3.1 自适应流式切片算法', page: 4, tag: '小节' },
  { level: 2, title: '四、 结语：让博客成为时间的容器', page: 5, tag: '章四' },
  { level: 3, title: '4.1 守护个人思想庇护所', page: 5, tag: '小节' },
];

const DEFAULT_COMMENTS: ReaderComment[] = [
  {
    id: 1,
    user: '行者三千',
    avatarBg: 'bg-blue-600',
    avatarChar: '行',
    page: '第 1 页',
    time: '10分钟前',
    quote: '“道者，令民与上同意也...”',
    content: '在技术博客里引入孙子兵法的道，将世界观作为第一层级，确实抓住了很多工程师在技术瓶颈期的精神迷茫点，立意深远！',
    likes: 18,
    liked: false,
  },
  {
    id: 2,
    user: '林深见鹿',
    avatarBg: 'bg-rose-600',
    avatarChar: '鹿',
    page: '第 3 页',
    time: '1小时前',
    quote: '“为什么坚决拒绝无尽垂直滚动条？”',
    content: '太有同感了！现代社交媒体的无限瀑布流让注意力极度支离破碎，实体双对页装帧带来了久违的专注慢读心流。',
    likes: 24,
    liked: false,
  },
  {
    id: 3,
    user: '白心解',
    isAuthor: true,
    avatarBg: 'bg-stone-900',
    avatarChar: '白',
    page: '第 3 页',
    time: '2小时前',
    quote: '“双页翻书的心流心智模型：边界清晰、呼吸节奏、位置记忆”',
    content: '这里重点参考了加藤周一的阅读心理学研究，空间位置物理记忆对长期知识沉淀是不可替代的，这也是我坚持做双开本的原因。',
    likes: 36,
    liked: true,
  },
  {
    id: 4,
    user: '墨客小友',
    avatarBg: 'bg-[#70C000]',
    avatarChar: '墨',
    page: '第 5 页',
    time: '昨天',
    quote: '',
    content: '青柠绿的配色非常舒服干净，翻页动效利落优雅，支持博主长期耕耘！',
    likes: 9,
    liked: false,
  },
];

// 根据文章真实正文与分页引擎智能构造对开书页
export function buildArticleReaderContent(article: ArticleItem): {
  spreads: BookSpread[];
  toc: TOCItem[];
  comments: ReaderComment[];
} {
  const dimensionName = article.dimensionName || `${article.dimensionChar || '道'} · 认知体系`;
  const dimensionBg = article.dimensionBg || 'bg-stone-100';
  const dimensionBorder = article.dimensionBorder || 'border-stone-200';
  const dateStr = article.date_str || new Date().toISOString().slice(0, 10);

  // 摘要由发布时自动截取正文前 140 字生成，若它只是正文开头的重复，则不再作为导语二次渲染
  const contentPlain = (article.content || '').replace(/<[^>]+>/g, '').trim();
  const leadText = (article.summary || '').trim();
  const showLead =
    Boolean(leadText) &&
    Boolean(contentPlain) &&
    !contentPlain.startsWith(leadText.replace(/\.\.\.$/, '').trim());

  // 篇头篇目信息（仅在第一页上方自然排版呈现）
  const headerHtml = `
    <div class="space-y-3 mb-5 pb-3 border-b border-stone-200/80">
      <div class="flex items-center gap-2 mb-1">
        <span class="px-2 py-0.5 rounded text-[10px] font-serif font-bold ${dimensionBg} border ${dimensionBorder} text-stone-700">
          ${dimensionName}
        </span>
        <span class="text-[10px] font-mono text-stone-400">${dateStr}</span>
        <span class="text-[10px] font-mono text-stone-300">·</span>
        <span class="text-[10px] font-serif text-stone-400">${article.author_nickname || '白心解'} 著</span>
      </div>
      <h1 class="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight leading-snug">
        ${article.title}
      </h1>
      ${showLead ? `<div class="text-xs text-limeDark font-serif italic py-1.5 border-l-2 border-limeBrand pl-3 bg-lime-50/40 rounded-r">${article.summary}</div>` : ''}
    </div>
  `;

  const fullRawHtml = article.content
    ? `${headerHtml}${article.content}`
    : `${headerHtml}<p class="text-stone-700 leading-relaxed indent-8">${article.summary || '正文暂在编排装帧中...'}</p>`;

  const pagination = paginateHtmlContent(fullRawHtml);

  // 动态提取文章内各级标题作为目录导航 (TOC)
  const toc: TOCItem[] = [];
  toc.push({ level: 1, title: article.title, page: 1, tag: '篇目' });

  const headingMatches = [...fullRawHtml.matchAll(/<(h[1-3])[^>]*>(.*?)<\/\1>/gi)];
  let chapterIndex = 1;
  for (const m of headingMatches) {
    const level = parseInt(m[1][1], 10);
    const headingText = m[2].replace(/<[^>]+>/g, '').trim();
    if (headingText && headingText !== article.title) {
      toc.push({
        level,
        title: headingText,
        page: Math.min(pagination.totalPages, chapterIndex + 1),
        tag: level === 1 ? '篇目' : level === 2 ? `章${chapterIndex++}` : '小节',
      });
    }
  }

  return {
    spreads: pagination.spreads,
    toc,
    comments: [],
  };
}

const getInitialPaperTheme = (): PaperTheme => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('vms_paper_theme');
      if (saved === 'ivory' || saved === 'bamboo' || saved === 'ink') {
        return saved;
      }
    } catch {}
  }
  return 'ivory';
};

const initialReaderState: ReaderState = {
  isOpen: false,
  article: null,
  currentSpreadIndex: 0,
  paperTheme: getInitialPaperTheme(),
  spreads: [],
  toc: [],
  comments: [],
};

export const $reader = map<ReaderState>(initialReaderState);

// 异步从云端拉取文章真实批注列表
export async function loadComments(articleId: number) {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch(`/api/comments?articleId=${articleId}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        $reader.setKey('comments', result.data);
      }
    }
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
}

// 打开翻书阅读器
export async function openBookReader(article: ArticleItem, initialPage: number = 1) {
  let fullArticle = article;
  if (!fullArticle.content && fullArticle.slug) {
    try {
      const res = await fetch(`/api/articles?slug=${fullArticle.slug}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.article) {
          fullArticle = { ...fullArticle, ...json.article };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch full article for reader:', e);
    }
  }

  const content = buildArticleReaderContent(fullArticle);
  const targetSpread = Math.max(0, Math.floor((initialPage - 1) / 2));

  $reader.set({
    isOpen: true,
    article: fullArticle,
    currentSpreadIndex: Math.min(targetSpread, Math.max(0, content.spreads.length - 1)),
    paperTheme: $reader.get().paperTheme,
    spreads: content.spreads,
    toc: content.toc,
    comments: [], // 先置空，等待 loadComments 注入真实批注
  });

  if (article?.id) {
    loadComments(article.id);
  }

  if (typeof window !== 'undefined') {
    // 隐藏顶栏与三栏工作台
    const header = document.querySelector('header');
    if (header) header.classList.add('hidden');
    const homeView = document.getElementById('view-home');
    if (homeView) homeView.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 关闭阅读器返回文集工作台
export function closeBookReader() {
  $reader.setKey('isOpen', false);

  if (typeof window !== 'undefined') {
    // 恢复全局顶栏与三栏工作台
    const header = document.querySelector('header');
    if (header) header.classList.remove('hidden');
    const homeView = document.getElementById('view-home');
    if (homeView) homeView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 翻至上一页
export function prevSpread() {
  const current = $reader.get().currentSpreadIndex;
  if (current > 0) {
    $reader.setKey('currentSpreadIndex', current - 1);
  }
}

// 翻至下一页
export function nextSpread() {
  const { currentSpreadIndex, spreads } = $reader.get();
  if (currentSpreadIndex < spreads.length - 1) {
    $reader.setKey('currentSpreadIndex', currentSpreadIndex + 1);
  }
}

// 跳转到指定页码 (1-indexed)
export function jumpToPage(targetPage: number) {
  const { spreads } = $reader.get();
  const targetSpread = Math.floor((targetPage - 1) / 2);
  if (targetSpread >= 0 && targetSpread < spreads.length) {
    $reader.setKey('currentSpreadIndex', targetSpread);
  }
}

// 设置纸张材质色温
export function setPaperTheme(theme: PaperTheme) {
  $reader.setKey('paperTheme', theme);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('vms_paper_theme', theme);
    } catch {}
  }
}

// 点赞评论
export function likeComment(commentId: number | string) {
  const comments = [...$reader.get().comments];
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx !== -1) {
    const item = comments[idx];
    const liked = !item.liked;
    comments[idx] = {
      ...item,
      liked,
      likes: item.likes + (liked ? 1 : -1),
    };
    $reader.setKey('comments', comments);

    if (typeof window !== 'undefined' && liked) {
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', annotationId: String(commentId) }),
      }).catch(() => {});
    }
  }
}

// 发表新评注
export async function addComment(commentData: {
  content: string;
  quote?: string;
  user?: string;
  avatarBg?: string;
  avatarChar?: string;
  isAuthor?: boolean;
}) {
  const { article, currentSpreadIndex, spreads, comments } = $reader.get();
  const spread = spreads[currentSpreadIndex] || spreads[0] || { leftPageNum: 1, rightPageNum: 2 };

  const tempId = `temp_${Date.now()}`;
  const newComment: ReaderComment = {
    id: tempId,
    user: commentData.user || '墨客读者',
    avatarBg: commentData.avatarBg || 'bg-stone-800',
    avatarChar: commentData.avatarChar || (commentData.user ? commentData.user.slice(0, 1) : '墨'),
    isAuthor: commentData.isAuthor,
    page: `第 ${spread.leftPageNum}-${spread.rightPageNum} 页`,
    time: '刚刚',
    quote: commentData.quote,
    content: commentData.content,
    likes: 0,
    liked: false,
  };

  $reader.setKey('comments', [newComment, ...comments]);

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article?.id || 1,
          pageIndex: currentSpreadIndex + 1,
          quoteText: commentData.quote,
          content: commentData.content,
        }),
      });
      const data = await res.json();
      if (data?.data?.id) {
        const current = $reader.get().comments;
        $reader.setKey(
          'comments',
          current.map((c) => (c.id === tempId ? { ...c, id: data.data.id } : c))
        );
      }
      if (article?.id) {
        loadComments(article.id);
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
    }
  }
}
