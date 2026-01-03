这是一个非常棒的构思。你想要的是一个兼具**工具属性**（高效率、重交互）和**极客美学**（Tech Vibe）的现代化 Dashboard。

针对“Vibe Coding”（即利用 AI 辅助编程，如 Cursor, Windsurf, v0.dev）以及你对 shadcn/ui 的偏好，我为你制定了一套目前最前沿、开发效率最高、且最能体现“技术牛逼感”的技术栈方案。

### 🚀 核心推荐：The "Vibe Stack" (2025 Edition)

这一套组合是目前 AI 辅助编程表现最好的生态，Cursor 等工具对这套技术栈的代码生成质量最高。

#### 1. 核心框架：**Next.js 16 (App Router)**

* **为什么选它：** 它是 React 的元框架。目前的 AI 编程工具对 React 组件的理解最深。Next.js 的 Server Actions 非常适合处理你“拆书”时的长连接请求和数据流传输。
* **优势：** 极佳的路由管理，方便做页面切换（项目列表 -> 拆书界面 -> 详情页）。

#### 2. UI 组件库：**shadcn/ui + Tailwind CSS**

* **为什么选它：** 你提到了 shadcn，这是绝对的正确选择。它不是一个 npm 包，而是把代码复制到你的项目中。
* **微调优势：** 因为代码在你的项目里，你可以随意修改 Button 的圆角、Input 的光晕效果，非常适合你后期的“手动微调”。
* **Vibe Coding 兼容性：** 满分。你告诉 AI “给我一个 shadcn 风格的深色卡片”，它能 100% 完美生成。

#### 3. 增加“技术感”的秘密武器：**Magic UI** 或 **Aceternity UI**

* **核心痛点解决：** shadcn 提供了基础的干净整洁，但如果你想要“我的技术很牛”的感觉，你需要**动效**和**粒子效果**。
* **推荐组件：**
* **Border Beam (流光边框)：** 用在“拆书进度”卡片周围，显示 AI 正在工作的状态。
* **Meteor Effect (流星效果)：** 用在登录页或 Dashboard 背景。
* **Text Reveal (文字渐显)：** 当 AI 提取出“世界观”时，文字像黑客终端一样逐字打出。



#### 4. 状态管理与数据交互：**Zustand + TanStack Query (React Query)**

* **场景：** 拆书是一个耗时操作。你需要轮询或者通过 WebSocket 接收进度。React Query 是管理这些异步状态的神器，能轻松实现“加载中”、“错误”、“重新提取”等状态管理。

---

### 🎨 如何打造“技术感” (The Tech Aesthetic)

要让用户觉得“技术很牛”，不仅靠功能，更靠**视觉语言**。以下是针对你“拆书工具”的设计建议：

#### 1. 配色方案：Cyberpunk / Obsidian

* **背景：** 纯黑 (`#000000`) 或 极深灰 (`#09090b`)，不要用浅灰。
* **主色调：** 荧光绿 (Terminal Green) 或 电光紫 (Electric Purple)。
* **边框：** 极细的灰色边框 (`border-white/10`)，配合高亮选中态。

#### 2. 字体选择 (至关重要)

* 不要使用默认字体。
* **标题/正文：** **Inter** 或 **Geist Sans** (Vercel 出品，非常现代)。
* **数据/代码/提取内容：** **JetBrains Mono** 或 **Geist Mono**。
* *关键点：* 当展示“世界观设定”或“金手指参数”时，使用等宽字体（Monospace），这会瞬间拉高“数据分析”的专业感。



#### 3. 核心界面设计构思

**A. 项目导入与拆书中心 (Splitter Hub)**

* **视觉：** 使用类似 IDE（如 VS Code）的布局。左侧是章节树状图，中间是主要内容，右侧是 AI 分析面板。
* **交互：**
* 上传小说时，使用一个**Animated Progress Bar**，不仅仅显示百分比，还要显示“正在解析第 N 章...”、“正在构建人物关系图谱...”。这种“暴露系统思考过程”的设计最能体现技术感。



**B. 拆书进度 (The Process)**

* 不要只给一个转圈圈的 Loading。
* **建议：** 使用“终端日志”风格的输出。
> `[INFO] Extracting Chapter 1... Done (200ms)`
> `[ANALYSIS] Detected Entity: "萧炎" (Protagonist)`
> `[WARN] Ambiguous location detected, refining...`


* 让文字飞快地滚动，配合 **Magic UI** 的 `Number Ticker`，让用户感觉后台有强大的算力在支撑。

**C. 结果展示 (Knowledge Graph)**

* **人物/世界观展示：** 不要只用表格。尝试引入 **React Flow** 或 **Echarts**。
* 当用户点击“人物”，弹出一个节点关系图（Node Graph），显示该人物与其他角色的连接线。这比纯文本看起来“牛”十倍。

