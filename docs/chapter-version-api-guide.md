# 章节版本 API 前端对接指南

## 概述

章节版本机制允许保存每次生成的章节内容，包括审核未通过的版本。前端可以获取版本列表、查看不同版本详情、采用指定版本或删除历史版本。

## 数据模型

### GenerationType 枚举

| 值 | 中文 | 说明 |
|---|------|------|
| `writing` | 初次写作 | 首次生成的章节内容 |
| `rewriting` | 改写 | 审核后改写的版本 |

### ChapterVersionListRead（列表项，不含正文）

```typescript
interface ChapterVersionListRead {
  id: string;           // UUID
  project_id: string;
  chapter_number: number;
  version: number;      // 版本号，从 1 开始
  title: string | null;
  word_count: number;
  is_current: boolean;  // 是否为当前采用的版本
  generation_type: 'writing' | 'rewriting';
  created_at: string;   // ISO 8601
}
```

### ChapterVersionRead（详情，含正文）

```typescript
interface ChapterVersionRead extends ChapterVersionListRead {
  content: string;
  hidden_info: string[];
  ending_state: Record<string, any> | null;
  metadata_: Record<string, any>;
}
```

## API 端点

### 1. 获取版本列表

```
GET /api/v1/projects/{project_id}/chapters/{chapter_number}/versions
```

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "project_id": "...",
      "chapter_number": 1,
      "version": 3,
      "title": "第一章 开局",
      "word_count": 3500,
      "is_current": true,
      "generation_type": "rewriting",
      "created_at": "2026-01-06T10:30:00Z"
    },
    {
      "id": "...",
      "chapter_number": 1,
      "version": 2,
      "title": "第一章 开局",
      "word_count": 3200,
      "is_current": false,
      "generation_type": "rewriting",
      "created_at": "2026-01-06T10:20:00Z"
    },
    {
      "id": "...",
      "chapter_number": 1,
      "version": 1,
      "title": "第一章 开局",
      "word_count": 3000,
      "is_current": false,
      "generation_type": "writing",
      "created_at": "2026-01-06T10:00:00Z"
    }
  ]
}
```

**说明**：
- 版本按版本号降序排列（最新版本在前）
- `is_current=true` 表示当前采用的版本
- `generation_type` 区分初次写作和改写

---

### 2. 获取版本详情

```
GET /api/v1/projects/{project_id}/chapters/{chapter_number}/versions/{version}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "...",
    "chapter_number": 1,
    "version": 1,
    "title": "第一章 开局",
    "content": "正文内容...",
    "word_count": 3000,
    "is_current": false,
    "generation_type": "writing",
    "hidden_info": ["获得坐标 X-779"],
    "ending_state": {
      "time": "黄昏",
      "location": "萧家大厅"
    },
    "metadata_": {},
    "created_at": "2026-01-06T10:00:00Z"
  }
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "章节版本 1v99  不存在"
  }
}
```

---

### 3. 采用版本

```
POST /api/v1/projects/{project_id}/chapters/{chapter_number}/versions/{version}/adopt
```

**说明**：
- 将指定版本设为当前采用的版本
- 同时会更新 `chapters` 表中的内容
- 其他版本的 `is_current` 会被设为 `false`

**响应**：返回被采用版本的详情（同获取版本详情）

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "章节版本 1v99 不存在"
  }
}
```

---

### 4. 删除版本

```
DELETE /api/v1/projects/{project_id}/chapters/{chapter_number}/versions/{version}
```

**说明**：
- 不能删除当前采用的版本（`is_current=true`）
- 删除成功返回 `204 No Content`

**错误响应**：

版本不存在：
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "章节版本 1v99 不存在"
  }
}
```

尝试删除当前版本：
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "不能删除当前采用的版本"
  }
}
```

---

## 前端集成示例

### React + TypeScript

```typescript
// types.ts
export interface ChapterVersion {
  id: string;
  project_id: string;
  chapter_number: number;
  version: number;
  title: string | null;
  content?: string;
  word_count: number;
  is_current: boolean;
  generation_type: 'writing' | 'rewriting';
  hidden_info?: string[];
  ending_state?: Record<string, any>;
  created_at: string;
}

// api.ts
const API_BASE = '/api/v1';

export async function getChapterVersions(
  projectId: string,
  chapterNumber: number
): Promise<ChapterVersion[]> {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/versions`
  );
  const data = await res.json();
  return data.data;
}

export async function getChapterVersion(
  projectId: string,
  chapterNumber: number,
  version: number
): Promise<ChapterVersion> {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/versions/${version}`
  );
  const data = await res.json();
  return data.data;
}

export async function adoptChapterVersion(
  projectId: string,
  chapterNumber: number,
  version: number
): Promise<ChapterVersion> {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/versions/${version}/adopt`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.data;
}

export async function deleteChapterVersion(
  projectId: string,
  chapterNumber: number,
  version: number
): Promise<void> {
  await fetch(
    `${API_BASE}/projects/${projectId}/chapters/${chapterNumber}/versions/${version}`,
    { method: 'DELETE' }
  );
}
```

### 版本历史组件示例

```tsx
// ChapterVersionHistory.tsx
import { useState, useEffect } from 'react';
import { ChapterVersion, getChapterVersions, adoptChapterVersion } from './api';

interface Props {
  projectId: string;
  chapterNumber: number;
  onVersionChange?: (version: ChapterVersion) => void;
}

export function ChapterVersionHistory({ projectId, chapterNumber, onVersionChange }: Props) {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [projectId, chapterNumber]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await getChapterVersions(projectId, chapterNumber);
      setVersions(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdopt = async (version: number) => {
    const adopted = await adoptChapterVersion(projectId, chapterNumber, version);
    await loadVersions();
    onVersionChange?.(adopted);
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="version-history">
      <h3>版本历史</h3>
      <ul>
        {versions.map((v) => (
          <li key={v.id} className={v.is_current ? 'current' : ''}>
            <span className="version">v{v.version}</span>
            <span className="type">
              {v.generation_type === 'writing' ? '初次写作' : '改写'}
            </span>
            <span className="words">{v.word_count} 字</span>
            <span className="time">
              {new Date(v.created_at).toLocaleString()}
            </span>
            {v.is_current ? (
              <span className="badge">当前版本</span>
            ) : (
              <button onClick={() => handleAdopt(v.version)}>
                采用此版本
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 与写作流水线的关系

写作流水线 (`ChapterPipeline`) 会自动管理版本：

1. **初次写作**：保存 v1 (`generation_type=writing`)
2. **审核未通过 → 改写**：保存 v2 (`generation_type=rewriting`)
3. **再次改写**：保存 v3, v4...
4. **最终版本**：自动 adopt（无论是否通过审核）

```
写作 → v1 (writing) → 审核 → 改写 → v2 (rewriting) → 审核通过 → adopt v2
                                ↓
                              审核报告关联到 v2
```

### 审核报告查询

审核报告现在关联到具体版本，可以通过版本 ID 过滤：

```
GET /api/v1/projects/{project_id}/chapters/{chapter_number}/reviews?version_id={version_id}
```

---

## 注意事项

1. **版本号从 1 开始**，递增不跳跃
2. **is_current 只有一个为 true**，其他版本均为 false
3. **删除版本会级联删除**关联的审核报告
4. **chapters 表保存当前版本快照**，版本历史在 chapter_versions 表
