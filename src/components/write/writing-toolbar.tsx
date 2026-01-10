"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ProjectRead } from "@/types/api";
import { useWritingStore, useStreamingState, useInteractiveContentState } from "@/stores/writing-store";
import { useInteractiveChapterWriting } from "@/hooks/use-interactive-chapter-writing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Play,
  Square,
  FileSearch,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Wand2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { EditorSettings } from "./editor/editor-settings";
import { WriteChapterDialog } from "./write-chapter-dialog";
import { GenerateEntityDialog } from "./generate-entity-dialog";
import { GenerateOutlineDialog } from "./generate-outline-dialog";

interface WritingToolbarProps {
  project: ProjectRead;
}

export function WritingToolbar({ project }: WritingToolbarProps) {
  const t = useTranslations("write");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [outlineDialogOpen, setOutlineDialogOpen] = useState(false);

  const {
    chapterNumber,
    isLeftPaneCollapsed,
    isRightPaneCollapsed,
    toggleLeftPane,
    toggleRightPane,
  } = useWritingStore();

  const content = useWritingStore((state) => state.content);
  const { isStreaming } = useStreamingState();

  // 交互式正文生成
  const {
    startGeneration,
    isGenerating: isContentGenerating,
    error: contentGenerationError,
    clearError: clearContentGenerationError,
  } = useInteractiveChapterWriting(project.id, chapterNumber);

  const {
    contentGenerationCollabMode,
    streamingContentText,
    contentGenerationStatus,
  } = useInteractiveContentState();

  // 判断错误类型，是否是缺少细纲的错误
  const isOutlineRequiredError = contentGenerationError?.code === "OUTLINE_REQUIRED";

  // 处理错误对话框的"生成细纲"按钮
  const handleGenerateOutlineFromError = () => {
    clearContentGenerationError();
    setOutlineDialogOpen(true);
  };

  // 计算字数：流式生成时用 streamingContentText，否则用 content
  const wordCount = useMemo(() => {
    const isInGenerationMode = contentGenerationStatus === "generating" ||
      contentGenerationStatus === "decision" ||
      contentGenerationStatus === "completed";
    const textToCount = isInGenerationMode ? streamingContentText : content;
    if (!textToCount) return 0;
    // 中文字符 + 英文单词
    const chineseChars = (textToCount.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (textToCount.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }, [content, streamingContentText, contentGenerationStatus]);

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
          <TooltipContent>{t("backToProjects")}</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{project.name}</span>
          <Badge variant="outline" className="text-xs font-mono">
            {t("writing")}
          </Badge>
        </div>
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
            <span>{t("stop")}</span>
          </Button>
        ) : (
          <>
            {/* 生成细纲按钮 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setOutlineDialogOpen(true)}
                  disabled={!chapterNumber}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{t("generateOutline")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("generateOutlineTooltip")}</TooltipContent>
            </Tooltip>

            {/* 生成正文按钮 */}
            <Button
              size="sm"
              className="gap-1.5 glow-primary"
              onClick={() => setDialogOpen(true)}
              disabled={!chapterNumber || contentGenerationCollabMode}
            >
              <Play className="h-3.5 w-3.5" />
              <span>{t("generateContent")}</span>
            </Button>
          </>
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
              <span>{t("aiReview")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("aiReviewTooltip")}</TooltipContent>
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
              <span>{t("generateEntity")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("generateEntityTooltip")}</TooltipContent>
        </Tooltip>
      </div>

      {/* 右侧：状态 + 面板控制 */}
      <div className="ml-auto flex items-center gap-4">
        {/* 字数统计 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{wordCount.toLocaleString()}</span>
          <span>{t("words")}</span>
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
              {isLeftPaneCollapsed ? t("expandSettingsPane") : t("collapseSettingsPane")}
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
              {isRightPaneCollapsed ? t("expandAssistant") : t("collapseAssistant")}
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
        onStartGeneration={startGeneration}
        isGenerating={isContentGenerating}
      />

      {/* 生成设定对话框 */}
      <GenerateEntityDialog
        projectId={project.id}
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />

      {/* 生成细纲对话框 */}
      <GenerateOutlineDialog
        projectId={project.id}
        chapterNumber={chapterNumber}
        open={outlineDialogOpen}
        onOpenChange={setOutlineDialogOpen}
      />

      {/* 正文生成错误对话框 */}
      <AlertDialog
        open={!!contentGenerationError}
        onOpenChange={(open) => !open && clearContentGenerationError()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              生成失败
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {contentGenerationError?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>关闭</AlertDialogCancel>
            {isOutlineRequiredError && (
              <AlertDialogAction onClick={handleGenerateOutlineFromError}>
                <FileText className="mr-2 h-4 w-4" />
                去生成细纲
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
