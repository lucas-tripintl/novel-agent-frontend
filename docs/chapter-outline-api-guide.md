# 章节细纲 API 前端对接指南

## 概述

章节细纲是写作前的规划文档，包含剧情设计、情绪节奏、冲突设计等。支持：
- AI 自动生成细纲
- 人工编辑调整
- 独立于章节管理（可先生成细纲再写作）

## 数据模型

### ChapterOutlineListRead（列表/详情响应）

```typescript
interface ChapterOutlineListRead {
  id: string;                              // UUID
  chapter_number: number;                  // 章节号
  chapter_id: string | null;               // 关联的章节 ID（写作后自动关联）
  content: string;                         // 细纲内容（自然语言格式）
  context_requirements: ContextRequirements | null;  // 上下文需求
  golden_finger_plan: GoldenFingerPlan | null;       // 金手指规划
  created_at: string;                      // ISO 8601
  updated_at: string;                      // ISO 8601
}
```

### ContextRequirements（上下文需求）

```typescript
interface ContextRequirements {
  required_characters: CharacterRef[];     // 需要出场的角色
  required_locations: string[];            // 需要的场景/地点
  required_worldview: string[];            // 需要的世界观设定
  foreshadowing_to_recall: string[];       // 需要回收的伏笔
}

interface CharacterRef {
  name: string;                            // 角色名
  role: string | null;                     // 本章角色（主视角/对手/配角等）
}
```

### GoldenFingerPlan（金手指规划）

```typescript
interface GoldenFingerPlan {
  name: string;                            // 金手指名称
  type: string | null;                     // 类型
  planned_usage: string | null;            // 使用计划描述
  unlock_conditions: string[];             // 解锁条件
}
```

### 细纲内容格式

`content` 字段采用自然语言格式，包含以下部分：

```markdown
## 剧情设计
承接上章：xxx
本章目标：xxx
关键事件：1. xxx 2. xxx 3. xxx
章末钩子：xxx

## 情绪与节奏
情绪曲线：开篇xx → 中段xx → 高潮xx → 收尾xx
节奏建议：xxx

## 冲突设计
主冲突：xxx
次冲突：xxx
解决方向：xxx

## 爽点与伏笔
爽点设计：xxx（位置：约xx字处）
埋设伏笔：xxx
回收伏笔：xxx
钩子设计：xxx

## 字数与节拍
目标字数：约xxxx字
节拍点：
  - 300字：出危机 - xxx
  - 800字：亮金手指 - xxx
  - 1500字：小高潮 - xxx
  - 章末：钩子 - xxx

## 特别注意
xxx

## 摘要
xxx（100字以内的核心摘要）
```

---

## API 端点

### 1. 获取细纲列表

```
GET /api/v1/projects/{project_id}/chapters/outlines
```

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `chapter_start` | int | 章节号起始 (可选) |
| `chapter_end` | int | 章节号结束 (可选) |

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "chapter_number": 1,
      "chapter_id": "660e8400-e29b-41d4-a716-446655440001",
      "content": "## 剧情设计\n承接上章：无\n本章目标：引出主角...",
      "context_requirements": {
        "required_characters": [
          {"name": "萧炎", "role": "主视角"}
        ],
        "required_locations": ["萧家大厅"],
        "required_worldview": ["斗气等级"],
        "foreshadowing_to_recall": []
      },
      "golden_finger_plan": null,
      "created_at": "2026-01-06T10:00:00Z",
      "updated_at": "2026-01-06T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "chapter_number": 2,
      "chapter_id": null,
      "content": "## 剧情设计\n...",
      "context_requirements": {...},
      "golden_finger_plan": {...},
      "created_at": "2026-01-06T11:00:00Z",
      "updated_at": "2026-01-06T11:00:00Z"
    }
  ]
}
```

**说明**：
- `chapter_id` 为 `null` 表示细纲尚未与章节关联（章节未写或未采用）
- 按章节号升序排列

---

### 2. 获取单个细纲

```
GET /api/v1/projects/{project_id}/chapters/{chapter_number}/outline
```

**响应**：同列表项结构

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "章节细纲 1 不存在"
  }
}
```

