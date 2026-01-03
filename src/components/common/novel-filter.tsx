"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjects, projectToNovel } from "@/hooks/use-projects";
import { BookOpen, Check, ChevronsUpDown, X, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface NovelFilterProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  className?: string;
  /** 是否默认选择第一个项目 */
  autoSelectFirst?: boolean;
}

export function NovelFilter({
  selectedIds,
  onSelectionChange,
  className,
  autoSelectFirst = false,
}: NovelFilterProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useProjects();

  // 将项目列表转换为 novels 格式
  const items = data?.items;
  const novels = useMemo(() => {
    if (!items) return [];
    return items.map(projectToNovel);
  }, [items]);

  // 自动选择第一个项目
  useEffect(() => {
    if (autoSelectFirst && novels.length > 0 && selectedIds.length === 0) {
      onSelectionChange([novels[0].id]);
    }
  }, [autoSelectFirst, novels, selectedIds.length, onSelectionChange]);

  const selectedNovels = novels.filter((n) => selectedIds.includes(n.id));

  const toggleNovel = (novelId: string) => {
    if (selectedIds.includes(novelId)) {
      onSelectionChange(selectedIds.filter((id) => id !== novelId));
    } else {
      onSelectionChange([...selectedIds, novelId]);
    }
  };

  const removeNovel = (novelId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== novelId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-9 w-[180px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">加载项目失败</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[180px] justify-between bg-card/50 border-border/50 hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedIds.length === 0
                  ? "选择小说"
                  : `已选 ${selectedIds.length} 本`}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="搜索小说..." />
            <CommandList>
              <CommandEmpty>
                {novels.length === 0 ? "暂无项目，请先导入小说" : "未找到小说"}
              </CommandEmpty>
              <CommandGroup>
                {novels.map((novel) => (
                  <CommandItem
                    key={novel.id}
                    value={novel.title}
                    onSelect={() => toggleNovel(novel.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className="mr-2 h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: novel.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{novel.title}</div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selectedIds.includes(novel.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 已选小说标签 */}
      {selectedNovels.map((novel) => (
        <Badge
          key={novel.id}
          variant="secondary"
          className="gap-1 pr-1 bg-card/50 border border-border/50"
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: novel.color }}
          />
          {novel.title}
          <button
            onClick={() => removeNovel(novel.id)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* 清空按钮 */}
      {selectedIds.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          清空
        </Button>
      )}
    </div>
  );
}

/**
 * 获取小说信息的 hook（供其他组件使用）
 */
export function useNovelInfo(novelId: string | null) {
  const { data } = useProjects();
  const items = data?.items;

  return useMemo(() => {
    if (!novelId || !items) return null;
    const project = items.find((p) => p.id === novelId);
    return project ? projectToNovel(project) : null;
  }, [novelId, items]);
}
