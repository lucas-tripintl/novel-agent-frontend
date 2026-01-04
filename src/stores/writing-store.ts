/**
 * 写作面板状态管理
 *
 * 管理写作模式、选中的设定、编辑器内容、AI 对话等状态
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  WritingMode,
  SelectedEntity,
  ChatMessage,
  ChapterDraft,
} from "@/types/writing";
import type { EntityRead } from "@/types/api";

interface WritingState {
  // ============ 当前上下文 ============
  /** 当前项目 ID */
  projectId: string | null;
  /** 当前章节 ID */
  chapterId: string | null;

  // ============ 写作模式 ============
  /** 写作模式 */
  mode: WritingMode;

  // ============ 选中的设定 ============
  /** 导演模式下手动选择的实体 */
  selectedEntities: SelectedEntity[];
  /** 全自动模式下 AI 自动选择的实体 */
  autoSelectedEntities: SelectedEntity[];

  // ============ 编辑器内容 ============
  /** 章节标题 */
  title: string;
  /** 章节概要 */
  outline: string;
  /** 正文内容 */
  content: string;
  /** 是否有未保存的更改 */
  isDirty: boolean;
  /** 最后保存时间 */
  lastSavedAt: Date | null;

  // ============ AI 对话 ============
  /** 对话消息列表 */
  messages: ChatMessage[];
  /** 是否正在流式写作 */
  isStreaming: boolean;
  /** 流式内容缓冲 */
  streamingBuffer: string;

  // ============ UI 状态 ============
  /** 左栏是否折叠 */
  isLeftPaneCollapsed: boolean;
  /** 右栏是否折叠 */
  isRightPaneCollapsed: boolean;

  // ============ 设定编辑 ============
  /** 当前编辑的设定 */
  editingEntity: EntityRead | null;
  /** 编辑中的设定内容（用于检测未保存更改） */
  editingEntityContent: string;
  /** 设定是否有未保存的更改 */
  isEntityDirty: boolean;

  // ============ Actions ============
  /** 设置当前项目和章节 */
  setContext: (projectId: string | null, chapterId: string | null) => void;

  /** 设置写作模式 */
  setMode: (mode: WritingMode) => void;

  /** 添加选中的实体（导演模式） */
  addEntity: (entity: SelectedEntity) => void;
  /** 移除选中的实体 */
  removeEntity: (entityId: string) => void;
  /** 清空选中的实体 */
  clearSelectedEntities: () => void;
  /** 设置 AI 自动选择的实体 */
  setAutoSelectedEntities: (entities: SelectedEntity[]) => void;

  /** 更新标题 */
  setTitle: (title: string) => void;
  /** 更新概要 */
  setOutline: (outline: string) => void;
  /** 更新内容 */
  setContent: (content: string) => void;
  /** 标记为已保存 */
  markAsSaved: () => void;
  /** 加载章节草稿 */
  loadDraft: (draft: Partial<ChapterDraft>) => void;

  /** 添加消息 */
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  /** 更新最后一条消息（流式更新） */
  updateLastMessage: (content: string, isComplete?: boolean) => void;
  /** 清空消息 */
  clearMessages: () => void;

  /** 设置流式状态 */
  setStreaming: (isStreaming: boolean) => void;
  /** 追加流式内容 */
  appendStreamingBuffer: (text: string) => void;
  /** 清空流式缓冲 */
  clearStreamingBuffer: () => void;

  /** 切换左栏折叠 */
  toggleLeftPane: () => void;
  /** 切换右栏折叠 */
  toggleRightPane: () => void;

  /** 设置当前编辑的设定 */
  setEditingEntity: (entity: EntityRead | null) => void;
  /** 更新编辑中的设定内容 */
  setEditingEntityContent: (content: string) => void;
  /** 标记设定为已保存 */
  markEntityAsSaved: () => void;
  /** 关闭设定编辑（返回章节编辑） */
  closeEntityEditor: () => void;

  /** 重置状态 */
  reset: () => void;
}