---

### 3. 创建/更新细纲

```
PUT /api/v1/projects/{project_id}/chapters/{chapter_number}/outline
```

**请求体**：

```json
{
  "content": "## 剧情设计\n...",
  "context_requirements": {
    "required_characters": [
      {"name": "萧炎", "role": "主视角"},
      {"name": "萧媚", "role": "配角"}
    ],
    "required_locations": ["萧家大厅", "后山"],
    "required_worldview": ["斗气等级", "斗技分类"],
    "foreshadowing_to_recall": []
  },
  "golden_finger_plan": {
    "name": "药老",
    "type": "inheritance",
    "planned_usage": "本章暂不使用",
    "unlock_conditions": []
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | **是** | 细纲内容 (最多 100,000 字符) |
| `context_requirements` | object | 否 | 上下文需求 |
| `golden_finger_plan` | object | 否 | 金手指规划 |

**响应**：返回更新后的细纲对象

---

### 4. 异步生成细纲

```
POST /api/v1/projects/{project_id}/chapters/{chapter_number}/outline/generate
```

**请求体**（可选）：

```json
{
  "prompt": "这章主角需要展现智谋，通过设计陷阱反杀敌人"
}
```

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | string | 否 | 用户补充需求/创作指导（最多 5000 字符） |

**说明**：
- 使用 AI 自动生成章节细纲
- 返回异步任务 ID
- 支持工作流：生成细纲 → 人工调整 → 写作
- 会加载项目在 `chapter_outline` 阶段启用的技能作为生成指导
- `prompt` 参数可传入额外的创作指导，会与技能指导一起影响生成结果

**响应** (`202 Accepted`)：

```json
{
  "success": true,
  "data": {
    "task_id": "770e8400-e29b-41d4-a716-446655440003",
    "status": "queued",
    "message": "章节 1 细纲生成任务已排队"
  }
}
```

**查询任务状态**：

```
GET /api/v1/tasks/{task_id}
```

任务完成后，细纲会自动保存到数据库，可通过获取细纲接口查看。

---

### 5. 删除细纲

```
DELETE /api/v1/projects/{project_id}/chapters/{chapter_number}/outline
```

**响应**：`204 No Content`

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "章节细纲 1 不存在"
  }
}
```

---

## 前端集成示例

### TypeScript 类型定义

```typescript
// types.ts
export interface CharacterRef {
  name: string;
  role: string | null;
}

export interface ContextRequirements {
  required_characters: CharacterRef[];
  required_locations: string[];
  required_worldview: string[];
  foreshadowing_to_recall: string[];
}

export interface GoldenFingerPlan {
  name: string;
  type: string | null;
  planned_usage: string | null;
  unlock_conditions: string[];
}

export interface ChapterOutline {
  id: string;
  chapter_number: number;
  chapter_id: string | null;
  content: string;
  context_requirements: ContextRequirements | null;
  golden_finger_plan: GoldenFingerPlan | null;
  created_at: string;
  updated_at: string;
}

export interface TaskResponse {
  task_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
}
```

### API 函数

```typescript
// api.ts
const API_BASE = '/api/v1';

export async function getChapterOutlines(
  projectId: string,
  options?: { chapterStart?: number; chapterEnd?: number }
): Promise<ChapterOutline[]> {
  const params = new URLSearchParams();
  if (options?.chapterStart) params.set('chapter_start', String(options.chapterStart));
  if (options?.chapterEnd) params.set('chapter_end', String(options.chapterEnd));

  const url = `${API_BASE}/projects/${projectId}/chapters/outlines?${params}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

export async function getChapterOutline(
  projectId: string,
  chapterNumber: number
): Promise<ChapterOutline> {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/outline`
  );
  const data = await res.json();
  return data.data;
}

export async function upsertChapterOutline(
  projectId: string,
  chapterNumber: number,
  outline: {
    content: string;
    context_requirements?: ContextRequirements;
    golden_finger_plan?: GoldenFingerPlan;
  }
): Promise<ChapterOutline> {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/outline`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outline),
    }
  );
  const data = await res.json();
  return data.data;
}

