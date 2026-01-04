"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  isReadOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({
  content,
  onChange,
  isReadOnly = false,
  placeholder = "开始书写...",
  className,
}: TiptapEditorProps) {
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
          // 自定义样式
          "[&_p]:my-3 [&_p]:leading-relaxed",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3",
          "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  // 同步外部内容变化
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      // 只有当内容真正不同时才更新，避免光标跳动
      const currentContent = editor.getText();
      if (content !== currentContent) {
        editor.commands.setContent(content || "");
      }
    }
  }, [editor, content]);

  // 同步只读状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

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
      // @ts-ignore - 临时挂载方法
      editor.appendContent = appendContent;
    }
  }, [editor, appendContent]);

  return (
    <div
      className={cn(
        "relative",
        isReadOnly && "opacity-80",
        className
      )}
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