const initialState = {
  projectId: null,
  chapterId: null,
  mode: "auto" as WritingMode,
  selectedEntities: [],
  autoSelectedEntities: [],
  title: "",
  outline: "",
  content: "",
  isDirty: false,
  lastSavedAt: null,
  messages: [],
  isStreaming: false,
  streamingBuffer: "",
  isLeftPaneCollapsed: false,
  isRightPaneCollapsed: false,
  editingEntity: null,
  editingEntityContent: "",
  isEntityDirty: false,
};

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setContext: (projectId, chapterId) =>
        set({
          projectId,
          chapterId,
          // 切换章节时重置编辑器状态
          title: "",
          outline: "",
          content: "",
          isDirty: false,
          messages: [],
          streamingBuffer: "",
          // 切换项目/章节时清空选中的设定
          selectedEntities: [],
          autoSelectedEntities: [],
        }),

      setMode: (mode) => {
        set({ mode });
        // 切换模式时清空对方的实体选择
        if (mode === "auto") {
          set({ selectedEntities: [] });
        } else {
          set({ autoSelectedEntities: [] });
        }
      },

      addEntity: (entity) => {
        const { selectedEntities } = get();
        // 避免重复添加
        if (selectedEntities.some((e) => e.id === entity.id)) return;
        set({ selectedEntities: [...selectedEntities, entity] });
      },

      removeEntity: (entityId) =>
        set((state) => ({
          selectedEntities: state.selectedEntities.filter(
            (e) => e.id !== entityId
          ),
        })),

      clearSelectedEntities: () => set({ selectedEntities: [] }),

      setAutoSelectedEntities: (entities) =>
        set({ autoSelectedEntities: entities }),

      setTitle: (title) => set({ title, isDirty: true }),

      setOutline: (outline) => set({ outline, isDirty: true }),

      setContent: (content) => set({ content, isDirty: true }),

      markAsSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),

      loadDraft: (draft) =>
        set({
          title: draft.title ?? "",
          outline: draft.outline ?? "",
          content: draft.content ?? "",
          isDirty: false,
          lastSavedAt: draft.lastSavedAt ?? null,
        }),

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
      },

      updateLastMessage: (content, isComplete = false) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIndex = messages.length - 1;
          if (lastIndex >= 0) {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content,
              isComplete,
            };
          }
          return { messages };
        }),

      clearMessages: () => set({ messages: [] }),

      setStreaming: (isStreaming) => set({ isStreaming }),

      appendStreamingBuffer: (text) =>
        set((state) => ({
          streamingBuffer: state.streamingBuffer + text,
          content: state.content + text,
          isDirty: true,
        })),

      clearStreamingBuffer: () => set({ streamingBuffer: "" }),

      toggleLeftPane: () =>
        set((state) => ({ isLeftPaneCollapsed: !state.isLeftPaneCollapsed })),

      toggleRightPane: () =>
        set((state) => ({ isRightPaneCollapsed: !state.isRightPaneCollapsed })),

      setEditingEntity: (entity) =>
        set({
          editingEntity: entity,
          editingEntityContent: entity?.content || "",
          isEntityDirty: false,
        }),

      setEditingEntityContent: (content) =>
        set((state) => ({
          editingEntityContent: content,
          isEntityDirty: content !== (state.editingEntity?.content || ""),
        })),

      markEntityAsSaved: () =>
        set((state) => ({
          isEntityDirty: false,
          editingEntity: state.editingEntity
            ? { ...state.editingEntity, content: state.editingEntityContent }
            : null,
        })),

      closeEntityEditor: () =>
        set({
          editingEntity: null,
          editingEntityContent: "",
          isEntityDirty: false,
        }),

      reset: () => set(initialState),
    }),
    {
      name: "novel-agent-writing",
      partialize: (state) => ({
        // 只持久化部分状态
        mode: state.mode,
        isLeftPaneCollapsed: state.isLeftPaneCollapsed,
        isRightPaneCollapsed: state.isRightPaneCollapsed,
      }),
    }
  )
);

// ============ 便捷 Hooks ============

/** 获取当前写作模式 */
export function useWritingMode() {
  return useWritingStore((state) => state.mode);
}

/** 获取选中的实体（根据当前模式） */
export function useContextEntities() {
  return useWritingStore((state) =>
    state.mode === "auto" ? state.autoSelectedEntities : state.selectedEntities
  );
}

/** 获取编辑器内容 */
export function useEditorContent() {
  return useWritingStore(
    useShallow((state) => ({
      title: state.title,
      outline: state.outline,
      content: state.content,
      isDirty: state.isDirty,
    }))
  );
}

/** 获取流式状态 */
export function useStreamingState() {
  return useWritingStore(
    useShallow((state) => ({
      isStreaming: state.isStreaming,
      streamingBuffer: state.streamingBuffer,
    }))
  );
}

/** 获取对话消息 */
export function useChatMessages() {
  return useWritingStore((state) => state.messages);
}

/** 获取写作操作方法 */
export function useWritingActions() {
  return useWritingStore(
    useShallow((state) => ({
      setContext: state.setContext,
      setMode: state.setMode,
      addEntity: state.addEntity,
      removeEntity: state.removeEntity,
      clearSelectedEntities: state.clearSelectedEntities,
      setAutoSelectedEntities: state.setAutoSelectedEntities,
      setTitle: state.setTitle,
      setOutline: state.setOutline,
      setContent: state.setContent,
      markAsSaved: state.markAsSaved,
      loadDraft: state.loadDraft,
      addMessage: state.addMessage,
      updateLastMessage: state.updateLastMessage,
      clearMessages: state.clearMessages,
      setStreaming: state.setStreaming,
      appendStreamingBuffer: state.appendStreamingBuffer,
      clearStreamingBuffer: state.clearStreamingBuffer,
      reset: state.reset,
    }))
  );
}

/** 获取设定编辑状态 */
export function useEntityEditing() {
  return useWritingStore(
    useShallow((state) => ({
      editingEntity: state.editingEntity,
      editingEntityContent: state.editingEntityContent,
      isEntityDirty: state.isEntityDirty,
      setEditingEntity: state.setEditingEntity,
      setEditingEntityContent: state.setEditingEntityContent,
      markEntityAsSaved: state.markEntityAsSaved,
      closeEntityEditor: state.closeEntityEditor,
    }))
  );
}
