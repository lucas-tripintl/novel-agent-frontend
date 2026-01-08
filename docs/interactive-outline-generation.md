# 交互式内容生成系统设计

> 决策点驱动的 AI 辅助小说创作架构
>
> 统一框架，支持：大纲、卷纲、章纲、正文、角色、世界观等所有内容生成

## 一、背景与创新点

### 1.1 现有产品做法

| 产品 | 模式 | 特点 |
|------|------|------|
| Sudowrite | 生成→编辑→再生成 | Story Bible 流程，用户事后修改 |
| Novelcrafter | 对话式迭代 | Chat + Codex，多轮优化 |
| 国内工具 | 一键生成 | 简单粗暴，缺乏控制 |

**共同问题**：都是「AI 先做完，用户再改」，缺乏过程中的协作。

### 1.2 我们的创新

**决策点驱动模式**：在生成过程中的关键节点暂停，让用户参与决策。

```
传统模式：用户请求 → AI 完整生成 → 用户修改
我们模式：用户请求 → AI 生成片段 → 决策点 → 用户选择 → 继续生成 → ...
```

**核心创新点**：

1. **决策解释**：每个选项都有推荐理由和影响说明
2. **过程协作**：用户在创作过程中参与，而非事后修改
3. **可控粒度**：用户可选择决策密度（简单/详细）和模式（交互/半自动/全自动）

---

## 二、整体架构

### 2.1 两阶段创作流程

```
章节创作流程
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1: 细纲生成                                                │
│ OutlineGeneratorAgent（决策点模式）                              │
│ ├── 决策点由 Agent 动态识别（而非固定顺序）                      │
│ ├── 决策类型：开场/冲突/角色抉择/技能启用/章末钩子等            │
│ └── 模式：interactive / semi_auto / auto_review                 │
└─────────────────────────────────────────────────────────────────┘
       ↓
用户确认细纲
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2: 正文生成                                                │
│ WritingAgent（预览确认模式）                                     │
│ ├── 按细纲片段逐段生成                                           │
│ ├── 每段预览，用户可：确认 / 重写 / 调整风格                     │
│ ├── 关键场景可触发决策点（可选）                                 │
│ └── 模式：interactive / auto（全自动后统一审核）                 │
└─────────────────────────────────────────────────────────────────┘
       ↓
用户确认正文
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 3: 审核润色                                                │
│ ReviewAgent + SettingUpdateAgent（现有流程）                     │
│ ├── 一致性检查                                                   │
│ └── 设定提取                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 与现有 Agent 的关系

| 现有 Agent | 新方案 | 关系 |
|------------|--------|------|
| ChapterOutlineAgent | OutlineGeneratorAgent | **替换**（全自动模式 ≈ 原功能 + 决策日志） |
| WritingAgent | InteractiveWritingAgent | **增强**（增加预览确认模式） |
| ReviewAgent | 保持不变 | 继续使用 |
| SettingUpdateAgent | 保持不变 | 继续使用 |

### 2.3 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js + AG-UI)                   │
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │  OutlineGeneratorPanel    │  │  WritingPanel             │   │
│  │  ├── OutlinePreview       │  │  ├── ContentPreview       │   │
│  │  ├── DecisionPointCard    │  │  ├── SegmentActions       │   │
│  │  └── DecisionsSummary     │  │  └── StyleAdjustCard      │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
│                              ↕ AG-UI Events (SSE)                │
└─────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                            │
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │  OutlineGeneratorAgent    │  │  InteractiveWritingAgent  │   │
│  │  ├── 动态识别决策点       │  │  ├── 按片段生成正文       │   │
│  │  ├── 生成决策选项         │  │  ├── 预览确认机制         │   │
│  │  └── 处理用户选择         │  │  └── 风格调整处理         │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL                                              │    │
│  │  ├── outline_drafts（细纲草稿）                          │    │
│  │  ├── writing_drafts（正文草稿）                          │    │
│  │  └── decision_logs（决策日志）                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js + AG-UI | AG-UI 提供 interrupt 机制支持暂停/继续 |
| 通信 | SSE (Server-Sent Events) | 流式传输生成内容和决策点 |
| 后端 | FastAPI + PydanticAI | Agent 框架 |
| 持久化 | PostgreSQL | 草稿状态、决策日志 |

---

## 三、统一生成器框架

### 3.1 设计目标

将所有内容生成场景抽象为统一框架，通过配置适配不同场景：

| 场景 | 输出内容 | 决策点类型 | 分段策略 |
|------|----------|-----------|----------|
| 大纲生成 | 全书大纲 | 故事前提、主角类型、结局类型 | 按结构（幕/卷） |
| 卷纲生成 | 分卷大纲 | 卷主题、核心冲突、高潮设计 | 按章节 |
| 章节细纲 | 章节细纲 | 开场、冲突、角色抉择、章末钩子 | 按故事节拍 |
| 正文生成 | 章节正文 | 场景节奏、对话风格、情感浓度 | 按细纲片段 |
| 角色生成 | 角色设定 | 原型、性格、背景、关系 | 按字段 |
| 世界观生成 | 世界设定 | 世界类型、力量体系、社会结构 | 按字段 |

### 3.2 框架架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    配置层（场景定义）                            │
│                    agents/generator/configs/                     │
│                                                                  │
│   ChapterOutlineConfig │   ChapterWritingConfig                  │
│   CharacterConfig      │   WorldbuildingConfig                   │
│   (待实现: BookOutlineConfig, VolumeOutlineConfig, ...)          │
└─────────────────────────────────────────────────────────────────┘
                               ↓ 配置注入
┌─────────────────────────────────────────────────────────────────┐
│                    核心框架层（统一逻辑）                        │
│                    agents/generator/                             │
│                                                                  │
│  InteractiveGeneratorAgent (agent.py)                           │
│  ├── _generate_segment()     # 片段生成                         │
│  ├── _generation_loop()      # 生成循环                         │
│  └── continue_with_decision() # 决策后继续                      │
│                                                                  │
│  DecisionHandler (decision.py)                                  │
│  ├── detect_decision_point()  # 决策点检测                      │
│  ├── process_user_decision()  # 处理用户决策                    │
│  └── get_auto_decision()      # 自动决策                        │
│                                                                  │
│  DecisionDetectionAgent (decision_detection_agent.py)           │
│  └── LLM 驱动的决策点识别                                       │
│                                                                  │
│  StateManager (state.py)                                        │
│  ├── create_draft() / get_draft()    # 草稿管理                 │
│  ├── record_decision()               # 决策记录                 │
│  ├── revert_to_decision()            # 回退机制                 │
│  └── build_generator_context()       # 上下文构建               │
│                                                                  │
│  EventEmitter (events.py)                                       │
│  └── AG-UI 事件发送（STATE_DELTA, INTERRUPT, etc.）             │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    基础设施层（持久化/通信）                     │
│                    models/generator.py                           │
│                                                                  │
│  GeneratorDraft（统一草稿表）                                   │
│  DecisionLog（统一决策日志）                                    │
│  AG-UI SSE（统一通信协议）                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 GeneratorConfig 接口

每个生成场景通过 Config 定义其行为：

```
GeneratorConfig
├── 基础信息
│   ├── name: str                    # 如 "chapter_outline"
│   ├── description: str
│   └── output_type: type            # 输出数据类型
│
├── 上下文构建
│   ├── context_builder: ContextBuilder    # 如何收集上下文
│   └── context_schema: type               # 上下文数据结构
│
├── 分段策略
│   ├── segment_strategy: enum       # BY_STORY_BEAT / BY_FIELD / BY_STRUCTURE
│   ├── segments: list | None        # 固定字段列表（角色/设定场景）
│   └── max_segments: int | None     # 最大片段数
│
├── 决策配置
│   ├── decision_types: list         # 支持的决策点类型
│   ├── decision_detector: Detector  # 何时触发决策
│   └── decision_generator: Generator # 如何生成选项
│
├── 交互配置
│   ├── interaction_style: enum      # DECISION_SELECT / PREVIEW_CONFIRM
│   ├── supported_modes: list        # 支持的生成模式
│   └── default_mode: enum
│
└── Prompt 配置
    ├── system_prompt: Path
    ├── segment_prompt: Path
    └── decision_prompt: Path
