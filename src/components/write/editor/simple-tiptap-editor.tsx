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
import { InlineEditDecoration } from "./extensions/inline-edit-decoration";
import { SelectionToolbar } from "./selection-toolbar";
import { InlineEditActions } from "./inline-edit-actions";

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
  onQuickAction,
  onOpenCustomEdit,
  onAcceptEdit,
  onRejectEdit,
  onRegenerateEdit,
  onFocus,
  onBlur,
}: SimpleTiptapEditorProps) {
  // 读写分离状态：是否处于编辑模式
  const [isEditing, setIsEditing] = useState(false);
  // 操作栏位置
  const [actionsPosition, setActionsPosition] = useState({ x: 0, y: 0 });
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

  // 同步外部 value 变化到编辑器
  useEffect(() => {
    if (!editor) return;

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
  }, [editor, value, markdown]);

  // 同步 editable 状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // 监听内联编辑状态变化，更新 diff 预览
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

        // 更新操作栏位置（使用 queueMicrotask 避免同步 setState 警告）
        const { view } = editor;
        const endCoords = view.coordsAtPos(range.to);
        const editorRect = view.dom.getBoundingClientRect();
        queueMicrotask(() => {
          setActionsPosition({
            x: endCoords.left - editorRect.left,
            y: endCoords.bottom - editorRect.top + 8,
          });
        });
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

  // 处理打开自定义编辑
  const handleOpenCustomEdit = useCallback(
    (selectedText: string, range: { from: number; to: number }) => {
      onOpenCustomEdit?.(selectedText, range);
    },
    [onOpenCustomEdit]
  );

  // 是否显示内联编辑操作栏
  const showInlineEditActions =
    inlineEdit.targetType === targetType &&
    (inlineEdit.status === "streaming" || inlineEdit.status === "previewing");

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
        className
      )}
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
          editorClassName
        )}
      />

      {/* 选中文本悬浮工具栏 */}
      {enableInlineEdit && isEditing && !showInlineEditActions && (
        <SelectionToolbar
          editor={editor}
          targetType={targetType}
          onQuickAction={handleQuickAction}
          onOpenCustomEdit={handleOpenCustomEdit}
        />
      )}

      {/* 内联编辑操作栏 */}
      {showInlineEditActions && (
        <div
          className="absolute z-50"
          style={{
            left: actionsPosition.x,
            top: actionsPosition.y,
          }}
        >
          <InlineEditActions
            isComplete={inlineEdit.suggestion?.isComplete ?? false}
            isStreaming={inlineEdit.status === "streaming"}
            explanation={inlineEdit.suggestion?.explanation}
            onAccept={handleAcceptEdit}
            onReject={handleRejectEdit}
            onRegenerate={onRegenerateEdit}
          />
        </div>
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
