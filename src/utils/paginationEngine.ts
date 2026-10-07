import type { BookSpread } from '../stores/readerStore';

export interface PaginatedResult {
  spreads: BookSpread[];
  totalPages: number;
  totalSpreads: number;
}

/** 只有出现在嵌套深度 0 时，这些标签才构成分页边界 */
const TOP_LEVEL_BLOCK = /^<(?:h[1-6]|p|blockquote|pre|ul|ol|table|figure|div)\b/i;

/** 无闭合标签的元素，不参与嵌套深度计数 */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

/**
 * 按「顶层块级标签」切分 HTML，嵌套在块内的子元素不切。
 *
 * 不能用 /(?=<p|table|...)/ 直接 split：Tiptap 会把每个表格单元格、每个
 * 列表项的内容各自包进 <p>，于是表格内部的 <p> 也会被当成顶层边界，把
 * <table> 撕成「开标签留在一页、闭标签落到下一页」。两页各自补全标签后，
 * 前者变成残缺表格、后者只剩没有祖先的散落 <tr>/<td>，浏览器会把它们
 * 当纯文本渲染——这正是阅读器与实时预览中表格破碎的原因。
 *
 * 改为扫描标签并跟踪嵌套深度，只在深度 0 的块级开标签处切开，表格与
 * 列表因此始终作为完整块参与分页。
 */
function splitTopLevelBlocks(html: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = 0;
  let cursor = 0;

  while (cursor < html.length) {
    const lt = html.indexOf('<', cursor);
    if (lt === -1) break;

    // 注释：正常化阶段已把分页符替换为 <!-- PAGE_BREAK -->，它在顶层即为分页指令
    if (html.startsWith('<!--', lt)) {
      const close = html.indexOf('-->', lt);
      const end = close === -1 ? html.length : close + 3;
      if (depth === 0 && html.slice(lt, end).includes('PAGE_BREAK')) {
        const chunk = html.slice(start, lt).trim();
        if (chunk) blocks.push(chunk);
        blocks.push('<!-- PAGE_BREAK -->');
        start = end;
      }
      cursor = end;
      continue;
    }

    const gt = html.indexOf('>', lt);
    if (gt === -1) break;
    const rawTag = html.slice(lt, gt + 1);

    const match = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(rawTag);
    if (!match) {
      cursor = gt + 1;
      continue;
    }

    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();

    if (!isClosing && depth === 0 && TOP_LEVEL_BLOCK.test(rawTag)) {
      const chunk = html.slice(start, lt).trim();
      if (chunk) blocks.push(chunk);
      start = lt;
    }

    if (isClosing) {
      if (depth > 0) depth -= 1;
    } else if (!VOID_TAGS.has(tagName) && !/\/>$/.test(rawTag)) {
      depth += 1;
    }

    cursor = gt + 1;
  }

  const tail = html.slice(start).trim();
  if (tail) blocks.push(tail);
  return blocks;
}

/** 书页中单个表格单元格每行约容纳的汉字数（单页宽画布估算） */
const CELL_CHARS_PER_LINE = 14;
/** 单元格每行的高度 (px) */
const CELL_LINE_HEIGHT = 22;
/** 表格外边距合计 (px) */
const TABLE_MARGIN = 24;
/**
 * 表格首块要求的最小可用空间。
 * 低于此值说明当前页只剩一点尾巴，与其塞进一两行不如另起一页再排整张表。
 */
const MIN_TABLE_FIRST_CHUNK = 220;

/**
 * 估算表格行的渲染高度。
 * 书页很窄，长描述会被折成多行，故按「单元格中最长的一列折几行」来估，
 * 而不是按整行文本长度——否则多列短文本的行会被严重高估。
 */
function estimateTableRowHeight(rowHtml: string): number {
  const cells = rowHtml.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
  let maxLines = 1;
  for (const cell of cells) {
    const textLen = cell.replace(/<[^>]+>/g, '').trim().length;
    maxLines = Math.max(maxLines, Math.ceil(textLen / CELL_CHARS_PER_LINE));
  }
  return maxLines * CELL_LINE_HEIGHT + 12;
}