```

### 3.4 分段策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| BY_STORY_BEAT | 按故事节拍动态分段 | 细纲生成（旧模式） |
| BY_OUTLINE_SEGMENT | 按上游细纲片段 | 正文生成 |
| BY_FIELD | 按预定义字段顺序 | 角色、世界观等设定 |
| BY_STRUCTURE | 按结构（幕、卷、章）| 大纲、卷纲 |
| DECISION_FIRST | 先收集决策，再一次性生成 | 简单设定生成 |
| **HYBRID** | 先宏观决策，再边生成边决策 | **细纲生成（推荐）** |

#### HYBRID 混合模式详解

混合模式将生成过程分为三个阶段：

```
Phase 1: 宏观决策收集 (COLLECT_MACRO)
├── LLM 分析上下文，一次性返回 3-5 个宏观决策点
├── 决策类型：剧情走向、冲突安排、情绪节奏、章末钩子
├── 用户逐个处理决策
└── 决策点 ID 前缀：macro_

Phase 2: 剧情生成 (GENERATE_PLOT)
├── 融合宏观决策，逐段生成剧情内容
├── 每个片段生成后检测是否需要微观决策
├── 微观决策类型：角色抉择、技能激活、伏笔使用
└── 决策点 ID 前缀：dp_

Phase 3: 整合输出 (FINALIZE)
└── 组装最终输出（自然语言文本格式）
```

**状态持久化**（使用 `context` 字段，无需数据库迁移）：
```
draft.context = {
    ...原有上下文数据...,
    "macro_decisions": [...],           # 完整宏观决策列表
    "pending_macro_decisions": [...],   # 待处理的宏观决策
    "macro_decisions_collected": bool   # 是否收集完成
}
```

**恢复场景处理**：
- 如果 `macro_decisions` 已有数据，不会重新调用 `collect_macro_decisions()`
- 从 `pending_macro_decisions` 恢复待处理决策
- 根据 `current_position.phase` 决定进入哪个阶段

**回退机制**：
- 宏观决策回退（`macro_*`）：恢复 `pending_macro_decisions`，phase 设为 `collect_macro`
- 剧情决策回退（`dp_*`）：删除片段，phase 设为 `generate_plot`
- 非 HYBRID 模式回退：phase 设为 `waiting_decision`

**优势**：
- 宏观决策保证整体方向一致
- 微观决策在具体情节中精细调控
- 输出为可读文本，而非 JSON 结构
- 状态可恢复，支持中断续写

### 3.5 交互风格

| 风格 | 说明 | 适用场景 |
|------|------|----------|
| DECISION_SELECT | 展示选项，用户选择 | 细纲、大纲、设定生成 |
| PREVIEW_CONFIRM | 展示结果，用户确认/重写/调整 | 正文生成 |

### 3.6 场景配置示例

**章节细纲配置**（使用 HYBRID 混合模式）
```
ChapterOutlineConfig:
  name: "chapter_outline"
  segment_strategy: HYBRID
  max_segments: 5

  # 宏观决策类型（Phase 1）
  macro_decision_types: [plot_direction, conflict_design,
                         emotional_arc, ending_hook]

  # 微观决策类型（Phase 2）
  decision_types: [character_decision, skill_activation, foreshadow_usage]

  interaction_style: DECISION_SELECT
  output_type: None  # 输出自然语言文本
  modes: [interactive, semi_auto, auto_review]
```

**章节正文配置**
```
ChapterWritingConfig:
  name: "chapter_writing"
  segment_strategy: BY_OUTLINE_SEGMENT
  decision_types: [SCENE_PACING, DIALOGUE_STYLE, ACTION_DETAIL]
  interaction_style: PREVIEW_CONFIRM
  modes: [interactive, auto]
```

**角色生成配置**
```
CharacterConfig:
  name: "character"
  segment_strategy: BY_FIELD
  segments: [basic_info, personality, background,
             relationships, abilities, arc]
  decision_types: [CHARACTER_ARCHETYPE, PERSONALITY_TRAIT,
                   BACKSTORY_DIRECTION, POWER_LEVEL]
  interaction_style: DECISION_SELECT
  modes: [interactive, auto_review]
