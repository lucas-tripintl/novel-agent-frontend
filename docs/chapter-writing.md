# 章节正文生成 API 对接指南

## 概述

章节正文生成采用 **SSE（Server-Sent Events）** 流式返回，支持交互式剧情决策。

核心流程：
1. 前端发起生成请求 → 后端分析细纲，返回剧情分支决策点
2. 用户选择决策 → 后端继续生成
3. 循环直到所有决策完成 → 一次性返回完整正文

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/generate/chapter-writing/{project_id}/start` | POST | 开始生成（返回 SSE） |
| `/api/v1/generate/chapter-writing/{project_id}/decide` | POST | 提交决策（返回 SSE） |
| `/api/v1/generate/chapter-writing/{project_id}/confirm` | POST | 确认完成 |
| `/api/v1/generate/chapter-writing/{project_id}/draft?draft_id=xxx` | DELETE | 放弃草稿 |

---

## 1. 开始生成

### 请求

```http
POST /api/v1/generate/chapter-writing/{project_id}/start
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "mode": "interactive",
  "density": "detailed",
  "chapter_number": 1,
  "chapter_title": "觉醒",
  "selected_entities": [],
  "selected_skills": []
}
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mode | string | 否 | 生成模式：`interactive`(默认)/`semi_auto`/`auto_review`(全自动) |
| density | string | 否 | 决策密度：`simple`(只 critical)/`detailed`(critical+normal,默认) |
| chapter_number | int | 是 | 章节号 |
| chapter_title | string | 否 | 章节标题 |
| selected_entities | string[] | 否 | 选中的实体 ID |
| selected_skills | string[] | 否 | 选中的技能 ID |

**模式与密度组合说明**：
- `mode=interactive` + `density=simple`: 交互式，只暴露 critical 级别决策点
- `mode=interactive` + `density=detailed`: 交互式，暴露 critical + normal 级别决策点
- `mode=semi_auto`: 半自动，只有 critical 决策点暂停，其他自动选推荐值
- `mode=auto_review`: 全自动，所有决策使用推荐值，最后统一审核

### 响应（SSE 流）

响应为 `text/event-stream`，包含多个事件：

#### 事件 1: RUN_STARTED

```
event: RUN_STARTED
data: {"type":"RUN_STARTED","threadId":"550e8400-e29b-41d4-a716-446655440000","runId":"run_abc123"}
```

**重要**: `threadId` 是草稿 ID，后续 `/decide` 需要用到。

#### 事件 2: RUN_FINISHED (需要决策)

```
event: RUN_FINISHED
data: {
  "type": "RUN_FINISHED",
  "threadId": "550e8400-e29b-41d4-a716-446655440000",
  "runId": "run_abc123",
  "result": {
    "outcome": "interrupt",
    "interrupt": {
      "type": "decision_required",
      "decision_point": {
        "id": "pb_character_choice_1",
        "type": "character_choice",
        "question": "萧炎是否接受药老的提议？",
        "context": "药老提出传授异火控制之法，但需要萧炎放弃目前的修炼方向...",
        "options": [
          {
            "id": "opt_1",
            "label": "接受",
            "description": "放弃当前修炼路线，跟随药老学习异火之道。获得强大火焰能力，但短期内实力会下降。",
            "recommended": true,
            "reason": "符合主角成长曲线，为后续剧情铺垫"
          },
          {
            "id": "opt_2",
            "label": "拒绝",
            "description": "坚持当前修炼路线，婉拒药老。保持现有实力，但错过异火传承机会。",
            "recommended": false,
            "reason": ""
          },
          {
            "id": "opt_3",
            "label": "暂时搁置",
            "description": "既不接受也不拒绝，请求时间考虑。关系保持中立，故事节奏放缓。",
            "recommended": false,
            "reason": ""
          }
        ],
        "importance": "critical",
        "allow_custom": true
      }
    }
  }
}
```

#### 事件 3: RUN_FINISHED (生成完成)

```
event: RUN_FINISHED
data: {
  "type": "RUN_FINISHED",
  "threadId": "550e8400-e29b-41d4-a716-446655440000",
  "runId": "run_abc123",
  "result": {
    "outcome": "success",
    "content": "萧炎站在山巅，俯瞰着云海翻涌的景象...(完整正文内容)"
  }
}
```

---

## 2. 提交决策

用户选择决策选项后，调用此接口继续生成。

### 请求

```http
POST /api/v1/generate/chapter-writing/{project_id}/decide
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "draft_id": "550e8400-e29b-41d4-a716-446655440000",
  "decision": {
    "decision_point_id": "pb_character_choice_1",
    "chosen_option_id": "opt_1",
    "custom_input": null,
    "skipped": false
  }
}
```