/** 估算整张表格的高度 (px) */
function estimateTableHeight(tableHtml: string): number {
  const rows = tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
  if (rows.length === 0) return 60;
  return rows.reduce((sum, row) => sum + estimateTableRowHeight(row), 0) + TABLE_MARGIN;
}

/**
 * 把放不进单页的高表格按行拆成多张完整表格，续页重复表头。
 *
 * 表格虽是原子块，但一张真实的长表格（如待产包清单）远高于一页容量；
 * 只保证「不撕裂」的话它会整块溢出书页、被 overflow-hidden 裁掉，
 * 读者看到的仍是不完整的表格。这里改为按行分页，与实体书的做法一致。
 * 每张子表都是自闭合的完整 <table>，因此不会重现标签被撕开的旧问题。
 */
function splitTallTable(tableHtml: string, capacity: number): string[] {
  const openTag = (/^<table\b[^>]*>/i.exec(tableHtml) || [''])[0];
  if (!openTag) return [tableHtml];

  const theadMatch = /<thead\b[^>]*>[\s\S]*?<\/thead>/i.exec(tableHtml);
  const tbodyMatch = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec(tableHtml);
  const bodyHtml = tbodyMatch
    ? tbodyMatch[1]
    : tableHtml
        .slice(openTag.length)
        .replace(/<\/table>\s*$/i, '')
        .replace(theadMatch ? theadMatch[0] : '', '');

  let headerHtml = theadMatch ? theadMatch[0] : '';
  let rows = bodyHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];

  // Tiptap 的 withHeaderRow 只把首行单元格渲染成 <th>，并不生成 <thead>，
  // 这里补一层，让续页重复的表头在语义和样式上都成立。
  if (!headerHtml && rows.length > 0 && /<th\b/i.test(rows[0])) {
    headerHtml = `<thead>${rows[0]}</thead>`;
    rows = rows.slice(1);
  }

  if (rows.length === 0) return [tableHtml];

  const headerCost = headerHtml ? estimateTableRowHeight(headerHtml) : 0;
  const baseCost = headerCost + TABLE_MARGIN;

  const chunks: string[][] = [];
  let current: string[] = [];
  let used = baseCost;

  for (const row of rows) {
    const rowHeight = estimateTableRowHeight(row);
    // 每页至少保留一行，避免某行过高时陷入空转
    if (current.length > 0 && used + rowHeight > capacity) {
      chunks.push(current);
      current = [];
      used = baseCost;
    }
    current.push(row);
    used += rowHeight;
  }
  if (current.length > 0) chunks.push(current);

  if (chunks.length <= 1) return [tableHtml];

  return chunks.map(
    (chunk) => `${openTag}${headerHtml}<tbody>${chunk.join('')}</tbody></table>`
  );
}

/**
 * 离屏与结构化流式分页切片算法 (Pagination Engine)
 * 智能将长文结构切片为左右对开装帧书页，防止孤行标题与排版撕裂
 */