```

**世界观生成配置**
```
WorldbuildingConfig:
  name: "worldbuilding"
  segment_strategy: BY_FIELD
  segments: [world_type, power_system, social_structure,
             geography, history, rules]
  decision_types: [WORLD_TYPE, POWER_SYSTEM_STYLE,
                   TECH_LEVEL, TONE]
  interaction_style: DECISION_SELECT
  modes: [interactive, auto_review]
```

### 3.7 统一数据模型

**generator_drafts（统一草稿表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| generator_type | str | 生成器类型（chapter_outline, character, ...） |
| target_id | UUID | 目标对象 ID（chapter_id, project_id, ...） |
| user_id | UUID | FK → users |
| status | enum | generating / waiting_decision / waiting_confirm / completed / abandoned |
| mode | enum | interactive / semi_auto / auto_review / auto |
| context | JSON | 上下文数据（结构由 config 定义） |
| segments | JSON | 已生成的片段 |
| decisions_made | JSON | 已做的决策 |
| current_position | JSON | 当前位置 |
| created_at | timestamp | |
| updated_at | timestamp | |
| expires_at | timestamp | |

**decision_logs（统一决策日志表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| draft_id | UUID | FK → generator_drafts |
| generator_type | str | |
| decision_type | str | 决策点类型 |
| decision_point | JSON | 决策点详情（问题、选项、推荐） |
| user_choice | JSON | 用户选择 |
| created_at | timestamp | |

### 3.8 GenerationTarget（生成目标）

为解决 `target_id` 语义模糊问题（新章节时传 `project_id`，已有章节时传 `chapter_id`），
引入 `GenerationTarget` 类型封装目标信息：

```python
class GenerationTarget(BaseModel):
    """生成目标信息"""

    # 目标类型：new_chapter / existing_chapter / new_character / ...
    target_type: str

    # 已有对象 ID（编辑模式时填写）
    target_id: str | None = None

    # 章节相关参数
    chapter_number: int | None = None
    chapter_title: str | None = None

    # 扩展参数（如 outline_id）
    extra: dict[str, Any] = {}

    @property
    def is_new(self) -> bool:
        """是否是新建模式"""
        return self.target_type.startswith("new_")

    @property
    def is_chapter(self) -> bool:
        """是否是章节相关"""
        return "chapter" in self.target_type
```

**使用方式**：

```python
# 新章节
target = GenerationTarget(
    target_type="new_chapter",
    chapter_number=5,
    chapter_title="觉醒",
)

# 已有章节重新生成
target = GenerationTarget(
    target_type="existing_chapter",
    target_id="chapter-uuid",
)

# 正文生成（关联细纲）
target = GenerationTarget(
    target_type="new_chapter",
    chapter_number=5,
    extra={"outline_id": "outline-uuid"},
)
```

**Config 接口变更**：

```python
# 旧接口（已废弃）
async def build_context(self, target_id: str, session: Any, **kwargs) -> dict

# 新接口
async def build_context(
    self,
    target: GenerationTarget,
    session: Any,
    project_id: str,
) -> dict
```

### 3.9 统一 API

所有生成场景使用相同的 API 模式（注：URL 中的 `target_id` 对于新建模式传 `project_id`）：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/generate/{type}/{target_id}/draft` | 获取草稿 |
| POST | `/generate/{type}/{target_id}/start` | 开始生成 |
| POST | `/generate/{type}/{target_id}/decide` | 提交决策 |
| POST | `/generate/{type}/{target_id}/confirm-segment` | 确认片段（预览确认模式） |
| POST | `/generate/{type}/{target_id}/rewrite-segment` | 重写片段 |
| POST | `/generate/{type}/{target_id}/adjust-style` | 调整风格 |
| POST | `/generate/{type}/{target_id}/revert` | 回退到决策点 |
| POST | `/generate/{type}/{target_id}/confirm` | 确认完成 |
| DELETE | `/generate/{type}/{target_id}/draft` | 放弃草稿 |

其中 `{type}` 可以是：
- `book-outline` - 全书大纲
- `volume-outline` - 卷纲
- `chapter-outline` - 章节细纲
- `chapter-writing` - 章节正文
- `character` - 角色
- `worldbuilding` - 世界观
- `location` - 地点
- `power-system` - 力量体系
- ...

### 3.9 框架优势

| 优势 | 说明 |
|------|------|
| **高复用** | 状态管理、决策流程、AG-UI 集成、持久化只实现一次 |
| **一致体验** | 所有生成场景交互模式统一，用户学习成本低 |
| **易扩展** | 新增场景只需定义 Config，无需改核心代码 |
| **易维护** | 核心逻辑集中，Bug 修复一处生效全局 |
| **灵活配置** | 通过 Config 控制行为，支持运行时调整 |

---

## 四、决策点设计（细纲场景）

### 4.1 决策点类型

```
DecisionPointType
├── 结构类
│   ├── OPENING_STYLE      # 开场方式
│   ├── CONFLICT_TYPE      # 冲突类型
│   ├── CLIMAX_DESIGN      # 高潮设计
│   └── ENDING_HOOK        # 章末钩子
├── 角色类
│   ├── CHARACTER_ENTRANCE # 角色登场方式
│   └── CHARACTER_DECISION # 角色关键抉择
├── 设定类
│   ├── SKILL_ACTIVATION   # 金手指/技能启用时机
│   └── FORESHADOW_USAGE   # 伏笔使用
└── 节奏类
    └── PACING_CHOICE      # 节奏选择
```

### 4.2 动态决策点识别

**核心原则**：决策点由 Agent 在生成过程中动态识别，而非按固定顺序触发。

```
Agent 生成细纲片段
       ↓
分析当前内容，判断是否需要用户决策
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 触发条件（满足任一）：                                       │
│ 1. 遇到多种合理的发展方向（分歧点）                          │
│ 2. 涉及重要角色的关键抉择                                    │
│ 3. 金手指/技能的使用时机                                     │
│ 4. 伏笔的揭示或埋设                                          │
│ 5. 章节结构的关键节点（开场、高潮、结尾）                    │
└─────────────────────────────────────────────────────────────┘
       ↓
需要决策？ ─── 否 ──→ 继续生成
       │
       是
       ↓
生成决策点（含选项和推荐理由）
       ↓
根据模式和重要性决定是否暂停
```