---

### 🛠️ 推荐的 Vibe Coding 工作流

为了让你快速落地这个项目，建议采用以下工作流：

1. **初始化：** 使用 `Next.js` + `shadcn/ui` 初始化项目。
2. **生成器：** 使用 **v0.dev** (Vercel 出品)。
* *Prompt 示例：* "Create a dark mode dashboard for a novel writing assistant. It should have a sidebar navigation, a main area with a glass-morphism card for uploading files, and a terminal-like log window at the bottom. Use a tech-savvy font."
* v0 会直接生成 React 代码，你复制过来即可。


3. **编辑器：** 使用 **Cursor**。
* 把 `Magic UI` 的组件文档喂给 Cursor，让它帮你把普通的 shadcn 卡片升级成带有流光效果的卡片。



### 📊 总结：你的技术选型清单

| 模块 | 技术选型 | 理由 |
| --- | --- | --- |
| **框架** | **Next.js 16** | 行业标准，生态最强，方便扩展 API |
| **语言** | **TypeScript** | 必须，保证项目可维护性 |
| **样式** | **Tailwind CSS** | 现代开发必备，Vibe Coding 基础 |
| **组件库** | **shadcn/ui** | 干净、可控、高质量 |
| **特效库** | **Magic UI / Aceternity** | **核心差异化来源**，提供炫酷动效 |
| **图标** | **Lucide React** | 简洁统一 |
| **可视化** | **React Flow** | 用于展示人物关系图谱 |
| **字体** | **Geist Mono** | 营造黑客/极客氛围 |

---

## 📐 设计原则 (2025.01 更新)

### 核心理念：高技术力 + 易用性

**视觉上有张力，交互上克制**

### 视觉层次
- 信息密度适中：数据丰富但不拥挤，用卡片分组
- 对比明确：主操作突出，次要操作淡化
- 留白有节奏：密集数据区 vs 呼吸区交替

### 科技感元素（克制使用）
| 元素 | 用法 | 场景 |
|------|------|------|
| 网格背景 `bg-grid` | 全局底层 | 所有页面 |
| 发光效果 `glow-*` | 重要元素点缀 | 按钮、卡片焦点 |
| 等宽字体 `font-mono` | 数据/ID/代码 | 分析日志、统计数字 |
| 玻璃态 `backdrop-blur` | 浮层/模态框 | Dialog、Sheet |
| 微动效 | hover/进入时 | 卡片、列表项 |

### 易用性原则
- 一致的交互模式：同类操作同样入口
- 渐进式披露：先简单，展开更多
- 即时反馈：loading skeleton、toast 通知

---

## 📦 扩展库选型

### 必装
```bash
pnpm add framer-motion       # 页面切换、列表动画、手势
pnpm add recharts            # 统计图表（兼容 shadcn 风格）
pnpm add @xyflow/react       # 节点连线图（人物关系、剧情线）
```

### 可选增强
```bash
pnpm add @tsparticles/react  # 粒子背景（首页空状态点缀）
pnpm add @dnd-kit/core       # 拖拽排序（剧情大纲）
```

### 组件资源
- **Magic UI** (magicui.design) - 科技感组件，兼容 shadcn
- **Aceternity UI** (ui.aceternity.com) - 高级动效组件

---

## 🗂️ 功能模块 UI 规划

### 工作区

#### 作品中心 `/`
> 作品列表管理，用户的小说项目入口

| 组件 | 用途 |
|------|------|
| Card + CardHeader | 作品卡片，封面/标题/进度 |
| Badge | 状态标签（分析中/已完成/草稿）|
| Progress | 分析进度条 |
| DropdownMenu | 卡片操作菜单（编辑/删除/导出）|
| Dialog | 新建作品弹窗 |
| Skeleton | 加载占位 |
| EmptyState (自定义) | 空状态引导，可加粒子背景 |

**布局**：响应式网格 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

#### 设定提取 `/analyze`
> 上传小说、配置分析参数、查看分析进度

| 组件 | 用途 |
|------|------|
| Tabs | 切换：上传 / 分析中 / 历史 |
| Input + Label | 表单字段 |
| Select | 分析模式选择 |
| Textarea | 文本粘贴输入 |
| Progress + Steps (自定义) | 多步分析进度 |
| Alert | 提示/警告信息 |
| ScrollArea | 日志滚动区域（终端风格）|

**特效**：分析进行时显示脉冲动画 `animate-pulse`

**终端日志示例**：
```
[INFO] Extracting Chapter 1... Done (200ms)
[ANALYSIS] Detected Entity: "萧炎" (Protagonist)
[WARN] Ambiguous location detected, refining...
```

#### 创意工具 `/ideas`
> AI 辅助创作工具集

