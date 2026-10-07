import { Mark, mergeAttributes } from '@tiptap/core';

export type FontSizeValue = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: FontSizeValue) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: 'base',
        parseHTML: (element) => {
          const dataSize = element.getAttribute('data-size');
          if (dataSize) return dataSize;
          const cls = element.getAttribute('class') || '';
          const match = cls.match(/text-size-([a-z0-9]+)/);
          return match ? match[1] : 'base';
        },
        renderHTML: (attributes) => {
          if (!attributes.size || attributes.size === 'base') {
            return {};
          }
          return {
            'data-size': attributes.size,
            class: `text-size-${attributes.size}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-size]',
      },
      {
        tag: 'span[class*="text-size-"]',
      },
      {
        tag: 'small',
        getAttrs: () => ({ size: 'sm' }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size: FontSizeValue) =>
        ({ chain }) => {
          if (size === 'base') {
            return chain().unsetMark(this.name).run();
          }
          return chain().setMark(this.name, { size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});