### 决策参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| decision_point_id | string | 决策点 ID |
| chosen_option_id | string | 选择的选项 ID（与 custom_input 二选一） |
| custom_input | string | 自定义输入（当 allow_custom=true 时可用） |
| skipped | bool | 是否跳过，使用推荐值 |

### 自定义输入示例

```json
{
  "draft_id": "550e8400-e29b-41d4-a716-446655440000",
  "decision": {
    "decision_point_id": "pb_character_choice_1",
    "chosen_option_id": null,
    "custom_input": "萧炎假装接受，实际上暗中保留原有修炼，两边同时进行",
    "skipped": false
  }
}
```

### 响应

返回新的 SSE 流，可能包含：
- 更多决策点（继续循环）
- 生成完成（outcome=success）

---

## 3. 确认完成

生成完成后，确认保存到数据库。

### 请求

```http
POST /api/v1/generate/chapter-writing/{project_id}/confirm
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "draft_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 响应

```json
{
  "success": true,
  "data": {
    "success": true,
    "result": {
      "content": "...",
      "word_count": 3500
    }
  }
}
```

---

## 4. 放弃草稿

取消生成，不保存。

### 请求

```http
DELETE /api/v1/generate/chapter-writing/{project_id}/draft?draft_id=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

### 响应

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

## 前端实现示例

### TypeScript 类型定义

```typescript
// 决策选项
interface DecisionOption {
  id: string;
  label: string;
  description: string;
  recommended: boolean;
  reason: string;
}

// 决策点
interface DecisionPoint {
  id: string;
  type: 'character_choice' | 'plot_direction' | 'relationship_change' | 'foreshadow_reveal' | 'conflict_resolution';
  question: string;
  context: string;
  options: DecisionOption[];
  importance: 'critical' | 'normal' | 'minor';
  allow_custom: boolean;
}

// SSE 事件
interface SSEEvent {
  type: 'RUN_STARTED' | 'STATE_DELTA' | 'STATE_SNAPSHOT' | 'RUN_FINISHED';
  threadId: string;
  runId: string;
  result?: {
    outcome: 'success' | 'interrupt' | 'error';
    content?: string;
    interrupt?: {
      type: 'decision_required';
      decision_point: DecisionPoint;
    };
  };
}

// 用户决策
interface UserDecision {
  decision_point_id: string;
  chosen_option_id?: string;
  custom_input?: string;
  skipped?: boolean;
}
```

### React Hook 示例

