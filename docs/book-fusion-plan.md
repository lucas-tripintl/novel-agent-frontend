# 拆书与融合模块 UI 规划

> 扩展 Astra Codex 的核心能力：从「分析」到「创造」

---

## 架构梳理

### 现有页面与拆书功能的对应关系

| 现有页面 | 功能定位 | 对应后端 |
|---------|---------|---------|
| **作品中心** `/` | 项目列表管理 | `project list` |
| **设定提取** `/analyze` | 上传 → 分析入口 | `book import` + `book analyze` |
| **设定集**（世界观/人物/剧情/关系）| 按类型展示分析结果 | entity 查询 |

### 增强方向

不新增「拆书工坊」页面，而是**增强现有页面** + **新增融合模块**：

| 页面 | 改动 |
|------|------|
| **作品中心** `/` | 增强为书库管理，展示导入状态、分析进度 |
| **设定提取** `/analyze` | 增强导入向导，支持章节预览、范围选择 |
| `/projects/:id` | **新增**：单本书详情页（章节列表、设定汇总、续写入口）|
| **设定集** | 保持现有，按类型展示，支持 NovelFilter 跨书筛选 |
| **元素融合** `/fusion` | **新增**：融合功能入口 |
| **元素库** `/elements` | **新增**：抽象模式库（PATTERN 级别）|

### 数据层级区分

| 页面 | 数据级别 | 展示内容 |
|------|---------|---------|
| **设定集** | `INSTANCE` | 具体实体：「萧炎」「斗气九段」「云岚宗」 |
| **元素库** | `PATTERN` | 抽象模式：「废柴逆袭原型」「线性等级突破」|

---

## 导航结构

```tsx
// app-sidebar.tsx 更新

const mainNavItems = [
  { title: "作品中心", icon: FolderOpen, href: "/" },
  { title: "设定提取", icon: Zap, href: "/analyze" },
  { title: "创意工具", icon: Sparkles, href: "/ideas" },
];

const analysisNavItems = [
  { title: "世界观", icon: Earth, href: "/worldview" },
  { title: "人物图谱", icon: Users, href: "/characters" },
  { title: "剧情大纲", icon: FileText, href: "/storylines" },
  { title: "关系网络", icon: Network, href: "/relations" },
];

// 新增：创意工坊
const creationNavItems = [
  { title: "元素融合", icon: Blend, href: "/fusion" },
  { title: "元素库", icon: Library, href: "/elements" },
];
```

---

## 作品中心增强 `/`

### 现有功能
- 作品卡片列表
- 统计数字

### 增强内容

**项目状态扩展**：
```tsx
const projectStatusVariants = {
  draft: "bg-muted text-muted-foreground border-border",
  importing: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  analyzing: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const projectStatusLabels = {
  draft: "草稿",
  importing: "导入中",
  analyzing: "分析中",
  completed: "已完成",
  failed: "失败",
};
```

**项目类型标记**：
```tsx
const projectTypeLabels = {
  original: "原创",
  imported: "拆书",      // 导入的原作
  continuation: "续写",  // 基于原作的续写
  fusion: "融合",        // 融合生成的项目
};
```

**卡片信息扩展**：
```tsx
<Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group cursor-pointer overflow-hidden">
  {/* 封面区 */}
  <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 relative">
    <Sparkles className="h-12 w-12 text-primary/40" />

    {/* 项目类型徽章 */}
    <div className="absolute top-2 left-2">
      <Badge variant="secondary" className="text-xs">
        {projectTypeLabels[project.type]}
      </Badge>
    </div>

    {/* 状态徽章 */}
    {project.status !== "completed" && (
      <div className="absolute top-2 right-2">
        <StatusBadge status={project.status} />
      </div>
    )}

    {/* 进度条 */}
    {(project.status === "importing" || project.status === "analyzing") && (
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80">
        <Progress value={project.progress} className="h-1" />
        <span className="text-[10px] font-mono text-primary mt-1 block text-center">
          {project.analyzedChapters}/{project.totalChapters} 章
        </span>
      </div>
    )}
  </div>

  {/* 信息区 */}
  <CardContent className="p-3 space-y-1.5">
    <h3 className="font-semibold text-sm truncate">{project.title}</h3>
    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
      <div className="flex items-center gap-1">
        <FileText className="h-3 w-3" />
        <span className="font-mono">{project.totalChapters}</span>
      </div>
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        <span className="font-mono">{project.stats.characters}</span>
      </div>
      <div className="flex items-center gap-1">
        <Earth className="h-3 w-3" />
        <span className="font-mono">{project.stats.worldview}</span>
      </div>
    </div>
  </CardContent>
</Card>
```

