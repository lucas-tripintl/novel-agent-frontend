# Chat API 前端对接指南

## 概述

Chat API 提供写作面板的 AI 助手功能，支持：

- 文本处理：润色、扩写、改写、续写
- 设定咨询：查询角色、世界观信息
- 技能加持：使用预置写作技能处理文本
- 流式输出：通过 AG-UI 协议实时推送响应

## 认证

所有 API 需要在请求头携带 JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

## 基础 URL

```
/api/v1/projects/{project_id}/chat
```

所有聊天相关操作都绑定到具体项目。

---

## 数据模型

### ChatSession（会话）

```typescript
interface ChatSession {
  id: string;              // UUID
  project_id: string;      // 绑定的项目 ID
  title: string | null;    // 会话标题（自动生成）
  status: 'active' | 'archived' | 'deleted';
  model_id: string;        // 模型 ID（见下方说明）
  temperature: number;     // 温度参数 0-2
  message_count: number;   // 消息数量
  created_at: string;      // ISO 8601
  updated_at: string;
}
```

**model_id 格式：**

| 类型 | 格式 | 示例 | 计费 |
|------|------|------|------|
| 系统模型 | 模型名称 | `"gemini-2.5-flash"` | ✅ 扣除用户余额 |
| 用户模型 | `user:{uuid}` | `"user:550e8400-e29b-41d4-a716-446655440000"` | ❌ 不扣费（使用用户自己的 API Key） |

### ChatMessage（消息）

```typescript
interface ChatMessage {
  id: string;              // UUID
  sequence: number;        // 消息序号（用于排序）
  role: 'user' | 'assistant' | 'system' | 'tool_call' | 'tool_result';
  content: string;
  tool_name: string | null;   // 工具调用时的工具名
  tool_args: object | null;   // 工具参数
  status: 'streaming' | 'completed' | 'failed' | 'cancelled';
  metadata_: object;          // 元数据（token_count, latency_ms 等）
  created_at: string;
}
```

---

## API 端点

### 1. 创建会话

```http
POST /api/v1/projects/{project_id}/chat/sessions
Content-Type: application/json

{
  "model_id": "gemini-2.5-flash",  // 可选，默认 gemini-2.5-flash
  "temperature": 0.7,               // 可选，默认 0.7
  "title": "润色对话"               // 可选，不传则自动生成
}
```

**响应：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "...",
  "title": null,
  "status": "active",
  "model_id": "gemini-2.5-flash",
  "temperature": 0.7,
  "message_count": 0,
  "created_at": "2026-01-05T12:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

### 2. 获取会话列表

