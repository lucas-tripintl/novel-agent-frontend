# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Astra Codex 是一个智能小说分析 (拆书) 工具的前端应用，用于 AI 驱动的小说世界观提取、人物分析和章节解析。

技术栈: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui

## 常用命令

```bash
# 开发
pnpm dev          # 启动开发服务器 (http://localhost:3000)

# 构建
pnpm build        # 生产构建

# 代码检查
pnpm lint         # ESLint 检查
```

## 架构

### 目录结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── layout.tsx    # 根布局，配置 Geist 字体和 Providers
│   ├── page.tsx      # 首页，渲染 MainLayout + DashboardContent
│   └── globals.css   # 全局样式和主题定义
├── components/
│   ├── ui/           # shadcn/ui 组件 (new-york 风格)
│   ├── layout/       # 布局组件 (MainLayout, AppSidebar)
│   ├── dashboard/    # 仪表盘组件
│   ├── theme/        # 主题切换器 (ThemeSwitcher, ThemeSwitcherCompact)
│   └── providers.tsx # React Query + TooltipProvider
├── stores/           # Zustand 状态管理
│   └── theme-store.ts # 主题状态 + 主题配置定义
├── hooks/            # 自定义 hooks (use-mobile)
└── lib/              # 工具函数 (cn 等)
```

### 主题系统

应用支持三套主题，通过 `data-theme` 属性切换：

- `ink` (默认): 墨韵白，宣纸质感，水墨灰调
- `cyberpunk`: 科技黑，深色科技风，荧光绿 + 电光紫
- `bamboo`: 竹青绿，护眼舒适，竹青绿 + 金秋橙

主题变量定义在 `globals.css` 中，使用 CSS 自定义属性。主题状态由 `useThemeStore` (Zustand) 管理并持久化到 localStorage (key: `novel-agent-theme`)。

切换器组件：
- `ThemeSwitcher`: 下拉菜单式，带颜色预览
- `ThemeSwitcherCompact`: 按钮式，循环切换

### 核心布局

`MainLayout` 组件定义了主要布局：
- 左侧: `AppSidebar` - 可折叠导航菜单 (collapsible="icon")
- 右侧: `SidebarInset` - 主内容区，含顶部 header (带 SidebarTrigger) 和 main

### 导航结构 (AppSidebar)

**工作区**：作品中心、设定提取、创意工具

**设定集**：世界观、人物图谱、剧情大纲、关系网络

**底部**：主题切换、设置、用户信息

### 状态管理

- **TanStack Query**: 异步数据获取 (配置在 `providers.tsx`)
- **Zustand**: 客户端状态 (主题等)

### 样式约定

- 使用 Tailwind CSS 类名
- 发光效果: `glow-primary`, `glow-accent`, `glow-green`
- 等宽字体: `font-mono` (用于数据/代码展示)
- 自定义颜色: `neon-green`, `neon-purple`, `neon-cyan`

## 添加 shadcn/ui 组件

```bash
pnpm dlx shadcn@latest add <component-name>
```

组件配置见 `components.json`，别名: `@/components/ui`

---

## 设计原则

### 核心理念：高技术力 + 易用性

**视觉上有张力，交互上克制**

### 视觉层次
- 信息密度适中：数据丰富但不拥挤，用卡片分组
- 对比明确：主操作突出，次要操作淡化
- 留白有节奏：密集数据区 vs 呼吸区交替

### 科技感元素（克制使用）
- 网格背景 `bg-grid` - 全局底层
- 发光效果 `glow-*` - 重要元素点缀
- 等宽字体 `font-mono` - 数据/ID/代码
- 玻璃态 `backdrop-blur` - 浮层/模态框
- 微动效 - hover/进入时，不自动播放

### 易用性原则
- 一致的交互模式：同类操作同样入口
- 渐进式披露：先简单，展开更多
- 即时反馈：loading skeleton、toast 通知

---

## 扩展库选型

### 动效
```bash
pnpm add framer-motion       # 页面切换、列表动画、手势
```

### 数据可视化
```bash
pnpm add recharts            # 统计图表（兼容 shadcn 风格）
pnpm add @xyflow/react       # 节点连线图（人物关系、剧情线）
```

### 可选增强
```bash
pnpm add @tsparticles/react  # 粒子背景（首页空状态点缀）
```

### 组件资源
- **Magic UI** (magicui.design) - 科技感组件，兼容 shadcn
- **Aceternity UI** (ui.aceternity.com) - 高级动效组件

---

## 功能模块 UI 规划

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
| ScrollArea | 日志滚动区域 |

**特效**：分析进行时显示脉冲动画 `animate-pulse`

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
> - 组件：`MultiSelect` 或 `Combobox` with checkbox

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
> 人物关系可视化

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

## 通用组件清单

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
- `NovelFilter` - 小说多选筛选器（设定集通用）
- `EmptyState` - 空状态组件
- `Timeline` - 时间轴
- `Steps` - 步骤指示器
- `StatCard` - 统计数字卡片（带数字跳动动效）
