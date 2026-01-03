"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div
          className={cn(
            "text-2xl font-bold font-mono text-primary",
            valueClassName
          )}
        >
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

// 小型横向统计卡片
interface StatCardHorizontalProps extends StatCardProps {
  description?: string;
}

export function StatCardHorizontal({
  title,
  value,
  icon: Icon,
  description,
  className,
}: StatCardHorizontalProps) {
  return (
    <Card
      className={cn(
        "bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer",
        className
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        <div className="text-lg font-mono font-semibold text-primary">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
