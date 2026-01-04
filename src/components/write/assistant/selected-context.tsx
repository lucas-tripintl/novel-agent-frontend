"use client";

import type { SelectedEntity, WritingMode } from "@/types/writing";
import { useWritingStore } from "@/stores/writing-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Film,
  X,
  User,
  Globe,
  Zap,
  Package,
  MapPin,
  Flag,
  GitBranch,
  Circle,
} from "lucide-react";

// 简化的图标映射
const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  character: User,
  worldview: Globe,
  power_system: Zap,
  item: Package,
  location: MapPin,
  faction: Flag,
  plotline: GitBranch,
};

interface SelectedContextProps {
  entities: SelectedEntity[];
  mode: WritingMode;
}

export function SelectedContext({ entities, mode }: SelectedContextProps) {
  const { removeEntity } = useWritingStore();

  if (entities.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {mode === "auto" ? (
            <>
              <Sparkles className="h-3 w-3 text-primary" />
              <span>AI 将自动选择相关设定</span>
            </>
          ) : (
            <>
              <Film className="h-3 w-3 text-amber-500" />
              <span>从左侧设定面板选择要引用的内容</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/50">
      <div className="px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {mode === "auto" ? "AI 选择的设定" : "已选设定"}
        </span>
        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
          {entities.length}
        </Badge>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 pb-3">
          {entities.map((entity) => {
            const Icon = typeIconMap[entity.entityType] || Circle;

            return (
              <HoverCard key={entity.id} openDelay={200}>
                <HoverCardTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md",
                      "bg-primary/10 border border-primary/20",
                      "text-xs font-medium shrink-0",
                      "transition-colors hover:bg-primary/15"
                    )}
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    <span className="max-w-[100px] truncate">{entity.name}</span>

                    {/* 导演模式下可移除 */}
                    {mode === "director" && (
                      <button
                        className="ml-1 hover:text-destructive transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEntity(entity.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </HoverCardTrigger>

                <HoverCardContent side="bottom" className="w-64 p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-sm">{entity.name}</span>
                    </div>

                    {entity.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {entity.content}
                      </p>
                    )}

                    {entity.tags && entity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entity.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
