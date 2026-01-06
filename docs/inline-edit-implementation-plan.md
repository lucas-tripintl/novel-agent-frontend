# AI 内联编辑功能实现计划

> 创建日期: 2026-01-06
> 状态: P0 已完成
> 更新日期: 2026-01-06

## 实现进度

### 已完成 (P0)
- [x] 类型定义 `src/types/inline-edit.ts`
- [x] 状态管理 `src/stores/writing-store.ts` (inlineEdit, quickActionsConfig)
- [x] 悬浮工具栏 `src/components/write/editor/selection-toolbar.tsx`
- [x] Diff 预览扩展 `src/components/write/editor/extensions/inline-edit-decoration.ts`
- [x] 内联编辑 Hook `src/hooks/use-inline-edit.ts` (含临时会话支持)
- [x] Accept/Reject 操作栏 `src/components/write/editor/inline-edit-actions.tsx`
- [x] Tiptap 编辑器集成 `src/components/write/editor/tiptap-editor.tsx`
- [x] Diff 预览样式 `src/app/globals.css`
- [x] Chat 类型扩展 `src/types/chat.ts`
- [x] 工具名称映射 `src/components/write/assistant/tool-call-indicator.tsx`

### 待实现 (P1)
- [ ] 章节标题内联编辑
- [ ] 章节概要内联编辑
- [ ] 设定内容内联编辑
- [ ] 大纲内容内联编辑

### 后端需要
- [ ] 实现 `suggest_edit` 工具

---

## 功能概述

在写作面板中实现类似 Cursor 的 AI 内联编辑功能：
1. 选中文本后通过悬浮工具栏触发
2. 在右侧 AI 助手面板输入编辑指令
3. AI 返回修改建议，编辑器中显示 diff 预览（红色删除线 + 绿色新增）
4. 提供"接受/拒绝"按钮确认替换

**支持的编辑范围**：章节正文、章节标题、设定内容、大纲内容

---

## 技术方案

### 核心机制：工具调用 (Tool Call)

使用 AG-UI 协议的工具调用机制，后端新增 `suggest_edit` 工具：

```
用户选中文本 → 悬浮工具栏"AI编辑" → AI助手面板输入指令
       ↓
发送 Chat 请求（state.inline_edit = true）
       ↓
后端 AI 调用 suggest_edit 工具：
  TOOL_CALL_START → TOOL_CALL_ARGS（流式） → TOOL_CALL_END
       ↓
前端解析工具参数，在编辑器显示 diff 预览
       ↓
用户 Accept → 执行替换 | Reject → 取消预览
```

---

## 实现步骤

### Phase 1: 类型定义和状态管理

#### 1.1 新增类型定义 `src/types/inline-edit.ts`

```typescript
/** 内联编辑状态 */
export type InlineEditStatus =
  | 'idle'           // 空闲
  | 'prompting'      // 等待用户输入指令
  | 'streaming'      // AI 正在生成
  | 'previewing';    // 预览 diff

/** 编辑目标类型 */
export type EditTargetType =
  | 'content'        // 章节正文
  | 'title'          // 章节标题
  | 'outline'        // 章节概要
  | 'entity'         // 设定内容
  | 'novel-outline'  // 总纲/卷纲

/** 快捷操作定义 */
export interface QuickAction {
  id: string;
  label: string;           // 显示名称："润色"
  instruction: string;     // 发送给 AI 的指令
  icon?: string;           // 可选图标名
  skillId?: string;        // 可选：关联的技能 ID
}

/** 编辑建议 */
export interface EditSuggestion {
  id: string;
  targetType: EditTargetType;
  /** 原文位置（Tiptap pos 或字符索引） */
  range: { from: number; to: number } | null;
  originalText: string;
  replacementText: string;
  explanation?: string;
  isComplete: boolean;
}

/** 内联编辑上下文 */
export interface InlineEditContext {
  status: InlineEditStatus;
  targetType: EditTargetType | null;
  originalText: string;
  range: { from: number; to: number } | null;
  suggestion: EditSuggestion | null;
  error: string | null;
}
```

#### 1.2 扩展 `src/stores/writing-store.ts`

