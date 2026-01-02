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
│   ├── layout/       # 布局组件 (MainLayout, AppSidebar, TerminalLog)
│   ├── dashboard/    # 仪表盘组件
│   ├── theme/        # 主题切换器
│   └── providers.tsx # React Query + TooltipProvider
├── stores/           # Zustand 状态管理
│   └── theme-store.ts # 主题状态，支持持久化
├── hooks/            # 自定义 hooks
└── lib/              # 工具函数 (cn 等)
```

### 主题系统

应用支持三套主题，通过 `data-theme` 属性切换：

- `cyberpunk` (默认): 深色科技风，荧光绿 + 电光紫
- `ink`: 墨韵白，宣纸质感，水墨灰 + 朱砂红
- `bamboo`: 竹青绿，护眼舒适，竹青绿 + 金秋橙

主题变量定义在 `globals.css` 中，使用 CSS 自定义属性。主题状态由 `useThemeStore` (Zustand) 管理并持久化到 localStorage。

### 核心布局

`MainLayout` 组件定义了主要布局：
- 左侧: `AppSidebar` - 导航菜单
- 中间: 主内容区
- 底部: `TerminalLog` - 终端风格日志面板 (可折叠)

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
