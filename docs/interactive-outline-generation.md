# 交互式细纲生成功能

## 开发目标

实现细纲生成的交互式流程，让用户能够在 AI 生成细纲的过程中参与关键决策，而非完全自动化生成。

### 核心需求

1. **删除旧模式切换**：移除工具栏的"全自动/导演模式"切换
2. **按钮重命名**："开始书写" → "生成正文"
3. **新增生成细纲入口**：添加"生成细纲"按钮，弹出配置对话框
4. **流式生成展示**：点击生成后切换到细纲 Tab，实时显示生成内容
5. **决策点交互**：收到决策点时弹出模态对话框，让用户选择方向

---

## 文件变更清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `src/types/interactive-outline.ts` | 类型定义（模式、密度、决策点、SSE 事件等）|
| `src/lib/api/interactive-outline.ts` | SSE 流式 API 封装 |
| `src/hooks/use-interactive-outline.ts` | 交互式生成 Hook |
| `src/components/write/generate-outline-dialog.tsx` | 生成配置对话框 |
| `src/components/write/decision-point-dialog.tsx` | 决策点交互对话框 |

### 修改文件

| 文件路径 | 变更内容 |
|---------|---------|
| `src/components/write/writing-toolbar.tsx` | 删除模式切换，添加"生成细纲"按钮 |
| `src/components/write/editor/chapter-editor-tabs.tsx` | 集成流式生成 UI 和决策点对话框 |
| `src/stores/writing-store.ts` | 添加交互式生成状态和 actions |

---

## 功能详解

### 1. 生成模式

| 模式 | 说明 |
|------|------|
| `interactive` | 交互式 - 每个决策点都暂停，让用户参与选择 |
| `semi_auto` | 半自动 - 只在关键决策点暂停，次要决策自动处理 |
| `auto_review` | 全自动 - 全部使用 AI 推荐值，最后统一审核 |

### 2. 决策密度

| 密度 | 说明 |
|------|------|
| `simple` | 简洁模式 - 只在关键节点停顿 (1-2 个决策点) |
| `detailed` | 详细模式 - 更多细节由你把控 (3-5 个决策点) |

### 3. 决策点结构

```typescript
interface DecisionPoint {
  id: string;
  type: string;           // 决策类型
  question: string;       // 决策问题
  context: string;        // 上下文说明
  options: DecisionOption[];
  importance: "critical" | "normal" | "minor";
  allow_custom: boolean;  // 是否允许自定义输入
}

interface DecisionOption {
  id: string;
  label: string;          // 选项标题
  description: string;    // 选项描述
  recommended: boolean;   // 是否推荐
  reason: string;         // 推荐理由
  impact: string;         // 选择影响
}
```

### 4. SSE 事件流程

```
POST /generate/chapter-outline/{project_id}/start
         │
         ▼
    RUN_STARTED ──► 记录 draftId，切换到细纲 tab
         │
         ▼ (循环)
    STATE_DELTA ──► 解析 delta，追加到 streamingOutline
         │
         ▼ (检测到决策点)
    RUN_FINISHED ──► outcome: interrupt
    interrupt.payload ──► 显示 DecisionPointDialog
         │
         ▼ (用户选择)
POST /generate/chapter-outline/{project_id}/decide
         │
         ▼ (继续循环...)
         │
         ▼ (生成完成)
    RUN_FINISHED ──► outcome: success
                     同步内容到 chapterOutline
```

---

## API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/generate/chapter-outline/{project_id}/start` | 开始生成（SSE 流）|
| POST | `/generate/chapter-outline/{project_id}/decide` | 提交决策继续生成 |
| GET | `/generate/chapter-outline/{project_id}/draft` | 获取草稿信息 |
| DELETE | `/generate/chapter-outline/{project_id}/draft` | 放弃草稿 |
| POST | `/generate/chapter-outline/{project_id}/confirm` | 确认细纲 |

---

## 状态管理

### 新增 Store 状态

```typescript
// src/stores/writing-store.ts
outlineGenerationStatus: OutlineGenerationStatus;  // idle | generating | decision | completed | error
streamingOutline: string;                          // 流式生成的内容
currentDecisionPoint: DecisionPoint | null;        // 当前决策点
outlineDraftId: string | null;                     // 草稿 ID
```

### 便捷 Hook

```typescript
// 获取交互式生成状态
const {
  outlineGenerationStatus,
  streamingOutline,
  currentDecisionPoint,
  outlineDraftId,
  setOutlineGenerationStatus,
  // ...
} = useInteractiveOutlineState();

// 交互式生成操作
const {
  startGeneration,
  selectOption,
  skipDecision,
  submitCustomInput,
  stopGeneration,
  // ...
} = useInteractiveOutline(projectId, chapterNumber);
```

---

## 测试方式

### 1. 前置条件

- 确保后端 API 已部署并可访问
- 确保有一个项目，且该项目有章节

### 2. 功能测试

#### 2.1 UI 测试

1. **工具栏检查**
   - 验证"全自动/导演模式"切换已删除
   - 验证"开始书写"已改为"生成正文"
   - 验证"生成细纲"按钮存在且可点击

2. **生成配置对话框**
   - 点击"生成细纲"按钮，验证对话框弹出
   - 验证三种生成模式可选
   - 验证两种决策密度可选
   - 验证创意指导文本框可输入
   - 验证参考设定折叠面板可展开，且显示角色/世界观/剧情线
   - 验证技能折叠面板可展开（需有细纲阶段技能）

3. **流式生成**
   - 点击"开始生成"后验证对话框关闭
   - 验证自动切换到细纲 Tab
   - 验证显示"正在生成细纲..."状态
   - 验证内容实时流式填充

4. **决策点对话框**
   - 等待决策点出现，验证对话框弹出
   - 验证决策问题和上下文显示正确
   - 验证选项卡片显示标签、描述、推荐标识
   - 验证可展开查看选项影响
   - 验证"跳过（使用推荐）"按钮可用
   - 验证选择选项后点击"确认选择"可继续生成
   - 如果 `allow_custom: true`，验证自定义输入可用

5. **停止生成**
   - 点击"停止"按钮，验证生成中断
   - 验证已生成的内容保留

#### 2.2 API 测试

使用浏览器开发者工具或 curl 测试：

```bash
# 开始生成
curl -X POST "http://localhost:8000/api/v1/generate/chapter-outline/{project_id}/start" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "interactive",
    "density": "simple",
    "chapter_number": 1
  }'

# 提交决策
curl -X POST "http://localhost:8000/api/v1/generate/chapter-outline/{project_id}/decide" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "draft_id": "{draft_id}",
    "decision": {
      "decision_point_id": "{decision_point_id}",
      "chosen_option_id": "{option_id}",
      "custom_input": null,
      "skipped": false
    }
  }'
```

#### 2.3 边界情况测试

- [ ] 未选择章节时"生成细纲"按钮应禁用
- [ ] 生成过程中刷新页面后的恢复（检查草稿）
- [ ] 网络中断时的错误处理
- [ ] 快速多次点击生成按钮的防重复处理

---

## 注意事项

1. **SSE 解析**：使用 `data:` 前缀解析 SSE 事件，注意处理多行数据
2. **状态同步**：生成完成后自动同步到 `chapterOutline` 状态
3. **Tab 切换**：开始生成时自动切换到细纲 Tab (`setActiveEditorTab("outline")`)
4. **草稿管理**：支持检查未完成草稿并恢复/放弃
