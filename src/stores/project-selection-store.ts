/**
 * 全局项目选择状态
 *
 * 用于在设定集各页面之间保持项目选择状态
 * 使用 zustand + persist 实现本地持久化
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectSelectionState {
  /** 当前选中的项目 ID 列表 */
  selectedProjectIds: string[];

  /** 设置选中的项目 */
  setSelectedProjects: (ids: string[]) => void;

  /** 添加一个项目到选择 */
  addProject: (id: string) => void;

  /** 从选择中移除一个项目 */
  removeProject: (id: string) => void;

  /** 切换一个项目的选择状态 */
  toggleProject: (id: string) => void;

  /** 清空所有选择 */
  clearSelection: () => void;

  /** 检查项目是否被选中 */
  isSelected: (id: string) => boolean;
}

export const useProjectSelectionStore = create<ProjectSelectionState>()(
  persist(
    (set, get) => ({
      selectedProjectIds: [],

      setSelectedProjects: (ids) =>
        set({ selectedProjectIds: ids }),

      addProject: (id) =>
        set((state) => ({
          selectedProjectIds: state.selectedProjectIds.includes(id)
            ? state.selectedProjectIds
            : [...state.selectedProjectIds, id],
        })),

      removeProject: (id) =>
        set((state) => ({
          selectedProjectIds: state.selectedProjectIds.filter((pid) => pid !== id),
        })),

      toggleProject: (id) =>
        set((state) => ({
          selectedProjectIds: state.selectedProjectIds.includes(id)
            ? state.selectedProjectIds.filter((pid) => pid !== id)
            : [...state.selectedProjectIds, id],
        })),

      clearSelection: () =>
        set({ selectedProjectIds: [] }),

      isSelected: (id) => get().selectedProjectIds.includes(id),
    }),
    {
      name: "novel-agent-project-selection",
      partialize: (state) => ({
        selectedProjectIds: state.selectedProjectIds,
      }),
    }
  )
);

/**
 * 便捷 hook：获取选中的项目 ID 列表
 */
export function useSelectedProjectIds() {
  return useProjectSelectionStore((state) => state.selectedProjectIds);
}

/**
 * 便捷 hook：获取项目选择操作方法
 */
export function useProjectSelectionActions() {
  return useProjectSelectionStore((state) => ({
    setSelectedProjects: state.setSelectedProjects,
    addProject: state.addProject,
    removeProject: state.removeProject,
    toggleProject: state.toggleProject,
    clearSelection: state.clearSelection,
  }));
}