### 4.3 决策密度档位

| 档位 | 触发阈值 | 预期数量 | 适合用户 |
|------|----------|----------|----------|
| 简单 | 只触发 critical 级别 | 1-2 个/章 | 想快速完成 |
| 详细 | 触发 critical + normal | 3-5 个/章 | 想精细控制 |

**Agent 动态调整**：即使选择「详细」模式，如果本章内容比较直接，Agent 也可能只触发 2 个决策点。反之亦然。

### 4.4 生成模式

| 模式 | 行为 | 适合场景 |
|------|------|----------|
| 交互式 (interactive) | 每个决策点都暂停等待用户 | 重要章节、精细创作 |
| 半自动 (semi_auto) | 只有 critical 决策点暂停 | 日常写作 |
| 全自动 (auto_review) | 全部用推荐值，最后统一审核 | 批量生成、赶稿 |

**全自动模式说明**：相当于原 ChapterOutlineAgent 的功能，但额外记录了「AI 做了哪些决策」，用户可以在最后查看并修改。

### 4.5 决策点数据结构

```
DecisionPoint
├── id: str                    # 唯一标识
├── type: DecisionPointType    # 决策类型
├── question: str              # 决策问题，如「本章如何开场？」
├── context: str               # 上下文说明（为什么需要这个决策）
├── options: list[DecisionOption]
│   ├── id: str                # 选项标识
│   ├── label: str             # 简短标签（10字内）
│   ├── description: str       # 详细描述（50-100字）
│   ├── recommended: bool      # 是否推荐
│   ├── reason: str            # 推荐/不推荐理由
│   └── impact: str            # 对后续的影响
├── importance: critical|normal|minor
└── allow_custom: bool         # 是否允许自定义输入
```

### 4.6 用户决策数据结构

```
UserDecision
├── decision_point_id: str
├── chosen_option_id: str | None   # None 表示自定义
├── custom_input: str | None       # 自定义内容（直接使用，不做转化）
└── skipped: bool                  # 是否跳过（使用推荐值）
```

### 4.7 决策回退机制

用户可以回退到之前的决策点重新选择，回退后该决策点之后的内容全部重新生成。

```
当前状态：
[决策1 ✓] → [片段A] → [决策2 ✓] → [片段B] → [决策3 ●] → ...

用户点击回退到「决策2」：
[决策1 ✓] → [片段A] → [决策2 ●] → 重新生成...

结果：
- 决策1 和 片段A 保留
- 决策2 重新展示选项
- 片段B、决策3 及后续内容全部丢弃
```

**实现方式**：
- 数据库保存每个决策点时的完整状态快照
- 回退时恢复到该决策点的状态
- 重新开始生成流程

---

## 五、交互流程（细纲生成）

### 5.1 完整流程

```
用户点击「生成细纲」
       ↓
┌──────────────────────────────────────┐
│ 检查是否有未完成的草稿               │
│ GET /chapters/{id}/outline/draft     │
└──────────────────────────────────────┘
       ↓
   有草稿？ ─── 是 ──→ 弹窗询问「继续 or 重新开始」
       │                      ↓
       否               用户选择继续 → 恢复到上次决策点
       ↓                用户选择重新 → 标记旧草稿 abandoned
       ↓
┌──────────────────────────────────────┐
│ 显示配置面板                         │
│ - 模式选择：交互/半自动/全自动       │
│ - 密度选择：简单/详细                │
│ - 实体/技能选择                      │
└──────────────────────────────────────┘
       ↓
用户点击「开始生成」
       ↓
┌──────────────────────────────────────┐
│ POST /chapters/{id}/outline/start    │
│ → 创建 draft，返回 SSE 流            │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ 循环：生成 → 决策 → 继续             │
│                                      │
│ [STATE_DELTA] → 左侧显示新片段       │
│       ↓                              │
│ [INTERRUPT] → 右侧弹出决策卡片       │
│       ↓                              │
│ 用户选择 / 跳过 / 自定义             │
│       ↓                              │
│ POST /chapters/{id}/outline/decide   │
│       ↓                              │
│ 继续生成下一段...                    │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ [RUN_FINISHED outcome=success]       │
│ - 显示完整细纲（可编辑）             │
│ - 底部显示所有决策概览（可回退）     │
└──────────────────────────────────────┘
       ↓
用户点击「确认细纲」
       ↓
┌──────────────────────────────────────┐
│ POST /chapters/{id}/outline/confirm  │
│ → 创建正式 chapter_outline           │
│ → 删除 draft                         │
└──────────────────────────────────────┘
```

---

## 六、API 设计

### 6.1 端点列表（细纲生成）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chapters/{id}/outline/draft` | 获取未完成草稿 |
| POST | `/chapters/{id}/outline/start` | 开始生成（返回 SSE） |
| POST | `/chapters/{id}/outline/decide` | 提交决策并继续 |
| POST | `/chapters/{id}/outline/revert` | 回退到指定决策点 |
| POST | `/chapters/{id}/outline/confirm` | 确认完成 |
| DELETE | `/chapters/{id}/outline/draft` | 放弃草稿 |

### 6.2 端点列表（正文生成）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chapters/{id}/writing/draft` | 获取未完成草稿 |
| POST | `/chapters/{id}/writing/start` | 开始生成（返回 SSE） |
| POST | `/chapters/{id}/writing/confirm-segment` | 确认当前片段 |
| POST | `/chapters/{id}/writing/rewrite-segment` | 重写当前片段 |
| POST | `/chapters/{id}/writing/adjust-style` | 调整风格后重写 |
| POST | `/chapters/{id}/writing/confirm` | 确认完成 |
| DELETE | `/chapters/{id}/writing/draft` | 放弃草稿 |

### 6.3 AG-UI 事件流

```
# 开始
event: RUN_STARTED
data: {"threadId": "outline_xxx", "runId": "run_xxx"}

# 内容片段
event: STATE_DELTA
data: {"delta": [{"op": "add", "path": "/segments/-", "value": {...}}]}

# 决策点中断
event: RUN_FINISHED
data: {
  "outcome": "interrupt",
  "interrupt": {
    "id": "dp_001",
    "reason": "decision_required",
    "payload": { /* DecisionPoint */ }
  }
}

# 用户决策后继续，重复上述流程...

# 完成
event: STATE_SNAPSHOT
data: {"state": {"outline": [...], "decisions": {...}}}

event: RUN_FINISHED
data: {"outcome": "success"}
```

