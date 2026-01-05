# 写作流水线 API 对接文档

> 面向前端开发的接口说明，涵盖大纲生成、章节写作、任务管理等功能。

## 目录

- [概述](#概述)
- [认证](#认证)
- [大纲生成接口](#大纲生成接口)
- [写作流水线接口](#写作流水线接口)
- [任务管理接口](#任务管理接口)
- [Chat Agent 集成](#chat-agent-集成)
- [典型使用流程](#典型使用流程)
- [错误处理](#错误处理)

---

## 概述

写作流水线是异步任务系统，提交后立即返回任务 ID，实际执行在后台进行。

**任务执行流程**：
```
用户提交 → 创建任务(QUEUED) → Worker 执行(RUNNING) → 完成/失败(COMPLETED/FAILED)
```

**任务状态枚举**：
| 状态 | 说明 |
|------|------|
| `queued` | 排队中，等待 Worker 处理 |
| `running` | 执行中 |
| `completed` | 成功完成 |
| `failed` | 执行失败 |
| `cancelled` | 用户取消 |

---

## 认证

所有接口需要 Bearer Token 认证：

```http
Authorization: Bearer <access_token>
```

---

## 大纲生成接口

大纲是小说创作的基础框架，分为三个层次：

| 大纲类型 | 说明 | 存储表 |
|---------|------|--------|
| **总纲** (NovelOutline) | 全书框架：核心主题、结局走向、主要剧情线 | `novel_outlines` |
| **卷纲** (VolumeOutline) | 分卷大纲：本卷目标、关键事件、卷末悬念 | `volume_outlines` |
| **章节细纲** (ChapterOutline) | 单章细纲：情节点、对话要点、场景描写 | `chapter_outlines` |

### 1. 生成总纲

**POST** `/api/v1/projects/{project_id}/pipelines/generate-novel-outline`

根据用户创意生成完整的小说总纲。

#### 请求参数

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | - | 创作需求/创意描述（10-5000字） |
| `genre` | string | ❌ | null | 小说类型（如玄幻/都市/科幻） |
| `target_words` | integer | ❌ | 1000000 | 目标字数（10万-1000万） |
| `target_volumes` | integer | ❌ | 3 | 计划卷数（1-10） |

#### 请求示例

```json
{
  "prompt": "一个穿越到修仙世界的程序员，发现修炼功法可以用代码来优化。他利用编程思维理解天道规则，最终打破世界壁垒。",
  "genre": "玄幻",
  "target_words": 2000000,
  "target_volumes": 5
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "message": "总纲生成任务已排队"
  }
}
```

#### 任务完成后的 result 字段

```json
{
  "outline_id": "660e8400-e29b-41d4-a716-446655440000",
  "title": "代码修仙录",
  "genre": "玄幻",
  "target_words": 2000000,
  "target_volumes": 5,
  "core_theme": "以编程思维理解天道，打破规则束缚",
  "key_plotlines": ["主线：代码悟道", "成长线：境界突破", "感情线：红颜知己"]
}
```

---

### 2. 生成卷纲

**POST** `/api/v1/projects/{project_id}/pipelines/generate-volume-outline`

根据总纲和用户需求生成分卷大纲。

#### 请求参数

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | - | 本卷的具体需求/方向 |
| `volume_number` | integer | ✅ | - | 卷号（1-100） |
| `chapter_start` | integer | ❌ | 自动计算 | 起始章节号 |
| `chapter_end` | integer | ❌ | 自动计算 | 结束章节号 |

#### 请求示例

```json
{
  "prompt": "主角觉醒金手指，发现自己可以看到功法的'源代码'。在宗门底层苦修，逐渐崭露头角，击败第一个反派。",
  "volume_number": 1,
  "chapter_start": 1,
  "chapter_end": 100
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "queued",
    "message": "第1卷大纲生成任务已排队"
  }
}
```

#### 任务完成后的 result 字段

```json
{
  "outline_id": "770e8400-e29b-41d4-a716-446655440000",
  "volume_number": 1,
  "title": "第一卷 代码觉醒",
  "chapter_start": 1,
  "chapter_end": 100,
  "volume_goal": "主角觉醒金手指，在宗门站稳脚跟",
  "key_events_count": 12
}
```

---

### 3. 生成章节细纲

**POST** `/api/v1/projects/{project_id}/pipelines/generate-outline`

独立生成单章细纲，不执行写作。

#### 请求参数

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | - | 生成提示（如"为第7章生成细纲"） |
| `volume_number` | integer | ❌ | null | 卷号（可选） |

#### 请求示例

```json
{
  "prompt": "为第7章生成细纲，本章主角第一次进入宗门藏经阁"
}
```

---

## 写作流水线接口

### 1. 触发章节写作

**POST** `/api/v1/projects/{project_id}/pipelines/write-chapter`

提交章节写作任务，执行完整流程：细纲生成 → 上下文筛选 → 写作 → 审核 → 改写 → 设定更新。

#### 请求参数

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | - | 写作提示，如"完成第7章"、"续写上一章" |
| `skip_review` | boolean | ❌ | `false` | 是否跳过审核流程 |
| `chapter_number` | integer | ❌ | null | 指定章节号（通常从 prompt 自动解析） |
| `max_retries` | integer | ❌ | `3` | 审核不通过时最大改写次数 (0-5) |
| `score_threshold` | integer | ❌ | `70` | 一致性评分通过阈值 (0-100) |

#### 请求示例

```json
{
  "prompt": "完成第7章",
  "skip_review": false,
  "max_retries": 3,
  "score_threshold": 70
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "message": "写作任务已排队"
  }
}
```

---

### 2. 触发细纲生成

**POST** `/api/v1/projects/{project_id}/pipelines/generate-outline`

独立生成章节细纲，不执行写作。

#### 请求参数

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | - | 生成提示，如"为第7章生成细纲" |
| `volume_number` | integer | ❌ | null | 卷号（可选） |

#### 请求示例

```json
{
  "prompt": "为第7章生成细纲"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "queued",
    "message": "细纲生成任务已排队"
  }
}
```

---

### 3. 触发点子探索（待实现）

**POST** `/api/v1/projects/{project_id}/pipelines/explore-idea`

> ⚠️ 当前为占位实现，任务不会实际执行。

---

## 任务管理接口

### 1. 获取任务列表

**GET** `/api/v1/tasks`

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `project_id` | UUID | 按项目过滤 |
| `status` | string | 状态过滤：`queued`/`running`/`completed`/`failed`/`cancelled` |
| `skip` | integer | 分页偏移，默认 0 |
| `limit` | integer | 每页数量，默认 50，最大 200 |

#### 响应示例

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "project_id": "660e8400-e29b-41d4-a716-446655440000",
      "job_type": "write_chapter",
      "status": "running",
      "progress": 0.3,
      "message": "正在生成章节细纲...",
      "meta": {
        "prompt": "完成第7章",
        "skip_review": false
      },
      "result": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:31:00Z"
    }
  ],
  "total": 15,
  "skip": 0,
  "limit": 50
}
```

---

### 2. 获取任务详情

**GET** `/api/v1/tasks/{task_id}`

#### 响应示例（执行中）

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "660e8400-e29b-41d4-a716-446655440000",
  "job_type": "write_chapter",
  "status": "running",
  "progress": 0.5,
  "message": "正在写作...",
  "meta": {
    "prompt": "完成第7章",
    "skip_review": false,
    "chapter_number": 7
  },
  "result": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:32:00Z"
}
```

#### 响应示例（完成）

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "660e8400-e29b-41d4-a716-446655440000",
  "job_type": "write_chapter",
  "status": "completed",
  "progress": 1.0,
  "message": "写作完成: 第七章 风云再起 (3500 字)",
  "meta": {
    "prompt": "完成第7章",
    "skip_review": false
  },
  "result": {
    "success": true,
    "chapter_title": "第七章 风云再起",
    "chapter_number": 7,
    "word_count": 3500,
    "passed": true,
    "final_score": 85,
    "retry_count": 1,
    "duration_seconds": 120.5,
    "message": "审核通过 (总分: 85)"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

---

### 3. 任务事件流（SSE）

**GET** `/api/v1/tasks/{task_id}/events`

返回 Server-Sent Events 流，用于实时获取任务进度。

#### 事件格式

```
event: status_update
data: {"event":"status_update","task_id":"...","job_type":"write_chapter","status":"running","progress":0.3,"message":"正在生成章节细纲...","meta":{},"timestamp":"2024-01-15T10:31:00Z"}

event: status_update
data: {"event":"status_update","task_id":"...","job_type":"write_chapter","status":"running","progress":0.6,"message":"正在写作...","meta":{},"timestamp":"2024-01-15T10:32:00Z"}

event: completed
data: {"event":"completed","task_id":"...","job_type":"write_chapter","status":"completed","progress":1.0,"message":"写作完成","meta":{},"timestamp":"2024-01-15T10:35:00Z"}

event: heartbeat
data: {"event":"heartbeat","task_id":"...","status":"completed","progress":1.0,"message":"stream end","meta":{},"timestamp":"2024-01-15T10:35:00Z"}
```

#### 前端使用示例

```typescript
const eventSource = new EventSource(`/api/v1/tasks/${taskId}/events`, {
  headers: { Authorization: `Bearer ${token}` }
});

eventSource.addEventListener('status_update', (e) => {
  const data = JSON.parse(e.data);
  console.log(`进度: ${data.progress * 100}% - ${data.message}`);
});

eventSource.addEventListener('completed', (e) => {
  const data = JSON.parse(e.data);
  console.log('任务完成:', data);
  eventSource.close();
});

eventSource.addEventListener('failed', (e) => {
  const data = JSON.parse(e.data);
  console.error('任务失败:', data.message);
  eventSource.close();
});

eventSource.addEventListener('heartbeat', () => {
  eventSource.close();
});
```

---

### 4. 取消任务

**POST** `/api/v1/tasks/{task_id}/cancel`

取消排队中或执行中的任务。

#### 响应示例

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "cancelled",
  "message": "任务取消请求已提交",
  "previous_progress": 0.3
}
```

#### 注意事项

- 只有 `queued` 和 `running` 状态的任务可取消
- 取消是异步的，实际取消在下一个检查点发生
- 已执行的 LLM 调用费用不会退还

---

## Chat Agent 集成

Chat Agent 可以通过对话提交写作任务，无需调用 API。

### 工具调用

当用户说"帮我写第5章"时，Chat Agent 会自动调用 `submit_chapter_task` 工具：

```json
{
  "tool": "submit_chapter_task",
  "args": {
    "task_description": "写第5章",
    "chapter_number": 5,
    "skip_review": false
  }
}
```

### Chat API 端点

**POST** `/api/v1/projects/{project_id}/chat/sessions/{session_id}/message`

发送消息到 Chat Agent（SSE 流式响应）。

#### 请求体（AG-UI 格式）

```json
{
  "messages": [
    {"role": "user", "content": "帮我写第5章"}
  ],
  "state": {
    "selected_text": null,
    "skill_id": null,
    "context_entity_ids": []
  }
}
```

#### 响应

SSE 流，遵循 AG-UI 协议：
- `TEXT_MESSAGE_START/CONTENT/END`: 文本消息
- `TOOL_CALL_START/ARGS/END`: 工具调用
- `RUN_STARTED/FINISHED`: 运行生命周期

---

## 典型使用流程

### 流程 0：创建新书（完整流程）

```
1. POST /projects (创建项目)
   → 获取 project_id

2. POST /pipelines/generate-novel-outline
   → 生成总纲（核心主题、剧情线规划）
   → 等待完成，保存到 novel_outlines

3. POST /pipelines/generate-volume-outline (volume_number=1)
   → 生成第1卷大纲
   → 等待完成，保存到 volume_outlines

4. POST /pipelines/write-chapter
   → 开始写第1章
```

### 流程 1：直接调用 API 写章节

```
1. POST /pipelines/write-chapter
   → 获取 task_id

2. GET /tasks/{task_id}/events (SSE)
   → 监听进度更新
   → 显示进度条

3. 收到 completed 事件
   → 刷新章节列表
   → 显示写作结果
```

### 流程 2：通过 Chat Agent 写章节

```
1. POST /chat/sessions/{session_id}/message
   body: {"messages": [{"role": "user", "content": "帮我写第5章"}]}

2. 监听 SSE 响应
   → Agent 回复"任务已提交，任务 ID: xxx"

3. GET /tasks/{task_id}/events (SSE)
   → 监听写作进度

4. 任务完成后刷新
```

### 流程 3：批量任务管理

```
1. GET /tasks?project_id=xxx&status=running
   → 获取进行中的任务列表

2. 对每个任务订阅 SSE 或轮询状态

3. 可选：POST /tasks/{task_id}/cancel 取消任务
```

### 流程 4：大纲生成流程

```
1. POST /pipelines/generate-novel-outline
   → 提交总纲生成任务

2. GET /tasks/{task_id} 或 /tasks/{task_id}/events
   → 等待总纲生成完成

3. POST /pipelines/generate-volume-outline
   → 为每卷生成卷纲

4. 完成后可查看：
   → GET /projects/{id}/novel-outline (待实现)
   → GET /projects/{id}/volume-outlines (待实现)
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 202 | 已接受（异步任务已提交） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 状态冲突（如取消已完成的任务） |
| 500 | 服务器错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "任务不存在",
    "details": {
      "resource": "task",
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### 任务失败处理

任务失败时，`result` 字段包含错误信息：

```json
{
  "status": "failed",
  "message": "写作失败: LLM 调用超时",
  "result": {
    "error": "LLM 调用超时"
  }
}
```

---

## 任务类型速查

| job_type | 说明 | 触发接口 | 存储表 |
|----------|------|----------|--------|
| `generate_novel_outline` | 总纲生成 | `/pipelines/generate-novel-outline` | `novel_outlines` |
| `generate_volume_outline` | 卷纲生成 | `/pipelines/generate-volume-outline` | `volume_outlines` |
| `generate_outline` | 章节细纲生成 | `/pipelines/generate-outline` | `chapter_outlines` |
| `write_chapter` | 章节写作 | `/pipelines/write-chapter` | `chapters` |
| `explore_idea` | 点子探索（待实现） | `/pipelines/explore-idea` | - |
| `analysis` | 章节分析 | `/projects/{id}/analyze` | - |
| `fusion_pipeline` | 融合流水线 | `/fusion/tasks/{id}/run` | - |
| `extract_patterns` | 模式提取 | `/projects/{id}/extract-patterns` | - |

---

## 进度值参考

写作任务进度节点：

| 进度 | 阶段 |
|------|------|
| 0.0 | 任务开始 |
| 0.1 | 开始生成细纲 |
| 0.3 | 细纲完成，开始上下文筛选 |
| 0.5 | 开始写作 |
| 0.7 | 写作完成，开始审核 |
| 0.8 | 审核完成 / 开始改写 |
| 0.9 | 开始设定更新 |
| 1.0 | 全部完成 |

---

## 联系方式

如有问题，请联系后端开发或提交 Issue。
