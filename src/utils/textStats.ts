/**
 * 正文字数与纯文本抽取的唯一口径。
 *
 * 文章正文以 HTML 存储（Tiptap 输出），`length(content)` 会把 <p>、<td>、
 * class 名、style 等标签字符一并计入——一篇千字文能虚高成三四千「字」。
 * 全站凡是展示字数的位置都必须经由这里计算，否则同一篇文章会在不同卡片上
 * 显示成两个不同的数字。
 *
 * 服务端（写入时落库、读取时统计）与浏览器（编辑器实时字数）共用本模块，
 * 因此这里不允许引入任何运行时依赖。
 */

/** 块级标签：它们之间需要留出空格，否则 <p>foo</p><p>bar</p> 会粘成 foobar */
const BLOCK_LEVEL = new Set([
  'p', 'div', 'section', 'article', 'blockquote', 'pre', 'figure', 'figcaption',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
  'br', 'hr',
]);

/** 常见命名实体。未收录的（含自定义实体）原样保留，不猜。 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  hellip: '…', mdash: '—', ndash: '–', middot: '·',
  times: '×', copy: '©', reg: '®', trade: '™',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      // fromCodePoint 对越界码点会抛异常，越界时保持原样
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

/**
 * 剥去注释与标签，得到正文纯文本。
 *
 * 先剥标签再还原实体：否则正文里字面写着的 `&lt;p&gt;` 会被当成真标签删掉。
 * 用 `<\/?[a-zA-Z]` 限定标签形状，这样正文中的裸 `<`（如 "a < b"）不会被误伤。
 */
function stripTags(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g, (_whole, name: string) =>
      BLOCK_LEVEL.has(name.toLowerCase()) ? ' ' : ''
    );
}

/**
 * 正文纯文本：剥标签、还原实体、把连续空白折成单个空格。
 * 摘要与字数统计共用它，保证「摘要前缀」与「字数」描述的是同一段文本。
 */
export function toPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return decodeEntities(stripTags(html)).replace(/\s+/g, ' ').trim();
}

/**
 * 字数：纯文本去掉全部空白后的字符数（中文按字、英文按字母计）。
 *
 * 与 toPlainText 分开是因为摘要需要保留词间空格，而空格不该算进字数。
 */
export function countPlainChars(html: string | null | undefined): number {
  if (!html) return 0;
  return toPlainText(html).replace(/\s+/g, '').length;
}