### 6.4 前端对接指南

#### 6.4.1 SSE 事件流处理

前端通过 SSE 接收生成事件，事件类型和数据结构如下：

| 事件类型 | 触发时机 | 数据结构 |
|----------|----------|----------|
| `RUN_STARTED` | 生成开始 | `{threadId, runId}` |
| `STATE_DELTA` | 新增/更新片段或决策 | `{delta: [{op, path, value}]}` |
| `STATE_SNAPSHOT` | 状态快照 | `{state: {...}}` |
| `RUN_FINISHED` | 生成完成/中断/错误 | `{outcome, ...}` |

**RUN_FINISHED 的 outcome 类型**：
- `success`: 生成完成
- `interrupt`: 需要用户决策
- `error`: 发生错误

#### 6.4.2 决策点 ID 前缀约定

| ID 前缀 | 含义 | 阶段 |
|---------|------|------|
| `macro_*` | 宏观决策（冲突/情绪/钩子） | HYBRID Phase 1 |
| `dp_*` | 剧情微观决策 | HYBRID Phase 2 / 原有模式 |
| `preview_*` | 预览确认 | 正文生成模式 |

前端可根据 ID 前缀显示不同 UI 样式（宏观决策通常更重要）。

#### 6.4.3 current_position.phase 值说明

| phase 值 | 含义 | 所属模式 |
|----------|------|----------|
| `generating` | 通用生成中 | 所有模式 |
| `waiting_decision` | 等待用户决策 | 原有模式 |
| `collect_macro` | 收集宏观决策阶段 | HYBRID 模式 |
| `generate_plot` | 生成剧情阶段 | HYBRID 模式 |
| `finalize` | 整合输出阶段 | HYBRID 模式 |

草稿响应 `GET /draft` 返回的 `current_position.phase` 可用于显示当前进度。

#### 6.4.4 GeneratedSegment 结构

```typescript
interface GeneratedSegment {
  index: number;           // 片段索引
  content: string;         // 片段内容（纯文本/Markdown）
  segment_type: string;    // 片段类型：opening/development/climax/resolution/""
  decisions_applied: string[];  // 已应用的决策点 ID 列表
  confirmed: boolean;      // 是否已确认（预览确认模式）
  version: number;         // 版本号（重写时递增）
}
```

`segment_type` 可用于前端显示片段标签或不同样式。

#### 6.4.5 DecisionPoint 与 UserDecision 结构

**DecisionPoint**（决策点，interrupt 时返回）：
```typescript
interface DecisionOption {
  id: string;              // 选项 ID
  label: string;           // 简短标签（10字内）
  description: string;     // 详细描述（50-100字）
  recommended: boolean;    // 是否推荐
  reason: string;          // 推荐/不推荐理由
  impact: string;          // 对后续的影响
}

interface DecisionPoint {
  id: string;              // 决策点 ID（macro_001 / dp_001 等）
  type: string;            // 决策类型
  question: string;        // 决策问题
  context: string;         // 上下文说明
  options: DecisionOption[];
  importance: "critical" | "normal" | "minor";
  allow_custom: boolean;   // 是否允许自定义输入
  segment_index: number;   // 关联的片段索引
}
```

**UserDecision**（用户决策，提交到 `/decide`）：
```typescript
interface UserDecision {
  decision_point_id: string;
  chosen_option_id: string | null;  // null 表示自定义
  custom_input: string | null;      // 自定义内容
  skipped: boolean;                 // 是否跳过（使用推荐值）
}
```

#### 6.4.6 RUN_FINISHED(success) 输出结构

**原有模式**（BY_STORY_BEAT 等）：
```json
{
  "outcome": "success",
  "state": {
    "segments": [GeneratedSegment, ...],
    "decisions": {"dp_001": UserDecision, ...}
  }
}
```

**HYBRID 模式**（新增 `output` 字段）：
```json
{
  "outcome": "success",
  "state": {
    "segments": [GeneratedSegment, ...],
    "decisions": {"macro_001": UserDecision, "dp_001": UserDecision, ...},
    "output": "## 第5章 xxx 细纲\n\n### 创作决策\n...\n\n### 剧情设计\n..."
  }
}
```

**前端显示逻辑**：
```typescript
function displayResult(state: FinalState) {
  if (state.output) {
    // HYBRID 模式：直接显示整合后的 Markdown
    displayMarkdown(state.output);
  } else {
    // 原有模式：拼接 segments
    const content = state.segments.map(s => s.content).join('\n\n');
    displayMarkdown(content);
  }
}
```

#### 6.4.7 典型交互流程对比

**原模式 (BY_STORY_BEAT)**：
```
start → [segment] → interrupt(dp_*) → decide → [segment] → ... → success
```

**混合模式 (HYBRID)**：
```
start
  → interrupt(macro_001)     ← Phase 1: 宏观决策
  → decide
  → interrupt(macro_002)
  → decide
  → [segment]                ← Phase 2: 剧情生成
  → interrupt(dp_001)
  → decide
  → [segment]
  → success(output)          ← Phase 3: 输出整合后的 Markdown
```

#### 6.4.8 前端最小改动

如果不需要特殊处理混合模式，**完全无需修改**：
- 决策点仍通过 `RUN_FINISHED(interrupt)` 返回
- 调用 `/decide` 提交决策的方式相同
- 最终结果仍在 `RUN_FINISHED(success)` 中返回

唯一建议：检查 `state.output` 是否存在，存在则优先显示它。

---

### 6.5 请求/响应格式

**开始生成**
```
POST /generate/chapter-outline/{project_id}/start
{
  "mode": "interactive",
  "density": "simple",
  "target_type": "new_chapter",       // 可选，不填则自动推断
  "chapter_number": 5,                // 新章节必填
  "chapter_title": "觉醒",            // 可选
  "selected_entities": ["entity_id_1", "entity_id_2"],
  "selected_skills": ["skill_id_1"],
  "force_new": false
}

Response: SSE stream
```

