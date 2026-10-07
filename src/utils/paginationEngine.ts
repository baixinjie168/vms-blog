import type { BookSpread } from '../stores/readerStore';

export interface PaginatedResult {
  spreads: BookSpread[];
  totalPages: number;
  totalSpreads: number;
}

export type ReaderFontSize = 'small' | 'normal' | 'large';
export type TableDensity = 'compact' | 'normal' | 'relaxed';

export interface PaginationOptions {
  maxPageCapacity?: number;
  fontSize?: ReaderFontSize;
  tableDensity?: TableDensity;
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

/**
 * 估算表格行的渲染高度。
 * 支持根据表格行高密度 (compact / normal / relaxed) 与单元格字体大小自适应计算
 */
function estimateTableRowHeight(
  rowHtml: string,
  tableDensity: TableDensity = 'normal',
  cellCharsPerLine: number = 14
): number {
  const cells = rowHtml.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
  let maxLines = 1;
  for (const cell of cells) {
    const textLen = cell.replace(/<[^>]+>/g, '').trim().length;
    const isSmallText = /text-size-(xs|sm)|data-size="(xs|sm)"|<small\b/i.test(cell);
    const effectiveChars = isSmallText ? cellCharsPerLine * 1.3 : cellCharsPerLine;
    maxLines = Math.max(maxLines, Math.ceil(textLen / effectiveChars));
  }

  const lineHeight = tableDensity === 'compact' ? 17 : tableDensity === 'relaxed' ? 26 : 22;
  const padding = tableDensity === 'compact' ? 6 : tableDensity === 'relaxed' ? 16 : 12;

  return maxLines * lineHeight + padding;
}

/** 估算整张表格的高度 (px) */
function estimateTableHeight(
  tableHtml: string,
  globalTableDensity: TableDensity = 'normal',
  cellCharsPerLine: number = 14
): number {
  const isCompact = tableHtml.includes('table-compact') || tableHtml.includes('data-density="compact"') || globalTableDensity === 'compact';
  const isRelaxed = tableHtml.includes('table-relaxed') || tableHtml.includes('data-density="relaxed"') || globalTableDensity === 'relaxed';
  const tableDensity: TableDensity = isCompact ? 'compact' : isRelaxed ? 'relaxed' : 'normal';

  const rows = tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
  if (rows.length === 0) return 50;
  const tableMargin = tableDensity === 'compact' ? 16 : 24;
  return rows.reduce((sum, row) => sum + estimateTableRowHeight(row, tableDensity, cellCharsPerLine), 0) + tableMargin;
}

/**
 * 把放不进单页的高表格按行拆成多张完整表格，续页重复表头。
 */
function splitTallTable(
  tableHtml: string,
  capacity: number,
  globalTableDensity: TableDensity = 'normal',
  cellCharsPerLine: number = 14
): string[] {
  const isCompact = tableHtml.includes('table-compact') || tableHtml.includes('data-density="compact"') || globalTableDensity === 'compact';
  const isRelaxed = tableHtml.includes('table-relaxed') || tableHtml.includes('data-density="relaxed"') || globalTableDensity === 'relaxed';
  const tableDensity: TableDensity = isCompact ? 'compact' : isRelaxed ? 'relaxed' : 'normal';

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

  if (!headerHtml && rows.length > 0 && /<th\b/i.test(rows[0])) {
    headerHtml = `<thead>${rows[0]}</thead>`;
    rows = rows.slice(1);
  }

  if (rows.length === 0) return [tableHtml];

  const headerCost = headerHtml ? estimateTableRowHeight(headerHtml, tableDensity, cellCharsPerLine) : 0;
  const tableMargin = tableDensity === 'compact' ? 16 : 24;
  const baseCost = headerCost + tableMargin;

  const chunks: string[][] = [];
  let current: string[] = [];
  let used = baseCost;

  for (const row of rows) {
    const rowHeight = estimateTableRowHeight(row, tableDensity, cellCharsPerLine);
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
 * 智能将长文结构切片为单页典藏书页，支持字号与表格密度动态自适应
 */
export function paginateHtmlContent(
  htmlContent: string,
  options: number | PaginationOptions = 760
): PaginatedResult {
  const opts: PaginationOptions = typeof options === 'number' ? { maxPageCapacity: options } : options || {};
  const fontSize: ReaderFontSize = opts.fontSize || 'normal';
  const tableDensity: TableDensity = opts.tableDensity || 'normal';

  const defaultCapacity = fontSize === 'small' ? 880 : fontSize === 'large' ? 640 : 760;
  const maxPageCapacity = opts.maxPageCapacity || defaultCapacity;
  const cellCharsPerLine = fontSize === 'small' ? 16 : fontSize === 'large' ? 12 : 14;
  const minTableFirstChunk = tableDensity === 'compact' ? 170 : 220;

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
  const normalized = htmlContent
    .replace(/<hr[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>/gi, '<!-- PAGE_BREAK -->')
    .replace(/<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '<!-- PAGE_BREAK -->')
    .replace(/<(?:hr|div)[^>]*data-page-break[^>]*>(?:<\/(?:hr|div)>)?/gi, '<!-- PAGE_BREAK -->');

  const rawBlocks = splitTopLevelBlocks(normalized);

  const pages: string[] = [];
  let currentPageBlocks: string[] = [];
  let currentEstimatedHeight = 0;

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

    // 长表格拆分
    if (/^<table/i.test(block)) {
      const remaining = maxPageCapacity - currentEstimatedHeight;
      if (currentPageBlocks.length > 0 && remaining < minTableFirstChunk) {
        pages.push(currentPageBlocks.join('\n'));
        currentPageBlocks = [];
        currentEstimatedHeight = 0;
      }
      const available = Math.max(minTableFirstChunk, maxPageCapacity - currentEstimatedHeight);
      const chunks = splitTallTable(block, available, tableDensity, cellCharsPerLine);
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
      blockHeight = fontSize === 'small' ? 46 : fontSize === 'large' ? 58 : 52;
    } else if (isTable) {
      blockHeight = estimateTableHeight(block, tableDensity, cellCharsPerLine);
    } else if (isImage) {
      blockHeight = 240;
    } else if (isCode) {
      blockHeight = Math.max(80, Math.min(320, 40 + Math.ceil(textLen / 25) * 20));
    } else if (isQuote) {
      blockHeight = 36 + Math.ceil(textLen / 35) * 24;
    } else {
      // 普通段落：根据字号微调每行字数与行高
      const isSmallText = /text-size-(xs|sm)|data-size="(xs|sm)"|<small\b/i.test(block);
      const charsPerLine = isSmallText ? 52 : (fontSize === 'small' ? 48 : fontSize === 'large' ? 36 : 42);
      const lineHeight = isSmallText ? 22 : (fontSize === 'small' ? 23 : fontSize === 'large' ? 29 : 26);
      blockHeight = Math.max(28, Math.ceil(textLen / charsPerLine) * lineHeight + 12);
    }

    // 避让孤行标题
    const orphanBuffer = fontSize === 'small' ? 50 : fontSize === 'large' ? 70 : 60;
    const isOrphanHeading = isHeading && currentEstimatedHeight + blockHeight + orphanBuffer > maxPageCapacity;

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

  const pageClass =
    fontSize === 'small'
      ? 'space-y-3.5 text-stone-800 text-[13.5px] leading-snug text-justify'
      : fontSize === 'large'
      ? 'space-y-4 text-stone-800 text-base leading-loose text-justify'
      : 'space-y-4 text-stone-800 text-sm sm:text-[15px] leading-relaxed text-justify';

  const spreads: BookSpread[] = pages.map((content, idx) => {
    const pageHtml = `<div class="${pageClass}">${content}</div>`;
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
