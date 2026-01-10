"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import {
  Loader2,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Square,
  PenLine,
  ChevronDown,
} from "lucide-react";
import type {
  DecisionPoint,
  UserDecision,
  OutlineGenerationStatus,
} from "@/types/interactive-outline";

interface DecisionPanelProps {
  status: OutlineGenerationStatus;
  decision: DecisionPoint | null;
  onSelectOption: (optionId: string) => Promise<void>;
  onSkip: () => Promise<void>;
  onCustomInput: (input: string) => Promise<void>;
  onStop: () => void;
  onComplete: () => void;
  /** 已做的决策列表，用于完成界面展示 */
  decisionsForDisplay?: Array<{
    id: string;
    question: string;
    chosenLabel: string;
  }>;
  /** 生成类型：细纲或正文（用于显示不同完成消息） */
  generationType?: "outline" | "content";
}

/**
 * 获取决策阶段标签
 */
function getDecisionPhaseLabel(decisionId: string): string {
  if (decisionId.startsWith("macro_")) return "宏观决策";
  if (decisionId.startsWith("dp_")) return "剧情决策";
  return "决策";
}

export function DecisionPanel({
  status,
  decision,
  onSelectOption,
  onSkip,
  onCustomInput,
  onStop,
  onComplete,
  decisionsForDisplay = [],
  generationType = "outline",
}: DecisionPanelProps) {
  const t = useTranslations("write");

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当决策点变化时重置状态
  useEffect(() => {
    if (decision) {
      // 默认选中推荐选项
      const recommended = decision.options.find((opt) => opt.recommended);
      setSelectedOptionId(recommended?.id || decision.options[0]?.id || null);
      setCustomInput("");
      setIsCustomMode(false);
    }
  }, [decision]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isCustomMode && customInput.trim()) {
        await onCustomInput(customInput.trim());
      } else if (selectedOptionId) {
        await onSelectOption(selectedOptionId);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    isCustomMode,
    customInput,
    selectedOptionId,
    onCustomInput,
    onSelectOption,
  ]);

  const handleSkip = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSkip();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSkip]);

  const canSubmit = isCustomMode
    ? customInput.trim().length > 0
    : selectedOptionId !== null;

  // 生成中状态
  if (status === "generating") {
    return (
      <div className="flex h-full flex-col border-l border-border/50 bg-card/30 min-h-0">
        {/* 头部 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {generationType === "content" ? t("generatingContent") : t("generatingOutline")}
            </p>
            <p className="text-xs text-muted-foreground">{t("pleaseWait")}</p>
          </div>
        </div>

        {/* 内容区 - 空白等待 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("aiThinking")}
            </p>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="w-full text-destructive hover:text-destructive"
          >
            <Square className="h-3.5 w-3.5 mr-1.5" />
            {t("stop")}
          </Button>
        </div>
      </div>
    );
  }

  // 完成状态
  if (status === "completed") {
    return (
      <div className="flex h-full flex-col border-l border-border/50 bg-card/30 min-h-0">
        {/* 头部 - 成功提示 */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 ${DESIGN_TOKENS.backgrounds.success}`}>
          <CheckCircle2 className={`h-5 w-5 ${DESIGN_TOKENS.colors.success}`} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {generationType === "content" ? t("contentCompleted") : t("outlineCompleted")}
            </p>
            <p className="text-xs text-muted-foreground">{t("autoSaved")}</p>
          </div>
        </div>

        {/* 决策摘要 */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {decisionsForDisplay.length > 0 && (
              <>
                <h4 className="text-xs font-medium text-muted-foreground">
                  {t("decisionsThisSession")}
                </h4>
                {decisionsForDisplay.map((d) => (
                  <div
                    key={d.id}
                    className="p-2 rounded-lg bg-muted/30 border border-border/30 text-xs"
                  >
                    <p className="font-medium">{d.question}</p>
                    <p className="text-muted-foreground mt-1">→ {d.chosenLabel}</p>
                  </div>
                ))}
              </>
            )}
            {decisionsForDisplay.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className={`h-10 w-10 ${DESIGN_TOKENS.colors.success}/50 mx-auto mb-3`} />
                <p className="text-sm text-muted-foreground">
                  {generationType === "content"
                    ? t("contentGeneratedSuccessfully")
                    : t("outlineGeneratedSuccessfully")}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 完成按钮 */}
        <div className="p-3 border-t border-border/50">
          <Button onClick={onComplete} className="w-full">
            {t("complete")}
          </Button>
        </div>
      </div>
    );
  }

  // 错误状态
  if (status === "error") {
    return (
      <div className="flex h-full flex-col border-l border-border/50 bg-card/30 min-h-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 px-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Square className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">
              {t("generationFailed")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("generationFailedHint")}
            </p>
          </div>
        </div>
        <div className="p-3 border-t border-border/50">
          <Button variant="outline" onClick={onComplete} className="w-full">
            {t("close")}
          </Button>
        </div>
      </div>
    );
  }

  // 等待决策状态
  if (status === "decision" && decision) {
    return (
      <div className="flex h-full flex-col border-l border-border/50 bg-card/30 min-h-0">
        {/* 头部 - 状态指示 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <div className={`h-8 w-8 rounded-full ${DESIGN_TOKENS.backgrounds.warning} flex items-center justify-center shrink-0`}>
            <HelpCircle className={`h-4 w-4 ${DESIGN_TOKENS.colors.warning}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t("makeSelection")}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  decision.importance === "critical"
                    ? "border-destructive/30 text-destructive"
                    : "border-border"
                )}
              >
                {decision.importance === "critical"
                  ? t("criticalDecision")
                  : t("normalDecision")}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {getDecisionPhaseLabel(decision.id)}
              </Badge>
            </div>
          </div>
        </div>

        {/* 决策选项 */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* 决策问题 */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-sm font-medium">{decision.question}</p>
              {decision.context && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {decision.context}
                </p>
              )}
            </div>

            {/* 选项列表 */}
            <div className="space-y-2">
              <RadioGroup
                value={isCustomMode ? "" : selectedOptionId || ""}
                onValueChange={(value) => {
                  setSelectedOptionId(value);
                  setIsCustomMode(false);
                }}
              >
                {decision.options.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "block p-3 rounded-lg border cursor-pointer transition-all",
                      "hover:border-primary/40",
                      selectedOptionId === option.id && !isCustomMode
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/50 bg-card/30",
                      option.recommended &&
                        selectedOptionId !== option.id &&
                        "                        `${DESIGN_TOKENS.borders.success} ${DESIGN_TOKENS.backgrounds.success}`"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={option.id}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {option.label}
                          </span>
                          {option.recommended && (
                            <Badge className={`text-[10px] ${DESIGN_TOKENS.backgrounds.success} ${DESIGN_TOKENS.colors.success} ${DESIGN_TOKENS.borders.success}`}>
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                              {t("recommended")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {option.description}
                        </p>
                        {option.recommended && option.reason && (
                          <div className="flex items-start gap-1.5 mt-2">
                            <CheckCircle2 className={`h-3.5 w-3.5 ${DESIGN_TOKENS.colors.success} mt-0.5 shrink-0`} />
                            <p className={`text-xs ${DESIGN_TOKENS.colors.success}`}>
                              {option.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* 自定义输入 */}
            {decision.allow_custom && (
              <Collapsible
                open={isCustomMode}
                onOpenChange={(open) => {
                  if (open) setIsCustomMode(true);
                }}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 p-3 rounded-lg border transition-all",
                      "hover:border-primary/40 text-sm",
                      isCustomMode
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/50 bg-card/30"
                    )}
                  >
                    <PenLine className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left font-medium">
                      {t("customDirection")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isCustomMode && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <Textarea
                    placeholder={t("customDirectionPlaceholder")}
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value);
                      setIsCustomMode(true);
                    }}
                    className="min-h-[80px] resize-none"
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        {/* 底部操作栏 */}
        <div className="p-3 border-t border-border/50 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t("skipUseRecommended")}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!canSubmit || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("confirmSelection")
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="w-full text-destructive hover:text-destructive"
          >
            <Square className="h-3.5 w-3.5 mr-1.5" />
            {t("stop")}
          </Button>
        </div>
      </div>
    );
  }

  // 空闲状态 - 不应该显示这个面板
  return null;
}