在 `WritingState` 中添加：
```typescript
// ============ 内联编辑 ============
inlineEdit: InlineEditContext;

// ============ 快捷操作配置 ============
quickActions: QuickAction[];
enabledQuickActionIds: string[];  // 工具栏显示哪些

// Actions
startInlineEdit: (targetType: EditTargetType, text: string, range?: { from: number; to: number }) => void;
updateEditSuggestion: (update: Partial<EditSuggestion>) => void;
setInlineEditStatus: (status: InlineEditStatus) => void;
acceptEdit: () => void;
rejectEdit: () => void;
cancelInlineEdit: () => void;
updateQuickActions: (actions: QuickAction[]) => void;
setEnabledQuickActions: (ids: string[]) => void;
```

---

### Phase 2: 悬浮工具栏

#### 2.1 新增组件 `src/components/write/editor/selection-toolbar.tsx`

选中文本时显示悬浮工具栏：

**工具栏内容**：
- 快捷操作按钮（可配置）
- "更多..." 按钮 → 打开 AI 助手面板输入自定义指令
- 技能选择下拉（可选）

**默认快捷操作**：
```typescript
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'polish', label: '润色', instruction: '润色这段文字，使表达更流畅优美' },
  { id: 'expand', label: '扩写', instruction: '扩写这段文字，增加更多细节描写' },
  { id: 'rewrite', label: '改写', instruction: '换一种方式改写这段文字' },
  { id: 'simplify', label: '简化', instruction: '简化这段文字，使其更加简洁' },
];
```

**用户自定义**：
- 在设置中可配置显示哪些快捷操作
- 可绑定技能到快捷操作（如"番茄风格改写"）

#### 2.2 快捷操作时自动携带上下文

**自动携带的上下文**：
1. `selected_text` - 选中的文本
2. `context_entity_ids` - 当前模式下已选择的设定
3. `skill_id` - 快捷操作绑定的技能
4. `chapter_title` / `chapter_outline` - 章节上下文

**示例请求**：
```typescript
sendMessage({
  messages: [{ role: 'user', content: '润色这段文字...' }],
  state: {
    selected_text: '萧炎站在云岚宗门前...',
    inline_edit: true,
    context_entity_ids: ['char-xiaoyan-uuid'],
    skill_id: quickAction.skillId || selectedSkillId,
    chapter_title: '第一章 少年萧炎',
    chapter_outline: '萧炎初入云岚宗...',
  }
});
```

#### 2.3 修改 `src/components/write/editor/tiptap-editor.tsx`

- 集成 `SelectionToolbar` 组件
- 添加 `InlineEditDecoration` 扩展（显示 diff）
- 暴露 `replaceRange` 方法用于执行替换

---

### Phase 3: Tiptap Decoration 扩展

#### 3.1 新增扩展 `src/components/write/editor/extensions/inline-edit-decoration.ts`

使用 ProseMirror Decoration 实现 diff 预览：
- 原文：红色背景 + 删除线
- 新文本：绿色背景（widget decoration 插入到原文后）

```typescript
// 核心 API
editor.commands.showEditPreview({ from, to, originalText, newText })
editor.commands.clearEditPreview()
editor.commands.applyEditPreview() // 执行替换
```

#### 3.2 样式 `src/app/globals.css`

```css
.inline-edit-deletion {
  @apply bg-red-100 dark:bg-red-900/30 line-through text-red-600;
}
.inline-edit-addition {
  @apply bg-green-100 dark:bg-green-900/30 text-green-600;
}
```

---

### Phase 4: AI 助手面板改造

#### 4.1 修改 `src/components/write/panes/assistant-pane.tsx`

**新增"内联编辑模式"**：
- 当 `inlineEdit.status === 'prompting'` 时，UI 切换为编辑模式
- 显示选中文本预览
- 快捷指令按钮
- 发送时自动附带 `state.inline_edit = true`

#### 4.2 新增 Hook `src/hooks/use-inline-edit.ts`

监听 `suggest_edit` 工具调用：
```typescript
onToolCallStart: (tc) => {
  if (tc.name === 'suggest_edit') {
    setInlineEditStatus('streaming');
  }
},
onToolCallArgs: (id, args) => {
  // 解析流式 JSON，更新 replacementText
  updateEditSuggestion({ replacementText: parsed.replacement_text });
},
onToolCallEnd: () => {
  setInlineEditStatus('previewing');
}
```

---

### Phase 5: Accept/Reject 操作栏

#### 5.1 新增组件 `src/components/write/editor/inline-edit-actions.tsx`

当 `inlineEdit.status === 'previewing'` 时显示：
- Accept (✓) → 执行替换，清理 decoration
- Reject (✗) → 清理 decoration，恢复原文
- Regenerate (↻) → 重新请求 AI

