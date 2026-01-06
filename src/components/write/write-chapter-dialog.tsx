"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, ShieldCheck, RotateCcw, Hash } from "lucide-react";
import { useWriteChapter } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

interface WriteChapterDialogProps {
  projectId: string;
  chapterNumber: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_PROMPT_LENGTH = 2000;
const DEFAULT_SCORE_THRESHOLD = 80;
const DEFAULT_MAX_RETRIES = 3;

export function WriteChapterDialog({
  projectId,
  chapterNumber: defaultChapterNumber,
  open,
  onOpenChange,
}: WriteChapterDialogProps) {
  // Form state
  const [chapterNumber, setChapterNumber] = useState<number | null>(defaultChapterNumber);
  const [prompt, setPrompt] = useState("");
  const [skipReview, setSkipReview] = useState(false);
  const [scoreThreshold, setScoreThreshold] = useState(DEFAULT_SCORE_THRESHOLD);
  const [maxRetries, setMaxRetries] = useState(DEFAULT_MAX_RETRIES.toString());

  const writeChapterMutation = useWriteChapter();

  // Generate default prompt based on chapter number
  const getDefaultPrompt = (num: number | null) => {
    return num ? `完成第${num}章` : "续写当前章节";
  };

  // Reset form and handle dialog state
  const handleOpenChange = (newOpen: boolean) => {
    if (writeChapterMutation.isPending) return;

    if (newOpen) {
      // Reset form when opening
      setChapterNumber(defaultChapterNumber);
      setPrompt(getDefaultPrompt(defaultChapterNumber));
      setSkipReview(false);
      setScoreThreshold(DEFAULT_SCORE_THRESHOLD);
      setMaxRetries(DEFAULT_MAX_RETRIES.toString());
    }
    onOpenChange(newOpen);
  };

  // Update prompt when chapter number changes
  const handleChapterNumberChange = (value: string) => {
    const num = value === "" ? null : parseInt(value);
    if (num !== null && (isNaN(num) || num < 1)) return;
    setChapterNumber(num);
    // Update prompt to match new chapter number
    setPrompt(getDefaultPrompt(num));
  };

  const handleSubmit = async () => {
    const finalPrompt = prompt.trim() || getDefaultPrompt(chapterNumber);

    try {
      await writeChapterMutation.mutateAsync({
        projectId,
        params: {
          prompt: finalPrompt,
          skip_review: skipReview,
          chapter_number: chapterNumber ?? undefined,
          max_retries: skipReview ? undefined : parseInt(maxRetries),
          score_threshold: skipReview ? undefined : scoreThreshold,
        },
      });

      handleOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = writeChapterMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            开始书写
          </DialogTitle>
          <DialogDescription>
            配置写作参数，AI 将为你完成章节创作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Chapter Number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <Label htmlFor="chapter-number">章节号</Label>
            </div>
            <Input
              id="chapter-number"
              type="number"
              min={1}
              placeholder="输入章节号"
              value={chapterNumber ?? ""}
              onChange={(e) => handleChapterNumberChange(e.target.value)}
              disabled={isPending}
              className="w-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              指定要写作的章节号，留空则续写当前章节
            </p>
          </div>

          {/* Writing Prompt */}
          <div className="space-y-2">
            <Label htmlFor="write-prompt">写作提示</Label>
            <Textarea
              id="write-prompt"
              placeholder="描述本章的写作目标或特殊要求..."
              className="min-h-[100px] resize-none"
              value={prompt}
              onChange={(e) => {
                if (e.target.value.length <= MAX_PROMPT_LENGTH) {
                  setPrompt(e.target.value);
                }
              }}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </p>
          </div>

          {/* Skip Review Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="skip-review"
                className="text-sm font-medium cursor-pointer"
              >
                跳过审核流程
              </Label>
              <p className="text-xs text-muted-foreground">
                开启后直接生成，不进行一致性检查
              </p>
            </div>
            <Switch
              id="skip-review"
              checked={skipReview}
              onCheckedChange={setSkipReview}
              disabled={isPending}
            />
          </div>

          {/* Review Settings (shown when not skipping) */}
          <div
            className={cn(
              "space-y-4 rounded-lg border border-border/50 p-4 transition-all duration-200",
              skipReview
                ? "opacity-40 pointer-events-none bg-muted/10"
                : "bg-background"
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              审核设置
            </div>

            {/* Score Threshold Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="score-threshold" className="text-sm">
                  一致性评分阈值
                </Label>
                <span className="font-mono text-sm font-semibold text-primary">
                  {scoreThreshold}分
                </span>
              </div>
              <Slider
                id="score-threshold"
                value={[scoreThreshold]}
                onValueChange={(value) => setScoreThreshold(value[0])}
                min={0}
                max={100}
                step={5}
                disabled={isPending || skipReview}
                className="py-1"
              />
              <p className="text-xs text-muted-foreground">
                低于此分数将触发改写，分数越高要求越严格
              </p>
            </div>

            {/* Max Retries Select */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="max-retries" className="text-sm">
                  最大重试次数
                </Label>
              </div>
              <Select
                value={maxRetries}
                onValueChange={setMaxRetries}
                disabled={isPending || skipReview}
              >
                <SelectTrigger id="max-retries" className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} 次
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                审核不通过时的最大改写尝试次数
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-1.5 glow-primary"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始书写
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