**提交决策**
```
POST /generate/chapter-outline/{target_id}/decide
{
  "draft_id": "draft_xxx",
  "decision": {
    "decision_point_id": "dp_001",
    "chosen_option_id": "opt_b",
    "custom_input": null,
    "skipped": false
  }
}

Response: SSE stream (继续生成)
```

**获取草稿**
```
GET /generate/chapter-outline/{target_id}/draft

Response:
{
  "has_draft": true,
  "draft": {
    "id": "draft_xxx",
    "status": "waiting_decision",
    "created_at": "2025-01-07T10:00:00Z",
    "updated_at": "2025-01-07T10:05:00Z",
    "segments": [...],
    "current_decision": {...},
    "decisions_made": {...},
    "progress": {
      "total_decisions": 3,
      "completed_decisions": 1
    }
  }
}
```

---

## 七、状态持久化

### 7.1 数据模型

**outline_drafts（细纲草稿表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| chapter_id | UUID | FK → chapters |
| user_id | UUID | FK → users |
| status | enum | generating / waiting_decision / completed / abandoned / expired |
| mode | enum | interactive / semi_auto / auto_review |
| density | enum | simple / detailed |
| selected_entities | JSON | 用户选的实体 ID 列表 |
| selected_skills | JSON | 用户选的技能 ID 列表 |
| segments | JSON | 已生成的片段列表 |
| current_decision_index | int | 当前进行到第几个决策 |
| decisions_made | JSON | 已做的决策 {point_id: UserDecision} |
| created_at | timestamp | |
| updated_at | timestamp | |
| expires_at | timestamp | 草稿过期时间（7天后） |

**outline_decision_logs（决策日志表，可选）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| draft_id | UUID | FK → outline_drafts |
| decision_point_id | str | 决策点 ID |
| decision_type | str | 决策类型 |
| options_presented | JSON | 当时展示的选项 |
| chosen_option_id | str | 用户选择 |
| custom_input | TEXT | 自定义输入 |
| skipped | bool | 是否跳过 |
| created_at | timestamp | |

### 7.2 状态恢复策略

**无状态 Agent 设计**：

Agent 每次调用都传入完整上下文，不依赖内部状态：
- 前文摘要
- 已生成的 segments
- 已做的 decisions

这样恢复时只需从数据库读取，无需处理 Agent 状态序列化。

### 7.3 草稿生命周期

```
创建 ──→ generating ──→ waiting_decision ──→ generating ──→ ...
                              ↓                    ↓
                         用户离开              全部完成
                              ↓                    ↓
                        （可恢复）            completed
                              ↓                    ↓
                     7天未操作 / 用户放弃      用户确认
                              ↓                    ↓
                      expired/abandoned        删除草稿
                              ↓              创建正式记录
                         30天后物理删除
```

---

## 八、Prompt 设计

### 8.1 Prompt 架构

```
config/prompts/
├── agents/
│   └── outline_decision.yaml      # 系统角色设定
├── decisions/
│   ├── opening_style.yaml         # 开场方式决策
│   ├── conflict_type.yaml         # 冲突类型决策
│   ├── character_decision.yaml    # 角色抉择决策
│   ├── skill_activation.yaml      # 技能启用决策
│   └── ending_hook.yaml           # 章末钩子决策
├── includes/
│   └── decision_context.yaml      # 上下文模板
└── examples/
    └── decision_examples.yaml     # Few-shot 示例
```

### 8.2 Prompt 组成

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 系统角色设定                                              │
│    - 你是资深网文编辑                                        │
│    - 选项设计原则（差异化、可行性、有依据、说人话）          │
│    - 推荐逻辑（伏笔呼应、角色弧线、节奏平衡、读者期待）      │
├─────────────────────────────────────────────────────────────┤
│ 2. Few-shot 示例                                             │
│    - 同类型决策的完整示例                                    │
│    - 展示期望的分析深度和输出格式                            │
├─────────────────────────────────────────────────────────────┤
│ 3. 上下文注入                                                │
│    - 作品信息（书名、类型、风格）                            │
│    - 主要角色及当前状态                                      │
│    - 已埋伏笔列表                                            │
│    - 可用金手指/技能                                         │
│    - 前情摘要 + 上章结尾                                     │
│    - 本章已生成内容                                          │
│    - 已做决策                                                │
├─────────────────────────────────────────────────────────────┤
│ 4. 决策点专属指令                                            │
│    - 该类型决策的分析维度                                    │
│    - 常见选项方向参考                                        │
│    - 设计要求和避免事项                                      │
├─────────────────────────────────────────────────────────────┤
│ 5. 结构化输出要求                                            │
│    - 分析（50-100字）                                        │
│    - 选项（2-4个，每个含 label/description/reason/impact）   │
│    - 推荐及理由                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 选项设计原则

| 原则 | 说明 | 反例 |
|------|------|------|
| **差异化** | 每个选项代表不同方向 | ❌ 三个选项都是「打斗」只是激烈程度不同 |
| **可行性** | 都能合理接续当前剧情 | ❌ 主角实力不够却给「碾压对手」选项 |
| **有依据** | 推荐基于具体因素 | ❌ 「这个比较好」没有理由 |
| **说人话** | 避免抽象术语 | ❌ 「采用戏剧性反讽手法」 |
| **有代价** | 每个选择有得有失 | ❌ 一个选项明显最优 |

### 8.4 各类型决策的重点

| 决策类型 | 分析重点 | 选项方向 |
|----------|----------|----------|
| 开场方式 | 节奏承接、读者情绪、场景连贯 | 动作/对话/内心/环境/悬念/时间跳跃 |
| 冲突类型 | 主线进度、近期冲突类型、待解决悬念 | 外部(人vs人/势力/环境) / 内部(价值/情感) / 信息(真相/误会) |
| 角色抉择 | 人设一致性、代价感、性格揭示 | 符合人设的 2-3 个两难选择 |
| 技能启用 | 必要性、代价、爽感、节奏、成长曲线 | 全力/有限/暂不/被动触发/失败尝试 |
| 章末钩子 | 与下章衔接、追读体验 | 悬念型/情感型/信息型/动作型 |

---

## 九、正文生成（预览确认模式）

### 9.1 与细纲生成的区别

