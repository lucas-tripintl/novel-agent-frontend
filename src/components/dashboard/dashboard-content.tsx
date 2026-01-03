"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  FileText,
  Plus,
  Sparkles,
  TrendingUp,
  Settings2,
  Upload,
} from "lucide-react";
import Link from "next/link";

// 模拟项目数据
const recentProjects = [
  {
    id: "1",
    title: "斗破苍穹",
    progress: 100,
    status: "completed" as const,
    chaptersAnalyzed: 1648,
    settingsCount: 342,
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "遮天",
    progress: 67,
    status: "processing" as const,
    chaptersAnalyzed: 1200,
    settingsCount: 189,
    updatedAt: "2024-01-14",
  },
  {
    id: "3",
    title: "完美世界",
    progress: 23,
    status: "processing" as const,
    chaptersAnalyzed: 450,
    settingsCount: 78,
    updatedAt: "2024-01-14",
  },
];

const stats = [
  {
    title: "作品数",
    value: "12",
    icon: BookOpen,
    change: "+2",
    changeType: "increase" as const,
  },
  {
    title: "字数",
    value: "1,580万",
    icon: FileText,
    change: "+120万",
    changeType: "increase" as const,
  },
  {
    title: "设定数量",
    value: "2,341",
    icon: Settings2,
    change: "+156",
    changeType: "increase" as const,
  },
];

function StatusBadge({ status }: { status: "completed" | "processing" | "pending" }) {
  const variants = {
    completed: "bg-primary/20 text-primary border-primary/30",
    processing: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
    pending: "bg-muted text-muted-foreground border-border",
  };

  const labels = {
    completed: "已完成",
    processing: "分析中",
    pending: "待处理",
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {status === "processing" && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {labels[status]}
    </Badge>
  );
}

export function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">作品中心</h1>
          <p className="text-muted-foreground mt-1">
            管理你的作品
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/import">
              <Upload className="mr-2 h-4 w-4" />
              导入书籍
            </Link>
          </Button>
          <Button asChild className="glow-green">
            <Link href="/upload">
              <Plus className="mr-2 h-4 w-4" />
              新建作品
            </Link>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              {stat.change && (
                <p className="text-xs text-primary flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} 本周
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 作品列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            作品列表
          </h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            查看全部
          </Button>
        </div>

        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recentProjects.map((project) => (
            <Card
              key={project.id}
              className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all group cursor-pointer overflow-hidden p-0 gap-0"
            >
              {/* 书籍封面 */}
              <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 relative flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]" />
                <Sparkles className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                {/* 状态徽章 - 只在分析中显示 */}
                {project.status === "processing" && (
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={project.status} />
                  </div>
                )}
                {/* 进度条 */}
                {project.status === "processing" && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
                    <Progress
                      value={project.progress}
                      className="h-1 bg-muted/50"
                    />
                    <span className="text-[10px] font-mono text-primary mt-1 block text-center">
                      {project.progress}%
                    </span>
                  </div>
                )}
              </div>

              {/* 书籍信息 */}
              <CardContent className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span className="font-mono">{project.chaptersAnalyzed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings2 className="h-3 w-3" />
                    <span className="font-mono">{project.settingsCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 空状态提示（当没有项目时显示） */}
      {recentProjects.length === 0 && (
        <Card className="bg-card/30 border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有项目</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              上传你的第一本小说，开始智能拆书之旅
            </p>
            <Button asChild className="glow-green">
              <Link href="/upload">
                <Plus className="mr-2 h-4 w-4" />
                上传小说
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