---

### Phase 6: 多内容类型支持

#### 6.1 章节正文
- 使用 Tiptap Decoration
- 基于 ProseMirror position 定位

#### 6.2 章节标题/概要
- 修改 `chapter-header.tsx`
- 简单字符串替换，显示 inline diff

#### 6.3 设定内容
- 修改 `entity-editor.tsx`
- 类似标题处理，支持纯文本 diff

#### 6.4 大纲内容
- 修改 `outline-editor.tsx`
- 支持纯文本或 Markdown diff

---

## 后端配合

### 新增工具：`suggest_edit`

```python
{
    "name": "suggest_edit",
    "description": "建议对选中文本进行编辑，返回替换后的文本",
    "parameters": {
        "type": "object",
        "properties": {
            "original_text": {
                "type": "string",
                "description": "原始文本（用于确认匹配）"
            },
            "replacement_text": {
                "type": "string",
                "description": "替换后的文本"
            },
            "explanation": {
                "type": "string",
                "description": "修改说明（可选）"
            }
        },
        "required": ["original_text", "replacement_text"]
    }
}
```

### 扩展 ChatMessageState

```python
class ChatMessageState(BaseModel):
    selected_text: Optional[str] = None
    skill_id: Optional[str] = None
    context_entity_ids: Optional[List[str]] = None
    inline_edit: Optional[bool] = False  # 新增：是否为内联编辑请求
    chapter_title: Optional[str] = None  # 新增：章节标题
    chapter_outline: Optional[str] = None  # 新增：章节概要
```

### 系统提示词调整

当 `inline_edit = true` 时：
- 指导 AI 使用 `suggest_edit` 工具返回结构化结果
- 不要直接输出大段文字
- 保持原文结构，只修改必要部分

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/inline-edit.ts` | **新增** | 内联编辑 + 快捷操作类型定义 |
| `src/stores/writing-store.ts` | 修改 | 添加 inlineEdit 状态、quickActions 配置 |
| `src/components/write/editor/extensions/inline-edit-decoration.ts` | **新增** | Tiptap diff 预览扩展 |
| `src/components/write/editor/selection-toolbar.tsx` | **新增** | 悬浮工具栏（快捷操作 + 技能选择） |
| `src/components/write/editor/inline-edit-actions.tsx` | **新增** | Accept/Reject 操作栏 |
| `src/components/write/editor/tiptap-editor.tsx` | 修改 | 集成工具栏和 decoration |
| `src/components/write/panes/assistant-pane.tsx` | 修改 | 添加内联编辑模式 UI |
| `src/hooks/use-inline-edit.ts` | **新增** | 内联编辑逻辑封装（含上下文自动携带） |
| `src/types/chat.ts` | 修改 | 添加 inline_edit、chapter_title 等字段 |
| `src/components/write/assistant/tool-call-indicator.tsx` | 修改 | 添加 suggest_edit 工具名称 |
| `src/app/globals.css` | 修改 | 添加 diff 预览样式 |
| `src/components/write/editor/chapter-header.tsx` | 修改 | 支持标题/概要内联编辑 |
| `src/components/write/editor/entity-editor.tsx` | 修改 | 支持设定内联编辑 |
| `src/components/write/editor/outline-editor.tsx` | 修改 | 支持大纲内联编辑 |
| `src/components/write/settings/quick-actions-settings.tsx` | **新增** | 快捷操作配置界面（可选，P2） |

---

## 实现优先级

1. **P0 - 核心流程**（先做）
   - 类型定义和状态管理
   - Tiptap Decoration 扩展
   - 悬浮工具栏（含快捷操作）
   - AI 助手面板改造
   - Accept/Reject 操作

2. **P1 - 扩展支持**（后做）
   - 标题/概要编辑
   - 设定内容编辑
   - 大纲内容编辑

3. **P2 - 增强功能**（可选）
   - 快捷操作配置界面
   - 部分接受（逐句 accept）
   - 编辑历史记录

---

## 用户体验要点

1. **流式预览**：AI 生成过程中实时更新 diff 预览
2. **快捷操作**：提供"润色/扩写/改写/简化"一键按钮，可自定义
3. **上下文自动携带**：快捷操作时自动带上设定、技能、章节信息
4. **撤销支持**：Accept 后可通过 Cmd+Z 撤销（Tiptap history）
5. **错误处理**：网络错误时保留原文，显示重试选项
6. **视觉反馈**：流式生成时显示光标/加载动画
