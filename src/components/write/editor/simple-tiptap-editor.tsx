"use client";

/**
 * 简化版 Tiptap 编辑器
 *
 * 用于替代 Input/Textarea，支持：
 * - 单行/多行模式
 * - 读写分离（点击激活，失焦退出）
 * - 内联编辑（悬浮工具栏 + diff 预览）
 * - Markdown 模式（解析和渲染 Markdown）
 *
 * 完全复用 P0 基础设施：SelectionToolbar, InlineEditDecoration, InlineEditActions
 */

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { cn } from "@/lib/utils";
import { useInlineEditState } from "@/stores/writing-store";
import type { QuickAction, EditTargetType } from "@/types/inline-edit";
import { fontFamilies, type EditorFontFamily, type EditorSettings } from "@/types/writing";
import { InlineEditDecoration } from "./extensions/inline-edit-decoration";
import { SelectionToolbar } from "./selection-toolbar";
import { FloatingInlineEditActions } from "./inline-edit-actions";

/** 编辑器控制器接口 */
export interface SimpleTiptapEditorController {
  /** 增量追加内容到末尾 */
  appendContent: (text: string) => void;
  /** 清空内容 */
  clearContent: () => void;
}

export interface SimpleTiptapEditorProps {
  /** 内容（纯文本或 Markdown） */
  value: string;
  /** 内容变化回调 */
  onChange: (value: string) => void;
  /** 编辑目标类型 */
  targetType: EditTargetType;
  /** 模式：单行（标题）或多行（概要/内容） */
  mode?: "single-line" | "multi-line";
  /** 是否启用 Markdown 模式（解析和渲染 Markdown） */
  markdown?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 样式类名 */
  className?: string;
  /** 编辑器内容区类名 */
  editorClassName?: string;
  /** 是否启用内联编辑 */
  enableInlineEdit?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读（与 disabled 区别：只读仍可选中文本） */
  readOnly?: boolean;
  /**
   * 流式模式：启用后禁用 value 同步，改用 onEditorReady 提供的 appendContent 进行增量插入
   * 适用于 SSE 流式内容生成场景
   */
  streamingMode?: boolean;
  /** 编辑器就绪回调，返回控制器用于增量插入 */
  onEditorReady?: (controller: SimpleTiptapEditorController) => void;
  /** 快捷操作回调 */
  onQuickAction?: (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => void;
  /** 打开自定义编辑回调 */
  onOpenCustomEdit?: (
    selectedText: string,
    range: { from: number; to: number }
  ) => void;
  /** 接受编辑回调 */
  onAcceptEdit?: (newText: string) => void;
  /** 拒绝编辑回调 */
  onRejectEdit?: () => void;
  /** 重新生成回调 */
  onRegenerateEdit?: () => void;
  /** 聚焦回调 */
  onFocus?: () => void;
  /** 失焦回调 */
  onBlur?: () => void;
  /** 编辑器样式设置（可选，用于流式显示时应用字体） */
  editorSettings?: EditorSettings;
}

/** 获取字体 CSS 类名 */
function getFontClass(fontFamily: EditorFontFamily): string {
  const font = fontFamilies.find((f) => f.id === fontFamily);
  return font?.fontClass ?? "font-sans";
}

export function SimpleTiptapEditor({
  value,
  onChange,
  targetType,
  mode = "multi-line",
  markdown = false,
  placeholder = "",
  className,
  editorClassName,
  enableInlineEdit = true,
  disabled = false,
  readOnly = false,
  streamingMode = false,
  onEditorReady,
  onQuickAction,
  onOpenCustomEdit,
  onAcceptEdit,
  onRejectEdit,
  onRegenerateEdit,
  onFocus,
  onBlur,
  editorSettings,
}: SimpleTiptapEditorProps) {
  // 读写分离状态：是否处于编辑模式
  const [isEditing, setIsEditing] = useState(false);
  // 用于区分程序设置内容和用户输入
  const isSettingContentRef = useRef(false);
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null);

  const { inlineEdit, acceptEdit, rejectEdit } = useInlineEditState();

  // 是否可编辑
  const editable = isEditing && !disabled && !readOnly;

