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

### 枚举本地化系统

后端 API 返回的枚举值（如 `protagonist`、`supporting`）需要在前端显示为中文（如"主角"、"配角"）。

#### 核心机制

1. **枚举数据来源**: 后端 `/enums` API 返回枚举定义
2. **状态管理**: `src/stores/enum-store.ts` (Zustand) 缓存枚举数据
3. **初始化**: `src/hooks/use-enums-init.ts` 在应用启动时加载枚举

#### 可用枚举类型

| 枚举名 | 用途 | 示例值 |
|--------|------|--------|
| `EntityType` | 实体类型 | character → 角色, worldview → 世界观 |
| `CharacterRole` | 角色类型 | protagonist → 主角, supporting → 配角 |
| `CharacterImportance` | 角色重要性 | core → 核心角色, important → 重要角色 |
| `WorldviewCategory` | 世界观类别 | geography → 地理环境, power_system → 力量体系 |
| `SourceType` | 来源类型 | extracted → AI提取, manual → 手动添加 |

#### 使用方法

```tsx
import { useEnumStore } from "@/stores/enum-store";

function MyComponent() {
  // 订阅 loaded 状态确保枚举加载后重渲染
  const enumsLoaded = useEnumStore((state) => state.loaded);
  const getLabel = useEnumStore((state) => state.getLabel);

  // 获取本地化标签
  const label = getLabel("CharacterRole", "protagonist"); // 返回 "主角"
}
```

#### 通用标签本地化函数

当标签可能来自多个枚举时，使用通用函数：

```tsx
function getTagLabel(tag: string, getLabel: (enumName: string, value: string) => string): string {
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(tag)) return tag;

  // 尝试从各种枚举获取标签
  const enums = ["CharacterRole", "CharacterImportance", "WorldviewCategory", "EntityType"];
  for (const enumName of enums) {
    const label = getLabel(enumName, tag);
    if (label !== tag) return label;
  }
  return tag;
}
```

#### 需要注意本地化的文件

| 文件 | 说明 |
|------|------|
| `src/app/worldview/page.tsx` | 世界观页面，使用 `WorldviewCategory` |
| `src/app/characters/page.tsx` | 人物页面，使用 `CharacterRole`, `CharacterImportance` |
| `src/components/write/settings/entity-browser.tsx` | 设定浏览器，标签本地化 |
| `src/components/write/editor/entity-editor.tsx` | 设定编辑器，标签和属性本地化 |

#### 实体数据结构

API 返回的实体包含结构化属性：

```typescript
interface EntityRead {
  id: string;
  name: string;
  content: string;           // 纯文本内容
  tags: string[];            // 标签（需本地化）
  entity_type: EntityType;   // 实体类型
  attributes?: {             // 结构化属性
    role?: string;           // 角色类型 (CharacterRole)
    importance?: string;     // 重要性 (CharacterImportance)
    category?: string;       // 世界观类别 (WorldviewCategory)
    personality?: string[];  // 性格特点
    abilities?: string[];    // 能力
    power_level?: string;    // 力量等级
    // ...
  };
  metadata_?: {              // 元数据
    aliases?: string[];      // 别名
  };
}
```

**注意**: `content` 通常是纯文本，结构化数据在 `attributes` 中。

### 样式约定

- 使用 Tailwind CSS 类名
- 发光效果: `glow-primary`, `glow-accent`, `glow-green`
- 等宽字体: `font-mono` (用于数据/代码展示)
- 自定义颜色: `neon-green`, `neon-purple`, `neon-cyan`

### 页面标题样式

**H1 大标题**（页面主标题）:
```tsx
<h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
  <Icon className="h-6 w-6 text-primary" />
  页面标题
</h1>
```
- 必须包含 `tracking-tight`
- 如有图标，使用 `flex items-center gap-2`
- 图标尺寸: `h-6 w-6 text-primary`

**页面副标题**（标题下方描述文字）:
```tsx
<p className="text-muted-foreground mt-1 text-sm">
  页面描述文字
</p>
```
- 必须包含 `text-sm`
- 使用 `mt-1` 与标题保持间距

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

## 设计规范

> 参考标杆页面: `/entities`, `/skills` (左侧分类导航 + 右侧滚动内容)

### 页面布局

**标准列表页布局** (适用于设定库、技法库等带分类筛选的页面):

```tsx
<div className="flex flex-col h-full overflow-hidden">
  {/* 标题区 - 固定 */}
  <div className="shrink-0 pb-4 border-b border-border/40">
    <h1>页面标题</h1>
    {/* 筛选栏：项目筛选、搜索框、统计 */}
  </div>

  {/* 主内容区：左侧导航 + 右侧卡片 */}
  <div className="flex flex-1 min-h-0 pt-4 gap-6">
    {/* 左侧分类导航 - 固定不滚动 */}
    <nav className="shrink-0 w-40">
      <div className="space-y-1">
        {/* 分类按钮 */}
      </div>
    </nav>

    {/* 右侧内容区 - 独立滚动 */}
    <div className="flex-1 min-w-0">
      <ScrollArea className="h-full">
        <div className="pr-4">
          {/* 卡片网格 */}
        </div>
      </ScrollArea>
    </div>
  </div>
</div>
```

