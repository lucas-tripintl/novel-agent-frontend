"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Blend,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FusionStatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";
import {
  type FusionTask,
  type FusionCandidate,
  fusionModes,
} from "@/types/fusion";

// 模拟融合任务详情
const mockTask: FusionTask = {
  id: "task-1",
  status: "completed",
  sourceProjectIds: ["1", "2"],
  sourceProjects: [
    { id: "1", name: "斗破苍穹", color: "#22c55e" },
    { id: "2", name: "遮天", color: "#a855f7" },
  ],
  mode: "mashup",
  candidateCount: 3,
  candidates: [
    {
      id: "c1",
      name: "天道觉醒",
      summary:
        "融合斗气与仙道体系，主角在两界交融中觉醒天道意志，以炼药为核心成长路线，结合遮天的大帝之路与斗破的异火系统。",
      settings: {},
      sourceElements: ["斗气体系", "仙道修炼", "异火系统"],
      originalityScore: 85,
      marketAssessment: "爽文市场潜力大",
      highlights: ["双体系融合", "创新成长路线", "视觉冲击强"],
      risks: ["设定复杂", "可能影响阅读流畅度"],
    },
    {
      id: "c2",
      name: "万古帝尊",
      summary:
        "以遮天的荒古背景为主，融入斗破的家族势力斗争，主角从废物到大帝的逆袭之路，强调命运与轮回的主题。",
      settings: {},
      sourceElements: ["荒古设定", "家族斗争", "轮回体系"],
      originalityScore: 72,
      marketAssessment: "符合市场主流偏好",
      highlights: ["故事张力强", "人物群像丰富", "主题深刻"],
      risks: ["与原作相似度高", "需要大量原创剧情"],
    },
    {
      id: "c3",
      name: "药道通天",
      summary:
        "以炼药为主线的全新世界观，结合两本书的丹药体系和天才设定，创造一个以药道定天下的修炼世界。",
      settings: {},
      sourceElements: ["炼药体系", "天才设定", "势力争霸"],
      originalityScore: 91,
      marketAssessment: "差异化竞争优势明显",
      highlights: ["独特的主线设定", "创新的战斗方式", "完整的升级体系"],
      risks: ["受众可能较窄", "需要精心设计战斗场面"],
    },
  ],
  progress: 100,
  extracted: {
    powerSystems: 8,
    plotPatterns: 12,
    archetypes: 6,
    worldview: 10,
  },
  createdAt: "2024-01-12",
  updatedAt: "2024-01-14",
};

export default function FusionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // 实际项目中应该从 API 获取数据
  const task = mockTask;

  // 确认选择
  const handleConfirmSelection = async () => {
    if (selectedCandidate === null) return;
    // 模拟创建项目
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push("/projects/new-fusion-project");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/fusion">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Blend className="h-6 w-6 text-primary" />
                  融合任务
                </h1>
                <span className="font-mono text-sm text-muted-foreground">
                  #{task.id.slice(0, 8)}
                </span>
                <FusionStatusBadge status={task.status} />
              </div>
              <div className="flex items-center gap-2 mt-1">
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
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {fusionModes.find((m) => m.id === task.mode)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 根据状态显示不同内容 */}
        {(task.status === "extracting" || task.status === "fusing") && (
          /* 进度展示 */
          <div className="space-y-6">
            {/* 阶段指示 */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  task.status === "extracting"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <div className="h-6 w-6 rounded-full bg-current/20 flex items-center justify-center text-xs font-mono">
                  1
                </div>
                <span className="font-medium">元素提取</span>
                {task.status === "extracting" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              <div className="h-px flex-1 bg-border" />
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  task.status === "fusing"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
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

                {task.status === "extracting" && task.extracted && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="font-mono text-2xl text-primary">
                        {task.extracted.powerSystems}
                      </div>
                      <div className="text-xs text-muted-foreground">力量体系</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-2xl text-primary">
                        {task.extracted.plotPatterns}
                      </div>
                      <div className="text-xs text-muted-foreground">剧情模式</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-2xl text-primary">
                        {task.extracted.archetypes}
                      </div>
                      <div className="text-xs text-muted-foreground">角色原型</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-2xl text-primary">
                        {task.extracted.worldview}
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
        )}

        {task.status === "completed" && (
          /* 方案对比 */
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">选择你喜欢的方案</h2>

            {/* 方案卡片 */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {task.candidates.map((candidate, index) => (
                <Card
                  key={candidate.id}
                  className={cn(
                    "bg-card/50 transition-all cursor-pointer",
                    selectedCandidate === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border/50 hover:border-primary/30"
                  )}
                  onClick={() => setSelectedCandidate(index)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">方案 {index + 1}</CardTitle>
                      <Badge variant="outline" className="font-mono">
                        原创度 {candidate.originalityScore}
                      </Badge>
                    </div>
                    <p className="text-xl font-semibold text-primary">
                      {candidate.name}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {candidate.summary}
                    </p>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">亮点</Label>
                      <div className="flex flex-wrap gap-1">
                        {candidate.highlights.map((h) => (
                          <Badge key={h} variant="secondary" className="text-xs">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">风险</Label>
                      <div className="flex flex-wrap gap-1">
                        {candidate.risks.map((r) => (
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
                      className={cn(
                        "w-full",
                        selectedCandidate === index && "glow-green"
                      )}
                      variant={selectedCandidate === index ? "default" : "outline"}
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
        )}

        {task.status === "done" && (
          /* 已完成 */
          <Card className="bg-card/50 border-primary/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">融合已完成</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                已成功创建新项目，你可以前往项目详情页查看
              </p>
              <Button asChild className="glow-green">
                <Link href={`/projects/${task.resultProjectId}`}>
                  查看项目
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