export function paginateHtmlContent(
  htmlContent: string,
  maxPageCapacity: number = 760
): PaginatedResult {
  if (!htmlContent || !htmlContent.trim()) {
    return {
      spreads: [
        {
          leftPageNum: 1,
          rightPageNum: 1,
          leftContent: '<div class="text-stone-400 font-serif p-4">正文虚位以待...</div>',
          rightContent: '<div class="text-stone-400 font-serif p-4">正文虚位以待...</div>',
        },
      ],
      totalPages: 1,
      totalSpreads: 1,
    };
  }

  // 1. 块级标签粗粒度拆分
  // 识别自定义分页符 <hr class="page-break"> 或 <div class="page-break"> 或带 data-page-break 的块元素
  const normalized = htmlContent
    .replace(/<hr[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>/gi, '<!-- PAGE_BREAK -->')
    .replace(/<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '<!-- PAGE_BREAK -->')
    .replace(/<(?:hr|div)[^>]*data-page-break[^>]*>(?:<\/(?:hr|div)>)?/gi, '<!-- PAGE_BREAK -->');

  // 顶层块级切分。表格的跨页拆分依赖「当前页还剩多少空间」，
  // 因此不在这里预先拆，而是交给下方队列在使用时决定。
  const rawBlocks = splitTopLevelBlocks(normalized);

  const pages: string[] = [];
  let currentPageBlocks: string[] = [];
  let currentEstimatedHeight = 0;

  // 用队列而非索引遍历：长表格会被就地拆成多张子表插回队首，
  // 让每张子表都按普通块参与后续排版。
  const queue = [...rawBlocks];

  while (queue.length > 0) {
    const block = queue.shift()!;

    // 手动分页符
    if (block.includes('<!-- PAGE_BREAK -->')) {
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks.join('\n'));
        currentPageBlocks = [];
        currentEstimatedHeight = 0;
      }
      continue;
    }

    // 长表格：按当前页剩余空间决定首块大小，使表格能从本页接着排，
    // 避免整块放不下时把前面的标题孤零零留在页尾。拆出的子表都是
    // 自闭合的完整 <table>，不会重现标签被撕开的问题。
    if (/^<table/i.test(block)) {
      const remaining = maxPageCapacity - currentEstimatedHeight;
      if (currentPageBlocks.length > 0 && remaining < MIN_TABLE_FIRST_CHUNK) {
        pages.push(currentPageBlocks.join('\n'));
        currentPageBlocks = [];
        currentEstimatedHeight = 0;
      }
      const available = Math.max(MIN_TABLE_FIRST_CHUNK, maxPageCapacity - currentEstimatedHeight);
      const chunks = splitTallTable(block, available);
      // 未被拆开（本页放得下）时不再入队，直接走下面的常规排版
      if (chunks.length > 1) {
        queue.unshift(...chunks);
        continue;
      }
    }

    // 估算当前块高度 (px)
    const isHeading = /^<h[1-6]/i.test(block);
    const isCode = /^<pre/i.test(block);
    const isTable = /^<table/i.test(block);
    const isImage = /<img/i.test(block);
    const isQuote = /^<blockquote/i.test(block);
    const textLen = block.replace(/<[^>]+>/g, '').length;

    let blockHeight = 28;
    if (isHeading) {
      blockHeight = 52;
    } else if (isTable) {
      // 未被拆分的整表：按行折行估算高度（与 splitTallTable 同一套口径）
      blockHeight = estimateTableHeight(block);
    } else if (isImage) {
      blockHeight = 240;
    } else if (isCode) {
      blockHeight = Math.max(80, Math.min(320, 40 + Math.ceil(textLen / 25) * 20));
    } else if (isQuote) {
      blockHeight = 36 + Math.ceil(textLen / 35) * 24;
    } else {
      // 普通段落
      blockHeight = Math.max(32, Math.ceil(textLen / 42) * 26 + 12);
    }

    // 避让孤行标题：如果是标题且剩余空间不足以容纳标题及其后续段落，强制翻至下一页
    const isOrphanHeading = isHeading && currentEstimatedHeight + blockHeight + 60 > maxPageCapacity;

    if (
      (currentEstimatedHeight + blockHeight > maxPageCapacity || isOrphanHeading) &&
      currentPageBlocks.length > 0
    ) {
      pages.push(currentPageBlocks.join('\n'));
      currentPageBlocks = [block];
      currentEstimatedHeight = blockHeight;
    } else {
      currentPageBlocks.push(block);
      currentEstimatedHeight += blockHeight;
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks.join('\n'));
  }

  // 2. 单页装帧模式：每一页作为一个独立优雅印张，不再进行偶数补白
  const spreads: BookSpread[] = pages.map((content, idx) => {
    const pageHtml = `<div class="space-y-4 text-stone-800 text-sm sm:text-[15px] leading-relaxed text-justify">${content}</div>`;
    return {
      leftPageNum: idx + 1,
      rightPageNum: idx + 1,
      leftContent: pageHtml,
      rightContent: pageHtml,
    };
  });

  return {
    spreads,
    totalPages: pages.length,
    totalSpreads: spreads.length,
  };
}
