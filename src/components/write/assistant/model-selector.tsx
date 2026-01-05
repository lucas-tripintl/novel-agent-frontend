"use client";

import { useState, useEffect } from "react";
import { useSelectedModel } from "@/stores/writing-store";
import { useModels } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { Cpu, ChevronDown, Loader2, Check, Brain } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ModelSelectorProps {
  className?: string;
}

// 提供商图标/颜色映射
const providerStyles: Record<string, { color: string; label: string }> = {
  openai: { color: "text-green-500", label: "OpenAI" },
  anthropic: { color: "text-orange-500", label: "Anthropic" },
  google: { color: "text-blue-500", label: "Google" },
  deepseek: { color: "text-cyan-500", label: "DeepSeek" },
  default: { color: "text-muted-foreground", label: "Other" },
};

function getProviderStyle(providerType: string) {
  return providerStyles[providerType.toLowerCase()] ?? providerStyles.default;
}

export function ModelSelector({ className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const { selectedModelId, setSelectedModel } = useSelectedModel();
  const { data: models, isLoading } = useModels();

  const selectedModel = models?.find((m) => m.id === selectedModelId);

  // 如果没有选中模型，自动选择默认模型
  useEffect(() => {
    if (!selectedModelId && models && models.length > 0) {
      const defaultModel = models.find((m) => m.is_default) ?? models[0];
      setSelectedModel(defaultModel.id);
    }
  }, [selectedModelId, models, setSelectedModel]);

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setOpen(false);
  };

  // 按提供商分组
  const groupedModels = (models ?? []).reduce(
    (acc, model) => {
      const provider = model.provider_type.toLowerCase();
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, typeof models>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md",
            "border border-border/50",
            "text-xs font-medium",
            "transition-colors hover:bg-muted",
            selectedModel
              ? "bg-primary/5 border-primary/20 text-foreground"
              : "bg-muted/50 text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <Cpu
            className={cn(
              "h-3 w-3",
              selectedModel
                ? getProviderStyle(selectedModel.provider_type).color
                : ""
            )}
          />
          <span className="max-w-[80px] truncate">
            {selectedModel ? selectedModel.name : "模型"}
          </span>
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs">选择 AI 模型</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : !models || models.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            暂无可用模型
          </div>
        ) : (
          Object.entries(groupedModels).map(([provider, providerModels]) => {
            const style = getProviderStyle(provider);
            return (
              <div key={provider}>
                <DropdownMenuLabel className="text-[10px] text-muted-foreground py-1">
                  {style.label}
                </DropdownMenuLabel>
                {providerModels?.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className={cn("h-3.5 w-3.5", style.color)} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {model.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(model.context_window / 1000)}K 上下文
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {model.supports_thinking && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 gap-0.5"
                        >
                          <Brain className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                      {selectedModelId === model.id && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