| 维度 | 细纲生成 | 正文生成 |
|------|----------|----------|
| 交互模式 | 决策点选择 | 预览确认 |
| 决策粒度 | 粗（开场/冲突/结尾） | 细（段落/对话/描写） |
| 用户操作 | 选择选项 | 确认 / 重写 / 调整风格 |
| 暂停原因 | 需要方向决策 | 展示生成结果 |

### 9.2 预览确认流程

```
细纲片段 1: "萧炎与药老对话，揭示修炼机缘"
       ↓
InteractiveWritingAgent 生成 300-500 字正文
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 预览                                                             │
│ ──────────────────────────────────────────────────────────────── │
│ 「小子，你的身体里有一团奇特的火焰。」药老的声音在萧炎脑海中响    │
│ 起，带着几分惊讶和欣赏。                                         │
│                                                                  │
│ 萧炎微微一愣，下意识地将手放在胸口，似乎想要感受那团火焰的存在... │
│ ──────────────────────────────────────────────────────────────── │
│                                                                  │
│ [继续 ✓]  [重写 ↻]  [调整风格 ⚙]  [添加指令 +]                  │
└─────────────────────────────────────────────────────────────────┘
       ↓
用户选择操作
       ↓
继续 → 生成下一片段
重写 → 重新生成当前片段
调整风格 → 弹出风格选项后重新生成
添加指令 → 用户输入额外要求后重新生成
```

### 9.3 风格调整选项

```
┌─────────────────────────────────────────────────────────────────┐
│ 调整风格                                                         │
│                                                                  │
│ 节奏：  ○ 更紧凑（减少描写）  ● 适中  ○ 更舒缓（增加细节）       │
│                                                                  │
│ 对话：  ○ 更多对话  ● 适中  ○ 更多叙述                           │
│                                                                  │
│ 情感：  ○ 更内敛  ● 适中  ○ 更浓烈                               │
│                                                                  │
│ 自定义指令：[________________________________]                   │
│                                                                  │
│                              [取消]  [应用并重写]                │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 正文生成的决策点类型（可选触发）

对于关键场景，Agent 可以主动触发决策点：

```
WritingDecisionPointType
├── 场景类
│   ├── SCENE_PACING         # 场景节奏
│   ├── DESCRIPTION_DEPTH    # 描写详略
│   └── ATMOSPHERE           # 氛围营造
├── 对话类
│   ├── DIALOGUE_STYLE       # 对话风格
│   └── DIALOGUE_DENSITY     # 对话密度
├── 动作类
│   ├── ACTION_DETAIL        # 动作/战斗详略
│   └── POWER_DISPLAY        # 能力展示方式
└── 情感类
    ├── EMOTIONAL_INTENSITY  # 情感浓度
    └── POV_DEPTH            # 视角深度
