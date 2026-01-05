"use client";

import { useEffect, useCallback, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { useEditorSettings, useSelectedTextContext } from "@/stores/writing-store";
import { fontFamilies, type EditorFontFamily } from "@/types/writing";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  isReadOnly?: boolean;
  placeholder?: string;
  className?: string;
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
}: TiptapEditorProps) {
  const { settings } = useEditorSettings();
  const { selectedTextContext, setSelectedTextContext } = useSelectedTextContext();
  // 用于区分程序设置内容和用户输入
  const isSettingContentRef = useRef(false);

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

  // 段落样式直接用 style 对象控制
  const paragraphStyle = useMemo(
    () => ({
      "--editor-font-size": `${settings.fontSize}px`,
      "--editor-line-height": settings.lineHeight,
      "--editor-paragraph-spacing": `${settings.paragraphSpacing}px`,
    }),
    [settings.fontSize, settings.lineHeight, settings.paragraphSpacing]
  );

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
    </div>
  );
}