  // 根据模式配置扩展
  const extensions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseExtensions: any[] = [
      StarterKit.configure({
        // Markdown 模式启用更多功能
        heading: markdown ? { levels: [1, 2, 3, 4, 5, 6] } : false,
        bulletList: markdown ? {} : false,
        orderedList: markdown ? {} : false,
        blockquote: markdown ? {} : false,
        codeBlock: markdown ? {} : false,
        code: markdown ? {} : false,
        horizontalRule: markdown ? {} : false,
        // 单行模式禁用硬换行
        hardBreak: mode === "single-line" ? false : undefined,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      // 内联编辑 diff 预览扩展
      InlineEditDecoration.configure({
        deletionClass: "inline-edit-deletion",
        additionClass: "inline-edit-addition",
      }),
    ];

    // Markdown 模式添加 Markdown 扩展
    if (markdown) {
      baseExtensions.push(
        Markdown.configure({
          html: true,
          breaks: true, // 将 \n 转换为 <br>
          transformCopiedText: true,
          transformPastedText: true,
        })
      );
    }

    return baseExtensions;
  }, [markdown, mode, placeholder]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: markdown ? value : (value ? `<p>${escapeHtml(value)}</p>` : ""),
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "outline-none w-full",
          mode === "single-line" && "whitespace-nowrap overflow-hidden"
        ),
      },
      // 单行模式阻止回车换行
      handleKeyDown:
        mode === "single-line"
          ? (_, event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                return true;
              }
              return false;
            }
          : undefined,
      // 粘贴时处理
      transformPastedText:
        mode === "single-line"
          ? (text) => text.replace(/\n/g, " ")
          : undefined,
    },
    onUpdate: ({ editor }) => {
      if (!isSettingContentRef.current) {
        if (markdown) {
          // Markdown 模式：输出 Markdown 格式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const storage = editor.storage as any;
          const md = storage.markdown?.getMarkdown?.() ?? editor.getText();
          onChange(md);
        } else {
          onChange(editor.getText());
        }
      }
    },
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      // 延迟检查，允许点击工具栏
      setTimeout(() => {
        // 如果焦点仍在容器内（如工具栏），不退出编辑模式
        if (!containerRef.current?.contains(document.activeElement)) {
          setIsEditing(false);
          onBlur?.();
        }
      }, 150);
    },
  });

  // 同步外部 value 变化到编辑器（流式模式下跳过，改用增量插入）
  useEffect(() => {
    if (!editor || streamingMode) return;

    // 获取当前编辑器内容用于比较
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = editor.storage as any;
    const currentContent = markdown
      ? (storage.markdown?.getMarkdown?.() ?? editor.getText())
      : editor.getText();

    if (value !== currentContent) {
      isSettingContentRef.current = true;
      if (markdown) {
        // Markdown 模式：直接设置 Markdown 内容
        editor.commands.setContent(value || "");
      } else {
        editor.commands.setContent(value ? `<p>${escapeHtml(value)}</p>` : "");
      }
      setTimeout(() => {
        isSettingContentRef.current = false;
      }, 0);
    }
  }, [editor, value, markdown, streamingMode]);

  // 流式模式：提供编辑器控制器
  useEffect(() => {
    if (!editor || !onEditorReady) return;

    const controller: SimpleTiptapEditorController = {
      appendContent: (text: string) => {
        // 获取文档末尾的有效插入位置
        const { state, view } = editor;
        // 文档末尾位置 = doc.content.size（不含结束标签）
        // 但需要在最后一个段落内部插入，所以减 1
        const endPos = state.doc.content.size - 1;

        // 处理换行符：\n\n 创建新段落，\n 插入 <br>
        if (text.includes("\n\n")) {
          // 包含段落分隔，使用 HTML 插入
          const html = text
            .split(/\n\n+/)
            .map((para, i) => {
              const content = para.replace(/\n/g, "<br>");
              return i === 0 ? content : `</p><p>${content}`;
            })
            .join("");

          editor.commands.insertContentAt(endPos, html, {
            updateSelection: true,
          });
        } else if (text.includes("\n")) {
          // 只有单换行，转换为 <br>
          const html = text.replace(/\n/g, "<br>");
          editor.commands.insertContentAt(endPos, html, {
            updateSelection: true,
          });
        } else {
          // 纯文本直接插入，不创建新节点
          const tr = state.tr.insertText(text, endPos);
          view.dispatch(tr);
        }
      },
      clearContent: () => {
        editor.commands.clearContent();
      },
    };

    onEditorReady(controller);
  }, [editor, onEditorReady]);

  // 同步 editable 状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // 监听内联编辑状态变化，更新 diff 预览
  // 使用 replacementText 作为依赖项，确保在流式更新时重新触发
  const replacementText = inlineEdit.suggestion?.replacementText ?? "";

  useEffect(() => {
    if (!editor) return;

    const suggestion = inlineEdit.suggestion;
    const range = inlineEdit.range;

    // 只在当前编辑器的 targetType 匹配时显示预览
    if (
      inlineEdit.targetType === targetType &&
      (inlineEdit.status === "streaming" || inlineEdit.status === "previewing")
    ) {
      if (suggestion && range) {
        // 显示 diff 预览
        editor.commands.showEditPreview({
          from: range.from,
          to: range.to,
          originalText: suggestion.originalText,
          newText: suggestion.replacementText,
        });

        // 清除选区，将光标移到选区末尾
        editor.commands.setTextSelection(range.to);
      }
    } else {
      // 清除预览
      editor.commands.clearEditPreview();
    }
  }, [
    editor,
    targetType,
    inlineEdit.targetType,
    inlineEdit.status,
    inlineEdit.suggestion,
    inlineEdit.range,
    replacementText,
  ]);

  // 处理点击进入编辑模式
  const handleClick = useCallback(() => {
    if (!disabled && !readOnly && !isEditing) {
      setIsEditing(true);
      // 聚焦编辑器
      setTimeout(() => {
        editor?.commands.focus();
      }, 0);
    }
  }, [disabled, readOnly, isEditing, editor]);

  // 处理接受编辑
  const handleAcceptEdit = useCallback(() => {
    if (!editor || !inlineEdit.suggestion || !inlineEdit.range) return;

    const { replacementText } = inlineEdit.suggestion;

    // 应用编辑
    editor.commands.applyEditPreview();

    onAcceptEdit?.(replacementText);
    acceptEdit();
  }, [editor, inlineEdit.suggestion, inlineEdit.range, onAcceptEdit, acceptEdit]);

  // 处理拒绝编辑
  const handleRejectEdit = useCallback(() => {
    if (!editor) return;

    editor.commands.clearEditPreview();

    onRejectEdit?.();
    rejectEdit();
  }, [editor, onRejectEdit, rejectEdit]);

  // 处理快捷操作
  const handleQuickAction = useCallback(
    (
      action: QuickAction,
      selectedText: string,
      range: { from: number; to: number }
    ) => {
      onQuickAction?.(action, selectedText, range);
    },
    [onQuickAction]
  );


  // 是否显示内联编辑操作栏
  const showInlineEditActions =
    inlineEdit.targetType === targetType &&
    (inlineEdit.status === "streaming" || inlineEdit.status === "previewing");

  // 编辑器样式（字体大小、行高、段落间距）
  const editorStyle = useMemo(() => {
    if (!editorSettings) return undefined;
    return {
      "--editor-font-size": `${editorSettings.fontSize}px`,
      "--editor-line-height": `${editorSettings.lineHeight}`,
      "--editor-paragraph-spacing": `${editorSettings.paragraphSpacing}px`,
    } as React.CSSProperties;
  }, [editorSettings]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        // 基础样式
        mode === "single-line" ? "simple-tiptap-input" : "simple-tiptap-textarea",
        // Markdown 模式样式
        markdown && "simple-tiptap-markdown",
        // 读写分离样式
        !isEditing && "simple-tiptap-readonly",
        isEditing && "simple-tiptap-editing",
        // 状态样式
        disabled && "opacity-50 cursor-not-allowed",
        // 字体样式
        editorSettings && getFontClass(editorSettings.fontFamily),
        className
      )}
      style={editorStyle}
      onClick={handleClick}
    >
      <EditorContent
        editor={editor}
        className={cn(
          // 占位符样式
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.is-editor-empty:first-child::before]:text-muted-foreground/50",
          "[&_.is-editor-empty:first-child::before]:float-left",
          "[&_.is-editor-empty:first-child::before]:h-0",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.is-editor-empty:first-child::before]:whitespace-pre-wrap",
          editorClassName
        )}
      />

      {/* 选中文本悬浮工具栏 */}
      {enableInlineEdit && isEditing && !showInlineEditActions && (
        <SelectionToolbar
          editor={editor}
          targetType={targetType}
          onQuickAction={handleQuickAction}
        />
      )}

      {/* 内联编辑操作栏 */}
      {showInlineEditActions && (
        <FloatingInlineEditActions
          editor={editor}
          range={inlineEdit.range}
          isComplete={inlineEdit.suggestion?.isComplete ?? false}
          isStreaming={inlineEdit.status === "streaming"}
          onAccept={handleAcceptEdit}
          onReject={handleRejectEdit}
          onRegenerate={onRegenerateEdit}
        />
      )}
    </div>
  );
}

/** HTML 转义 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
