"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Type, List, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { getAvailableConfigs } from "./config";
import type { AddAttributePopoverProps, CharacterAttributeKey } from "./types";

/**
 * 添加属性弹出层组件
 * 使用 Command 组件实现搜索式选择
 */
export function AddAttributePopover({
  existingKeys,
  onAdd,
}: AddAttributePopoverProps) {
  const [open, setOpen] = useState(false);

  // 获取可添加的属性列表
  const availableConfigs = useMemo(
    () => getAvailableConfigs(existingKeys),
    [existingKeys]
  );

  const handleSelect = useCallback(
    (key: string) => {
      onAdd(key as CharacterAttributeKey);
      setOpen(false);
    },
    [onAdd]
  );

  // 按类型分组
  const textConfigs = useMemo(
    () => availableConfigs.filter((c) => c.type === "text"),
    [availableConfigs]
  );
  const arrayConfigs = useMemo(
    () => availableConfigs.filter((c) => c.type === "array"),
    [availableConfigs]
  );

  // 没有可添加的属性时
  if (availableConfigs.length === 0) {
    return (
      <div className="flex items-center justify-center py-3 px-4 rounded-lg border border-dashed border-border/40 bg-card/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary/50" />
          <span>已添加全部属性</span>
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 h-10",
            "border-dashed border-border/50 hover:border-primary/50",
            "bg-card/20 hover:bg-card/40",
            "text-muted-foreground hover:text-foreground",
            "transition-all duration-200"
          )}
        >
          <Plus className="h-4 w-4" />
          <span>添加属性</span>
          <span className="ml-auto text-xs text-muted-foreground/60">
            {availableConfigs.length} 个可选
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 z-[100]"
        align="start"
        side="top"
        sideOffset={8}
        collisionPadding={16}
      >
        <Command>
          <CommandInput placeholder="搜索属性..." />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm text-muted-foreground">
                没有找到匹配的属性
              </div>
            </CommandEmpty>

            {/* 文本类型属性 */}
            {textConfigs.length > 0 && (
              <CommandGroup heading="文本属性">
                {textConfigs.map((config) => (
                  <CommandItem
                    key={config.key}
                    value={`${config.key} ${config.label}`}
                    onSelect={() => handleSelect(config.key)}
                    className="flex items-center gap-3 py-2.5 cursor-pointer group/item"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/50 group-data-[selected=true]/item:bg-background/30">
                      <Type className="h-3.5 w-3.5 text-muted-foreground group-data-[selected=true]/item:text-accent-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{config.label}</span>
                      {config.description && (
                        <span className="text-xs text-muted-foreground/80 group-data-[selected=true]/item:text-accent-foreground/70 line-clamp-1">
                          {config.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* 数组类型属性 */}
            {arrayConfigs.length > 0 && (
              <CommandGroup heading="列表属性">
                {arrayConfigs.map((config) => (
                  <CommandItem
                    key={config.key}
                    value={`${config.key} ${config.label}`}
                    onSelect={() => handleSelect(config.key)}
                    className="flex items-center gap-3 py-2.5 cursor-pointer group/item"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 group-data-[selected=true]/item:bg-background/30">
                      <List className="h-3.5 w-3.5 text-accent group-data-[selected=true]/item:text-accent-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{config.label}</span>
                      {config.description && (
                        <span className="text-xs text-muted-foreground/80 group-data-[selected=true]/item:text-accent-foreground/70 line-clamp-1">
                          {config.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
