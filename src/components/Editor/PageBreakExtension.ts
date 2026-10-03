import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  parseHTML() {
    return [
      { tag: 'div.page-break' },
      { tag: 'div[data-page-break]' },
      { tag: 'hr.page-break' },
      { tag: 'hr[data-page-break]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'page-break',
        'data-page-break': 'true',
        title: '装帧分页符：点击选中后可按 Delete/Backspace 键删除',
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent([
              { type: this.name },
              { type: 'paragraph' },
            ])
            .run();
        },
    };
  },
});
