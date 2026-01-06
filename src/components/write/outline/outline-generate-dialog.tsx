"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Sparkles,
  ChevronDown,
  X,
  Users,
  Globe,
  Layers,
} from "lucide-react";
import { useGenerateNovelOutline } from "@/hooks/use-outlines";
import { useEntities } from "@/hooks/use-analysis-results";
import type { EntityRead, EntityType } from "@/types/api";

interface OutlineGenerateDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENRE_PRESETS = [
  "玄幻",
  "仙侠",
  "都市",
  "科幻",
  "历史",
  "游戏",
  "悬疑",
  "奇幻",
  "武侠",
  "言情",
  "军事",
  "体育",
];

const TARGET_WORDS = [
  { value: "500000", label: "50万字" },
  { value: "1000000", label: "100万字" },
  { value: "2000000", label: "200万字" },
  { value: "3000000", label: "300万字" },
  { value: "5000000", label: "500万字" },
];

const TARGET_VOLUMES = [
  { value: "1", label: "1卷" },
  { value: "2", label: "2卷" },
  { value: "3", label: "3卷" },
  { value: "4", label: "4卷" },
  { value: "5", label: "5卷" },
  { value: "6", label: "6卷" },
  { value: "8", label: "8卷" },
  { value: "10", label: "10卷" },
];

const ENTITY_TYPES: { type: EntityType; label: string; icon: React.ReactNode }[] = [
  { type: "character", label: "角色", icon: <Users className="h-3.5 w-3.5" /> },
  { type: "worldview", label: "世界观", icon: <Globe className="h-3.5 w-3.5" /> },
  { type: "plotline", label: "剧情线", icon: <Layers className="h-3.5 w-3.5" /> },
];

export function OutlineGenerateDialog({
  projectId,
  open,
  onOpenChange,
}: OutlineGenerateDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [genrePopoverOpen, setGenrePopoverOpen] = useState(false);
  const [targetWords, setTargetWords] = useState("1000000");
  const [targetVolumes, setTargetVolumes] = useState("3");
  const [selectedEntities, setSelectedEntities] = useState<EntityRead[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const generateMutation = useGenerateNovelOutline(projectId);
  const isValid = prompt.trim().length >= 10;

  // 获取各类型实体
  const { data: charactersData } = useEntities(projectId, "character", { limit: 50 });
  const { data: worldviewData } = useEntities(projectId, "worldview", { limit: 50 });
  const { data: plotlineData } = useEntities(projectId, "plotline", { limit: 50 });

  const entitiesByType = useMemo(() => ({
    character: charactersData?.items ?? [],
    worldview: worldviewData?.items ?? [],
    plotline: plotlineData?.items ?? [],
  }), [charactersData, worldviewData, plotlineData]);

  const totalEntities = Object.values(entitiesByType).reduce((sum, arr) => sum + arr.length, 0);

  const handleSubmit = async () => {
    if (!isValid) return;

    // 构建完整 prompt，附加选中的设定
    let fullPrompt = prompt.trim();
    if (selectedEntities.length > 0) {
      const settingsText = selectedEntities
        .map((e) => `【${e.name}】: ${e.content}`)
        .join("\n\n");
      fullPrompt += `\n\n参考设定：\n${settingsText}`;
    }

    try {
      await generateMutation.mutateAsync({
        prompt: fullPrompt,
        genre: genre || undefined,
        target_words: parseInt(targetWords),
        target_volumes: parseInt(targetVolumes),
      });

      onOpenChange(false);

      // 重置表单
      setPrompt("");
      setGenre("");
      setTargetWords("1000000");
      setTargetVolumes("3");
      setSelectedEntities([]);
    } catch {
      // 错误由 mutation 处理
    }
  };

  const toggleEntity = (entity: EntityRead) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => e.id === entity.id);
      if (exists) {
        return prev.filter((e) => e.id !== entity.id);
      }
      return [...prev, entity];
    });
  };

  const removeEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  // 过滤预设类型（匹配输入）
  const filteredGenres = genre
    ? GENRE_PRESETS.filter((g) => g.includes(genre))
    : GENRE_PRESETS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            生成总纲
          </DialogTitle>
          <DialogDescription>
            描述你的创作想法，AI 将为你生成完整的小说总纲
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 py-4 px-1">
            {/* 创意描述 */}
            <div className="space-y-2">
              <Label htmlFor="prompt">
                创意描述 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="prompt"
                placeholder="描述你的小说创意，例如：一个穿越到修仙世界的程序员，发现修炼功法就像编写代码，他能通过 debug 天地法则来突破修为..."
                className="min-h-[120px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {prompt.length}/5000 字符（至少10字）
              </p>
            </div>

            {/* 小说类型 - 可输入可选择 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>小说类型</Label>
                <Popover open={genrePopoverOpen} onOpenChange={setGenrePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={genrePopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {genre || "选择或输入类型"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="搜索或输入类型..."
                        value={genre}
                        onValueChange={setGenre}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-sm">
                            使用自定义类型: <span className="font-medium">{genre}</span>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredGenres.map((g) => (
                            <CommandItem
                              key={g}
                              value={g}
                              onSelect={(value) => {
                                setGenre(value);
                                setGenrePopoverOpen(false);
                              }}
                            >
                              {g}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 目标字数 */}
              <div className="space-y-2">
                <Label htmlFor="target-words">目标字数</Label>
                <Select value={targetWords} onValueChange={setTargetWords}>
                  <SelectTrigger id="target-words">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_WORDS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 计划卷数 */}
            <div className="space-y-2">
              <Label htmlFor="target-volumes">计划卷数</Label>
              <Select value={targetVolumes} onValueChange={setTargetVolumes}>
                <SelectTrigger id="target-volumes" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_VOLUMES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 附加设定 */}
            {totalEntities > 0 && (
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-3 h-9 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      附加设定（选填）
                      {selectedEntities.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          已选 {selectedEntities.length}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        settingsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  {/* 已选设定 */}
                  {selectedEntities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-muted/50 rounded-md">
                      {selectedEntities.map((entity) => (
                        <Badge
                          key={entity.id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {entity.name}
                          <button
                            onClick={() => removeEntity(entity.id)}
                            className="ml-0.5 hover:bg-muted rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 设定列表 */}
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {ENTITY_TYPES.map(({ type, label, icon }) => {
                      const entities = entitiesByType[type as keyof typeof entitiesByType] ?? [];
                      if (entities.length === 0) return null;

                      return (
                        <div key={type} className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            {icon}
                            {label}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {entities.slice(0, 10).map((entity) => (
                              <label
                                key={entity.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={selectedEntities.some(
                                    (e) => e.id === entity.id
                                  )}
                                  onCheckedChange={() => toggleEntity(entity)}
                                />
                                <span className="truncate">{entity.name}</span>
                              </label>
                            ))}
                          </div>
                          {entities.length > 10 && (
                            <p className="text-xs text-muted-foreground pl-2">
                              还有 {entities.length - 10} 个...
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    选中的设定内容会附加到创意描述中，帮助 AI 更好地理解你的世界观
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || generateMutation.isPending}
            className="gap-1.5"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