```http
GET /api/v1/projects/{project_id}/chat/sessions?status=active&skip=0&limit=20
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 状态过滤：active/archived/deleted |
| skip | number | 分页偏移，默认 0 |
| limit | number | 每页数量，默认 20，最大 100 |

**响应：**

```json
{
  "items": [
    {
      "id": "...",
      "title": "润色对话",
      "status": "active",
      "model_id": "gemini-2.5-flash",
      "temperature": 0.7,
      "message_count": 5,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 10,
  "skip": 0,
  "limit": 20
}
```

### 3. 获取会话详情

```http
GET /api/v1/projects/{project_id}/chat/sessions/{session_id}
```

**响应：**

```json
{
  "id": "...",
  "project_id": "...",
  "title": "润色对话",
  "status": "active",
  "model_id": "gemini-2.5-flash",
  "temperature": 0.7,
  "message_count": 5,
  "created_at": "...",
  "updated_at": "...",
  "recent_messages": [
    {
      "id": "...",
      "sequence": 1,
      "role": "user",
      "content": "帮我润色这段话",
      "status": "completed",
      "created_at": "..."
    },
    {
      "id": "...",
      "sequence": 2,
      "role": "assistant",
      "content": "好的，这是润色后的版本...",
      "status": "completed",
      "created_at": "..."
    }
  ]
}
```

### 4. 更新会话配置

```http
PATCH /api/v1/projects/{project_id}/chat/sessions/{session_id}
Content-Type: application/json

{
  "model_id": "gpt-4o",      // 可选，切换模型
  "temperature": 0.5,         // 可选，调整温度
  "title": "新标题",          // 可选，修改标题
  "status": "archived"        // 可选，归档会话
}
```

### 5. 删除会话

```http
DELETE /api/v1/projects/{project_id}/chat/sessions/{session_id}
```

**响应：**

```json
{
  "message": "会话已删除"
}
```

### 6. 获取消息历史

```http
GET /api/v1/projects/{project_id}/chat/sessions/{session_id}/messages?skip=0&limit=50
```

**响应：**

```json
{
  "items": [
    {
      "id": "...",
      "sequence": 1,
      "role": "user",
      "content": "帮我润色",
      "tool_name": null,
      "tool_args": null,
      "status": "completed",
      "metadata_": {},
      "created_at": "..."
    }
  ],
  "total": 10,
  "skip": 0,
  "limit": 50
}
```

### 7. 发送消息（核心 - SSE 流式）

```http
POST /api/v1/projects/{project_id}/chat/sessions/{session_id}/message
Content-Type: application/json
Accept: text/event-stream

{
  "messages": [
    {"role": "user", "content": "帮我润色这段话"}
  ],
  "state": {
    "selected_text": "萧炎站在云岚宗门前，心中充满了复杂的情绪。",
    "skill_id": "550e8400-e29b-41d4-a716-446655440001",
    "context_entity_ids": ["entity-uuid-1", "entity-uuid-2"]
  }
}
```

**请求参数说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | array | 是 | 消息数组，最后一条必须是 user 角色 |
| state.selected_text | string | 否 | 编辑器中选中的文本 |
| state.skill_id | string | 否 | 要使用的技能 ID |
| state.context_entity_ids | array | 否 | 引用的实体（角色/设定）ID 列表 |

**响应：** SSE 事件流（见下方 AG-UI 协议）

### 8. 取消生成

```http
POST /api/v1/projects/{project_id}/chat/sessions/{session_id}/cancel
```

**响应：**

```json
{
  "message": "取消请求已发送"
}
```

### 9. 获取生成状态

```http
GET /api/v1/projects/{project_id}/chat/sessions/{session_id}/status
```

**响应：**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "is_generating": true
}
```

用于检查当前会话是否有正在进行的生成任务。

---

## AG-UI 协议（SSE 事件）

发送消息后，服务器通过 Server-Sent Events 推送响应。

### 事件类型

| 事件 | 说明 |
|------|------|
| `RUN_STARTED` | 运行开始 |
| `TEXT_MESSAGE_START` | 文本消息开始 |
| `TEXT_MESSAGE_CONTENT` | 文本内容增量 |
| `TEXT_MESSAGE_END` | 文本消息结束 |
| `TOOL_CALL_START` | 工具调用开始 |
| `TOOL_CALL_ARGS` | 工具参数 |
| `TOOL_CALL_END` | 工具调用结束 |
| `RUN_FINISHED` | 运行结束 |
| `RUN_ERROR` | 运行出错 |

### 事件格式示例

```
event: RUN_STARTED
data: {"type": "RUN_STARTED", "thread_id": "...", "run_id": "..."}

event: TEXT_MESSAGE_START
data: {"type": "TEXT_MESSAGE_START", "message_id": "..."}

event: TEXT_MESSAGE_CONTENT
data: {"type": "TEXT_MESSAGE_CONTENT", "message_id": "...", "delta": "萧炎"}

event: TEXT_MESSAGE_CONTENT
data: {"type": "TEXT_MESSAGE_CONTENT", "message_id": "...", "delta": "伫立于"}

event: TEXT_MESSAGE_CONTENT
data: {"type": "TEXT_MESSAGE_CONTENT", "message_id": "...", "delta": "云岚宗"}

event: TEXT_MESSAGE_END
data: {"type": "TEXT_MESSAGE_END", "message_id": "..."}

event: RUN_FINISHED
data: {"type": "RUN_FINISHED", "thread_id": "...", "run_id": "..."}
```

---

## 前端集成示例

### 方案 1：原生 EventSource

```typescript
async function sendMessage(
  projectId: string,
  sessionId: string,
  content: string,
  options?: {
    selectedText?: string;
    skillId?: string;
    entityIds?: string[];
  }
) {
  const response = await fetch(
    `/api/v1/projects/${projectId}/chat/sessions/${sessionId}/message`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        state: {
          selected_text: options?.selectedText,
          skill_id: options?.skillId,
          context_entity_ids: options?.entityIds,
        },
      }),
    }
  );

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        switch (data.type) {
          case 'TEXT_MESSAGE_CONTENT':
            fullText += data.delta;
            onTextUpdate(fullText); // 更新 UI
            break;
          case 'TEXT_MESSAGE_END':
            onMessageComplete(fullText);
            break;
          case 'RUN_ERROR':
            onError(data.error);
            break;
        }
      }
    }
  }
}
```

### 方案 2：使用 @ag-ui/client

```bash
npm install @ag-ui/client
```

```typescript
import { HttpAgent } from '@ag-ui/client';

const agent = new HttpAgent({
  url: `/api/v1/projects/${projectId}/chat/sessions/${sessionId}/message`,
  headers: {
    'Authorization': `Bearer ${getToken()}`,
  },
});

// 发送消息
const stream = agent.runAgent({
  messages: [{ role: 'user', content: '帮我润色这段话' }],
  state: {
    selected_text: '萧炎站在云岚宗门前...',
    skill_id: 'skill-uuid',
  },
});

// 监听事件
for await (const event of stream) {
  switch (event.type) {
    case 'TEXT_MESSAGE_CONTENT':
      appendText(event.delta);
      break;
    case 'RUN_FINISHED':
      console.log('完成');
      break;
    case 'RUN_ERROR':
      console.error('错误:', event.error);
      break;
  }
}
```

### 方案 3：使用 CopilotKit（React）

```bash
npm install @copilotkit/react-core @copilotkit/react-ui
```

```tsx
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';

function WritingAssistant({ projectId, sessionId }: Props) {
  return (
    <CopilotKit
      runtimeUrl={`/api/v1/projects/${projectId}/chat/sessions/${sessionId}/message`}
      headers={{
        'Authorization': `Bearer ${getToken()}`,
      }}
    >
      <CopilotChat
        labels={{
          title: '写作助手',
          initial: '你好！我可以帮你润色、扩写、改写文本。',
        }}
      />
    </CopilotKit>
  );
}
```

---

## 典型使用场景

### 场景 1：选中文本润色

```typescript
// 用户在编辑器中选中一段文字
const selectedText = editor.getSelection();

// 发送润色请求
await sendMessage(projectId, sessionId, '帮我润色一下', {
  selectedText,
});

// AI 返回润色后的文本，用户可一键替换
```

### 场景 2：使用技能处理

```typescript
// 用户选择"番茄风格"技能
const skillId = '550e8400-e29b-41d4-a716-446655440001';

await sendMessage(projectId, sessionId, '用番茄风格改写', {
  selectedText: '萧炎看着云韵...',
  skillId,
});
```

### 场景 3：引用角色设定

```typescript
// 用户选择引用"萧炎"和"云韵"的设定
const entityIds = ['char-xiaoyan-uuid', 'char-yunyun-uuid'];

await sendMessage(projectId, sessionId, '写一段萧炎和云韵的对话', {
  entityIds,
});
```

### 场景 4：切换模型

```typescript
// 切换到系统模型 GPT-4o
await fetch(`/api/v1/projects/${projectId}/chat/sessions/${sessionId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    model_id: 'gpt-4o',
    temperature: 0.5,
  }),
});

