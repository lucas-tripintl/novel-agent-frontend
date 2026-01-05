"use client";

import { useState } from "react";
import { useWritingStore, useWritingMode } from "@/stores/writing-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Layers,
  FileText,
  Wand2,
} from "lucide-react";
import { ChapterList } from "../settings/chapter-list";
import { EntityBrowser } from "../settings/entity-browser";
import { SkillBrowser } from "../settings/skill-browser";
import { useProjectSkills } from "@/hooks/use-skills";

interface SettingsPaneProps {
  projectId: string;
}

export function SettingsPane({ projectId }: SettingsPaneProps) {
  const [activeTab, setActiveTab] = useState<string>("chapters");
  const mode = useWritingMode();
  const { selectedEntities } = useWritingStore();

  // 获取项目技能数量
  const { data: projectSkills } = useProjectSkills(projectId);
  const skillCount = projectSkills?.length ?? 0;

  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-card/30 min-h-0">
      {/* 头部 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">资料库</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-3 grid grid-cols-3 shrink-0">
          <TabsTrigger value="chapters" className="gap-1 text-xs px-2">
            <FileText className="h-3.5 w-3.5" />
            章节
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs px-2">
            <Layers className="h-3.5 w-3.5" />
            设定
            {mode === "director" && selectedEntities.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {selectedEntities.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1 text-xs px-2">
            <Wand2 className="h-3.5 w-3.5" />
            技能
            {skillCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {skillCount}
              </Badge>
            )}
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
      </Tabs>
    </div>
  );
}
