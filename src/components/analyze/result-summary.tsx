"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Users,
  Earth,
  Zap,
  GitBranch,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Home,
  Library,
  Network,
} from "lucide-react";
import { useAnalysisStats, useStyleResult } from "@/hooks/use-analysis-results";

interface ResultSummaryProps {
  projectId: string;
  projectName: string;
  onContinue: () => void;
}

export function ResultSummary({
  projectId,
  projectName,
  onContinue,
}: ResultSummaryProps) {
  const { stats, isLoading: statsLoading } = useAnalysisStats(projectId);
  const { data: styleResult, isLoading: styleLoading } = useStyleResult(projectId);

  const isLoading = statsLoading || styleLoading;

  return (
    <div className="space-y-6">
      {/* 完成标题 */}
      <Card className="bg-card/50 border-primary/30">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-1">分析完成</h3>
          <p className="text-muted-foreground">《{projectName}》</p>
        </CardContent>
      </Card>

      {/* 分析结果总览 */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">分析结果总览</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 统计卡片组 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="角色"
              value={stats.characters}
              loading={isLoading}
            />
            <StatCard
              icon={<Earth className="h-5 w-5" />}
              label="世界观"
              value={stats.worldview}
              loading={isLoading}
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              label="金手指"
              value={stats.goldenFingers}
              loading={isLoading}
            />
            <StatCard
              icon={<GitBranch className="h-5 w-5" />}
              label="剧情线"
              value={stats.plotlines}
              loading={isLoading}
            />
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              label="伏笔"
              value={stats.foreshadowing}
              loading={isLoading}
            />
          </div>

          {/* 风格分析结果 */}
          {styleResult && (
            <Card className="bg-accent/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">风格分析</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{styleResult.tone}</Badge>
                  <Badge variant="outline">{styleResult.sentence_style}</Badge>
                  <Badge variant="outline">{styleResult.narrative_perspective}</Badge>
                  {styleResult.high_frequency_words?.slice(0, 3).map((word) => (
                    <Badge key={word} variant="outline" className="font-mono">
                      {word}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">快捷入口</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/characters">
                <Users className="mr-2 h-4 w-4" />
                人物图谱
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/worldview">
                <Earth className="mr-2 h-4 w-4" />
                世界观设定
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/storylines">
                <GitBranch className="mr-2 h-4 w-4" />
                剧情大纲
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href={`/projects/${projectId}`}>
                <Zap className="mr-2 h-4 w-4" />
                金手指追踪
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/relations">
                <Network className="mr-2 h-4 w-4" />
                关系网络
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/elements">
                <Library className="mr-2 h-4 w-4" />
                进入元素库
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onContinue}>
          <RotateCcw className="mr-2 h-4 w-4" />
          继续导入
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            返回作品中心
          </Link>
        </Button>
        <Button asChild className="glow-green">
          <Link href={`/projects/${projectId}`}>
            查看项目详情
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// 统计卡片
function StatCard({
  icon,
  label,
  value,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card className="bg-accent/30">
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="text-primary mb-2">{icon}</div>
        <div className="font-mono text-2xl font-bold text-primary mb-1">
          {loading ? "-" : value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