export async function generateChapterOutline(
  projectId: string,
  chapterNumber: number,
  options?: { prompt?: string }
): Promise<TaskResponse> {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/outline/generate`,
    {
      method: 'POST',
      headers: options?.prompt ? { 'Content-Type': 'application/json' } : {},
      body: options?.prompt ? JSON.stringify({ prompt: options.prompt }) : undefined,
    }
  );
  const data = await res.json();
  return data.data;
}

export async function deleteChapterOutline(
  projectId: string,
  chapterNumber: number
): Promise<void> {
  await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/outline`,
    { method: 'DELETE' }
  );
}
```

### React 组件示例

```tsx
// ChapterOutlineEditor.tsx
import { useState, useEffect } from 'react';
import { ChapterOutline, getChapterOutline, upsertChapterOutline, generateChapterOutline } from './api';

interface Props {
  projectId: string;
  chapterNumber: number;
  onSave?: (outline: ChapterOutline) => void;
}

export function ChapterOutlineEditor({ projectId, chapterNumber, onSave }: Props) {
  const [outline, setOutline] = useState<ChapterOutline | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadOutline();
  }, [projectId, chapterNumber]);

  const loadOutline = async () => {
    setLoading(true);
    try {
      const data = await getChapterOutline(projectId, chapterNumber);
      setOutline(data);
      setContent(data.content);
    } catch (e) {
      // 细纲不存在，显示空编辑器
      setOutline(null);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const saved = await upsertChapterOutline(projectId, chapterNumber, {
      content,
      context_requirements: outline?.context_requirements ?? undefined,
      golden_finger_plan: outline?.golden_finger_plan ?? undefined,
    });
    setOutline(saved);
    onSave?.(saved);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const task = await generateChapterOutline(projectId, chapterNumber);
      // 轮询任务状态或使用 WebSocket
      alert(`任务已创建: ${task.task_id}`);
      // 任务完成后重新加载
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="outline-editor">
      <div className="toolbar">
        <button onClick={handleGenerate} disabled={generating}>
          {generating ? 'AI 生成中...' : 'AI 生成细纲'}
        </button>
        <button onClick={handleSave}>保存</button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="## 剧情设计&#10;承接上章：...&#10;本章目标：..."
        rows={20}
      />

      {outline && (
        <div className="meta-info">
          <span>章节: {outline.chapter_number}</span>
          <span>关联章节: {outline.chapter_id ?? '未关联'}</span>
          <span>更新: {new Date(outline.updated_at).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 与写作流水线的关系

1. **独立生成**：可通过 `POST .../outline/generate` 独立生成细纲
2. **写作时复用**：写作流水线会先检查数据库中是否已有该章节的细纲，有则直接使用，无则自动生成
3. **写作时自动关联**：章节采用版本后，细纲的 `chapter_id` 会自动更新
4. **人工调整**：生成后可通过 `PUT` 接口手动编辑，调整后再触发写作

```
                        ┌─── 有细纲 ───→ 复用已有细纲 ───┐
                        │                               │
触发写作 → 检查数据库 ──┤                               ├→ 上下文筛选 → 写作 → 审核
                        │                               │
                        └─── 无细纲 ───→ 自动生成细纲 ───┘

推荐工作流：
生成细纲 → 人工调整 → 写作 → 审核 → 章节采用 → 细纲自动关联
     ↑                              ↓
     └────── 重新生成 ←── 不满意 ────┘
```

---

## 注意事项

1. **细纲与章节独立**：细纲可以先于章节存在
2. **chapter_id 自动关联**：写作完成并采用版本后自动关联
3. **content 格式自由**：虽然推荐上述格式，但 content 是自由文本
4. **context_requirements 用于写作**：写作时系统会根据此字段加载相关上下文
5. **异步任务**：生成细纲是异步任务，需要轮询或 WebSocket 获取结果
6. **技能指导**：生成细纲时会加载项目在 `chapter_outline` 阶段启用的技能，可通过技能管理接口配置
7. **写作复用**：写作流水线启动时会检查是否已有细纲，有则复用，避免重复生成
