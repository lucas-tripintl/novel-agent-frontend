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
  EditorSettings,
} from "@/types/writing";
import type { EntityRead } from "@/types/api";
import type { SelectedTextContext, ToolCallState } from "@/types/chat";
import type { NovelOutline, VolumeOutline } from "@/types/outline";

/** 大纲编辑类型 */
export type EditingOutlineType = "novel" | "volume";

/** 当前编辑的大纲信息 */
export interface EditingOutline {
  type: EditingOutlineType;
  data: NovelOutline | VolumeOutline;
}

// 生成唯一 ID（兼容非 HTTPS 环境）
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface WritingState {
  // ============ 当前上下文 ============
  /** 当前项目 ID */
  projectId: string | null;
  /** 当前章节 ID */
  chapterId: string | null;
  /** 当前章节序号（用于 API 调用） */
  chapterNumber: number | null;

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

  // ============ Chat 会话 ============
  /** 当前聊天会话 ID */
  currentChatSessionId: string | null;
  /** Chat 是否正在流式响应 */
  isChatStreaming: boolean;
  /** 当前会话的流式文本（未完成） */
  streamingChatContent: string;
  /** 当前工具调用状态 */
  activeToolCalls: ToolCallState[];

  // ============ 文本上下文 ============
  /** 选中的文本上下文 */
  selectedTextContext: SelectedTextContext | null;

  // ============ 技能选择 ============
  /** 选中的技能 ID */
  selectedSkillId: string | null;
  /** 选中的技能信息（用于 UI 显示） */
  selectedSkillInfo: {
    name: string;
    description: string;
    category: string;
  } | null;

  // ============ 模型选择 ============
  /** 选中的模型 ID */
  selectedModelId: string | null;

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

  // ============ 大纲编辑 ============
  /** 当前编辑的大纲 */
  editingOutline: EditingOutline | null;

  // ============ 编辑器设置 ============
  /** 编辑器样式设置 */
  editorSettings: EditorSettings;

  // ============ Actions ============
  /** 设置当前项目和章节 */
  setContext: (projectId: string | null, chapterId: string | null, chapterNumber?: number | null) => void;

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

  // ============ Chat 会话 Actions ============
  /** 设置当前聊天会话 */
  setCurrentChatSession: (sessionId: string | null) => void;
  /** 设置聊天流式状态 */
  setChatStreaming: (isStreaming: boolean) => void;
  /** 设置流式聊天内容 */
  setStreamingChatContent: (content: string) => void;
  /** 追加流式聊天内容 */
  appendStreamingChatContent: (delta: string) => void;
  /** 清空流式聊天内容 */
  clearStreamingChatContent: () => void;
  /** 设置工具调用状态 */
  setActiveToolCalls: (toolCalls: ToolCallState[]) => void;

  // ============ 文本上下文 Actions ============
  /** 设置选中的文本上下文 */
  setSelectedTextContext: (context: SelectedTextContext | null) => void;
  /** 清空选中的文本上下文 */
  clearSelectedTextContext: () => void;

  // ============ 技能选择 Actions ============
  /** 设置选中的技能 */
  setSelectedSkill: (
    skillId: string | null,
    info?: { name: string; description: string; category: string }
  ) => void;

  // ============ 模型选择 Actions ============
  /** 设置选中的模型 */
  setSelectedModel: (modelId: string | null) => void;

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

  /** 设置当前编辑的大纲 */
  setEditingOutline: (outline: EditingOutline | null) => void;
  /** 关闭大纲编辑 */
  closeOutlineEditor: () => void;

  /** 更新编辑器设置 */
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;

  /** 重置状态 */
  reset: () => void;
}

const defaultEditorSettings: EditorSettings = {
  fontFamily: "lxgw-wenkai",
  fontSize: 18,
  lineHeight: 1.8,
  paragraphSpacing: 16,
};

