# API 资源编辑/删除接口对接文档

> 本文档列出所有支持编辑（PATCH/PUT）和删除（DELETE）操作的 API 端点。
>
> 基础路径: `/api/v1`

---

## 目录

1. [项目 (Projects)](#1-项目-projects)
2. [章节 (Chapters)](#2-章节-chapters)
3. [实体 (Entities)](#3-实体-entities)
4. [金手指 (Golden Fingers)](#4-金手指-golden-fingers)
5. [选题 (Ideas)](#5-选题-ideas)
6. [大纲 (Outlines)](#6-大纲-outlines)
7. [草稿 (Drafts)](#7-草稿-drafts)
8. [技能 (Skills)](#8-技能-skills)
9. [融合任务 (Fusion)](#9-融合任务-fusion)
10. [通用说明](#10-通用说明)

---

## 1. 项目 (Projects)

### 1.1 更新项目

```http
PATCH /projects/{project_id}
```

**请求体** `ProjectUpdateRequest`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 项目名称 (1-100字符) |
| `description` | string | 否 | 项目描述 (最多500字符) |
| `status` | enum | 否 | 项目状态: `active`, `archived`, `completed` |

**示例**:
```json
{
  "name": "斗破苍穹续写版",
  "status": "active"
}
```

### 1.2 删除项目

```http
DELETE /projects/{project_id}
```

**说明**: 删除项目及其关联的所有数据（章节、实体、大纲等）和项目目录。

**响应**: `{ "success": true, "data": { "deleted_id": "uuid" } }`

---

## 2. 章节 (Chapters)

### 2.1 更新章节

```http
PATCH /projects/{project_id}/chapters/{chapter_number}
```

**请求体** `ChapterUpdate`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 章节标题 |
| `content` | string | 否 | 章节正文内容 |
| `status` | enum | 否 | 状态: `imported`, `outlined`, `drafted`, `reviewed`, `published` |
| `summary` | string | 否 | 章节摘要 |
| `ending_state` | object | 否 | 章末状态快照 |
| `metadata_` | object | 否 | 元数据 |

**示例**:
```json
{
  "title": "第一章 陨落的天才",
  "content": "斗气大陆，强者为尊...",
  "status": "published"
}
```

### 2.2 创建/更新章节细纲

```http
PUT /projects/{project_id}/chapters/{chapter_number}/outline
```

**请求体** `ChapterOutlineUpsertRequest`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | **是** | 细纲内容 (最多100,000字符) |
| `context_requirements` | object | 否 | 上下文需求配置 |
| `golden_finger_plan` | object | 否 | 金手指使用计划 |

**示例**:
```json
{
  "content": "## 本章目标\n萧炎展示三段斗之气...",
  "context_requirements": {
    "required_characters": [{"name": "萧炎", "role": "主视角"}],
    "required_locations": ["萧家"],
    "required_worldview": ["斗气等级"],
    "foreshadowing_to_recall": []
  }
}
```

### 2.3 获取细纲列表

```http
GET /projects/{project_id}/chapters/outlines
```

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `chapter_start` | int | - | 章节号起始 (≥1) |
| `chapter_end` | int | - | 章节号结束 (≥1) |

**响应** `SuccessResponse<ChapterOutlineListRead[]>`:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chapter_number": 1,
      "chapter_id": "uuid或null",
      "content": "## 剧情设计\n...",
      "context_requirements": {...},
      "golden_finger_plan": {...},
      "created_at": "2026-01-06T10:00:00Z",
      "updated_at": "2026-01-06T10:30:00Z"
    }
  ]
}
```

### 2.4 删除细纲

```http
DELETE /projects/{project_id}/chapters/{chapter_number}/outline
```

**说明**: 删除指定章节的细纲记录。返回 `204 No Content`。

### 2.5 生成细纲 (异步)

```http
POST /projects/{project_id}/chapters/{chapter_number}/outline/generate
```

**说明**: 异步生成章节细纲。返回任务 ID，通过任务接口查询结果。

**响应** (`202 Accepted`):

```json
{
  "success": true,
  "data": {
    "task_id": "uuid",
    "status": "queued",
    "message": "章节 1 细纲生成任务已排队"
  }
}
```

**任务完成后**: 通过 `GET /tasks/{task_id}` 查询，结果中包含生成的细纲。

### 2.6 删除章节

```http
DELETE /projects/{project_id}/chapters/{chapter_number}
```

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keep_outline` | boolean | `false` | 是否保留细纲 |

**示例**: `DELETE /projects/{id}/chapters/5?keep_outline=true`

---

## 3. 实体 (Entities)

> 实体包括：角色、地点、世界观、金手指、伏笔、物品、技能、势力、剧情线等。

### 3.1 更新实体

```http
PATCH /projects/{project_id}/entities/{entity_id}
```

**请求体** `EntityUpdate` (来自 `models/entity.py`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 实体名称 |
| `status` | enum | 否 | 状态: `active`, `inactive`, `deceased`, `destroyed`, `recalled`, `abandoned` |
| `tags` | string[] | 否 | 标签列表 |
| `content` | string | 否 | 完整描述 (Markdown) |
| `attributes` | object | 否 | 结构化属性 (JSON) |
| `metadata_` | object | 否 | 元数据 |

**示例**:
```json
{
  "name": "萧炎",
  "status": "active",
  "tags": ["主角", "炎帝"],
  "attributes": {
    "level": 9,
    "realm": "斗帝"
  }
}
```

### 3.2 删除实体

```http
DELETE /projects/{project_id}/entities/{entity_id}
```

**说明**: 删除实体及其状态历史记录。

---

## 4. 金手指 (Golden Fingers)

> 金手指是 `EntityType.GOLDEN_FINGER` 的实体视图，提供专用字段格式。

### 4.1 更新金手指

```http
PATCH /projects/{project_id}/golden-fingers/{name}
```

**请求体** `GoldenFingerUpdateRequest`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 金手指名称 |
| `gf_type` | string | 否 | 类型: `system`, `inheritance`, `rebirth`, `artifact`, `physique` |
| `status` | string | 否 | 状态: `active`, `inactive`, `sealed` |
| `level` | int | 否 | 等级 |
| `content` | string | 否 | 完整描述 |
| `abilities` | string[] | 否 | 能力列表 |
| `resources` | object | 否 | 资源配置 |
| `unlock_conditions` | string[] | 否 | 解锁条件 |
| `restrictions` | string[] | 否 | 限制条件 |
| `tags` | string[] | 否 | 标签 |

**示例**:
```json
{
  "level": 5,
  "status": "active",
  "abilities": ["吞噬", "进化", "融合"]
}
```

### 4.2 删除金手指

```http
DELETE /projects/{project_id}/golden-fingers/{name}
```

**说明**: 删除金手指及其状态历史记录。此操作不可逆。

---

## 5. 选题 (Ideas)

### 5.1 更新选题

```http
PATCH /projects/{project_id}/ideas/{idea_id}
```

**请求体** `IdeaUpdateRequest`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 选题标题 (1-500字符) |
| `status` | enum | 否 | 状态: `draft`, `exploring`, `reviewed`, `selected`, `archived` |
| `total_score` | int | 否 | 总分 (0-100) |
| `scores` | object | 否 | 分项评分 |
| `review_feedback` | string | 否 | 评审反馈 (最多5000字符) |
| `metadata_` | object | 否 | 元数据 (最多50个键) |

**示例**:
```json
{
  "status": "selected",
  "total_score": 85,
  "scores": {
    "创意": 90,
    "市场": 80,
    "可行性": 85
  }
}
```

### 5.2 归档选题 (软删除)

```http
DELETE /projects/{project_id}/ideas/{idea_id}
```

**说明**: 将选题状态设为 `archived`，不会物理删除数据。

---

## 6. 大纲 (Outlines)

### 6.1 更新总纲

```http
PUT /projects/{project_id}/outlines/novel
```

**请求体** `NovelOutlineUpdate`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 书名 (最多500字符) |
| `genre` | string | 否 | 类型 (最多100字符) |
| `target_words` | int | 否 | 目标字数 (≥10000) |
| `target_volumes` | int | 否 | 计划卷数 (≥1) |
| `core_theme` | string | 否 | 核心主题 |
| `core_conflict` | string | 否 | 核心冲突 |
| `ending_direction` | string | 否 | 结局走向 |
| `protagonist_arc` | string | 否 | 主角成长弧线 |
| `content` | string | 否 | 完整大纲内容 |
| `key_plotlines` | string[] | 否 | 主要剧情线名称列表 |

### 6.2 更新卷纲

```http
PUT /projects/{project_id}/outlines/volumes/{volume_number}
```

**请求体** `VolumeOutlineUpdate`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 卷名 (最多500字符) |
| `chapter_start` | int | 否 | 起始章节号 (≥1) |
| `chapter_end` | int | 否 | 结束章节号 (≥1) |
| `target_words` | int | 否 | 目标字数 (≥10000) |
| `volume_goal` | string | 否 | 本卷核心目标 |
| `main_conflict` | string | 否 | 本卷主要冲突 |
| `key_events` | string[] | 否 | 关键事件列表 |
| `ending_hook` | string | 否 | 卷末钩子/悬念 |
| `content` | string | 否 | 完整卷纲内容 |
| `plotline_goals` | object | 否 | 各剧情线目标 `{ "主线": "目标..." }` |

### 6.3 删除总纲

```http
DELETE /projects/{project_id}/outlines/novel
```

### 6.4 删除卷纲

```http
DELETE /projects/{project_id}/outlines/volumes/{volume_number}
```

---

## 7. 草稿 (Drafts)

### 7.1 删除草稿

```http
DELETE /projects/{project_id}/drafts/{chapter}
```

**说明**: 删除指定章节的草稿文件。

> **注意**: 草稿目前不支持 POST 创建和 PATCH 更新，仅支持通过写作流水线生成。

---

## 8. 技能 (Skills)

> 技能分为**系统技能**（只读）和**团队技能**（可编辑）。

### 8.1 更新技能

```http
PATCH /skills/{skill_id}
```

**请求体** `SkillUpdate`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 技能名称 |
| `description` | string | 否 | 技能描述 |
| `content` | string | 否 | 技能内容/提示词 |
| `category` | string | 否 | 分类 |
| `tags` | string[] | 否 | 标签 |

**限制**: 仅团队技能可修改，系统预置技能不可编辑。

### 8.2 删除技能

```http
DELETE /skills/{skill_id}
```

**限制**: 仅团队技能可删除。

### 8.3 禁用项目技能

```http
DELETE /skills/projects/{project_id}/{skill_id}
```

**说明**: 从项目中禁用指定技能（不删除技能本身）。

### 8.4 调整项目技能顺序

```http
PATCH /skills/projects/{project_id}/order
```

**请求体** `ReorderSkillsRequest`:

```json
{
  "skill_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 9. 融合任务 (Fusion)

### 9.1 更新融合任务

```http
PATCH /fusion/tasks/{task_id}
```

**请求体** `FusionTaskUpdateRequest`:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `fusion_mode` | enum | 否 | 融合模式: `mashup`, `twist`, `crossover`, `evolution`, `custom` |
| `custom_instruction` | string | 否 | 自定义融合指令 (最多2000字符) |
| `user_ideas` | string | 否 | 用户创意/偏好 (最多2000字符) |
| `candidate_count` | int | 否 | 候选方案数量 (1-5) |

**限制**: 只有 `PENDING`、`FAILED`、`COMPLETED` 状态的任务可更新。

### 9.2 删除融合任务

```http
DELETE /fusion/tasks/{task_id}
```

**说明**: 删除融合任务记录，但不会删除已创建的结果项目。

---

## 10. 通用说明

### 10.1 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "资源不存在"
  }
}
```

### 10.2 认证要求

所有编辑/删除端点都需要认证，请在请求头中携带 JWT Token:

```http
Authorization: Bearer <token>
```

### 10.3 部分更新规则

- PATCH 请求只更新提供的字段，未提供的字段保持不变
- 传入 `null` 会清空该字段（如果该字段允许为空）
- 传入空对象 `{}` 不会清空，而是保持原值

### 10.4 级联删除

| 资源 | 级联删除内容 |
|------|-------------|
| 项目 | 章节、实体、实体状态、大纲、草稿、选题、目录 |
| 章节 | 细纲（除非 `keep_outline=true`）、审核记录 |
| 实体 | 实体状态历史、实体嵌入向量 |
| 金手指 | 状态历史（作为实体的一种） |

### 10.5 不支持编辑/删除的资源

| 资源 | 原因 |
|------|------|
| 提示词 (Prompts) | 版本管理机制，只能创建新版本 |
| 系统技能 | 预置内容，不允许修改 |
| 任务 (Tasks) | 只读，只能取消运行中的任务 |
| 聊天会话 | 只能删除整个会话，不能编辑消息 |

---

## 快速参考

| 资源 | GET | POST | PUT | PATCH | DELETE |
|------|:---:|:----:|:---:|:-----:|:------:|
| 项目 | `/projects` | `/projects` | - | `/projects/{id}` | `/projects/{id}` |
| 章节 | `/chapters` | `/chapters` | - | `/chapters/{num}` | `/chapters/{num}` |
| 细纲 | `/chapters/outlines` | `/chapters/{num}/outline/generate` | `/chapters/{num}/outline` | - | `/chapters/{num}/outline` |
| 实体 | `/entities` | `/entities` | - | `/entities/{id}` | `/entities/{id}` |
| 金手指 | `/golden-fingers` | `/golden-fingers` | - | `/golden-fingers/{name}` | `/golden-fingers/{name}` |
| 选题 | `/ideas` | `/ideas` | - | `/ideas/{id}` | `/ideas/{id}` (软删除) |
| 总纲 | `/outlines/novel` | - | `/outlines/novel` | - | `/outlines/novel` |
| 卷纲 | `/outlines/volumes/{num}` | - | `/outlines/volumes/{num}` | - | `/outlines/volumes/{num}` |
| 草稿 | `/drafts` | - | - | - | `/drafts/{chapter}` |
| 技能 | `/skills` | `/skills` | - | `/skills/{id}` | `/skills/{id}` |
| 融合 | `/fusion/tasks` | `/fusion/tasks` | - | `/fusion/tasks/{id}` | `/fusion/tasks/{id}` |

> 所有路径前缀为 `/api/v1`，章节相关路径需要加上 `/projects/{project_id}` 前缀。
