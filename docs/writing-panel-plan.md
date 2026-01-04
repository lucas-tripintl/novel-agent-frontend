# 写作面板 (Writing Panel) 实现计划

## 概述

三栏式写作面板，支持 AI 辅助创作、设定引用和章节管理。

**页面路由**: `/write/[projectId]`

## 技术选型

| 模块 | 技术方案 | 理由 |
|------|---------|------|
| 编辑器 | **Tiptap** | 用户参考界面已使用 ProseMirror，Tiptap 是最佳封装 |
| AI 流式 | **SSE + AsyncGenerator** | 原生支持，无需额外依赖 |
| 状态管理 | **Zustand** (writing-store) | 与项目现有模式一致 |
| 数据获取 | **TanStack Query** | 复用现有 hooks |

```bash
# 需要安装
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
```

## 布局架构

```
┌─────────────────────────────────────────────────────────────────┐
│ 顶部工具栏: 模式切换 | 开始书写 | AI审稿 | 保存状态 | 字数统计   │
├──────────────┬─────────────────────────┬────────────────────────┤
│   左栏 320px │      中栏 flex-1        │     右栏 400px         │
│              │                         │                        │
│ [章节列表]   │   [Tiptap 编辑器]       │  [选中的设定卡片]      │
│ - 第1章 ✓   │                         │  - 角色: 张三          │
│ - 第2章     │   标题输入              │  - 世界观: xxx         │
│ - 第3章 ←   │   章节概要(折叠)        │                        │
│              │   正文编辑区            │  [AI 对话流]           │
│ [设定浏览器] │                         │  > 用户: 帮我写...     │
│ > 角色 (12) │                         │  < AI: 好的，正在...   │
│ > 世界观 (5)│                         │                        │
│ > 物品 (8)  │                         │  [输入框]              │
│              │                         │                        │
└──────────────┴─────────────────────────┴────────────────────────┘
```

## 文件结构

```
src/
├── app/write/[projectId]/
│   ├── page.tsx                 # 页面入口
│   └── loading.tsx              # 骨架屏
│
├── components/write/
│   ├── index.ts
│   ├── writing-panel.tsx        # 三栏容器
│   ├── writing-toolbar.tsx      # 顶部工具栏
│   │
│   ├── panes/
│   │   ├── settings-pane.tsx    # 左栏
│   │   ├── editor-pane.tsx      # 中栏
│   │   └── assistant-pane.tsx   # 右栏
│   │
│   ├── settings/
│   │   ├── chapter-list.tsx     # 章节列表
│   │   └── entity-browser.tsx   # 设定浏览器 (简化版)
│   │
│   ├── editor/
│   │   ├── tiptap-editor.tsx    # Tiptap 编辑器封装
│   │   ├── chapter-header.tsx   # 标题+概要区
│   │   └── extensions/          # Tiptap 扩展
│   │       └── streaming.ts     # AI 流式写入扩展
│   │
│   └── assistant/
│       ├── chat-stream.tsx      # AI 对话流
│       ├── chat-message.tsx     # 消息组件
│       └── selected-context.tsx # 已选设定展示
│
├── hooks/
│   ├── use-writing.ts           # 写作数据 hooks
│   └── use-stream-write.ts      # 流式写作 hook
│
├── stores/
│   └── writing-store.ts         # 写作状态
│
├── lib/api/
│   └── writing.ts               # 写作 API
│
└── types/
    └── writing.ts               # 类型定义
```

## 实现步骤

### Phase 1: 基础架构 (核心)

1. **创建页面和布局**
   - `src/app/write/[projectId]/page.tsx`
   - `src/components/write/writing-panel.tsx` - 三栏 ResizablePanelGroup
   - `src/components/write/writing-toolbar.tsx` - 顶部工具栏

2. **状态管理**
   - `src/stores/writing-store.ts`
   - `src/types/writing.ts`

### Phase 2: 左栏 - 设定面板

3. **章节列表**
   - `src/components/write/settings/chapter-list.tsx`
   - 复用 `useProjectChapters` hook

4. **设定浏览器**
   - `src/components/write/settings/entity-browser.tsx`
   - 简化版 `ProjectElementSelector`，支持单选添加到上下文

### Phase 3: 中栏 - Tiptap 编辑器

5. **安装和配置 Tiptap**
   ```bash
   pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
   ```

6. **编辑器组件**
   - `src/components/write/editor/tiptap-editor.tsx`
   - `src/components/write/editor/chapter-header.tsx` - 标题+折叠概要

7. **流式写入扩展**
   - `src/components/write/editor/extensions/streaming.ts`
   - 支持 AI 流式内容插入 + 打字机效果

### Phase 4: 右栏 - AI 助手

8. **对话流组件**
   - `src/components/write/assistant/chat-stream.tsx`
   - `src/components/write/assistant/chat-message.tsx`

