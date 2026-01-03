"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Blend, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { FusionStatusBadge } from "@/components/common/status-badge";
import { type FusionTask, fusionModes } from "@/types/fusion";

// 模拟融合任务数据
const mockTasks: FusionTask[] = [
  {
    id: "task-1",
    status: "completed",
    sourceProjectIds: ["1", "2"],
    sourceProjects: [
      { id: "1", name: "斗破苍穹", color: "#22c55e" },
      { id: "2", name: "遮天", color: "#a855f7" },
    ],
    mode: "mashup",
    candidateCount: 3,
    candidates: [],
    progress: 100,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-14",
  },
  {
    id: "task-2",
    status: "fusing",
    sourceProjectIds: ["1", "3"],
    sourceProjects: [
      { id: "1", name: "斗破苍穹", color: "#22c55e" },
      { id: "3", name: "完美世界", color: "#06b6d4" },
    ],
    mode: "abstract_recombine",
    candidateCount: 2,
    candidates: [],
    progress: 65,
    extracted: {
      powerSystems: 8,
      plotPatterns: 12,
      archetypes: 6,
      worldview: 10,
    },
    createdAt: "2024-01-14",
    updatedAt: "2024-01-14",
  },
  {
    id: "task-3",
    status: "done",
    sourceProjectIds: ["2", "4"],
    sourceProjects: [
      { id: "2", name: "遮天", color: "#a855f7" },
      { id: "4", name: "凡人修仙传", color: "#f97316" },
    ],
    mode: "twist",
    candidateCount: 3,
    candidates: [],
    selectedCandidateIndex: 1,
    resultProjectId: "5",
    progress: 100,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-12",
  },
];

export default function FusionPage() {
  return (
    <MainLayout>
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
        {mockTasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{task.id.slice(0, 8)}
                    </span>
                    <FusionStatusBadge status={task.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 源项目 */}
                  <div className="flex flex-wrap gap-1">
                    {task.sourceProjects.map((project) => (
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
                      {fusionModes.find((m) => m.id === task.mode)?.name}
                    </Badge>
                    {task.candidateCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {task.candidateCount} 个方案
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
        ) : (
          /* 空状态 */
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
    </MainLayout>
  );
}
