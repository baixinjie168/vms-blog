import type { BookSpread } from '../stores/readerStore';

export interface PaginatedResult {
  spreads: BookSpread[];
  totalPages: number;
  totalSpreads: number;
}

/**
 * 离屏与结构化流式分页切片算法 (Pagination Engine)
 * 智能将长文结构切片为左右对开装帧书页，防止孤行标题与排版撕裂
 */
export function paginateHtmlContent(
  htmlContent: string,
  maxPageCapacity: number = 660
): PaginatedResult {
  if (!htmlContent || !htmlContent.trim()) {
    return {
      spreads: [
        {
          leftPageNum: 1,
          rightPageNum: 2,
          leftContent: '<div class="text-stone-400 font-serif p-4">正文虚位以待...</div>',
          rightContent: '<div class="text-stone-300 font-serif p-4 text-center">印张待著</div>',
        },
      ],
      totalPages: 2,
      totalSpreads: 1,
    };
  }

  // 1. 块级标签粗粒度拆分
  // 识别自定义分页符 <hr class="page-break"> 或标准块元素
  const normalized = htmlContent
    .replace(/<hr class="page-break"[^>]*>/gi, '<!-- PAGE_BREAK -->')
    .replace(/<div class="page-break"[^>]*>.*?<\/div>/gi, '<!-- PAGE_BREAK -->');

  const rawBlocks = normalized
    .split(/(?=<(?:h[1-6]|p|blockquote|pre|ul|ol|table|figure|div|!-- PAGE_BREAK --))/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const pages: string[] = [];
  let currentPageBlocks: string[] = [];
  let currentEstimatedHeight = 0;

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];

    // 手动分页符
    if (block.includes('<!-- PAGE_BREAK -->')) {
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks.join('\n'));
        currentPageBlocks = [];
        currentEstimatedHeight = 0;
      }
      continue;
    }

    // 估算当前块高度 (px)
    const isHeading = /^<h[1-6]/i.test(block);
    const isCode = /^<pre/i.test(block);
    const isImage = /<img/i.test(block);
    const isQuote = /^<blockquote/i.test(block);
    const textLen = block.replace(/<[^>]+>/g, '').length;

    let blockHeight = 28;
    if (isHeading) {
      blockHeight = 52;
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

  // 保证偶数页成对 (双开本装帧)
  if (pages.length % 2 !== 0) {
    pages.push(`
      <div class="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-stone-200/80 rounded-2xl bg-white/40">
        <div class="text-stone-300 font-serif text-2xl font-bold mb-2">❖</div>
        <p class="text-xs text-stone-400 font-serif">纸墨开本 · 沉思留白</p>
      </div>
    `);
  }

  // 2. 两两合并为 Spread 双对页
  const spreads: BookSpread[] = [];
  for (let p = 0; p < pages.length; p += 2) {
    const spreadIndex = Math.floor(p / 2);
    spreads.push({
      leftPageNum: p + 1,
      rightPageNum: p + 2,
      leftContent: `<div class="space-y-3.5 text-stone-800 text-xs sm:text-sm leading-relaxed text-justify">${pages[p]}</div>`,
      rightContent: `<div class="space-y-3.5 text-stone-800 text-xs sm:text-sm leading-relaxed text-justify">${pages[p + 1]}</div>`,
    });
  }

  return {
    spreads,
    totalPages: pages.length,
    totalSpreads: spreads.length,
  };
}
