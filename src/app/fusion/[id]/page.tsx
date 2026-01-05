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
  Eye,
  Globe,
  BookOpen,
  User,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FusionStatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";
import {
  useFusionTask,
  useFusionModes,
  useBuildFusionProject,
} from "@/hooks/use-fusion";
import { formatTimeAgo } from "@/lib/utils/time";
import type { FusionCandidateRead } from "@/types/fusion";

/** 简易 Markdown 渲染组件 */
function MarkdownContent({ content }: { content: string }) {
  // 简单处理：将 **text** 转为粗体，将换行转为 <br>，将 \n\n 转为段落
  const html = content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\\n/g, "\n")
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function FusionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  // 创建项目对话框状态：存储要创建的候选方案
  const [buildingCandidate, setBuildingCandidate] = useState<FusionCandidateRead | null>(null);
  const [projectName, setProjectName] = useState("");
  // 候选详情对话框状态
  const [detailCandidate, setDetailCandidate] = useState<FusionCandidateRead | null>(null);

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

  // 创建项目
  const buildProject = useBuildFusionProject();

  // 获取融合模式名称
  const getModeName = (mode: string) => {
    const modeInfo = modesData?.find((m) => m.mode === mode);
    return modeInfo?.name ?? mode;
  };

  // 打开创建项目对话框
  const handleOpenBuildDialog = (candidate: FusionCandidateRead) => {
    setBuildingCandidate(candidate);
    // 默认使用候选方案的名称作为项目名
    setProjectName(candidate.name);
  };

  // 关闭创建项目对话框
  const handleCloseBuildDialog = () => {
    setBuildingCandidate(null);
    setProjectName("");
  };

  // 创建项目并跳转到写作面板
  const handleBuildProject = async () => {
    if (!projectName.trim() || !buildingCandidate) return;

    try {
      const result = await buildProject.mutateAsync({
        taskId,
        request: {
          project_name: projectName.trim(),
          candidate_id: buildingCandidate.id,
        },
      });
      handleCloseBuildDialog();
      // 跳转到写作面板
      router.push(`/write/${result.project_id}`);
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

        {/* 方案对比 - 完成状态或已选择状态（兼容旧数据） */}
        {(task.status === "completed" || task.status === "selected") && candidates.length > 0 && (
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
                  className="bg-card/50 transition-all border-border/50 hover:border-primary/30 flex flex-col"
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
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {candidate.summary}
                      </p>

                      {/* 独特亮点 */}
                      {candidate.unique_hooks && candidate.unique_hooks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            独特亮点
                          </Label>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {candidate.unique_hooks.slice(0, 2).map((h, i) => (
                              <li key={i} className="line-clamp-1">• {h}</li>
                            ))}
                            {candidate.unique_hooks.length > 2 && (
                              <li className="text-primary">+{candidate.unique_hooks.length - 2} 更多...</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* 风险提示 */}
                      {candidate.risks && candidate.risks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            风险提示
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {candidate.risks.slice(0, 2).map((r, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs text-amber-500 border-amber-500/30 line-clamp-1 max-w-full"
                              >
                                {r.length > 20 ? r.slice(0, 20) + "..." : r}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 - 固定在底部 */}
                    <div className="flex gap-2 pt-4 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailCandidate(candidate);
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        查看详情
                      </Button>
                      <Button
                        className="flex-1 glow-green"
                        size="sm"
                        onClick={() => handleOpenBuildDialog(candidate)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        创建项目
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
      <Dialog open={buildingCandidate !== null} onOpenChange={(open) => !open && handleCloseBuildDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建项目</DialogTitle>
            <DialogDescription>
              {buildingCandidate && (
                <>基于「{buildingCandidate.name}」创建新项目</>
              )}
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
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseBuildDialog}>
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

      {/* 候选详情对话框 */}
      <Dialog open={!!detailCandidate} onOpenChange={(open) => !open && setDetailCandidate(null)}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[700px] lg:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Blend className="h-5 w-5 text-primary" />
              {detailCandidate?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono">
                原创度 {detailCandidate?.originality_score}
              </Badge>
              <span className="text-muted-foreground line-clamp-2">{detailCandidate?.summary}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* 世界观设定 */}
              <section>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-primary" />
                  世界观设定
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  {detailCandidate?.worldview_doc && (
                    <MarkdownContent content={detailCandidate.worldview_doc} />
                  )}
                </div>
              </section>

              {/* 剧情大纲 */}
              <section>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  剧情大纲
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  {detailCandidate?.plot_doc && (
                    <MarkdownContent content={detailCandidate.plot_doc} />
                  )}
                </div>
              </section>

              {/* 主角设定 */}
              <section>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-primary" />
                  主角设定
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  {detailCandidate?.protagonist_doc && (
                    <MarkdownContent content={detailCandidate.protagonist_doc} />
                  )}
                </div>
              </section>

              {/* 独特亮点 */}
              <section>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  独特亮点
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  {detailCandidate?.unique_hooks && detailCandidate.unique_hooks.length > 0 && (
                    <ul className="space-y-3">
                      {detailCandidate.unique_hooks.map((hook, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Badge variant="secondary" className="mt-0.5 shrink-0">
                            {i + 1}
                          </Badge>
                          <span className="text-sm">{hook}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* 风险提示 */}
              {detailCandidate?.risks && detailCandidate.risks.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-amber-500">
                    <AlertTriangle className="h-5 w-5" />
                    风险提示
                  </h3>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <ul className="space-y-2">
                      {detailCandidate.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-amber-500 shrink-0">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* 市场评估 */}
              <section>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  市场评估
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  {detailCandidate?.market_assessment && (
                    <MarkdownContent content={detailCandidate.market_assessment} />
                  )}
                  {detailCandidate?.source_elements && detailCandidate.source_elements.length > 0 && (
                    <div className="pt-3 border-t border-border/50">
                      <Label className="text-xs text-muted-foreground mb-2 block">素材来源</Label>
                      <div className="flex flex-wrap gap-1">
                        {detailCandidate.source_elements.map((el, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {el}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t shrink-0">
            <Button variant="outline" onClick={() => setDetailCandidate(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