9. **已选设定展示**
   - `src/components/write/assistant/selected-context.tsx`
   - 显示导演模式下手动选择的设定 / 全自动模式下系统选择的设定

### Phase 5: API 层

10. **流式写作 API**
    - `src/lib/api/writing.ts` - SSE 流式请求封装
    - `src/hooks/use-stream-write.ts`

## API 设计 (前后端协商)

### 1. 流式写作

```typescript
// POST /api/v1/projects/{projectId}/chapters/{chapterId}/write
// Request
{
  mode: "auto" | "director",
  entity_ids?: string[],        // 导演模式下选择的实体
  prompt?: string,              // 用户额外指令
  continue_from?: number,       // 从第几个字符续写
  outline?: string              // 章节概要
}

// Response: SSE Stream
data: {"type": "context", "auto_selected_entities": [...]}
data: {"type": "content", "text": "他缓缓"}
data: {"type": "content", "text": "走进了"}
data: {"type": "done", "total_chars": 1234}
data: {"type": "error", "message": "..."}
```

### 2. AI 审稿

```typescript
// POST /api/v1/projects/{projectId}/chapters/{chapterId}/review
// Request
{
  content: string,
  aspects: ("plot" | "character" | "style" | "logic")[]
}

// Response: SSE Stream
data: {"type": "review", "aspect": "plot", "score": 85, "comment": "..."}
data: {"type": "suggestion", "range": [10, 50], "original": "...", "suggested": "...", "reason": "..."}
data: {"type": "done"}
```

### 3. 保存章节

```typescript
// PUT /api/v1/projects/{projectId}/chapters/{chapterId}
// Request
{
  title: string,
  outline?: string,
  content: string
}
```

## 关键组件设计

### WritingStore (Zustand)

```typescript
interface WritingState {
  // 当前上下文
  projectId: string | null;
  chapterId: string | null;

  // 写作模式
  mode: "auto" | "director";

  // 选中的实体 (导演模式)
  selectedEntities: SelectedEntity[];

  // 自动选择的实体 (全自动模式，AI 返回)
  autoSelectedEntities: SelectedEntity[];

  // 编辑器状态
  title: string;
  outline: string;
  content: string;
  isDirty: boolean;

  // AI 对话
  messages: ChatMessage[];
  isStreaming: boolean;

  // Actions
  setMode: (mode) => void;
  addEntity: (entity) => void;
  removeEntity: (entityId) => void;
  updateContent: (content) => void;
  // ...
}
```

### 流式写入实现

```typescript
// use-stream-write.ts
export function useStreamWrite() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startWrite = useCallback(async (params: WriteParams, onChunk: (text: string) => void) => {
    setIsStreaming(true);
    abortRef.current = new AbortController();

    const response = await fetch(`/api/v1/projects/${params.projectId}/chapters/${params.chapterId}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
      signal: abortRef.current.signal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content') onChunk(data.text);
          if (data.type === 'context') setAutoSelectedEntities(data.auto_selected_entities);
        }
      }
    }
    setIsStreaming(false);
  }, []);

  const stop = () => abortRef.current?.abort();

  return { isStreaming, startWrite, stop };
}
```

## UI 设计要点

1. **流式写入效果**: 文字末尾闪烁光标 `animate-pulse`
2. **模式切换**: RadioGroup + 发光边框 `glow-primary`
3. **设定卡片**: 小型 Card + HoverCard 预览
4. **对话消息**: 用户右对齐深色，AI 左对齐浅色
5. **工具栏**: 粘性定位 `sticky top-0`，毛玻璃效果 `backdrop-blur`

## 需要复用的现有组件

| 组件 | 来源 | 用途 |
|------|------|------|
| Accordion | ui/accordion | 设定分类折叠 |
| HoverCard | ui/hover-card | 实体预览 |
| Badge | ui/badge | 状态标签、字数 |
| Button | ui/button | 操作按钮 |
| ScrollArea | ui/scroll-area | 滚动容器 |
| RadioGroup | ui/radio-group | 模式切换 |
| Skeleton | ui/skeleton | 加载状态 |
| elementCategories | hooks/use-project-elements | 设定分类配置 |

## 关键文件路径

需要参考/复用:
- `/src/components/fusion/project-element-selector.tsx` - 实体选择器模式
- `/src/components/layout/terminal-log.tsx` - 日志 UI 模式
- `/src/lib/api/client.ts` - API 客户端 (需扩展 SSE)
- `/src/hooks/use-project-elements.ts` - 元素加载 hook
- `/src/stores/project-selection-store.ts` - Zustand 模式参考

需要新建:
- `/src/app/write/[projectId]/page.tsx`
- `/src/components/write/` (整个目录)
- `/src/stores/writing-store.ts`
- `/src/lib/api/writing.ts`
- `/src/types/writing.ts`
- `/src/hooks/use-writing.ts`
- `/src/hooks/use-stream-write.ts`