```

**触发时机**：战斗场景、关键对话、情感高潮等，Agent 判断需要用户确认风格时触发。

### 9.5 正文生成模式

| 模式 | 行为 | 适合场景 |
|------|------|----------|
| 交互式 (interactive) | 每个片段都预览确认 | 精细打磨、重要章节 |
| 全自动 (auto) | 全部生成后统一审核 | 快速出稿、批量生成 |

### 9.6 正文草稿数据模型

**writing_drafts（正文草稿表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| chapter_id | UUID | FK → chapters |
| outline_id | UUID | 基于哪个细纲 |
| user_id | UUID | FK → users |
| status | enum | generating / waiting_confirm / completed / abandoned |
| mode | enum | interactive / auto |
| segments | JSON | 已生成的正文片段 |
| current_segment_index | int | 当前生成到第几个片段 |
| style_adjustments | JSON | 用户的风格调整记录 |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 十一、实现计划

### Phase 1：统一框架基础 ✅ (2025-01-07 完成)

- [x] InteractiveGeneratorAgent 核心类 (`agents/generator/agent.py`)
- [x] GeneratorConfig 接口定义 (`agents/generator/configs/base.py`)
- [x] StateManager 状态管理 (`agents/generator/state.py`)
- [x] DecisionHandler 决策处理 (`agents/generator/decision.py`)
- [x] DecisionDetectionAgent 决策点检测 (`agents/generator/decision_detection_agent.py`)
- [x] 统一数据模型（generator_drafts、decision_logs）(`models/generator.py`)
- [x] AG-UI 事件集成 (`agents/generator/events.py`)
- [x] 类型定义 (`agents/generator/types.py`)
- [ ] 统一 API 路由（/generate/{type}/{target_id}/...）

**代码结构重构** (2025-01-07):
- 将 `config.py` (912行) 拆分为 `configs/` 目录：
  - `configs/base.py` - 基类 + 注册表
  - `configs/chapter_outline.py` - 章节细纲配置
  - `configs/chapter_writing.py` - 章节正文配置
  - `configs/character.py` - 角色配置
  - `configs/worldbuilding.py` - 世界观配置

**Bug 修复记录**:
| Bug | 问题 | 修复 |
|-----|------|------|
| #1 | 决策后恢复生成时片段重复 | 设置 `next_segment_index = position.segment_index + 1` |
| #2 | `detect_decision_point` 重复创建数据库连接 | 添加 `session` 参数传递复用 |
| #3 | 决策摘要只有 option_id，缺少完整选项信息 | 添加 `decision_details` 字段 |
| #4 | 决策检测缺少错误处理 | 添加 try-except |
| #5 | 新章节上下文不完整 | 添加 previous_chapters、skills 等 |
| #6 | `decision_details` 恢复时丢失 | `build_generator_context` 改为 async，添加 `_restore_decision_details` |
| #7 | `_generate_segment` 资源泄漏 | 复用已有 session |
| #8 | 结构化输出处理不当 | 检测 BaseModel 并序列化为 JSON |
| #9 | `ChapterOutlineConfig` 技能加载 stage 错误 | `"outline"` 改为 `"chapter_outline"` |
| #10 | `target_id` 语义模糊（新章节时传 `project_id`） | 引入 `GenerationTarget` 类型封装目标信息 |
| #11 | `_get_project_info` 新章节时 404 | 先尝试作为章节查询，再尝试作为项目查询 |
| #12 | `_resume_generation` 不支持 HYBRID 策略 | 添加策略检查，HYBRID 调用 `_hybrid_generation_loop` |
| #13 | `generate_auto` 不支持 HYBRID 策略 | 返回 None 触发 Pipeline 回退到原有 Agent |
| #14 | 恢复时重新收集宏观决策 | 添加 `not context.macro_decisions` 检查 |
| #15 | `revert_to_decision` 非 HYBRID 模式 phase 错误 | 根据 `is_hybrid_mode` 设置正确的 phase |

### Phase 2：章节细纲生成 ✅ (2025-01-08 完成)

- [x] ChapterOutlineConfig 配置
- [x] OutlineContextBuilder 上下文构建 (`build_context` 方法)
- [x] OutlineDecisionDetector 决策点检测 (`detect_decision_point` + `DecisionDetectionAgent`)
- [x] 细纲片段生成提示词 (`get_segment_prompt` 方法)
- [x] 决策检测 Prompt (`config/prompts/agents/decision_detection.md`) - 改用单文件包含所有决策类型
- [x] 统一 API 路由实现 (`api/routes/generate.py`)
- [x] 替换现有 ChapterOutlineAgent
- [x] GenerationTarget 类型重构 - 解决 target_id 语义模糊问题
- [x] **HYBRID 混合模式实现** - 三阶段生成流程

**替换方案**:
- 添加 `InteractiveGeneratorAgent.generate_auto()` 方法 - 全自动模式，无交互直接返回结果
- 添加 `ChapterPipelineConfig.use_interactive_generator` 配置项
- 添加 `ChapterPipeline._generate_outline_with_generator()` 方法
- 保持后向兼容：默认使用传统 Agent，可通过配置切换到新框架
- 失败时自动回退到传统 Agent
- **HYBRID 策略 `generate_auto()` 返回 None**，触发 Pipeline 回退

**GenerationTarget 重构** (2025-01-08):
- 新增 `GenerationTarget` 类型封装目标信息（`types.py:142-199`）
- 修改 `generate_auto()` 和 `start_generation()` 签名使用 `target: GenerationTarget`
- 修改 `GeneratorConfig.build_context()` 签名为 `(target, session, project_id)`
- 更新所有 Config 实现（ChapterOutline/ChapterWriting/Character/Worldbuilding）
- 更新 `ChapterPipeline._generate_outline_with_generator()` 构造 GenerationTarget
- 更新 API routes 构造 GenerationTarget，新增 `target_type`/`chapter_title` 请求字段

**HYBRID 混合模式实现** (2025-01-08):
- 新增 `GenerationPhase` 枚举：`COLLECT_MACRO` / `GENERATE_PLOT` / `FINALIZE`
- 新增 `MacroDecisionType` 枚举：宏观决策类型定义
- 新增 `DecisionCollectionResult` schema：LLM 宏观决策收集输出
- `GeneratorContext` 扩展：`macro_decisions` / `pending_macro_decisions` / `macro_decisions_collected`
- `GeneratorConfig` 新增方法：
  - `collect_macro_decisions()` - 收集宏观决策（默认返回空）
  - `get_plot_generation_prompt()` - 剧情生成 prompt（融合宏观决策）
  - `assemble_final_output()` - 整合最终输出
- `InteractiveGeneratorAgent` 新增：
  - `_hybrid_generation_loop()` - 三阶段生成循环
  - `_generate_plot_segment()` - 剧情片段生成
- `StateManager` 新增：
  - `update_macro_decisions()` - 保存宏观决策
  - `update_pending_macro_decisions()` - 更新待处理宏观决策
  - `mark_macro_decisions_collected()` - 标记收集完成
  - `revert_to_decision()` 支持混合模式回退
- `ChapterOutlineConfig` 改造：
  - `segment_strategy = HYBRID`
  - 实现 `collect_macro_decisions()` - LLM 一次性分析
  - 实现 `get_plot_generation_prompt()` - 融合宏观决策
  - 实现 `assemble_final_output()` - 自然语言细纲输出
  - `get_output_type()` 返回 `None`（文本输出）

### Phase 3：章节正文生成

- [x] ChapterWritingConfig 配置（骨架）
- [ ] WritingContextBuilder 上下文构建
- [ ] 预览确认交互模式
- [ ] 风格调整功能
- [ ] 前端 WritingPanel
- [ ] 增强现有 WritingAgent

### Phase 4：设定生成

- [x] CharacterConfig 角色生成（骨架）
- [x] WorldbuildingConfig 世界观生成（骨架）
- [ ] LocationConfig 地点生成
- [ ] PowerSystemConfig 力量体系生成
- [ ] 各场景的决策点 Prompt

### Phase 5：大纲体系

- [ ] BookOutlineConfig 全书大纲
- [ ] VolumeOutlineConfig 卷纲
- [ ] 大纲→卷纲→章纲的级联生成

### Phase 6：优化与扩展

- [ ] 性能优化（流式响应、状态同步）
- [ ] Prompt 调优（基于实际效果）
- [ ] 用户偏好学习
- [ ] 模板系统

---

## 十二、设计决策记录

以下问题已在设计讨论中确定：

| 问题 | 决策 | 理由 |
|------|------|------|
| 决策点顺序 | **动态识别** | Agent 根据内容判断何时需要用户参与，更自然 |
| 自定义输入处理 | **直接使用** | 不做额外转化，保持用户意图原貌 |
| 决策回退粒度 | **回退到上一决策点，之后重来** | 平衡复杂度和用户体验 |
| 与 ChapterOutlineAgent 关系 | **直接替换** | 全自动模式 ≈ 原功能 + 决策日志 |
| WritingAgent 处理方式 | **预览确认模式** | 正文的决策点太细碎，预览确认更自然 |
| 架构方式 | **统一框架 + 场景配置** | 高复用、一致体验、易扩展 |

---

## 十三、后续扩展方向

1. **更多生成场景**：
   - 对话生成（角色对话专项）
   - 战斗场景生成（战斗描写专项）
   - 情感场景生成（感情戏专项）

2. **协作功能**：
   - 多人协作：决策点可分配给不同协作者
   - 审核流程：编辑审核作者的决策

3. **智能化**：
   - 学习用户偏好：根据历史决策自动调整推荐
   - 风格迁移：学习特定作品风格后应用

4. **模板系统**：
   - 保存常用决策偏好作为模板
   - 分享模板给其他用户

5. **分析功能**：
   - 决策历史分析
   - 生成质量统计
   - 用户行为洞察
