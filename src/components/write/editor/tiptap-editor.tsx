"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import {
  useEditorSettings,
  useSelectedTextContext,
  useInlineEditState,
} from "@/stores/writing-store";
import { fontFamilies, type EditorFontFamily } from "@/types/writing";
import type { QuickAction, EditTargetType } from "@/types/inline-edit";
import { InlineEditDecoration } from "./extensions/inline-edit-decoration";
import { SelectionToolbar } from "./selection-toolbar";
import { InlineEditActions } from "./inline-edit-actions";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  isReadOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** 编辑目标类型 */
  targetType?: EditTargetType;
  /** 是否启用内联编辑工具栏 */
  enableInlineEdit?: boolean;
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
}

function getFontClass(fontFamily: EditorFontFamily): string {
  const font = fontFamilies.find((f) => f.id === fontFamily);
  return font?.fontClass ?? "font-sans";
}

export function TiptapEditor({
  content,
  onChange,
  isReadOnly = false,
  placeholder = "开始书写...",
  className,
  targetType = "content",
  enableInlineEdit = true,
  onQuickAction,
  onOpenCustomEdit,
  onAcceptEdit,
  onRejectEdit,
  onRegenerateEdit,
}: TiptapEditorProps) {
  const { settings } = useEditorSettings();
  const { selectedTextContext, setSelectedTextContext } = useSelectedTextContext();
  const { inlineEdit, acceptEdit, rejectEdit } = useInlineEditState();

  // 用于区分程序设置内容和用户输入
  const isSettingContentRef = useRef(false);
  // 操作栏位置
  const [actionsPosition, setActionsPosition] = useState({ x: 0, y: 0 });

  // 计算位置对应的行号（基于段落）
  const getLineNumber = useCallback((doc: { nodesBetween: (from: number, to: number, callback: (node: { isBlock: boolean }, pos: number) => void) => void }, pos: number): number => {
    let lineNumber = 1;
    doc.nodesBetween(0, pos, (node, nodePos) => {
      if (node.isBlock && nodePos < pos) {
        lineNumber++;
      }
    });
    return lineNumber;
  }, []);

  const editor = useEditor({
    immediatelyRender: false, // 避免 SSR hydration 不匹配
    extensions: [
      StarterKit.configure({
        // 禁用不需要的扩展
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
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
    ],
    content,
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none",
          "focus:outline-none",
          "min-h-[50vh]",
          // 自定义样式 - 不设置段落行高，由外部控制
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3",
          "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // 只有用户真正输入时才触发 onChange，程序设置内容时不触发
      if (!isSettingContentRef.current) {
        onChange(editor.getText());
      }
    },
  });

  // 将纯文本转换为 HTML（保留换行符）
  const textToHtml = (text: string): string => {
    if (!text) return "";
    // 将换行符转换为 <p> 段落
    return text
      .split(/\n/)
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("");
  };

  // 同步外部内容变化
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      // 只有当内容真正不同时才更新，避免光标跳动
      const currentContent = editor.getText();
      if (content !== currentContent) {
        // 标记为程序设置内容，避免触发 onChange
        isSettingContentRef.current = true;
        // 将纯文本转换为 HTML 格式，保留换行
        editor.commands.setContent(textToHtml(content));
        // 使用 setTimeout 确保 onUpdate 回调执行完毕后再重置标记
        setTimeout(() => {
          isSettingContentRef.current = false;
        }, 0);
      }
    }
  }, [editor, content]);

  // 同步只读状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

  // 监听选区变化，更新 selectedTextContext
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // 如果上下文未启用，不更新
      if (!selectedTextContext?.enabled) return;

      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection) {
        // 有选中文本
        const text = editor.state.doc.textBetween(from, to);
        const fromLine = getLineNumber(editor.state.doc, from);
        const toLine = getLineNumber(editor.state.doc, to);

        setSelectedTextContext({
          enabled: true,
          text,
          lineRange: [fromLine, toLine],
          charCount: text.length,
        });
      } else if (selectedTextContext?.text !== null) {
        // 取消选中时，重置为全章内容（仅当之前有选中时才更新，避免无限循环）
        setSelectedTextContext({
          enabled: true,
          text: null,
          lineRange: null,
          charCount: 0,
        });
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, selectedTextContext?.enabled, selectedTextContext?.text, setSelectedTextContext, getLineNumber]);

  // 流式写入：追加内容到末尾
  const appendContent = useCallback(
    (text: string) => {
      if (editor) {
        editor.commands.insertContentAt(editor.state.doc.content.size, text);
      }
    },
    [editor]
  );

  // 暴露 appendContent 方法供外部使用
  useEffect(() => {
    if (editor) {
      // @ts-expect-error - 临时挂载方法
      editor.appendContent = appendContent;
    }
  }, [editor, appendContent]);

  // 监听内联编辑状态变化，更新 diff 预览
  // 使用 replacementText 作为依赖项，确保在流式更新时重新触发
  const replacementText = inlineEdit.suggestion?.replacementText ?? "";

  useEffect(() => {
    if (!editor) return;

    const suggestion = inlineEdit.suggestion;
    const range = inlineEdit.range;

    if (
      inlineEdit.status === "streaming" ||
      inlineEdit.status === "previewing"
    ) {
      if (suggestion && range) {
        // 显示 diff 预览
        editor.commands.showEditPreview({
          from: range.from,
          to: range.to,
          originalText: suggestion.originalText,
          newText: suggestion.replacementText,
        });

        // 更新操作栏位置
        const { view } = editor;
        const endCoords = view.coordsAtPos(range.to);
        const editorRect = view.dom.getBoundingClientRect();
        setActionsPosition({
          x: endCoords.left - editorRect.left,
          y: endCoords.bottom - editorRect.top + 8,
        });
      }
    } else {
      // 清除预览
      editor.commands.clearEditPreview();
    }
  }, [editor, inlineEdit.status, inlineEdit.suggestion, inlineEdit.range, replacementText]);

  // 处理接受编辑
  const handleAcceptEdit = useCallback(() => {
    if (!editor || !inlineEdit.suggestion || !inlineEdit.range) return;

    const { replacementText } = inlineEdit.suggestion;
    const { from, to } = inlineEdit.range;

    // 应用编辑
    editor.commands.applyEditPreview();

    // 调用回调
    onAcceptEdit?.(replacementText);
    acceptEdit();
  }, [editor, inlineEdit.suggestion, inlineEdit.range, onAcceptEdit, acceptEdit]);

  // 处理拒绝编辑
  const handleRejectEdit = useCallback(() => {
    if (!editor) return;

    // 清除预览
    editor.commands.clearEditPreview();

    // 调用回调
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

  // 段落样式直接用 style 对象控制
  const paragraphStyle = useMemo(
    () => ({
      "--editor-font-size": `${settings.fontSize}px`,
      "--editor-line-height": settings.lineHeight,
      "--editor-paragraph-spacing": `${settings.paragraphSpacing}px`,
    }),
    [settings.fontSize, settings.lineHeight, settings.paragraphSpacing]
  );

  // 是否显示内联编辑操作栏
  const showInlineEditActions =
    inlineEdit.status === "streaming" || inlineEdit.status === "previewing";

  return (
    <div
      className={cn(
        "relative editor-wrapper",
        isReadOnly && "opacity-80",
        getFontClass(settings.fontFamily),
        className
      )}
      style={paragraphStyle as React.CSSProperties}
    >
      <EditorContent
        editor={editor}
        className={cn(
          "relative",
          // 占位符样式
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.is-editor-empty:first-child::before]:text-muted-foreground/50",
          "[&_.is-editor-empty:first-child::before]:float-left",
          "[&_.is-editor-empty:first-child::before]:h-0",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none"
        )}
      />

      {/* 流式写入光标 */}
      {isReadOnly && (
        <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-0.5 align-middle" />
      )}

      {/* 选中文本悬浮工具栏 */}
      {enableInlineEdit && !isReadOnly && !showInlineEditActions && (
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

/** 导出 editor 类型供外部使用 */
export type { Editor } from "@tiptap/react";