const initialState = {
  projectId: null,
  chapterId: null,
  chapterNumber: null,
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
  // Chat 会话
  currentChatSessionId: null,
  isChatStreaming: false,
  streamingChatContent: "",
  activeToolCalls: [] as ToolCallState[],
  // 文本上下文（默认启用，表示"本章内容"）
  selectedTextContext: {
    enabled: true,
    text: null,
    lineRange: null,
    charCount: 0,
  } as SelectedTextContext,
  // 技能选择
  selectedSkillId: null,
  selectedSkillInfo: null,
  // 模型选择
  selectedModelId: null,
  // UI 状态
  isLeftPaneCollapsed: false,
  isRightPaneCollapsed: false,
  editingEntity: null,
  editingEntityContent: "",
  isEntityDirty: false,
  // 大纲编辑
  editingOutline: null,
  editorSettings: defaultEditorSettings,
};

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setContext: (projectId, chapterId, chapterNumber) =>
        set((state) => ({
          projectId,
          chapterId,
          chapterNumber: chapterNumber ?? null,
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
          // 切换项目时清空会话 ID，确保不会复用旧项目的会话
          currentChatSessionId:
            state.projectId !== projectId ? null : state.currentChatSessionId,
          streamingChatContent:
            state.projectId !== projectId ? "" : state.streamingChatContent,
          activeToolCalls:
            state.projectId !== projectId ? [] : state.activeToolCalls,
        })),

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

      setTitle: (title) =>
        set((state) => ({
          title,
          isDirty: title !== state.title ? true : state.isDirty,
        })),

      setOutline: (outline) =>
        set((state) => ({
          outline,
          isDirty: outline !== state.outline ? true : state.isDirty,
        })),

      setContent: (content) =>
        set((state) => ({
          content,
          isDirty: content !== state.content ? true : state.isDirty,
        })),

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
          id: generateId(),
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

      // Chat 会话 Actions
      setCurrentChatSession: (sessionId) =>
        set({
          currentChatSessionId: sessionId,
          // 切换会话时清空流式内容
          streamingChatContent: "",
          activeToolCalls: [],
        }),

      setChatStreaming: (isStreaming) => set({ isChatStreaming: isStreaming }),

      setStreamingChatContent: (content) =>
        set({ streamingChatContent: content }),

      appendStreamingChatContent: (delta) =>
        set((state) => ({
          streamingChatContent: state.streamingChatContent + delta,
        })),

      clearStreamingChatContent: () =>
        set({ streamingChatContent: "", activeToolCalls: [] }),

      setActiveToolCalls: (toolCalls) => set({ activeToolCalls: toolCalls }),

      // 文本上下文 Actions
      setSelectedTextContext: (context) =>
        set({ selectedTextContext: context }),

      clearSelectedTextContext: () =>
        set({
          selectedTextContext: {
            enabled: true,
            text: null,
            lineRange: null,
            charCount: 0,
          },
        }),

      // 技能选择 Actions
      setSelectedSkill: (skillId, info) =>
        set({
          selectedSkillId: skillId,
          selectedSkillInfo: skillId && info ? info : null,
        }),

      // 模型选择 Actions
      setSelectedModel: (modelId) => set({ selectedModelId: modelId }),

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

      setEditingOutline: (outline) =>
        set({
          editingOutline: outline,
          // 打开大纲编辑时，关闭设定编辑
          editingEntity: null,
          editingEntityContent: "",
          isEntityDirty: false,
        }),

      closeOutlineEditor: () =>
        set({
          editingOutline: null,
        }),

      updateEditorSettings: (settings) =>
        set((state) => ({
          editorSettings: { ...state.editorSettings, ...settings },
        })),

      reset: () => set(initialState),
    }),
    {
      name: "novel-agent-writing",
      partialize: (state) => ({
        // 只持久化部分状态
        mode: state.mode,
        isLeftPaneCollapsed: state.isLeftPaneCollapsed,
        isRightPaneCollapsed: state.isRightPaneCollapsed,
        editorSettings: state.editorSettings,
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

/** 获取编辑器设置 */
export function useEditorSettings() {
  return useWritingStore(
    useShallow((state) => ({
      settings: state.editorSettings,
      updateSettings: state.updateEditorSettings,
    }))
  );
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

/** 获取大纲编辑状态 */
export function useOutlineEditing() {
  return useWritingStore(
    useShallow((state) => ({
      editingOutline: state.editingOutline,
      setEditingOutline: state.setEditingOutline,
      closeOutlineEditor: state.closeOutlineEditor,
    }))
  );
}

/** 获取 Chat 会话状态 */
export function useChatSessionState() {
  return useWritingStore(
    useShallow((state) => ({
      currentSessionId: state.currentChatSessionId,
      isChatStreaming: state.isChatStreaming,
      streamingContent: state.streamingChatContent,
      activeToolCalls: state.activeToolCalls,
      setCurrentChatSession: state.setCurrentChatSession,
      setChatStreaming: state.setChatStreaming,
      setStreamingChatContent: state.setStreamingChatContent,
      appendStreamingChatContent: state.appendStreamingChatContent,
      clearStreamingChatContent: state.clearStreamingChatContent,
      setActiveToolCalls: state.setActiveToolCalls,
    }))
  );
}

/** 获取选中的文本上下文 */
export function useSelectedTextContext() {
  return useWritingStore(
    useShallow((state) => ({
      selectedTextContext: state.selectedTextContext,
      setSelectedTextContext: state.setSelectedTextContext,
      clearSelectedTextContext: state.clearSelectedTextContext,
    }))
  );
}

/** 获取选中的技能 */
export function useSelectedSkill() {
  return useWritingStore(
    useShallow((state) => ({
      selectedSkillId: state.selectedSkillId,
      selectedSkillInfo: state.selectedSkillInfo,
      setSelectedSkill: state.setSelectedSkill,
    }))
  );
}

/** 获取选中的模型 */
export function useSelectedModel() {
  return useWritingStore(
    useShallow((state) => ({
      selectedModelId: state.selectedModelId,
      setSelectedModel: state.setSelectedModel,
    }))
  );
}