**操作按钮增强**：
```tsx
<div className="flex items-center gap-3">
  <Button variant="outline" asChild>
    <Link href="/analyze">
      <Upload className="mr-2 h-4 w-4" />
      导入书籍
    </Link>
  </Button>
  <Button asChild className="glow-green">
    <Link href="/projects/new">
      <Plus className="mr-2 h-4 w-4" />
      新建作品
    </Link>
  </Button>
</div>
```

---

## 设定提取增强 `/analyze`

### 现有功能
- Tabs: 上传 / 分析中 / 历史

### 增强内容

#### Tab 1: 上传（增强为导入向导）

**三步流程**：
1. 上传文件 → 2. 章节预览 → 3. 开始导入

**步骤 1: 上传文件**
```tsx
<Card className="bg-card/30 border-dashed border-2 border-border/50 hover:border-primary/30 transition-colors">
  <CardContent className="flex flex-col items-center justify-center py-16">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
      <Upload className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-2">拖拽文件到此处</h3>
    <p className="text-muted-foreground text-center max-w-sm mb-4">
      支持 .epub、.txt、.md 格式
    </p>
    <Button variant="outline">
      <FolderOpen className="mr-2 h-4 w-4" />
      选择文件
    </Button>
  </CardContent>
</Card>

{/* 文件信息 */}
{selectedFile && (
  <Card className="bg-card/50 mt-4">
    <CardContent className="flex items-center gap-4 p-4">
      <FileText className="h-10 w-10 text-primary" />
      <div className="flex-1">
        <p className="font-medium">{selectedFile.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatFileSize(selectedFile.size)}
        </p>
      </div>
      <Button onClick={handleParse}>
        解析章节
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
)}
```

**步骤 2: 章节预览**
```tsx
<div className="space-y-4">
  {/* 作品名称 */}
  <div className="flex items-center gap-4">
    <Label className="w-20 text-muted-foreground">作品名称</Label>
    <span className="font-medium">{projectName}</span>
  </div>

  {/* 章节范围 */}
  <div className="flex items-center justify-between">
    <Badge variant="outline" className="font-mono">
      检测到 {chapters.length} 个章节
    </Badge>
    <div className="flex items-center gap-2">
      <Label>导入范围</Label>
      <Select value={startChapter} onValueChange={setStartChapter}>
        <SelectTrigger className="w-28">
          <SelectValue placeholder="起始" />
        </SelectTrigger>
        <SelectContent>
          {chapters.map(ch => (
            <SelectItem key={ch.number} value={String(ch.number)}>
              第 {ch.number} 章
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">~</span>
      <Select value={endChapter} onValueChange={setEndChapter}>
        <SelectTrigger className="w-28">
          <SelectValue placeholder="结束" />
        </SelectTrigger>
        <SelectContent>
          {chapters.map(ch => (
            <SelectItem key={ch.number} value={String(ch.number)}>
              第 {ch.number} 章
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* 章节列表 */}
  <ScrollArea className="h-[400px] border rounded-lg">
    {chapters.map(chapter => (
      <div
        key={chapter.number}
        className={cn(
          "flex items-center gap-4 p-3 border-b hover:bg-accent/50",
          (chapter.number < startChapter || chapter.number > endChapter) &&
            "opacity-50"
        )}
      >
        <span className="font-mono text-sm text-muted-foreground w-12">
          {chapter.number}
        </span>
        <span className="flex-1 truncate">{chapter.title}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {chapter.wordCount.toLocaleString()} 字
        </span>
      </div>
    ))}
  </ScrollArea>

  {/* 操作按钮 */}
  <div className="flex justify-end gap-3">
    <Button variant="outline" onClick={() => setStep(1)}>
      返回
    </Button>
    <Button onClick={handleImport} className="glow-green">
      开始导入
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
</div>
```

**步骤 3: 导入进度**
```tsx
<div className="space-y-6">
  <div className="text-center">
    <div className="text-4xl font-mono font-bold text-primary mb-2">
      {progress}%
    </div>
    <Progress value={progress} className="h-2 max-w-md mx-auto" />
    <p className="text-sm text-muted-foreground mt-2">
      正在导入第 {currentChapter} 章...
    </p>
  </div>

  {/* 完成后的操作 */}
  {progress === 100 && (
    <div className="flex justify-center gap-4">
      <Button variant="outline" asChild>
        <Link href="/">返回作品中心</Link>
      </Button>
      <Button asChild className="glow-green">
        <Link href={`/projects/${projectId}`}>
          查看项目
          <ChevronRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" onClick={() => startAnalyze(projectId)}>
        <Zap className="mr-2 h-4 w-4" />
        开始分析
      </Button>
    </div>
  )}
</div>
```

