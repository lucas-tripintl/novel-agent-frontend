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
import type {
  InlineEditContext,
  EditTargetType,
  EditSuggestion,
  QuickActionsConfig,
  QuickAction,
} from "@/types/inline-edit";
import type {
  OutlineGenerationStatus,
  DecisionPoint,
} from "@/types/interactive-outline";
import {
  initialInlineEditContext,
  defaultQuickActionsConfig,
} from "@/types/inline-edit";

/** 大纲编辑类型 */
export type EditingOutlineType = "novel" | "volume";

/** 当前编辑的大纲信息 */
export interface EditingOutline {
  type: EditingOutlineType;
  data: NovelOutline | VolumeOutline;
}

/** AI 助手上下文来源类型 */
export type ContextSourceType =
  | "editor-content"    // 中栏：正文
  | "editor-outline"    // 中栏：细纲
  | "editor-summary"    // 中栏：摘要
  | "entity-detail"     // 左栏：设定详情（点击查看）
  | "outline-detail";   // 左栏：大纲详情（点击查看）

/** AI 助手当前上下文来源 */
export interface ActiveContextSource {
  type: ContextSourceType;
  /** 显示标签（如"本章正文"、"设定：张三"） */
  label: string;
  /** 内容字数 */
  charCount: number;
  /** 是否启用 */
  enabled: boolean;
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
  /** 章节摘要（对应后端 summary） */
  outline: string;
  /** 正文内容 */
  content: string;
  /** 是否有未保存的更改（正文/摘要） */
  isDirty: boolean;
  /** 最后保存时间 */
  lastSavedAt: Date | null;

  // ============ 章节细纲（独立存储） ============
  /** 当前活动的编辑器 Tab */
  activeEditorTab: "content" | "outline" | "summary";
  /** 章节细纲内容（独立于 Chapter，对接 ChapterOutline API） */
  chapterOutline: string;
  /** 细纲是否有未保存的更改 */
  isChapterOutlineDirty: boolean;

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
  /** 选中的文本上下文（用于编辑器内选中文本片段） */
  selectedTextContext: SelectedTextContext | null;

  // ============ AI 助手上下文来源 ============
  /** 当前 AI 助手附加的上下文来源（根据 Tab 切换/详情查看自动更新） */
  activeContextSource: ActiveContextSource | null;

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

  // ============ 内联编辑 ============
  /** 内联编辑上下文 */
  inlineEdit: InlineEditContext;
  /** 快捷操作配置 */
  quickActionsConfig: QuickActionsConfig;

  // ============ 交互式细纲生成 ============
  /** 细纲生成状态 */
  outlineGenerationStatus: OutlineGenerationStatus;
  /** 流式生成的细纲内容 */
  streamingOutline: string;
  /** 当前决策点 */
  currentDecisionPoint: DecisionPoint | null;
  /** 草稿 ID */
  outlineDraftId: string | null;
  /** 是否处于生成协作模式（右侧面板显示决策面板而非聊天） */
  generationCollabMode: boolean;

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
  /** 更新摘要 */
  setOutline: (outline: string) => void;
  /** 更新内容 */
  setContent: (content: string) => void;
  /** 标记为已保存 */
  markAsSaved: () => void;
  /** 加载章节草稿 */
  loadDraft: (draft: Partial<ChapterDraft>) => void;

  /** 设置活动的编辑器 Tab */
  setActiveEditorTab: (tab: "content" | "outline" | "summary") => void;
  /** 更新章节细纲 */
  setChapterOutline: (content: string) => void;
  /** 加载章节细纲（不标记为脏） */
  loadChapterOutline: (content: string) => void;
  /** 标记细纲为已保存 */
  markChapterOutlineSaved: () => void;

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

  // ============ AI 助手上下文来源 Actions ============
  /** 设置当前上下文来源 */
  setActiveContextSource: (source: ActiveContextSource | null) => void;

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

  // ============ 内联编辑 Actions ============
  /** 开始内联编辑 */
  startInlineEdit: (
    targetType: EditTargetType,
    text: string,
    range?: { from: number; to: number }
  ) => void;
  /** 设置内联编辑状态 */
  setInlineEditStatus: (status: InlineEditContext["status"]) => void;
  /** 更新编辑建议 */
  updateEditSuggestion: (update: Partial<EditSuggestion>) => void;
  /** 设置编辑建议（完整） */
  setEditSuggestion: (suggestion: EditSuggestion | null) => void;
  /** 接受编辑 */
  acceptEdit: () => void;
  /** 拒绝编辑 */
  rejectEdit: () => void;
  /** 取消内联编辑 */
  cancelInlineEdit: () => void;
  /** 设置内联编辑错误 */
  setInlineEditError: (error: string | null) => void;

