/**
 * 自动同步 AI 助手上下文来源
 *
 * 监听以下状态变化：
 * - activeEditorTab: 中栏编辑器 Tab 切换
 * - editingEntity: 左栏设定详情打开/关闭
 * - editingOutline: 左栏大纲详情打开/关闭
 *
 * 优先级：设定详情 / 大纲详情 > 中栏编辑器 Tab
 */

import { useEffect } from "react";
import {
  useWritingStore,
  useChapterOutlineState,
  useEntityEditing,
  useOutlineEditing,
  useEditorContent,
  type ContextSourceType,
} from "@/stores/writing-store";
import type { VolumeOutline } from "@/types/outline";

export function useContextSourceSync() {
  const { activeEditorTab } = useChapterOutlineState();
  const { editingEntity } = useEntityEditing();
  const { editingOutline } = useOutlineEditing();
  const { content, outline } = useEditorContent();

  // 获取章节细纲（chapterOutline）
  const chapterOutline = useWritingStore((state) => state.chapterOutline);
  const setActiveContextSource = useWritingStore(
    (state) => state.setActiveContextSource
  );

  useEffect(() => {
    // 1. 设定详情优先（用户点击查看设定）
    if (editingEntity) {
      setActiveContextSource({
        type: "entity-detail",
        label: `设定：${editingEntity.name}`,
        charCount: editingEntity.content?.length ?? 0,
        enabled: true,
      });
      return;
    }

    // 2. 大纲详情（用户点击查看大纲）
    if (editingOutline) {
      const label =
        editingOutline.type === "novel"
          ? "总纲"
          : `卷${(editingOutline.data as VolumeOutline).volume_number}`;
      setActiveContextSource({
        type: "outline-detail",
        label,
        charCount: editingOutline.data.content?.length ?? 0,
        enabled: true,
      });
      return;
    }

    // 3. 默认：中栏编辑器当前 Tab
    const tabConfig: Record<
      string,
      { type: ContextSourceType; label: string; content: string }
    > = {
      content: { type: "editor-content", label: "本章正文", content },
      outline: {
        type: "editor-outline",
        label: "章节细纲",
        content: chapterOutline,
      },
      summary: { type: "editor-summary", label: "章节摘要", content: outline },
    };

    const config = tabConfig[activeEditorTab];
    if (config) {
      setActiveContextSource({
        type: config.type,
        label: config.label,
        charCount: config.content.length,
        enabled: true,
      });
    }
  }, [
    activeEditorTab,
    editingEntity,
    editingOutline,
    content,
    chapterOutline,
    outline,
    setActiveContextSource,
  ]);
}
