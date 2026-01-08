"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSelectedSkill } from "@/stores/writing-store";
import { getSkillCategoryKey } from "@/hooks/use-skills";
import { cn } from "@/lib/utils";
import { Wand2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SelectSkillDialog } from "@/components/skills/select-skill-dialog";
import type { SkillBrief } from "@/types/skills";

interface SkillSelectorProps {
  className?: string;
}

export function SkillSelector({ className }: SkillSelectorProps) {
  const t = useTranslations("skills");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { selectedSkillId, selectedSkillInfo, setSelectedSkill } =
    useSelectedSkill();

  const handleSelect = (skill: SkillBrief | null) => {
    if (skill) {
      setSelectedSkill(skill.id, {
        name: skill.name,
        description: skill.description,
        category: skill.category,
      });
    } else {
      setSelectedSkill(null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSkill(null);
  };

  // 如果已选择技能，显示徽章
  if (selectedSkillId && selectedSkillInfo) {
    return (
      <>
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                "bg-amber-500/10 border border-amber-500/20",
                "text-xs font-medium",
                "transition-colors hover:bg-amber-500/15",
                className
              )}
              onClick={() => setDialogOpen(true)}
            >
              <Wand2 className="h-3 w-3 text-amber-500" />
              <span className="max-w-[100px] truncate text-amber-600 dark:text-amber-400">
                {selectedSkillInfo.name}
              </span>
              <span
                role="button"
                tabIndex={0}
                className="ml-0.5 hover:text-destructive transition-colors cursor-pointer"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                title="取消技能"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" className="w-64 p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Wand2 className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <span className="font-semibold text-sm">
                  {selectedSkillInfo.name}
                </span>
              </div>
              {selectedSkillInfo.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {selectedSkillInfo.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">
                  {t(getSkillCategoryKey(selectedSkillInfo.category))}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                点击更换技能
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>

        <SelectSkillDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedSkillId={selectedSkillId}
          onSelect={handleSelect}
        />
      </>
    );
  }

  // 显示选择按钮
  return (
    <>
      <button
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md",
          "bg-muted/50 border border-border/50",
          "text-xs font-medium text-muted-foreground",
          "transition-colors hover:bg-muted hover:text-foreground",
          className
        )}
        onClick={() => setDialogOpen(true)}
      >
        <Wand2 className="h-3 w-3" />
        <span>+ 技能</span>
      </button>

      <SelectSkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedSkillId={selectedSkillId}
        onSelect={handleSelect}
      />
    </>
  );
}
