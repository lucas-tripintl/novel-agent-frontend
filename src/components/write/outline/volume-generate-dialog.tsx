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
  BookMarked,
} from "lucide-react";
import { useGenerateVolumeOutline } from "@/hooks/use-outlines";
import { useEntities } from "@/hooks/use-analysis-results";
import type { EntityRead, EntityType } from "@/types/api";

interface VolumeGenerateDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default volume number (typically next volume) */
  defaultVolumeNumber: number;
  /** Maximum volume number allowed (from novel outline target) */
  maxVolumeNumber?: number;
}

const ENTITY_TYPES: { type: EntityType; label: string; icon: React.ReactNode }[] = [
  { type: "character", label: "角色", icon: <Users className="h-3.5 w-3.5" /> },
  { type: "worldview", label: "世界观", icon: <Globe className="h-3.5 w-3.5" /> },
  { type: "plotline", label: "剧情线", icon: <Layers className="h-3.5 w-3.5" /> },
];

export function VolumeGenerateDialog({
  projectId,
  open,
  onOpenChange,
  defaultVolumeNumber,
  maxVolumeNumber = 20,
}: VolumeGenerateDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [volumeNumber, setVolumeNumber] = useState(defaultVolumeNumber.toString());
  const [selectedEntities, setSelectedEntities] = useState<EntityRead[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const generateMutation = useGenerateVolumeOutline(projectId);

  // Handle dialog open/close with state reset
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset to default volume number when opening
      setVolumeNumber(defaultVolumeNumber.toString());
    }
    onOpenChange(newOpen);
  };

  // Get entities by type
  const { data: charactersData } = useEntities(projectId, "character", { limit: 50 });
  const { data: worldviewData } = useEntities(projectId, "worldview", { limit: 50 });
  const { data: plotlineData } = useEntities(projectId, "plotline", { limit: 50 });

  const entitiesByType = useMemo(() => ({
    character: charactersData?.items ?? [],
    worldview: worldviewData?.items ?? [],
    plotline: plotlineData?.items ?? [],
  }), [charactersData, worldviewData, plotlineData]);

  const totalEntities = Object.values(entitiesByType).reduce((sum, arr) => sum + arr.length, 0);

  // Generate volume number options
  const volumeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let i = 1; i <= Math.min(maxVolumeNumber, 20); i++) {
      options.push({ value: i.toString(), label: `第 ${i} 卷` });
    }
    return options;
  }, [maxVolumeNumber]);

  const handleSubmit = async () => {
    // Build full prompt with selected entities
    let fullPrompt = prompt.trim();
    if (selectedEntities.length > 0) {
      const settingsText = selectedEntities
        .map((e) => `【${e.name}】: ${e.content}`)
        .join("\n\n");
      fullPrompt = fullPrompt
        ? `${fullPrompt}\n\n参考设定：\n${settingsText}`
        : `参考设定：\n${settingsText}`;
    }

    try {
      await generateMutation.mutateAsync({
        prompt: fullPrompt || "请根据总纲生成本卷大纲",
        volume_number: parseInt(volumeNumber),
      });

      handleOpenChange(false);

      // Reset form
      setPrompt("");
      setSelectedEntities([]);
    } catch {
      // Error handled by mutation
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            生成卷纲
          </DialogTitle>
          <DialogDescription>
            描述本卷的剧情方向，AI 将为你生成详细的分卷大纲
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 py-4 px-1">
            {/* Volume Number Selection */}
            <div className="space-y-2">
              <Label htmlFor="volume-number">卷号</Label>
              <Select value={volumeNumber} onValueChange={setVolumeNumber}>
                <SelectTrigger id="volume-number" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {volumeOptions.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generation Guidance */}
            <div className="space-y-2">
              <Label htmlFor="prompt">生成指导（选填）</Label>
              <Textarea
                id="prompt"
                placeholder="描述本卷的剧情走向或特殊要求，例如：主角开始探索秘境，遭遇强敌，获得传承..."
                className="min-h-[100px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {prompt.length}/3000 字符
              </p>
            </div>

            {/* Optional Entity References */}
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
                  {/* Selected entities */}
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

                  {/* Entity list */}
                  <div className="space-y-3 max-h-[180px] overflow-y-auto">
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
                    选中的设定内容会附加到描述中，帮助 AI 保持一致性
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={generateMutation.isPending}
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
