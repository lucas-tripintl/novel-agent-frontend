/**
 * 任务面板状态管理
 *
 * 管理任务面板的展开/收起状态
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

interface TaskPanelState {
  /** 面板是否展开 */
  isExpanded: boolean;
  /** 是否有新任务（用于提示） */
  hasNewTask: boolean;

  // Actions
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setHasNewTask: (hasNew: boolean) => void;
}

export const useTaskStore = create<TaskPanelState>()(
  persist(
    (set) => ({
      isExpanded: false,
      hasNewTask: false,

      setExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setHasNewTask: (hasNew) =>
        set((state) => ({
          hasNewTask: hasNew,
          // 有新任务时自动展开
          isExpanded: hasNew ? true : state.isExpanded,
        })),
    }),
    {
      name: "novel-agent-task-panel",
      partialize: (state) => ({
        // 只持久化展开状态
        isExpanded: state.isExpanded,
      }),
    }
  )
);

// ============ 便捷 Hooks ============

/** 任务面板状态 */
export function useTaskPanelState() {
  return useTaskStore(
    useShallow((state) => ({
      isExpanded: state.isExpanded,
      hasNewTask: state.hasNewTask,
    }))
  );
}

/** 任务面板操作 */
export function useTaskPanelActions() {
  return useTaskStore(
    useShallow((state) => ({
      setExpanded: state.setExpanded,
      toggleExpanded: state.toggleExpanded,
      setHasNewTask: state.setHasNewTask,
    }))
  );
}