  // ============ 快捷操作 Actions ============
  /** 更新快捷操作列表 */
  updateQuickActions: (actions: QuickAction[]) => void;
  /** 设置启用的快捷操作 ID */
  setEnabledQuickActions: (ids: string[]) => void;
  /** 添加快捷操作 */
  addQuickAction: (action: QuickAction) => void;
  /** 移除快捷操作 */
  removeQuickAction: (id: string) => void;

  // ============ 交互式细纲生成 Actions ============
  /** 设置细纲生成状态 */
  setOutlineGenerationStatus: (status: OutlineGenerationStatus) => void;
  /** 设置流式细纲内容 */
  setStreamingOutline: (content: string) => void;
  /** 追加流式细纲内容 */
  appendStreamingOutline: (delta: string) => void;
  /** 设置当前决策点 */
  setCurrentDecisionPoint: (point: DecisionPoint | null) => void;
  /** 设置草稿 ID */
  setOutlineDraftId: (id: string | null) => void;
  /** 重置交互式生成状态 */
  resetOutlineGeneration: () => void;
  /** 进入生成协作模式（自动展开右侧面板） */
  enterGenerationCollabMode: () => void;
  /** 退出生成协作模式 */
  exitGenerationCollabMode: () => void;

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
  // 细纲状态
  activeEditorTab: "content" as const,
  chapterOutline: "",
  isChapterOutlineDirty: false,
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
  // AI 助手上下文来源（默认显示本章正文）
  activeContextSource: {
    type: "editor-content",
    label: "本章正文",
    charCount: 0,
    enabled: true,
  } as ActiveContextSource,
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
  // 内联编辑
  inlineEdit: initialInlineEditContext,
  quickActionsConfig: defaultQuickActionsConfig,
  // 交互式细纲生成
  outlineGenerationStatus: "idle" as OutlineGenerationStatus,
  streamingOutline: "",
  currentDecisionPoint: null,
  outlineDraftId: null,
  generationCollabMode: false,
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
          // 重置细纲状态
          chapterOutline: "",
          isChapterOutlineDirty: false,
          activeEditorTab: "content" as const,
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

