"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ProjectRead } from "@/types/api";
import { useWritingStore, useStreamingState } from "@/stores/writing-store";
import { writingModes, type WritingMode } from "@/types/writing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  Film,
  Play,
  Square,
  FileSearch,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Wand2,
} from "lucide-react";
import { EditorSettings } from "./editor/editor-settings";
import { WriteChapterDialog } from "./write-chapter-dialog";
import { GenerateEntityDialog } from "./generate-entity-dialog";

interface WritingToolbarProps {
  project: ProjectRead;
}

export function WritingToolbar({ project }: WritingToolbarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const {
    mode,
    setMode,
    chapterNumber,
    isLeftPaneCollapsed,
    isRightPaneCollapsed,
    toggleLeftPane,
    toggleRightPane,
  } = useWritingStore();

  const content = useWritingStore((state) => state.content);
  const { isStreaming } = useStreamingState();

  // 计算字数
  const wordCount = useMemo(() => {
    if (!content) return 0;
    // 中文字符 + 英文单词
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }, [content]);

  const handleStopWrite = () => {
    // TODO: 停止流式写作
    console.log("停止书写");
  };

  const handleReview = () => {
    // TODO: 触发 AI 审稿
    console.log("AI 审稿");
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4">
      {/* 左侧：返回 + 项目名 */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>返回作品中心</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{project.name}</span>
          <Badge variant="outline" className="text-xs font-mono">
            写作中
          </Badge>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* 写作模式切换 */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        {writingModes.map((modeConfig) => {
          const isActive = mode === modeConfig.id;
          const Icon = modeConfig.id === "auto" ? Sparkles : Film;
          return (
            <Tooltip key={modeConfig.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5 transition-all",
                    isActive && "bg-background shadow-sm glow-primary"
                  )}
                  onClick={() => setMode(modeConfig.id as WritingMode)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{modeConfig.name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {modeConfig.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {isStreaming ? (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={handleStopWrite}
          >
            <Square className="h-3.5 w-3.5" />
            <span>停止</span>
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 glow-primary"
            onClick={() => setDialogOpen(true)}
          >
            <Play className="h-3.5 w-3.5" />
            <span>开始书写</span>
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleReview}
              disabled={isStreaming || !content}
            >
              <FileSearch className="h-3.5 w-3.5" />
              <span>AI 审稿</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>让 AI 审阅当前内容并给出建议</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setGenerateDialogOpen(true)}
              disabled={isStreaming}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>生成设定</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>生成角色、世界观等设定</TooltipContent>
        </Tooltip>
      </div>

      {/* 右侧：状态 + 面板控制 */}
      <div className="ml-auto flex items-center gap-4">
        {/* 字数统计 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{wordCount.toLocaleString()}</span>
          <span>字</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* 面板折叠控制 */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleLeftPane}
              >
                {isLeftPaneCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isLeftPaneCollapsed ? "展开设定面板" : "折叠设定面板"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleRightPane}
              >
                {isRightPaneCollapsed ? (
                  <PanelRightOpen className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRightPaneCollapsed ? "展开 AI 助手" : "折叠 AI 助手"}
            </TooltipContent>
          </Tooltip>

          {/* 编辑器设置 */}
          <EditorSettings />
        </div>
      </div>

      {/* 写作配置对话框 */}
      <WriteChapterDialog
        projectId={project.id}
        chapterNumber={chapterNumber}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* 生成设定对话框 */}
      <GenerateEntityDialog
        projectId={project.id}
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />
    </header>
  );
}
