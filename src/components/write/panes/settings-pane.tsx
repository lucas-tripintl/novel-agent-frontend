"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWritingStore, useWritingMode } from "@/stores/writing-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Layers,
  FileText,
  Wand2,
  Map,
} from "lucide-react";
import { ChapterList } from "../settings/chapter-list";
import { EntityBrowser } from "../settings/entity-browser";
import { SkillBrowser } from "../settings/skill-browser";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { OutlineTab } from "../outline";
import { useProjectSkills } from "@/hooks/use-skills";

interface SettingsPaneProps {
  projectId: string;
}

export function SettingsPane({ projectId }: SettingsPaneProps) {
  const t = useTranslations("write");
  const [activeTab, setActiveTab] = useState<string>("chapters");
  const mode = useWritingMode();
  const { selectedEntities } = useWritingStore();

  // 获取项目技能数量
  const { data: projectSkills } = useProjectSkills(projectId);
  const skillCount = projectSkills?.length ?? 0;

  return (
    <div className={cn("flex h-full flex-col bg-card/30 min-h-0", "border-r", DESIGN_TOKENS.borders.default)}>
      {/* 头部 */}
      <div className={cn("flex items-center", DESIGN_TOKENS.gaps.sm, DESIGN_TOKENS.padding.md, "border-b", DESIGN_TOKENS.borders.default)}>
        <BookOpen className="h-4 w-4 text-primary" />
        <span className={cn(DESIGN_TOKENS.fontWeight.semibold, DESIGN_TOKENS.typography.sm)}>{t("library")}</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-3 grid grid-cols-4 shrink-0">
          <TabsTrigger value="chapters" className="gap-1 text-xs px-2">
            <FileText className="h-3.5 w-3.5" />
            {t("chapters")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs px-2">
            <Layers className="h-3.5 w-3.5" />
            {t("settings")}
            {mode === "director" && selectedEntities.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {selectedEntities.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1 text-xs px-2">
            <Wand2 className="h-3.5 w-3.5" />
            {t("skills")}
            {skillCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {skillCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outline" className="gap-1 text-xs px-2">
            <Map className="h-3.5 w-3.5" />
            {t("outline")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="flex-1 m-0 mt-2 min-h-0 overflow-hidden">
          <ChapterList projectId={projectId} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 mt-2 min-h-0 overflow-hidden">
          <EntityBrowser projectId={projectId} />
        </TabsContent>

        <TabsContent value="skills" className="flex-1 m-0 mt-2 min-h-0 overflow-hidden">
          <SkillBrowser projectId={projectId} />
        </TabsContent>

        <TabsContent value="outline" className="flex-1 m-0 mt-2 min-h-0 overflow-hidden">
          <OutlineTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