      // ============ 细纲 Actions ============
      setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),

      setChapterOutline: (content) =>
        set((state) => ({
          chapterOutline: content,
          isChapterOutlineDirty: content !== state.chapterOutline,
        })),

      loadChapterOutline: (content) =>
        set({
          chapterOutline: content,
          isChapterOutlineDirty: false,
        }),

      markChapterOutlineSaved: () => set({ isChapterOutlineDirty: false }),

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

      // AI 助手上下文来源 Actions
      setActiveContextSource: (source) => set({ activeContextSource: source }),

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
          // 打开设定编辑时，关闭大纲编辑
          editingOutline: null,
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

      // ============ 内联编辑 Actions 实现 ============
      startInlineEdit: (targetType, text, range) =>
        set({
          inlineEdit: {
            status: "prompting",
            targetType,
            originalText: text,
            range: range ?? null,
            suggestion: null,
            error: null,
          },
        }),

      setInlineEditStatus: (status) =>
        set((state) => ({
          inlineEdit: { ...state.inlineEdit, status },
        })),

      updateEditSuggestion: (update) =>
        set((state) => ({
          inlineEdit: {
            ...state.inlineEdit,
            suggestion: state.inlineEdit.suggestion
              ? { ...state.inlineEdit.suggestion, ...update }
              : null,
          },
        })),

      setEditSuggestion: (suggestion) =>
        set((state) => ({
          inlineEdit: { ...state.inlineEdit, suggestion },
        })),

      acceptEdit: () => {
        const { inlineEdit } = get();
        if (inlineEdit.suggestion?.isComplete) {
          // 重置内联编辑状态，实际替换由调用方执行
          set({ inlineEdit: initialInlineEditContext });
        }
      },

      rejectEdit: () => set({ inlineEdit: initialInlineEditContext }),

      cancelInlineEdit: () => set({ inlineEdit: initialInlineEditContext }),

      setInlineEditError: (error) =>
        set((state) => ({
          inlineEdit: { ...state.inlineEdit, error, status: "idle" },
        })),

      // ============ 快捷操作 Actions 实现 ============
      updateQuickActions: (actions) =>
        set((state) => ({
          quickActionsConfig: { ...state.quickActionsConfig, actions },
        })),

      setEnabledQuickActions: (ids) =>
        set((state) => ({
          quickActionsConfig: { ...state.quickActionsConfig, enabledIds: ids },
        })),

      addQuickAction: (action) =>
        set((state) => ({
          quickActionsConfig: {
            ...state.quickActionsConfig,
            actions: [...state.quickActionsConfig.actions, action],
          },
        })),

      removeQuickAction: (id) =>
        set((state) => ({
          quickActionsConfig: {
            ...state.quickActionsConfig,
            actions: state.quickActionsConfig.actions.filter((a) => a.id !== id),
            enabledIds: state.quickActionsConfig.enabledIds.filter((eid) => eid !== id),
          },
        })),

      // ============ 交互式细纲生成 Actions 实现 ============
      setOutlineGenerationStatus: (status) =>
        set({ outlineGenerationStatus: status }),

      setStreamingOutline: (content) =>
        set({ streamingOutline: content }),

      appendStreamingOutline: (delta) =>
        set((state) => ({
          streamingOutline: state.streamingOutline + delta,
        })),

      setCurrentDecisionPoint: (point) =>
        set({ currentDecisionPoint: point }),

      setOutlineDraftId: (id) =>
        set({ outlineDraftId: id }),

      resetOutlineGeneration: () =>
        set({
          outlineGenerationStatus: "idle" as OutlineGenerationStatus,
          streamingOutline: "",
          currentDecisionPoint: null,
          outlineDraftId: null,
        }),

      enterGenerationCollabMode: () =>
        set({
          generationCollabMode: true,
          isRightPaneCollapsed: false, // 自动展开右侧面板
        }),

      exitGenerationCollabMode: () =>
        set({
          generationCollabMode: false,
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
        editorSettings: state.editorSettings,
        quickActionsConfig: state.quickActionsConfig,
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

/** 获取 AI 助手上下文来源 */
export function useActiveContextSource() {
  return useWritingStore(
    useShallow((state) => ({
      activeContextSource: state.activeContextSource,
      setActiveContextSource: state.setActiveContextSource,
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

/** 获取内联编辑状态 */
export function useInlineEditState() {
  return useWritingStore(
    useShallow((state) => ({
      inlineEdit: state.inlineEdit,
      startInlineEdit: state.startInlineEdit,
      setInlineEditStatus: state.setInlineEditStatus,
      updateEditSuggestion: state.updateEditSuggestion,
      setEditSuggestion: state.setEditSuggestion,
      acceptEdit: state.acceptEdit,
      rejectEdit: state.rejectEdit,
      cancelInlineEdit: state.cancelInlineEdit,
      setInlineEditError: state.setInlineEditError,
    }))
  );
}

/** 获取快捷操作配置 */
export function useQuickActionsConfig() {
  return useWritingStore(
    useShallow((state) => ({
      quickActionsConfig: state.quickActionsConfig,
      updateQuickActions: state.updateQuickActions,
      setEnabledQuickActions: state.setEnabledQuickActions,
      addQuickAction: state.addQuickAction,
      removeQuickAction: state.removeQuickAction,
    }))
  );
}

/** 获取章节细纲状态 */
export function useChapterOutlineState() {
  return useWritingStore(
    useShallow((state) => ({
      activeEditorTab: state.activeEditorTab,
      chapterOutline: state.chapterOutline,
      isChapterOutlineDirty: state.isChapterOutlineDirty,
      setActiveEditorTab: state.setActiveEditorTab,
      setChapterOutline: state.setChapterOutline,
      loadChapterOutline: state.loadChapterOutline,
      markChapterOutlineSaved: state.markChapterOutlineSaved,
    }))
  );
}

/** 获取章节保存状态（用于保存功能） */
export function useChapterSaveState() {
  return useWritingStore(
    useShallow((state) => ({
      projectId: state.projectId,
      chapterId: state.chapterId,
      chapterNumber: state.chapterNumber,
      title: state.title,
      outline: state.outline,
      content: state.content,
      chapterOutline: state.chapterOutline,
      isDirty: state.isDirty,
      isChapterOutlineDirty: state.isChapterOutlineDirty,
      markAsSaved: state.markAsSaved,
      markChapterOutlineSaved: state.markChapterOutlineSaved,
    }))
  );
}

/** 获取交互式细纲生成状态 */
export function useInteractiveOutlineState() {
  return useWritingStore(
    useShallow((state) => ({
      outlineGenerationStatus: state.outlineGenerationStatus,
      streamingOutline: state.streamingOutline,
      currentDecisionPoint: state.currentDecisionPoint,
      outlineDraftId: state.outlineDraftId,
      generationCollabMode: state.generationCollabMode,
      setOutlineGenerationStatus: state.setOutlineGenerationStatus,
      setStreamingOutline: state.setStreamingOutline,
      appendStreamingOutline: state.appendStreamingOutline,
      setCurrentDecisionPoint: state.setCurrentDecisionPoint,
      setOutlineDraftId: state.setOutlineDraftId,
      resetOutlineGeneration: state.resetOutlineGeneration,
      enterGenerationCollabMode: state.enterGenerationCollabMode,
      exitGenerationCollabMode: state.exitGenerationCollabMode,
      // 关联的 actions
      setActiveEditorTab: state.setActiveEditorTab,
      loadChapterOutline: state.loadChapterOutline,
    }))
  );
}