// 切换到用户自定义模型（使用用户自己的 API Key，不扣费）
await fetch(`/api/v1/projects/${projectId}/chat/sessions/${sessionId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    model_id: 'user:550e8400-e29b-41d4-a716-446655440000',
  }),
});

// 后续消息将使用新模型
```

### 场景 5：提交长任务（章节写作）

```typescript
// 用户请求写章节
await sendMessage(projectId, sessionId, '帮我写第5章，主角需要突破到斗师');

// AI 会调用 submit_chapter_task 工具，返回类似：
// "任务已提交！
// - 任务 ID: `xxx-xxx-xxx`
// - 任务描述: 帮我写第5章...
// - 状态: 排队中
// 请前往任务面板查看进度。"

// 前端监听到工具调用后，可以：
// 1. 显示"正在提交章节写作任务..."
// 2. 任务提交成功后，提供跳转到任务面板的按钮
```

### 场景 6：查询设定

```typescript
// 用户询问角色信息
await sendMessage(projectId, sessionId, '萧炎现在什么境界？');

// AI 会自动调用 search_entities 或 query_context 工具
// 从项目设定中查找信息后回答

// 前端可以监听 TOOL_CALL_* 事件显示加载状态
```

---

## 可用模型列表

### 系统模型

通过 `/api/v1/models` 获取系统预置模型：

```http
GET /api/v1/models
```

常用模型：

| model_id | 名称 | 特点 |
|----------|------|------|
| gemini-2.5-flash | Gemini 2.5 Flash | 快速、性价比高（默认） |
| gemini-2.5-flash-lite | Gemini 2.5 Flash Lite | 更快、更便宜 |
| gpt-4o | GPT-4o | OpenAI 旗舰模型 |
| claude-sonnet-4 | Claude Sonnet 4 | Anthropic 模型 |

### 用户自定义模型

用户可以添加自己的 API Key 使用自定义模型。通过 `/api/v1/user/models` 获取：

```http
GET /api/v1/user/models
```

**响应：**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "我的 GPT-4",
      "model_id": "gpt-4-turbo",
      "provider_type": "openai",
      "is_enabled": true,
      "is_default": false,
      "total_calls": 120,
      "total_input_tokens": 50000,
      "total_output_tokens": 30000
    }
  ]
}
```

在会话中使用用户模型时，`model_id` 格式为 `"user:{id}"`：

```json
{
  "model_id": "user:550e8400-e29b-41d4-a716-446655440000"
}
```

**注意：** 用户模型使用用户自己的 API Key，**不扣除平台余额**，但会记录使用统计。

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "会话不存在",
    "details": null
  }
}
```

