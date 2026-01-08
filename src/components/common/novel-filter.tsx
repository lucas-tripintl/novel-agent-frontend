"use client";

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
import { useProjectSelectionStore } from "@/stores/project-selection-store";
import { BookOpen, Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";

interface NovelFilterProps {
  /** 受控模式：外部传入选中的 ID */
  selectedId?: string | null;
  /** 受控模式：外部处理选择变化 */
  onSelectionChange?: (id: string | null) => void;
  className?: string;
  /** 是否默认选择第一个项目 */
  autoSelectFirst?: boolean;
  /** 是否使用全局 store（默认 true） */
  useGlobalStore?: boolean;
}

export function NovelFilter({
  selectedId: externalSelectedId,
  onSelectionChange: externalOnSelectionChange,
  className,
  autoSelectFirst = false,
  useGlobalStore = true,
}: NovelFilterProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useProjects();

  // 全局 store
  const storeSelectedId = useProjectSelectionStore((s) => s.selectedProjectId);
  const storeSetSelected = useProjectSelectionStore((s) => s.setSelectedProject);

  // 决定使用哪个状态源
  const selectedId = useGlobalStore
    ? storeSelectedId
    : (externalSelectedId ?? null);

  const onSelectionChange = useGlobalStore
    ? storeSetSelected
    : (externalOnSelectionChange ?? (() => { }));

  // 将项目列表转换为 novels 格式
  const items = data?.items;
  const novels = useMemo(() => {
    if (!items) return [];
    return items.map(projectToNovel);
  }, [items]);

  // 自动选择第一个项目
  useEffect(() => {
    if (autoSelectFirst && novels.length > 0 && !selectedId) {
      onSelectionChange(novels[0].id);
    }
  }, [autoSelectFirst, novels, selectedId, onSelectionChange]);

  const selectedNovel = novels.find((n) => n.id === selectedId);

  const selectNovel = (novelId: string) => {
    onSelectionChange(novelId);
    setOpen(false); // 选中即关闭
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
        <span className="text-sm">{t("loadProjectsFailed")}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between gap-2 bg-card/50 border-border/50 hover:bg-accent/50",
            className
          )}
        >
          {selectedNovel ? (
            <div className="flex items-center gap-2 truncate">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedNovel.color }}
              />
              <span className="truncate">{selectedNovel.title}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{t("selectNovel")}</span>
            </div>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 min-w-[200px]"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t("searchNovelPlaceholder")} className="h-9" />
          <CommandList>
            <CommandEmpty>
              {novels.length === 0 ? t("noProjects") : t("noNovelsFound")}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all_novels_clear_selection"
                onSelect={() => {
                  onSelectionChange(null);
                  setOpen(false);
                }}
                className="cursor-pointer font-medium text-primary"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {t("allNovels")}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4 shrink-0",
                    selectedId === null ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {novels.map((novel) => (
                <CommandItem
                  key={novel.id}
                  value={novel.id}
                  keywords={[novel.title]}
                  onSelect={() => selectNovel(novel.id)}
                  className="cursor-pointer"
                >
                  <div
                    className="mr-2 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: novel.color }}
                  />
                  <span className="flex-1 truncate">{novel.title}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      selectedId === novel.id
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
