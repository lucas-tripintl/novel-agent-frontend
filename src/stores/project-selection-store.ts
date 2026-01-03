/**
 * 全局项目选择状态
 *
 * 用于在设定集各页面之间保持项目选择状态
 * 使用 zustand + persist 实现本地持久化
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectSelectionState {
  /** 当前选中的项目 ID（单选） */
  selectedProjectId: string | null;

  /** 设置选中的项目 */
  setSelectedProject: (id: string | null) => void;

  /** 检查项目是否被选中 */
  isSelected: (id: string) => boolean;

  /** 清空选择 */
  clearSelection: () => void;
}

export const useProjectSelectionStore = create<ProjectSelectionState>()(
  persist(
    (set, get) => ({
      selectedProjectId: null,

      setSelectedProject: (id) =>
        set({ selectedProjectId: id }),

      isSelected: (id) => get().selectedProjectId === id,

      clearSelection: () =>
        set({ selectedProjectId: null }),
    }),
    {
      name: "novel-agent-project-selection",
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
      }),
    }
  )
);

/**
 * 便捷 hook：获取选中的项目 ID
 */
export function useSelectedProjectId() {
  return useProjectSelectionStore((state) => state.selectedProjectId);
}

/**
 * 便捷 hook：获取项目选择操作方法
 */
export function useProjectSelectionActions() {
  return useProjectSelectionStore((state) => ({
    setSelectedProject: state.setSelectedProject,
    clearSelection: state.clearSelection,
  }));
}