#### Tab 2: 分析中（增强进度展示）

```tsx
<div className="space-y-4">
  {analyzingProjects.length === 0 ? (
    <Card className="bg-card/30 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="h-12 w-12 text-primary/50 mb-4" />
        <p className="text-muted-foreground">暂无正在分析的项目</p>
      </CardContent>
    </Card>
  ) : (
    analyzingProjects.map(project => (
      <Card key={project.id} className="bg-card/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">{project.name}</span>
            </div>
            <StatusBadge status="analyzing" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                第 {project.currentChapter} 章 / 共 {project.totalChapters} 章
              </span>
              <span className="font-mono text-primary">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>

          {/* 实时统计 */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="font-mono text-lg text-primary">
                {project.stats.characters}
              </div>
              <div className="text-xs text-muted-foreground">角色</div>
            </div>
            <div>
              <div className="font-mono text-lg text-primary">
                {project.stats.worldview}
              </div>
              <div className="text-xs text-muted-foreground">世界观</div>
            </div>
            <div>
              <div className="font-mono text-lg text-primary">
                {project.stats.goldenFingers}
              </div>
              <div className="text-xs text-muted-foreground">金手指</div>
            </div>
            <div>
              <div className="font-mono text-lg text-primary">
                {project.stats.plotlines}
              </div>
              <div className="text-xs text-muted-foreground">剧情线</div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              <Pause className="mr-1 h-3 w-3" />
              暂停
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.id}`}>查看详情</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    ))
  )}
</div>
```

---

## 项目详情页 `/projects/:id`（新增）

> 单本书的管理中心：章节、设定汇总、续写入口

### 页面结构

**Header**：
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="sm" asChild>
      <Link href="/">
        <ChevronLeft className="h-4 w-4" />
      </Link>
    </Button>
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge variant="secondary">{projectTypeLabels[project.type]}</Badge>
        <StatusBadge status={project.status} />
      </div>
      <p className="text-muted-foreground mt-1">
        {project.totalChapters} 章 · {project.stats.characters} 角色 · {project.stats.worldview} 世界观设定
      </p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    {project.status === "completed" && (
      <>
        <Button variant="outline">
          <GitBranch className="mr-2 h-4 w-4" />
          创建续写
        </Button>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          提取元素
        </Button>
      </>
    )}
    {project.status === "imported" && (
      <Button className="glow-green" onClick={() => startAnalyze(project.id)}>
        <Zap className="mr-2 h-4 w-4" />
        开始分析
      </Button>
    )}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          导出设定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          删除项目
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
```

### Tabs 结构

| Tab | 内容 |
|-----|------|
| 概览 | 统计卡片 + 快捷入口 |
| 章节 | 章节列表 + 分析状态 |
| 角色 | 本书角色（复用 characters 卡片）|
| 世界观 | 本书世界观（碎片 + 合成）|
| 金手指 | 金手指设定 |
| 剧情线 | 剧情线追踪 |
| 伏笔 | 伏笔追踪 |

#### 概览 Tab

```tsx
<div className="space-y-6">
  {/* 统计卡片 */}
  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
    <StatCard title="章节" value={project.totalChapters} icon={FileText} />
    <StatCard title="角色" value={project.stats.characters} icon={Users} />
    <StatCard title="世界观" value={project.stats.worldview} icon={Earth} />
    <StatCard title="金手指" value={project.stats.goldenFingers} icon={Zap} />
    <StatCard title="剧情线" value={project.stats.plotlines} icon={GitBranch} />
    <StatCard title="伏笔" value={project.stats.foreshadowing} icon={Bookmark} />
  </div>

  {/* 分析进度（如果正在分析）*/}
  {project.status === "analyzing" && (
    <Card className="bg-card/50 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          正在分析
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>第 {project.currentChapter} 章 / 共 {project.totalChapters} 章</span>
          <span className="font-mono text-primary">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </CardContent>
    </Card>
  )}

  {/* 快捷入口 */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card className="bg-card/50 hover:border-primary/30 cursor-pointer transition-all" asChild>
      <Link href={`/characters?novel=${project.id}`}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">查看角色</div>
            <div className="text-sm text-muted-foreground">
              {project.stats.characters} 个角色
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
    {/* 类似的卡片：世界观、剧情线、关系网络 */}
  </div>
</div>
```

