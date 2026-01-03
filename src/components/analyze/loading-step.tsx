"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoadingStepProps {
  projectName: string;
  startChapter: number;
  endChapter: number;
  onCancel?: () => void;
  error?: Error | null;
  isCancelling?: boolean;
}

export function LoadingStep({
  projectName,
  startChapter,
  endChapter,
  onCancel,
  error = null,
  isCancelling = false,
}: LoadingStepProps) {
  return (
    <Card className="bg-card/50">
      <CardContent className="flex flex-col items-center justify-center py-16">
        {/* Loading 动画 */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>

        {/* 状态文字 */}
        <h3 className="text-xl font-semibold mb-2">正在分析中...</h3>
        <p className="text-muted-foreground text-center mb-2">
          《{projectName}》{startChapter}-{endChapter} 章
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          AI 正在提取设定，请稍候...
        </p>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mb-4 max-w-md">
            <AlertDescription>
              分析失败：{error.message || "请稍后重试"}
            </AlertDescription>
          </Alert>
        )}

        {/* 取消按钮 */}
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                取消中...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                取消
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
