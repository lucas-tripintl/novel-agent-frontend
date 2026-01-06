/**
 * Tiptap 内联编辑 Decoration 扩展
 *
 * 用于在编辑器中显示 diff 预览效果：
 * - 原文：红色背景 + 删除线
 * - 新文本：绿色背景（作为 widget 插入到原文后）
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/** 编辑预览数据 */
export interface EditPreviewData {
  /** 原文起始位置 */
  from: number;
  /** 原文结束位置 */
  to: number;
  /** 原始文本 */
  originalText: string;
  /** 替换文本 */
  newText: string;
}

/** 插件元数据类型 */
interface PluginMeta {
  /** 设置预览 */
  setPreview?: EditPreviewData;
  /** 清除预览 */
  clearPreview?: boolean;
  /** 应用预览（执行替换） */
  applyPreview?: boolean;
}

/** 插件状态 */
interface PluginState {
  decorations: DecorationSet;
  preview: EditPreviewData | null;
}

export const InlineEditDecorationPluginKey = new PluginKey<PluginState>(
  "inlineEditDecoration"
);

export interface InlineEditDecorationOptions {
  /** 删除标记样式类 */
  deletionClass: string;
  /** 添加标记样式类 */
  additionClass: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineEditDecoration: {
      /** 显示编辑预览 */
      showEditPreview: (data: EditPreviewData) => ReturnType;
      /** 清除编辑预览 */
      clearEditPreview: () => ReturnType;
      /** 应用编辑预览（执行替换） */
      applyEditPreview: () => ReturnType;
    };
  }
}

export const InlineEditDecoration = Extension.create<InlineEditDecorationOptions>(
  {
    name: "inlineEditDecoration",

    addOptions() {
      return {
        deletionClass: "inline-edit-deletion",
        additionClass: "inline-edit-addition",
      };
    },

    addCommands() {
      return {
        showEditPreview:
          (data: EditPreviewData) =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              tr.setMeta(InlineEditDecorationPluginKey, {
                setPreview: data,
              } as PluginMeta);
            }
            return true;
          },

        clearEditPreview:
          () =>
          ({ tr, dispatch }) => {
            if (dispatch) {
              tr.setMeta(InlineEditDecorationPluginKey, {
                clearPreview: true,
              } as PluginMeta);
            }
            return true;
          },

        applyEditPreview:
          () =>
          ({ tr, dispatch, state }) => {
            const pluginState = InlineEditDecorationPluginKey.getState(state);
            if (!pluginState?.preview) return false;

            const { from, to, newText } = pluginState.preview;

            if (dispatch) {
              // 先清除预览
              tr.setMeta(InlineEditDecorationPluginKey, {
                clearPreview: true,
              } as PluginMeta);
              // 执行替换
              tr.replaceWith(from, to, state.schema.text(newText));
            }
            return true;
          },
      };
    },

    addProseMirrorPlugins() {
      const { deletionClass, additionClass } = this.options;

      return [
        new Plugin<PluginState>({
          key: InlineEditDecorationPluginKey,

          state: {
            init() {
              return {
                decorations: DecorationSet.empty,
                preview: null,
              };
            },

            apply(tr, state, oldEditorState, newEditorState) {
              const meta = tr.getMeta(InlineEditDecorationPluginKey) as
                | PluginMeta
                | undefined;

              // 清除预览
              if (meta?.clearPreview) {
                return {
                  decorations: DecorationSet.empty,
                  preview: null,
                };
              }

              // 设置新预览
              if (meta?.setPreview) {
                const { from, to, originalText, newText } = meta.setPreview;

                // 创建 decorations
                const decorations: Decoration[] = [];

                // 1. 原文删除标记（inline decoration）
                decorations.push(
                  Decoration.inline(from, to, {
                    class: deletionClass,
                    "data-original": originalText,
                  })
                );

                // 2. 新文本添加标记（widget decoration 插入到原文后）
                decorations.push(
                  Decoration.widget(
                    to,
                    () => {
                      const span = document.createElement("span");
                      span.className = additionClass;
                      span.textContent = newText;
                      span.setAttribute("data-new-text", "true");
                      return span;
                    },
                    {
                      side: 1, // 插入到位置后面
                      key: "inline-edit-addition",
                    }
                  )
                );

                return {
                  decorations: DecorationSet.create(
                    newEditorState.doc,
                    decorations
                  ),
                  preview: meta.setPreview,
                };
              }

              // 文档变化时映射 decorations
              if (tr.docChanged && state.preview) {
                return {
                  decorations: state.decorations.map(tr.mapping, tr.doc),
                  preview: {
                    ...state.preview,
                    from: tr.mapping.map(state.preview.from),
                    to: tr.mapping.map(state.preview.to),
                  },
                };
              }

              return state;
            },
          },

          props: {
            decorations(state) {
              return this.getState(state)?.decorations ?? DecorationSet.empty;
            },
          },
        }),
      ];
    },
  }
);

/** 获取当前预览状态 */
export function getEditPreviewState(
  editor: { state: { doc: unknown } } | null
): EditPreviewData | null {
  if (!editor) return null;
  // 直接通过 PluginKey 获取状态
  const pluginState = InlineEditDecorationPluginKey.getState(
    editor.state as Parameters<typeof InlineEditDecorationPluginKey.getState>[0]
  );
  return pluginState?.preview ?? null;
}