### 常见错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| VALIDATION_ERROR | 422 | 请求参数验证失败 |
| NOT_FOUND | 404 | 资源不存在 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### SSE 错误事件

```
event: RUN_ERROR
data: {"type": "RUN_ERROR", "error": {"code": "MODEL_ERROR", "message": "模型调用失败"}}
```

---

## 注意事项

1. **会话归属**：会话与项目绑定，只能在对应项目下访问
2. **消息持久化**：用户消息和 AI 回复都会保存到数据库
3. **标题自动生成**：首次发送消息后，会自动用消息内容生成标题
4. **历史上下文**：默认加载最近 20 条消息作为上下文
5. **取消机制**：取消请求发送后，当前生成会被中断
6. **模型切换**：切换模型后，后续消息使用新模型，历史不受影响
7. **计费规则**：
   - 系统模型：按 token 数扣除用户余额
   - 用户模型（`user:*`）：不扣费，使用用户自己的 API Key，但会记录使用统计

---

## AI 可用工具

Chat Agent 内置以下工具，AI 会根据用户请求自动调用。前端可以通过 SSE 工具调用事件展示调用过程。

### 查询工具

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `search_entities` | 搜索角色、地点、世界观等设定 | `query`: 关键词, `entity_type`: 类型过滤, `limit`: 数量限制 |
| `query_context` | 查询项目上下文 | `context_type`: outline/chapters/characters/worldview |

### 长任务工具

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `submit_chapter_task` | 提交章节写作任务 | `task_description`: 描述, `chapter_number`: 章节号 |
| `submit_outline_task` | 提交细纲生成任务 | `task_description`: 描述, `volume_number`: 卷号 |

长任务工具会返回任务 ID，前端应引导用户前往任务面板查看进度。

### 工具调用事件示例

```
event: TOOL_CALL_START
data: {"type": "TOOL_CALL_START", "tool_call_id": "...", "tool_name": "search_entities"}

event: TOOL_CALL_ARGS
data: {"type": "TOOL_CALL_ARGS", "tool_call_id": "...", "delta": "{\"query\": \"萧炎\"}"}

event: TOOL_CALL_END
data: {"type": "TOOL_CALL_END", "tool_call_id": "...", "tool_name": "search_entities"}
```

前端可以选择展示工具调用状态，例如"正在搜索角色设定..."。

---

## 附录：技能和实体 API

### 获取可用技能

```http
GET /api/v1/skills?category=anti_ai&stage=writing
```

### 获取项目实体（角色/设定）

```http
GET /api/v1/projects/{project_id}/entities?entity_type=character
```

使用返回的 `id` 作为 `context_entity_ids` 参数。
