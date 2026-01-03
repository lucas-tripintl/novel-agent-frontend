"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export interface Step {
  id: string | number;
  title: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            {/* 步骤圆点 */}
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                isCompleted && "bg-primary/10 text-primary",
                isCurrent && "bg-primary/10 text-primary",
                isPending && "bg-muted text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 text-primary",
                  isPending && "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : isCurrent ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="font-medium whitespace-nowrap">{step.title}</span>
            </div>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 min-w-8",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// 垂直步骤条
interface VerticalStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function VerticalSteps({
  steps,
  currentStep,
  className,
}: VerticalStepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step.id} className="flex gap-4">
            {/* 步骤指示器 */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-mono shrink-0 transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary/20 text-primary border-2 border-primary",
                  isPending &&
                    "bg-muted text-muted-foreground border-2 border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  index + 1
                )}
              </div>
              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 mt-2 min-h-8",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>

            {/* 步骤内容 */}
            <div className="flex-1 pb-8">
              <h4
                className={cn(
                  "font-medium",
                  (isCompleted || isCurrent) && "text-primary"
                )}
              >
                {step.title}
              </h4>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