**简单列表页布局** (适用于作品中心、融合任务等无分类导航的页面):

```tsx
<div className="space-y-8">
  {/* 标题 + 操作按钮 */}
  <div className="flex items-center justify-between">...</div>

  {/* 搜索栏 */}
  <div className="flex items-center gap-4">...</div>

  {/* 卡片网格 */}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">...</div>
</div>
```

### 侧边分类导航

```tsx
const categoryIcons: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="h-4 w-4" />,
  category_a: <IconA className="h-4 w-4" />,
  // ...
};

<button
  className={cn(
    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
    "hover:bg-accent/50",
    isActive
      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
      : "text-muted-foreground hover:text-foreground border border-transparent"
  )}
>
  <span className={cn(
    "transition-colors",
    isActive ? "text-primary" : "text-muted-foreground/70"
  )}>
    {Icon}
  </span>
  <span className="truncate">{label}</span>
</button>
```

### 卡片样式

**标准卡片**:
```tsx
<Card className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group flex flex-col">
  <CardHeader className="pb-3">
    {/* 顶部：徽章 + 时间 */}
  </CardHeader>
  <CardContent className="flex flex-col flex-1 space-y-3">
    {/* 内容 */}

    {/* 底部按钮 - 固定在底部 */}
    <div className="flex gap-2 mt-auto pt-2">
      <Button variant="outline" size="sm" className="flex-1">
        <Eye className="mr-2 h-4 w-4" />
        查看
      </Button>
    </div>
  </CardContent>
</Card>
```

**关键类名**:
- 卡片容器: `bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md`
- 底部按钮: `variant="outline" size="sm" className="flex-1"`
- 底部按钮容器: `flex gap-2 mt-auto pt-2`

### 网格布局

```tsx
// 标准三列网格
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
```

**不要**使用 4 列或更多列，保持信息密度适中。

### 空状态

```tsx
<Card className="bg-card/30 border-dashed border-2 border-border/50">
  <CardContent className="flex flex-col items-center justify-center py-16">
    {/* 图标 - 直接使用，不要加圆形背景 */}
    <IconName className="h-12 w-12 text-muted-foreground/50 mb-4" />
    <h3 className="text-lg font-semibold mb-2">标题</h3>
    <p className="text-muted-foreground text-center max-w-sm">描述文字</p>
    <Button variant="outline" className="mt-4">操作按钮</Button>
  </CardContent>
</Card>
```

**关键点**:
- 图标: `h-12 w-12 text-muted-foreground/50` (不要加圆形背景)
- 卡片: `border-dashed border-2`

### 搜索功能

使用前端过滤（适用于数据量 < 100 条的场景）:

```tsx
const [searchQuery, setSearchQuery] = useState("");

const filteredItems = useMemo(() => {
  const items = data?.items ?? [];
  if (!searchQuery.trim()) return items;
  const query = searchQuery.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(query));
}, [data?.items, searchQuery]);

// 搜索框
<div className="relative flex-1 max-w-sm">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="搜索..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 bg-background/50"
  />
</div>
```

### 无限滚动

使用 IntersectionObserver 监听底部 sentinel:

```tsx
const scrollRef = useRef<HTMLDivElement>(null);
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const sentinel = sentinelRef.current;
  if (!sentinel) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    {
      root: scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]"),
      rootMargin: "100px",
      threshold: 0,
    }
  );

  observer.observe(sentinel);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

### 分类切换时重置滚动

```tsx
const handleCategoryChange = useCallback((category: string) => {
  setCategory(category);
  if (scrollRef.current) {
    const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = 0;
    }
  }
}, []);
```

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
| Card | 作品卡片 (标准卡片样式) |
| Badge | 状态标签（分析中/已完成）+ 类型标签 |
| Progress | 分析进度条（仅分析中显示）|
| DropdownMenu | 卡片操作菜单（编辑/删除）|
| Input + Search | 搜索框（前端过滤）|
| Skeleton | 加载占位 |

**布局**：简单列表页布局 + 三列网格 `md:grid-cols-2 xl:grid-cols-3`

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
- `NovelFilter` - 小说筛选器（设定集通用）
- `Timeline` - 时间轴
- `Steps` - 步骤指示器

---

## 已实现页面一览

| 页面 | 路径 | 布局类型 | 特性 |
|------|------|----------|------|
| 作品中心 | `/` | 简单列表页 | 搜索、三列网格 |
| 设定库 | `/entities` | 标准列表页 | 侧边分类导航、无限滚动 |
| 技法库 | `/skills` | 标准列表页 | 侧边分类导航、阶段/可见性筛选 |
| 元素融合 | `/fusion` | 简单列表页 | 搜索、三列网格 |
