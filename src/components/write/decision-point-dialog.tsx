"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HelpCircle,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  PenLine,
} from "lucide-react";
import type { DecisionPoint, UserDecision } from "@/types/interactive-outline";

interface DecisionPointDialogProps {
  decision: DecisionPoint | null;
  open: boolean;
  onSubmit: (decision: UserDecision) => Promise<void>;
  onSkip: () => Promise<void>;
  isSubmitting?: boolean;
}

// 重要性样式映射
const importanceStyles = {
  critical: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
    label: "关键决策",
  },
  normal: {
    badge: "bg-primary/10 text-primary border-primary/20",
    icon: <HelpCircle className="h-4 w-4 text-primary" />,
    label: "一般决策",
  },
  minor: {
    badge: "bg-muted text-muted-foreground border-border",
    icon: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
    label: "次要决策",
  },
};

export function DecisionPointDialog({
  decision,
  open,
  onSubmit,
  onSkip,
  isSubmitting = false,
}: DecisionPointDialogProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showImpact, setShowImpact] = useState<string | null>(null);

  // 当决策点变化时重置状态
  useEffect(() => {
    if (decision) {
      // 默认选中推荐选项
      const recommended = decision.options.find((opt) => opt.recommended);
      setSelectedOptionId(recommended?.id || decision.options[0]?.id || null);
      setCustomInput("");
      setIsCustomMode(false);
      setShowImpact(null);
    }
  }, [decision]);

  if (!decision) return null;

  const importance = importanceStyles[decision.importance] || importanceStyles.normal;

  const handleSubmit = async () => {
    const userDecision: UserDecision = {
      decision_point_id: decision.id,
      chosen_option_id: isCustomMode ? null : selectedOptionId,
      custom_input: isCustomMode ? customInput.trim() : null,
      skipped: false,
    };

    await onSubmit(userDecision);
  };

  const handleSkip = async () => {
    await onSkip();
  };

  const canSubmit = isCustomMode
    ? customInput.trim().length > 0
    : selectedOptionId !== null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[600px] h-[85vh] max-h-[700px] overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            {importance.icon}
            <DialogTitle className="flex items-center gap-2">
              决策点
              <Badge variant="outline" className={importance.badge}>
                {importance.label}
              </Badge>
            </DialogTitle>
          </div>
          <DialogDescription className="text-base font-medium text-foreground pt-2">
            {decision.question}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              {/* 上下文说明 */}
              {decision.context && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {decision.context}
                  </p>
                </div>
              )}

              {/* 选项列表 */}
              <div className="space-y-3">
                <Label>选择一个方向</Label>
                <RadioGroup
                  value={isCustomMode ? "" : (selectedOptionId || "")}
                  onValueChange={(value) => {
                    setSelectedOptionId(value);
                    setIsCustomMode(false);
                  }}
                  className="space-y-2"
                >
                  {decision.options.map((option) => (
                    <div key={option.id} className="relative">
                      <label
                        className={`
                          flex flex-col p-4 rounded-lg border cursor-pointer
                          transition-all hover:border-primary/50
                          ${
                            selectedOptionId === option.id && !isCustomMode
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value={option.id}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              {option.recommended && (
                                <Badge
                                  variant="secondary"
                                  className={`gap-1 text-xs ${DESIGN_TOKENS.backgrounds.success} ${DESIGN_TOKENS.colors.success} ${DESIGN_TOKENS.borders.success}`}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  推荐
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>

                            {/* 推荐理由（仅推荐选项显示） */}
                            {option.recommended && option.reason && (
                              <div className="flex items-start gap-2 pt-1">
                                <CheckCircle2 className={`h-4 w-4 ${DESIGN_TOKENS.colors.success} mt-0.5 shrink-0`} />
                                <p className={`text-xs ${DESIGN_TOKENS.colors.success}`}>
                                  {option.reason}
                                </p>
                              </div>
                            )}

                            {/* 影响说明（可折叠） */}
                            {option.impact && (
                              <Collapsible
                                open={showImpact === option.id}
                                onOpenChange={(open) =>
                                  setShowImpact(open ? option.id : null)
                                }
                              >
                                <CollapsibleTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <ArrowRight
                                      className={`h-3 w-3 transition-transform ${
                                        showImpact === option.id
                                          ? "rotate-90"
                                          : ""
                                      }`}
                                    />
                                    查看影响
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2">
                                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                    {option.impact}
                                  </p>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 自定义输入 */}
              {decision.allow_custom && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground px-2">或</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <label
                    className={`
                      flex flex-col p-4 rounded-lg border cursor-pointer
                      transition-all hover:border-primary/50
                      ${
                        isCustomMode
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border"
                      }
                    `}
                    onClick={() => setIsCustomMode(true)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <PenLine className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">自定义方向</span>
                    </div>
                    <Textarea
                      placeholder="描述你想要的故事走向..."
                      className="min-h-[80px] resize-none"
                      value={customInput}
                      onChange={(e) => {
                        setCustomInput(e.target.value);
                        setIsCustomMode(true);
                      }}
                      onFocus={() => setIsCustomMode(true)}
                    />
                  </label>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="pt-4 border-t shrink-0">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="mr-auto"
          >
            跳过（使用推荐）
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>处理中...</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                确认选择
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
