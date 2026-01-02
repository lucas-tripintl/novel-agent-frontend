"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  FileText,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

// 模拟项目数据
const recentProjects = [
  {
    id: "1",
    title: "斗破苍穹",
    author: "天蚕土豆",
    progress: 100,
    status: "completed" as const,
    chaptersAnalyzed: 1648,
    charactersFound: 342,
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "遮天",
    author: "辰东",
    progress: 67,
    status: "processing" as const,
    chaptersAnalyzed: 1200,
    charactersFound: 189,
    updatedAt: "2024-01-14",
  },
  {
    id: "3",
    title: "完美世界",
    author: "辰东",
    progress: 23,
    status: "processing" as const,
    chaptersAnalyzed: 450,
    charactersFound: 78,
    updatedAt: "2024-01-14",
  },
];

const stats = [
  {
    title: "已分析小说",
    value: "12",
    icon: BookOpen,
    change: "+2",
    changeType: "increase" as const,
  },
  {
    title: "总章节数",
    value: "15,847",
    icon: FileText,
    change: "+1,200",
    changeType: "increase" as const,
  },
  {
    title: "识别人物",
    value: "2,341",
    icon: Users,
    change: "+156",
    changeType: "increase" as const,
  },
  {
    title: "处理中",
    value: "3",
    icon: Zap,
    change: "",
    changeType: "neutral" as const,
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
          <h1 className="text-2xl font-bold tracking-tight">项目中心</h1>
          <p className="text-muted-foreground mt-1">
            管理你的小说分析项目
          </p>
        </div>
        <Button asChild className="glow-green">
          <Link href="/upload">
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Link>
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* 最近项目 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            最近项目
          </h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            查看全部
          </Button>
        </div>

        <div className="grid gap-4">
          {recentProjects.map((project) => (
            <Card
              key={project.id}
              className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all group cursor-pointer"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:glow-green transition-shadow">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {project.author}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="font-mono">{project.chaptersAnalyzed}</span>
                        <span>章节</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-mono">{project.charactersFound}</span>
                        <span>人物</span>
                      </div>
                    </div>

                    {project.status === "processing" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">分析进度</span>
                          <span className="font-mono text-primary">
                            {project.progress}%
                          </span>
                        </div>
                        <Progress
                          value={project.progress}
                          className="h-1.5 bg-muted"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={project.status} />
                    <span className="text-xs text-muted-foreground">
                      {project.updatedAt}
                    </span>
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