```typescript
import { useState, useCallback } from 'react';

interface UseChapterWritingOptions {
  projectId: string;
  token: string;
  onDecisionRequired?: (decision: DecisionPoint) => void;
  onComplete?: (content: string) => void;
  onError?: (error: string) => void;
}

export function useChapterWriting(options: UseChapterWritingOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [currentDecision, setCurrentDecision] = useState<DecisionPoint | null>(null);
  const [content, setContent] = useState<string>('');

  const parseSSE = (text: string): SSEEvent[] => {
    const events: SSEEvent[] = [];
    const lines = text.split('\n');
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        currentData = line.slice(6);
      } else if (line === '' && currentData) {
        try {
          events.push(JSON.parse(currentData));
        } catch (e) {
          console.error('Failed to parse SSE data:', e);
        }
        currentData = '';
      }
    }
    return events;
  };

  const processStream = async (response: Response) => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const events = parseSSE(text);

      for (const event of events) {
        if (event.type === 'RUN_STARTED') {
          setDraftId(event.threadId);
        }

        if (event.type === 'RUN_FINISHED') {
          if (event.result?.outcome === 'interrupt' && event.result.interrupt) {
            const dp = event.result.interrupt.decision_point;
            setCurrentDecision(dp);
            options.onDecisionRequired?.(dp);
          } else if (event.result?.outcome === 'success') {
            setContent(event.result.content || '');
            setCurrentDecision(null);
            setIsGenerating(false);
            options.onComplete?.(event.result.content || '');
          } else if (event.result?.outcome === 'error') {
            setIsGenerating(false);
            options.onError?.('生成失败');
          }
        }
      }
    }
  };

  const startGeneration = useCallback(async (params: {
    chapterNumber: number;
    chapterTitle?: string;
    density?: 'simple' | 'detailed' | 'auto';
  }) => {
    setIsGenerating(true);
    setContent('');
    setCurrentDecision(null);

    const response = await fetch(
      `/api/v1/generate/chapter-writing/${options.projectId}/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`,
        },
        body: JSON.stringify({
          mode: 'interactive',
          density: params.density || 'detailed',
          chapter_number: params.chapterNumber,
          chapter_title: params.chapterTitle,
        }),
      }
    );

    await processStream(response);
  }, [options.projectId, options.token]);

  const submitDecision = useCallback(async (decision: UserDecision) => {
    if (!draftId) return;

    setCurrentDecision(null);

    const response = await fetch(
      `/api/v1/generate/chapter-writing/${options.projectId}/decide`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`,
        },
        body: JSON.stringify({
          draft_id: draftId,
          decision,
        }),
      }
    );

    await processStream(response);
  }, [draftId, options.projectId, options.token]);

  const confirmCompletion = useCallback(async () => {
    if (!draftId) return;

    const response = await fetch(
      `/api/v1/generate/chapter-writing/${options.projectId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`,
        },
        body: JSON.stringify({ draft_id: draftId }),
      }
    );

    return response.json();
  }, [draftId, options.projectId, options.token]);

  const abandonDraft = useCallback(async () => {
    if (!draftId) return;

    await fetch(
      `/api/v1/generate/chapter-writing/${options.projectId}/draft?draft_id=${draftId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${options.token}`,
        },
      }
    );

    setDraftId(null);
    setContent('');
    setCurrentDecision(null);
    setIsGenerating(false);
  }, [draftId, options.projectId, options.token]);

  return {
    isGenerating,
    draftId,
    currentDecision,
    content,
    startGeneration,
    submitDecision,
    confirmCompletion,
    abandonDraft,
  };
}
```

### 使用示例

```tsx
function ChapterWritingPage() {
  const {
    isGenerating,
    currentDecision,
    content,
    startGeneration,
    submitDecision,
    confirmCompletion,
  } = useChapterWriting({
    projectId: 'xxx',
    token: 'xxx',
    onDecisionRequired: (dp) => console.log('需要决策:', dp.question),
    onComplete: (content) => console.log('生成完成:', content.length, '字'),
  });

  return (
    <div>
      {/* 开始按钮 */}
      <button
        onClick={() => startGeneration({ chapterNumber: 1, density: 'detailed' })}
        disabled={isGenerating}
      >
        生成第 1 章
      </button>

      {/* 决策 UI */}
      {currentDecision && (
        <DecisionDialog
          decision={currentDecision}
          onSelect={(optionId) => submitDecision({
            decision_point_id: currentDecision.id,
            chosen_option_id: optionId,
          })}
          onCustom={(text) => submitDecision({
            decision_point_id: currentDecision.id,
            custom_input: text,
          })}
          onSkip={() => submitDecision({
            decision_point_id: currentDecision.id,
            skipped: true,
          })}
        />
      )}

      {/* 结果展示 */}
      {content && (
        <div>
          <h3>生成结果</h3>
          <pre>{content}</pre>
          <button onClick={confirmCompletion}>确认保存</button>
        </div>
      )}
    </div>
  );
}
```

---

## 决策点类型说明

| 类型 | 说明 | 示例问题 |
|------|------|----------|
| `character_choice` | 角色关键抉择 | "萧炎是否接受药老的提议？" |
| `plot_direction` | 剧情走向 | "本章冲突以和解还是对抗收场？" |
| `relationship_change` | 关系转变 | "主角与配角的关系是修复还是破裂？" |
| `foreshadow_reveal` | 伏笔揭示方式 | "身世之谜是部分揭示还是完全揭开？" |
| `conflict_resolution` | 冲突解决方式 | "危机是靠智取、武力还是外援解决？" |

---

## 生成模式与决策密度

### GenerationMode（生成模式）

| 值 | 说明 |
|------|------|
| `interactive` | 交互式：每个决策点都暂停等待用户选择 |
| `semi_auto` | 半自动：只有 critical 决策点暂停，其他自动使用推荐值 |
| `auto_review` | 全自动：所有决策使用推荐值，最后统一审核结果 |

### DecisionDensity（决策密度）

| 值 | 说明 | 筛选的决策级别 |
|------|------|----------|
| `simple` | 少量决策 | 只保留 `critical` 级别 |
| `detailed` | 更多决策 | 保留 `critical` + `normal` 级别 |

**注意**：全自动模式通过 `mode=auto_review` 控制，而非 `density` 参数。

---

## 错误处理

### SSE 错误事件

```
event: RUN_FINISHED
data: {
  "type": "RUN_FINISHED",
  "result": {
    "outcome": "error",
    "error": {
      "code": "OUTLINE_NOT_FOUND",
      "message": "章节细纲不存在，请先生成细纲"
    }
  }
}
```

### HTTP 错误响应

```json
{
  "success": false,
  "error": {
    "code": 20001,
    "message": "项目不存在"
  }
}
```

常见错误码：
- `20001`: 资源不存在（项目/章节）
- `30001`: 参数验证失败
- `40001`: 细纲不存在，需先生成细纲