#### 章节 Tab

```tsx
<div className="space-y-4">
  {/* 筛选 */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="font-mono">
        {project.analyzedChapters}/{project.totalChapters} 已分析
      </Badge>
    </div>
    <div className="flex items-center gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="状态筛选" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="analyzed">已分析</SelectItem>
          <SelectItem value="pending">待分析</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* 章节列表 */}
  <div className="space-y-2">
    {chapters.map(chapter => (
      <Card
        key={chapter.id}
        className="bg-card/50 border-border/50 hover:border-primary/30 transition-all"
      >
        <CardContent className="flex items-center gap-4 p-4">
          <span className="font-mono text-sm text-muted-foreground w-12">
            {chapter.number}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{chapter.title}</div>
            {chapter.summary && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {chapter.summary}
              </p>
            )}
          </div>
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            {chapter.wordCount.toLocaleString()} 字
          </Badge>
          <StatusBadge status={chapter.analyzed ? "completed" : "pending"} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>查看详情</DropdownMenuItem>
              <DropdownMenuItem>重新分析</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

#### 金手指 Tab

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {goldenFingers.map(gf => (
    <Card key={gf.id} className="bg-card/50 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {gf.name}
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            Lv.{gf.level}
          </Badge>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          {gf.type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{gf.description}</p>

        {gf.abilities.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">当前能力</Label>
            <div className="flex flex-wrap gap-1">
              {gf.abilities.map(ability => (
                <Badge key={ability} variant="outline" className="text-xs">
                  {ability}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {gf.resources && Object.keys(gf.resources).length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">资源</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(gf.resources).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-muted/30 rounded px-2 py-1"
                >
                  <span className="text-xs">{key}</span>
                  <span className="font-mono text-xs text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full">
          查看状态历史
        </Button>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## 元素融合 `/fusion`（新增）

### 任务列表页 `/fusion`

**组件清单**：

| 组件 | 用途 |
|------|------|
| Card | 任务卡片 |
| Badge | 状态/模式标签 |
| Progress | 进度指示 |
| DropdownMenu | 任务操作 |

**任务状态**：
```tsx
const fusionStatusVariants = {
  pending: "bg-muted text-muted-foreground border-border",
  extracting: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  fusing: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
  completed: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  selected: "bg-primary/20 text-primary border-primary/30",
  building: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  done: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const fusionStatusLabels = {
  pending: "待处理",
  extracting: "提取中",
  fusing: "融合中",
  completed: "待选择",
  selected: "已选择",
  building: "创建中",
  done: "已完成",
  failed: "失败",
};
```

**融合模式**：
```tsx
const fusionModes = [
  {
    id: "mashup",
    name: "元素混搭",
    icon: Shuffle,
    description: "从各源中挑选最佳元素组合",
  },
  {
    id: "twist",
    name: "变体改造",
    icon: RefreshCw,
    description: "以某一源为主体，融入其他元素",
  },
  {
    id: "abstract_recombine",
    name: "抽象重组",
    icon: Layers,
    description: "提取抽象模式，赋予全新设定",
  },
  {
    id: "conflict_merge",
    name: "冲突融合",
    icon: Swords,
    description: "组合有冲突的元素，创造新颖世界观",
  },
];
```

**页面布局**：
```tsx
<div className="space-y-6">
  {/* 标题 */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Blend className="h-6 w-6 text-primary" />
        元素融合
      </h1>
      <p className="text-muted-foreground mt-1">
        将多本书的元素融合，创造全新设定
      </p>
    </div>
    <Button asChild className="glow-green">
      <Link href="/fusion/create">
        <Plus className="mr-2 h-4 w-4" />
        新建融合
      </Link>
    </Button>
  </div>

  {/* 任务列表 */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {tasks.map(task => (
      <Card
        key={task.id}
        className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              #{task.id.slice(0, 8)}
            </span>
            <StatusBadge status={task.status} variants={fusionStatusVariants} labels={fusionStatusLabels} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 源项目 */}
          <div className="flex flex-wrap gap-1">
            {task.sourceProjects.map(project => (
              <Badge
                key={project.id}
                variant="outline"
                style={{ borderColor: project.color, color: project.color }}
                className="text-xs"
              >
                {project.name}
              </Badge>
            ))}
          </div>

          {/* 融合模式 */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {fusionModes.find(m => m.id === task.mode)?.name}
            </Badge>
            {task.candidatesCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {task.candidatesCount} 个方案
              </span>
            )}
          </div>

          {/* 进度 */}
          {(task.status === "extracting" || task.status === "fusing") && (
            <Progress value={task.progress} className="h-1.5" />
          )}

          {/* 操作 */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/fusion/${task.id}`}>
                查看详情
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* 空状态 */}
  {tasks.length === 0 && (
    <Card className="bg-card/30 border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Blend className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">还没有融合任务</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          选择多本已分析的书籍，创造全新的世界观和设定
        </p>
        <Button asChild className="glow-green">
          <Link href="/fusion/create">
            <Plus className="mr-2 h-4 w-4" />
            创建融合任务
          </Link>
        </Button>
      </CardContent>
    </Card>
  )}
</div>
```

### 创建融合任务 `/fusion/create`

**四步向导**：
1. 选择源项目（多选，至少 2 个）
2. 选择融合模式
3. 添加创意点子（可选）
4. 确认并开始

**步骤 1: 选择源项目**
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label className="text-lg font-semibold">选择要融合的项目</Label>
    <Badge variant="outline" className="font-mono">
      已选 {selectedProjects.length} 个
    </Badge>
  </div>

  <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
    {completedProjects.map(project => (
      <Card
        key={project.id}
        className={cn(
          "cursor-pointer transition-all",
          selectedProjects.includes(project.id)
            ? "border-primary bg-primary/5"
            : "bg-card/50 border-border/50 hover:border-primary/30"
        )}
        onClick={() => toggleProject(project.id)}
      >
        <CardContent className="p-4 flex items-start gap-3">
          <Checkbox
            checked={selectedProjects.includes(project.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{project.name}</h4>
            <p className="text-sm text-muted-foreground">
              {project.stats.characters} 角色 · {project.stats.worldview} 世界观
            </p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {selectedProjects.length < 2 && (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>请至少选择 2 个项目进行融合</AlertDescription>
    </Alert>
  )}
</div>
```

**步骤 2: 选择融合模式**
```tsx
<RadioGroup value={selectedMode} onValueChange={setSelectedMode}>
  <div className="grid gap-4 grid-cols-2">
    {fusionModes.map(mode => (
      <Card
        key={mode.id}
        className={cn(
          "cursor-pointer transition-all",
          selectedMode === mode.id
            ? "border-primary bg-primary/5"
            : "bg-card/50 border-border/50 hover:border-primary/30"
        )}
        onClick={() => setSelectedMode(mode.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <RadioGroupItem value={mode.id} className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <mode.icon className="h-4 w-4 text-primary" />
                <h4 className="font-medium">{mode.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {mode.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</RadioGroup>
```

**步骤 3: 添加创意点子**
```tsx
<div className="space-y-4">
  <Label className="text-lg font-semibold">添加你的创意偏好（可选）</Label>
  <Textarea
    placeholder="例如：我想把修仙元素和赛博朋克结合，主角是一个觉醒了古代传承的程序员..."
    value={userIdeas}
    onChange={e => setUserIdeas(e.target.value)}
    rows={4}
    className="bg-card/50"
  />

  <Accordion type="single" collapsible>
    <AccordionItem value="advanced">
      <AccordionTrigger className="text-sm">高级选项</AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <Label>候选方案数量</Label>
          <Select value={String(candidateCount)} onValueChange={v => setCandidateCount(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

### 融合详情页 `/fusion/:id`

**根据状态显示不同内容**：

| 状态 | 显示内容 |
|------|---------|
| `extracting` / `fusing` | 进度展示 |
| `completed` | 方案对比 + 选择 |
| `selected` | 已选方案 + 创建项目入口 |
| `done` | 已创建项目链接 |

**进度展示**（extracting/fusing）：
```tsx
<div className="space-y-6">
  {/* 阶段指示 */}
  <div className="flex items-center gap-4">
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg",
      task.status === "extracting"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground"
    )}>
      <div className="h-6 w-6 rounded-full bg-current/20 flex items-center justify-center text-xs font-mono">
        1
      </div>
      <span className="font-medium">元素提取</span>
      {task.status === "extracting" && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
    </div>
    <div className="h-px flex-1 bg-border" />
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg",
      task.status === "fusing"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground"
    )}>
      <div className="h-6 w-6 rounded-full bg-current/20 flex items-center justify-center text-xs font-mono">
        2
      </div>
      <span className="font-medium">融合生成</span>
      {task.status === "fusing" && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
    </div>
  </div>

  {/* 进度详情 */}
  <Card className="bg-card/50">
    <CardContent className="p-6 space-y-4">
      <Progress value={task.progress} className="h-2" />

      {task.status === "extracting" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-mono text-2xl text-primary">
              {task.extracted?.powerSystems || 0}
            </div>
            <div className="text-xs text-muted-foreground">力量体系</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl text-primary">
              {task.extracted?.plotPatterns || 0}
            </div>
            <div className="text-xs text-muted-foreground">剧情模式</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl text-primary">
              {task.extracted?.archetypes || 0}
            </div>
            <div className="text-xs text-muted-foreground">角色原型</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl text-primary">
              {task.extracted?.worldview || 0}
            </div>
            <div className="text-xs text-muted-foreground">世界观模式</div>
          </div>
        </div>
      )}

      {task.status === "fusing" && (
        <p className="text-center text-muted-foreground">
          正在生成 {task.candidateCount} 个候选方案...
        </p>
      )}
    </CardContent>
  </Card>
</div>
```

**方案对比**（completed）：
```tsx
<div className="space-y-6">
  {/* 方案卡片 */}
  <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
    {task.candidates.map((candidate, index) => (
      <Card
        key={candidate.id}
        className={cn(
          "bg-card/50 transition-all",
          selectedCandidate === index
            ? "border-primary ring-2 ring-primary/20"
            : "border-border/50 hover:border-primary/30"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">方案 {index + 1}</CardTitle>
            <Badge variant="outline" className="font-mono">
              原创度 {candidate.originalityScore}
            </Badge>
          </div>
          <p className="text-xl font-semibold text-primary">{candidate.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{candidate.summary}</p>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">亮点</Label>
            <div className="flex flex-wrap gap-1">
              {candidate.highlights.map(h => (
                <Badge key={h} variant="secondary" className="text-xs">
                  {h}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">风险</Label>
            <div className="flex flex-wrap gap-1">
              {candidate.risks.map(r => (
                <Badge
                  key={r}
                  variant="outline"
                  className="text-xs text-amber-500 border-amber-500/30"
                >
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            className={cn("w-full", selectedCandidate === index && "glow-green")}
            variant={selectedCandidate === index ? "default" : "outline"}
            onClick={() => setSelectedCandidate(index)}
          >
            {selectedCandidate === index ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已选择
              </>
            ) : (
              "选择此方案"
            )}
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* 确认按钮 */}
  {selectedCandidate !== null && (
    <div className="flex justify-end gap-4">
      <Button variant="outline" asChild>
        <Link href={`/fusion/${task.id}/candidate/${selectedCandidate}`}>
          查看详情
        </Link>
      </Button>
      <Button className="glow-green" onClick={handleConfirmSelection}>
        确认选择并创建项目
      </Button>
    </div>
  )}
</div>
```

---

## 元素库 `/elements`（新增）

> 存储 `PATTERN` 级别的抽象模式，用于融合

**筛选栏**：
```tsx
<div className="flex items-center gap-4 flex-wrap">
  {/* 来源项目筛选 */}
  <NovelFilter
    selectedIds={selectedSources}
    onSelectionChange={setSelectedSources}
  />

  {/* 元素类型筛选 */}
  <Select value={typeFilter} onValueChange={setTypeFilter}>
    <SelectTrigger className="w-40">
      <SelectValue placeholder="元素类型" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">全部类型</SelectItem>
      <SelectItem value="power_system">力量体系</SelectItem>
      <SelectItem value="plot_pattern">剧情模式</SelectItem>
      <SelectItem value="character_archetype">角色原型</SelectItem>
      <SelectItem value="worldview">世界观模式</SelectItem>
    </SelectContent>
  </Select>

  {/* 搜索 */}
  <div className="flex-1 max-w-sm">
    <Command className="rounded-lg border border-border/50 bg-card/50">
      <CommandInput
        placeholder="搜索元素..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
    </Command>
  </div>
</div>
```

**元素卡片**：
```tsx
<Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <Badge variant="outline" className="text-xs">
        {elementTypeLabels[element.type]}
      </Badge>
      <span className="text-xs text-muted-foreground font-mono">
        来自 {element.sourceProjects.length} 个项目
      </span>
    </div>
    <CardTitle className="text-base">{element.name}</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <p className="text-sm text-muted-foreground">{element.abstractPattern}</p>

    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">具体案例</Label>
      <div className="flex flex-wrap gap-2">
        {element.concreteExamples.map(ex => (
          <HoverCard key={ex.id}>
            <HoverCardTrigger>
              <Badge variant="secondary" className="cursor-pointer">
                {ex.name}
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">{ex.name}</h4>
                <p className="text-sm text-muted-foreground">{ex.description}</p>
                <Badge
                  variant="outline"
                  style={{ borderColor: ex.source.color, color: ex.source.color }}
                >
                  {ex.source.name}
                </Badge>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>

    <Button variant="outline" size="sm" className="w-full" asChild>
      <Link href={`/fusion/create?elements=${element.id}`}>
        <Blend className="mr-2 h-4 w-4" />
        用于融合
      </Link>
    </Button>
  </CardContent>
</Card>
```

---

## 通用组件

### 需要添加 (shadcn/ui)

```bash
pnpm dlx shadcn@latest add radio-group checkbox alert
```

### 需要自定义

| 组件 | 用途 | 说明 |
|------|------|------|
| `StatusBadge` | 通用状态徽章 | 支持不同 variants 和 labels |
| `StatCard` | 统计数字卡片 | 带数字跳动动效 |
| `Steps` | 多步骤向导 | 用于导入/融合流程 |
| `Dropzone` | 文件拖拽上传 | 用于导入页 |

---

## 数据类型

```typescript
// types/project.ts
interface Project {
  id: string;
  name: string;
  type: "original" | "imported" | "continuation" | "fusion";
  status: "draft" | "importing" | "analyzing" | "completed" | "failed";
  progress: number;
  currentChapter?: number;
  totalChapters: number;
  analyzedChapters: number;
  stats: {
    characters: number;
    worldview: number;
    goldenFingers: number;
    plotlines: number;
    foreshadowing: number;
  };
  parentProjectId?: string;
  createdAt: string;
  updatedAt: string;
}

// types/fusion.ts
interface FusionTask {
  id: string;
  status: FusionStatus;
  sourceProjectIds: string[];
  sourceProjects: { id: string; name: string; color: string }[];
  mode: FusionMode;
  customInstruction?: string;
  userIdeas?: string;
  candidateCount: number;
  candidates: FusionCandidate[];
  selectedCandidateIndex?: number;
  resultProjectId?: string;
  progress: number;
  extracted?: {
    powerSystems: number;
    plotPatterns: number;
    archetypes: number;
    worldview: number;
  };
  createdAt: string;
  updatedAt: string;
}

type FusionStatus =
  | "pending"
  | "extracting"
  | "fusing"
  | "completed"
  | "selected"
  | "building"
  | "done"
  | "failed";

type FusionMode =
  | "mashup"
  | "twist"
  | "abstract_recombine"
  | "conflict_merge"
  | "custom";

interface FusionCandidate {
  id: string;
  name: string;
  summary: string;
  settings: Record<string, unknown>;
  sourceElements: string[];
  originalityScore: number;
  marketAssessment: string;
  risks: string[];
  highlights: string[];
}

// types/element.ts
interface Element {
  id: string;
  name: string;
  type: ElementType;
  abstractPattern: string;
  sourceProjects: { id: string; name: string; color: string }[];
  concreteExamples: {
    id: string;
    name: string;
    description: string;
    source: { id: string; name: string; color: string };
  }[];
}

type ElementType =
  | "power_system"
  | "plot_pattern"
  | "character_archetype"
  | "worldview";
```

---

## API 端点

### 项目管理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects` | 列出项目 |
| GET | `/api/projects/:id` | 获取项目详情 |
| POST | `/api/projects/:id/analyze` | 开始分析 |
| POST | `/api/projects/:id/continue` | 创建续写项目 |
| DELETE | `/api/projects/:id` | 删除项目 |

### 导入

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/import/parse` | 解析文件（返回章节列表）|
| POST | `/api/import/start` | 开始导入 |
| GET | `/api/import/:id/status` | 获取导入状态（轮询）|

### 分析

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/analyze/status` | 获取分析状态（轮询）|
| POST | `/api/projects/:id/analyze/pause` | 暂停分析 |
| POST | `/api/projects/:id/analyze/resume` | 恢复分析 |

### 融合

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/fusion` | 列出融合任务 |
| POST | `/api/fusion` | 创建融合任务 |
| GET | `/api/fusion/:id` | 获取任务详情 |
| GET | `/api/fusion/:id/status` | 获取进度（轮询）|
| POST | `/api/fusion/:id/select` | 选择候选方案 |
| POST | `/api/fusion/:id/build` | 创建项目 |
| DELETE | `/api/fusion/:id` | 删除任务 |

### 元素库

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/elements` | 列出元素（支持筛选）|
| GET | `/api/elements/:id` | 获取元素详情 |

---

## 轮询实现

### 通用轮询 Hook

```typescript
// hooks/use-polling.ts
import { useEffect, useRef, useState } from "react";

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  shouldStop?: (data: T) => boolean;
}

export function usePolling<T>({
  fetcher,
  interval = 2000,
  enabled = true,
  onSuccess,
  onError,
  shouldStop,
}: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      return;
    }

    const poll = async () => {
      try {
        const result = await fetcher();
        setData(result);
        setError(null);
        onSuccess?.(result);

        if (shouldStop?.(result)) {
          setIsPolling(false);
          return;
        }

        timeoutRef.current = setTimeout(poll, interval);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        // 出错后继续轮询，但可以加指数退避
        timeoutRef.current = setTimeout(poll, interval * 2);
      }
    };

    setIsPolling(true);
    poll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, fetcher, interval, onSuccess, onError, shouldStop]);

  const stop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPolling(false);
  };

  return { data, isPolling, error, stop };
}
```

### 分析状态轮询

```typescript
// hooks/use-analyze-status.ts
import { usePolling } from "./use-polling";

interface AnalyzeStatus {
  status: "analyzing" | "completed" | "failed" | "paused";
  progress: number;
  currentChapter: number;
  totalChapters: number;
  stats: {
    characters: number;
    worldview: number;
    goldenFingers: number;
    plotlines: number;
  };
  error?: string;
}

export function useAnalyzeStatus(projectId: string, enabled = true) {
  return usePolling<AnalyzeStatus>({
    fetcher: async () => {
      const res = await fetch(`/api/projects/${projectId}/analyze/status`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    interval: 2000,
    enabled,
    shouldStop: (data) =>
      data.status === "completed" ||
      data.status === "failed" ||
      data.status === "paused",
  });
}
```

### 融合状态轮询

```typescript
// hooks/use-fusion-status.ts
import { usePolling } from "./use-polling";

interface FusionStatus {
  status: FusionTask["status"];
  progress: number;
  stage: "extracting" | "fusing";
  currentProject?: string;
  extracted?: {
    powerSystems: number;
    plotPatterns: number;
    archetypes: number;
    worldview: number;
  };
  error?: string;
}

export function useFusionStatus(taskId: string, enabled = true) {
  return usePolling<FusionStatus>({
    fetcher: async () => {
      const res = await fetch(`/api/fusion/${taskId}/status`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    interval: 3000,
    enabled,
    shouldStop: (data) =>
      data.status === "completed" ||
      data.status === "failed" ||
      data.status === "done",
  });
}
```

### 使用示例

```tsx
// 分析进度组件
function AnalyzeProgress({ projectId }: { projectId: string }) {
  const { data, isPolling, stop } = useAnalyzeStatus(projectId);

  if (!data) return <Skeleton className="h-32" />;

  return (
    <Card className="bg-card/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            第 {data.currentChapter} 章 / 共 {data.totalChapters} 章
          </span>
          <span className="font-mono text-primary">{data.progress}%</span>
        </div>
        <Progress value={data.progress} className="h-2" />

        {data.status === "analyzing" && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={stop}>
              <Pause className="mr-2 h-4 w-4" />
              暂停
            </Button>
          </div>
        )}

        {data.status === "completed" && (
          <Alert className="bg-primary/10 border-primary/30">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription>分析完成！</AlertDescription>
          </Alert>
        )}

        {data.status === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{data.error || "分析失败"}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 开发优先级

### Phase 1: 作品中心增强
1. ✅ 项目类型/状态标记
2. ✅ 进度展示优化
3. ✅ `/projects/:id` 项目详情页

### Phase 2: 设定提取增强
1. ✅ 导入向导（三步流程）
2. ✅ 分析中 Tab 增强
3. ✅ 轮询 Hook 实现

### Phase 3: 融合功能
1. ✅ `/fusion` 任务列表
2. ✅ `/fusion/create` 创建向导
3. ✅ `/fusion/:id` 任务详情（进度/对比/选择）

### Phase 4: 元素库
1. ✅ `/elements` 元素列表
2. ✅ 元素详情抽屉（通过 HoverCard 实现）
