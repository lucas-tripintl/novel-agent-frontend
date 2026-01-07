/**
 * 章节保存 hook
 *
 * 封装章节正文/摘要和细纲的保存逻辑
 */

import { useState, useCallback } from "react";
import { useChapterSaveState } from "@/stores/writing-store";
import { useUpdateChapter } from "@/hooks/use-projects";
import { useUpsertChapterOutline } from "@/hooks/use-chapter-outline";
import type { SaveStatus } from "@/components/write/editor/editor-status-bar";

interface UseChapterSaveResult {
  /** 是否有未保存的更改 */
  isDirty: boolean;
  /** 保存状态 */
  saveStatus: SaveStatus;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 保存函数 */
  save: () => Promise<void>;
}

export function useChapterSave(projectId: string): UseChapterSaveResult {
  const {
    chapterNumber,
    title,
    outline,
    content,
    chapterOutline,
    isDirty,
    isChapterOutlineDirty,
    markAsSaved,
    markChapterOutlineSaved,
  } = useChapterSaveState();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const updateChapterMutation = useUpdateChapter(projectId);
  const upsertOutlineMutation = useUpsertChapterOutline(projectId);

  const hasUnsavedChanges = isDirty || isChapterOutlineDirty;
  const isSaving = saveStatus === "saving";

  const save = useCallback(async () => {
    if (!chapterNumber || !hasUnsavedChanges) return;

    setSaveStatus("saving");

    try {
      const promises: Promise<unknown>[] = [];

      // 保存章节正文/标题/摘要
      if (isDirty) {
        promises.push(
          updateChapterMutation.mutateAsync({
            chapterNumber,
            data: {
              title,
              content,
              summary: outline,
            },
          }).then(() => {
            markAsSaved();
          })
        );
      }

      // 保存细纲
      if (isChapterOutlineDirty) {
        promises.push(
          upsertOutlineMutation.mutateAsync({
            chapterNumber,
            data: {
              content: chapterOutline,
            },
          }).then(() => {
            markChapterOutlineSaved();
          })
        );
      }

      await Promise.all(promises);

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("保存章节失败:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [
    chapterNumber,
    hasUnsavedChanges,
    isDirty,
    isChapterOutlineDirty,
    title,
    content,
    outline,
    chapterOutline,
    updateChapterMutation,
    upsertOutlineMutation,
    markAsSaved,
    markChapterOutlineSaved,
  ]);

  return {
    isDirty: hasUnsavedChanges,
    saveStatus,
    isSaving,
    save,
  };
}