| 组件 | 用途 |
|------|------|
| Card | 工具卡片入口 |
| Sheet | 侧滑面板展开工具 |
| Textarea | 输入区 |
| Button | 生成操作 |
| Collapsible | 折叠历史记录 |

---

### 设定集

> **通用筛选器**：所有设定集页面顶部需包含小说筛选器
> - 默认选中最近分析的一本小说
> - 支持多选（查看跨作品对比）
> - 组件：`NovelFilter` (自定义 MultiSelect)

#### 世界观 `/worldview`
> 提取的世界设定展示：时代背景、地理、势力、规则

| 组件 | 用途 |
|------|------|
| **NovelFilter (通用)** | 小说多选筛选器 |
| Accordion | 分类折叠（地理/势力/魔法体系等）|
| Card | 设定条目卡片 |
| Badge | 分类标签 + 来源小说标签 |
| HoverCard | 悬浮预览详情 |
| Timeline (自定义) | 历史事件时间轴 |
| Command | 快速搜索设定 |

**特效**：卡片 hover 微升 + 边框发光

#### 人物图谱 `/characters`
> 人物列表与详情

| 组件 | 用途 |
|------|------|
| **NovelFilter (通用)** | 小说多选筛选器 |
| Avatar | 人物头像（AI 生成或首字母）|
| Card | 人物卡片 |
| Badge | 阵营/身份标签 + 来源小说 |
| Sheet / Dialog | 人物详情面板 |
| Tabs | 详情内切换（基本信息/关系/事件）|
| DataTable (shadcn) | 人物列表视图 |

**布局**：支持网格视图 / 列表视图切换

#### 剧情大纲 `/storylines`
> 章节结构、剧情线、情节点

| 组件 | 用途 |
|------|------|
| **NovelFilter (通用)** | 小说多选筛选器 |
| Accordion | 卷/章节折叠 |
| Tree (自定义) | 剧情线层级结构 |
| Card | 情节点卡片 |
| Badge | 情节类型（冲突/转折/高潮）|
| Progress | 章节分析覆盖度 |
| Collapsible | 章节详情展开 |

**可选**：拖拽排序 `@dnd-kit/core`

#### 关系网络 `/relations`
> 人物关系可视化（核心亮点功能）

| 组件 | 用途 |
|------|------|
| **NovelFilter (通用)** | 小说多选筛选器 |
| **@xyflow/react** | 核心关系图 |
| MiniMap (xyflow) | 小地图导航 |
| Controls (xyflow) | 缩放控制 |
| Sheet | 点击节点显示详情 |
| Select | 筛选关系类型 |
| Legend (自定义) | 关系类型图例 |

**节点设计**：Avatar + 名字，边带标签（敌对/盟友/亲属），多选时不同小说用不同边框色区分

**交互**：
- 点击节点：高亮相关连线
- 双击节点：打开人物详情
- 拖拽画布：平移视图

---

## 🧩 通用组件清单

### 已有 (shadcn/ui)
```
button, card, input, label, tabs, scroll-area, separator,
sheet, tooltip, progress, badge, dialog, dropdown-menu,
avatar, skeleton, sidebar
```

### 需要添加 (shadcn/ui)
```bash
pnpm dlx shadcn@latest add accordion alert collapsible \
  command hover-card select textarea table
```

### 需要自定义
| 组件 | 用途 |
|------|------|
| `NovelFilter` | 小说多选筛选器（设定集通用），基于 Popover + Checkbox |
| `EmptyState` | 空状态组件，可加粒子背景 |
| `Timeline` | 时间轴 |
| `Steps` | 步骤指示器 |
| `StatCard` | 统计数字卡片（带数字跳动动效）|
| `Tree` | 树形结构 |
| `Legend` | 图例 |

---

## 🚦 开发优先级

### Phase 1: 基础框架
1. ✅ 项目初始化 (Next.js + shadcn)
2. ✅ 主题系统 (ink/cyberpunk/bamboo)
3. ✅ 布局框架 (MainLayout + AppSidebar)
4. ⬜ 安装扩展库 (framer-motion, recharts, xyflow)

### Phase 2: 核心功能
1. ⬜ 作品中心 `/` - 用户入口
2. ⬜ 设定提取 `/analyze` - 核心流程
3. ⬜ 人物图谱 `/characters` - 结果展示

### Phase 3: 亮点功能
1. ⬜ 关系网络 `/relations` - 可视化图谱
2. ⬜ 世界观 `/worldview` - 设定展示
3. ⬜ 剧情大纲 `/storylines` - 结构展示

### Phase 4: 增强
1. ⬜ 创意工具 `/ideas` - AI 辅助
2. ⬜ 动效优化 (Magic UI 组件)
3. ⬜ 性能优化 + PWA