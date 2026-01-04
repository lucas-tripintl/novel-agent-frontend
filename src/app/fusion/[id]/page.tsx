"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Blend,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FusionStatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";
import {
  useFusionTask,
  useFusionModes,
  useSelectFusionCandidate,
  useBuildFusionProject,
} from "@/hooks/use-fusion";
import { formatTimeAgo } from "@/lib/utils/time";
import type { FusionCandidateRead } from "@/types/fusion";

export default function FusionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [projectName, setProjectName] = useState("");

  // 获取任务详情
  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFusionTask(taskId);

  // 进行中的任务定时刷新
  const isInProgress = task && (
    task.status === "extracting" ||
    task.status === "fusing" ||
    task.status === "building" ||
    task.status === "pending"
  );

  useEffect(() => {
    if (!isInProgress) return;

    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [isInProgress, refetch]);

  // 获取融合模式信息
  const { data: modesData } = useFusionModes();

  // 选择候选方案
  const selectCandidate = useSelectFusionCandidate();

  // 创建项目
  const buildProject = useBuildFusionProject();

  // 同步已选择的候选
  useEffect(() => {
    if (task?.selected_candidate_index !== null && task?.selected_candidate_index !== undefined) {
      setSelectedCandidate(task.selected_candidate_index);
    }
  }, [task?.selected_candidate_index]);

  // 获取融合模式名称
  const getModeName = (mode: string) => {
    const modeInfo = modesData?.find((m) => m.mode === mode);
    return modeInfo?.name ?? mode;
  };

  // 确认选择候选方案
  const handleSelectCandidate = async () => {
    if (selectedCandidate === null) return;

    try {
      await selectCandidate.mutateAsync({
        taskId,
        request: { candidate_index: selectedCandidate },
      });
    } catch (error) {
      console.error("选择候选方案失败:", error);
    }
  };

  // 创建项目
  const handleBuildProject = async () => {
    if (!projectName.trim()) return;

    try {
      await buildProject.mutateAsync({
        taskId,
        request: { project_name: projectName.trim() },
      });
      setShowBuildDialog(false);
    } catch (error) {
      console.error("创建项目失败:", error);
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  // 错误状态
  if (isError || !task) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/fusion">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">融合任务</h1>
          </div>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">加载失败</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "无法加载任务详情"}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                重试
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const candidates = task.candidates as FusionCandidateRead[];

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
                <Badge variant="outline" className="text-xs">
                  {(task.source_pattern_ids?.length || task.source_project_ids?.length || 0)} 个源
                </Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {getModeName(task.fusion_mode)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(task.created_at)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
        </div>

        {/* 失败状态 */}
        {task.status === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {task.error_message || "融合任务失败，请重试"}
            </AlertDescription>
          </Alert>
        )}

        {/* 进行中状态 */}
        {(task.status === "pending" || task.status === "extracting" || task.status === "fusing") && (
          <Card className="bg-card/50">
            <CardContent className="p-6 space-y-4">
              {/* 阶段指示 */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    task.status === "extracting"
                      ? "bg-primary/10 text-primary"
                      : task.status === "pending"
                        ? "bg-muted text-muted-foreground"
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
                  {task.status === "fusing" && (
                    <Check className="h-4 w-4" />
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

              {/* 进度说明 */}
              <div className="text-center text-muted-foreground">
                {task.status === "pending" && "准备开始..."}
                {task.status === "extracting" && "正在从源项目提取可复用元素..."}
                {task.status === "fusing" && `正在生成 ${task.candidate_count} 个候选方案...`}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 方案对比 - 完成状态 */}
        {task.status === "completed" && candidates.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">选择你喜欢的方案</h2>

            {/* 对比说明 */}
            {task.comparison_summary && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{task.comparison_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* 方案卡片 */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {candidates.map((candidate, index) => (
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
                        原创度 {candidate.originality_score}
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
                <Button
                  className="glow-green"
                  onClick={handleSelectCandidate}
                  disabled={selectCandidate.isPending}
                >
                  {selectCandidate.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      确认中...
                    </>
                  ) : (
                    "确认选择"
                  )}
                </Button>
              </div>
            )}

            {/* 错误提示 */}
            {selectCandidate.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectCandidate.error instanceof Error
                    ? selectCandidate.error.message
                    : "选择失败，请重试"}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* 已选择状态 - 可以创建项目 */}
        {task.status === "selected" && task.selected_candidate_index !== null && (
          <div className="space-y-6">
            <Card className="bg-card/50 border-primary/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">已选择方案</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-2">
                  {candidates[task.selected_candidate_index]?.name ?? `方案 ${task.selected_candidate_index + 1}`}
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  {candidates[task.selected_candidate_index]?.summary}
                </p>
                <Button className="glow-green" onClick={() => setShowBuildDialog(true)}>
                  创建项目
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 创建中状态 */}
        {task.status === "building" && (
          <Card className="bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">正在创建项目</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                基于选中的候选方案创建新项目...
              </p>
            </CardContent>
          </Card>
        )}

        {/* 已完成状态 */}
        {task.status === "done" && (
          <Card className="bg-card/50 border-primary/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">融合已完成</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                已成功创建新项目，你可以前往项目详情页查看
              </p>
              {task.result_project_id && (
                <Button asChild className="glow-green">
                  <Link href={`/projects/${task.result_project_id}`}>
                    查看项目
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 创建项目对话框 */}
      <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建项目</DialogTitle>
            <DialogDescription>
              基于选中的融合方案创建新项目
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="projectName">项目名称</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="输入项目名称..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuildDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleBuildProject}
              disabled={!projectName.trim() || buildProject.isPending}
              className="glow-green"
            >
              {buildProject.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                "创建项目"
              )}
            </Button>
          </DialogFooter>
          {buildProject.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {buildProject.error instanceof Error
                  ? buildProject.error.message
                  : "创建失败，请重试"}
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
