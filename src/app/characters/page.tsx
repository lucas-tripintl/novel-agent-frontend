"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommandInput, Command } from "@/components/ui/command";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  Heart,
  Crown,
  Skull,
  X,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCrossProjectEntities } from "@/hooks/use-analysis-results";
import { useSelectedProjectIds } from "@/stores/project-selection-store";
import { getProjectColor } from "@/hooks/use-projects";
import type { EntityRead } from "@/types/api";

// 角色数据结构（从 API 实体解析）
interface Character {
  id: string;
  projectId: string;
  name: string;
  alias: string;
  avatar: string;
  role: string;
  faction: string;
  description: string;
  projectColor: string;
  traits: string[];
  powerLevel: string;
  relations: { name: string; type: string }[];
  events: string[];
  firstChapter?: number;
  lastChapter?: number;
  tags: string[];
}

// 从 EntityRead 解析角色数据
function parseCharacterEntity(entity: EntityRead): Character {
  let content: Record<string, unknown> = {};
  try {
    content = JSON.parse(entity.content);
  } catch {
    content = { description: entity.content };
  }

  const name = entity.name;
  const description = (content.description as string) || (content.summary as string) || entity.content.slice(0, 200);
  const traits = (content.traits as string[]) || (content.personality as string[]) || entity.tags || [];
  const faction = (content.faction as string) || (content.organization as string) || (content.affiliation as string) || "";
  const role = (content.role as string) || (content.type as string) || "配角";
  const powerLevel = (content.power_level as string) || (content.level as string) || (content.realm as string) || "";
  const alias = (content.alias as string) || (content.nickname as string) || (content.title as string) || "";
  const relations = (content.relations as { name: string; type: string }[]) ||
                   (content.relationships as { name: string; type: string }[]) || [];
  const events = (content.events as string[]) || (content.key_events as string[]) || [];

  return {
    id: entity.id,
    projectId: entity.project_id,
    name,
    alias,
    avatar: name[0] || "?",
    role,
    faction,
    description,
    projectColor: getProjectColor(entity.project_id),
    traits: Array.isArray(traits) ? traits : [traits].filter(Boolean),
    powerLevel,
    relations: Array.isArray(relations) ? relations : [],
    events: Array.isArray(events) ? events : [],
    firstChapter: entity.first_chapter,
    lastChapter: entity.last_chapter,
    tags: entity.tags,
  };
}

const roleIcons: Record<string, typeof Crown> = {
  主角: Crown,
  女主: Heart,
  配角: Users,
  反派: Skull,
  protagonist: Crown,
  antagonist: Skull,
  supporting: Users,
};

const roleColors: Record<string, string> = {
  主角: "bg-primary/20 text-primary border-primary/30",
  女主: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  配角: "bg-muted text-muted-foreground border-border",
  反派: "bg-destructive/20 text-destructive border-destructive/30",
  protagonist: "bg-primary/20 text-primary border-primary/30",
  antagonist: "bg-destructive/20 text-destructive border-destructive/30",
  supporting: "bg-muted text-muted-foreground border-border",
};

export default function CharactersPage() {
  // 使用全局项目选择状态
  const selectedNovels = useSelectedProjectIds();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // 获取角色实体（使用新的跨项目 API）
  const { data, isLoading, error } = useCrossProjectEntities(
    selectedNovels,
    {
      entity_type: "character",
      enabled: selectedNovels.length > 0,
    }
  );
  const entities = data?.items ?? [];

  // 解析并过滤角色数据
  const characters = useMemo(() => {
    const parsed = entities.map(parseCharacterEntity);

    if (!searchQuery) return parsed;

    const query = searchQuery.toLowerCase();
    return parsed.filter(
      (char) =>
        char.name.toLowerCase().includes(query) ||
        char.alias?.toLowerCase().includes(query) ||
        char.faction.toLowerCase().includes(query) ||
        char.description.toLowerCase().includes(query)
    );
  }, [entities, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              人物图谱
            </h1>
            <p className="text-muted-foreground mt-1">
              浏览和分析小说中的角色信息与人物关系
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {characters.length} 个角色
            </Badge>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          <NovelFilter autoSelectFirst />
          <div className="flex-1 max-w-sm">
            <Command className="rounded-lg border border-border/50 bg-card/50">
              <CommandInput
                placeholder="搜索角色..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </Command>
          </div>
          <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1 bg-card/50">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">加载角色数据失败，请稍后重试</span>
            </CardContent>
          </Card>
        )}

        {/* 未选择项目提示 */}
        {!isLoading && selectedNovels.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">请选择小说</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                选择一本或多本小说以查看其角色信息
              </p>
            </CardContent>
          </Card>
        )}

        {/* 人物列表 - 网格视图 */}
        {!isLoading && !error && selectedNovels.length > 0 && viewMode === "grid" && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {characters.map((char) => {
              const RoleIcon = roleIcons[char.role] || Users;
              return (
                <Card
                  key={char.id}
                  className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedCharacter(char)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border-2 group-hover:border-primary/50 transition-colors">
                        <AvatarFallback
                          className="text-lg font-bold"
                          style={{
                            backgroundColor: `${char.projectColor}20`,
                            color: char.projectColor,
                          }}
                        >
                          {char.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
                          {char.name}
                          {char.alias && (
                            <span className="text-xs text-muted-foreground font-normal">
                              ({char.alias})
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {char.faction || "未知势力"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {char.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", roleColors[char.role] || roleColors["配角"])}
                      >
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {char.role}
                      </Badge>
                      {char.powerLevel && (
                        <Badge variant="secondary" className="text-xs">
                          {char.powerLevel}
                        </Badge>
                      )}
                    </div>
                    {char.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {char.traits.slice(0, 3).map((trait, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                        {char.traits.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{char.traits.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 人物列表 - 列表视图 */}
        {!isLoading && !error && selectedNovels.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {characters.map((char) => {
              const RoleIcon = roleIcons[char.role] || Users;
              return (
                <Card
                  key={char.id}
                  className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedCharacter(char)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10 border-2 group-hover:border-primary/50 transition-colors shrink-0">
                      <AvatarFallback
                        className="font-bold"
                        style={{
                          backgroundColor: `${char.projectColor}20`,
                          color: char.projectColor,
                        }}
                      >
                        {char.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold group-hover:text-primary transition-colors">
                          {char.name}
                        </span>
                        {char.alias && (
                          <span className="text-xs text-muted-foreground">
                            ({char.alias})
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-xs", roleColors[char.role] || roleColors["配角"])}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {char.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {char.faction ? `${char.faction} · ` : ""}{char.description}
                      </p>
                    </div>
                    {char.powerLevel && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {char.powerLevel}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !error && selectedNovels.length > 0 && characters.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的角色</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? "尝试调整搜索关键词"
                  : "所选小说暂无角色数据，请先进行分析"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 人物详情弹窗 */}
        <Dialog
          open={!!selectedCharacter}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCharacter(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0" showCloseButton={false}>
            {selectedCharacter && (
              <>
                {/* 头部 */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 shrink-0">
                      <AvatarFallback
                        className="text-2xl font-bold"
                        style={{
                          backgroundColor: `${selectedCharacter.projectColor}20`,
                          color: selectedCharacter.projectColor,
                        }}
                      >
                        {selectedCharacter.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                        {selectedCharacter.name}
                        {selectedCharacter.alias && (
                          <span className="text-base text-muted-foreground font-normal">
                            ({selectedCharacter.alias})
                          </span>
                        )}
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                        {selectedCharacter.powerLevel && (
                          <Badge variant="outline" className="text-xs">
                            {selectedCharacter.powerLevel}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-xs", roleColors[selectedCharacter.role] || roleColors["配角"])}
                        >
                          {selectedCharacter.role}
                        </Badge>
                      </DialogDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => setSelectedCharacter(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>

                {/* 内容区 */}
                <ScrollArea className="flex-1 px-6">
                  <Tabs defaultValue="info" className="py-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="info">基本信息</TabsTrigger>
                      <TabsTrigger value="relations">关系</TabsTrigger>
                      <TabsTrigger value="events">事件</TabsTrigger>
                    </TabsList>

                    {/* 基本信息 */}
                    <TabsContent value="info" className="space-y-4 mt-4">
                      {selectedCharacter.faction && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">所属势力</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedCharacter.faction}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium">角色简介</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedCharacter.description}
                        </p>
                      </div>

                      {selectedCharacter.traits.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">性格特点</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCharacter.traits.map((trait, index) => (
                              <Badge key={index} variant="secondary">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedCharacter.firstChapter || selectedCharacter.lastChapter) && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">出场范围</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedCharacter.firstChapter && `首次出场: 第 ${selectedCharacter.firstChapter} 章`}
                            {selectedCharacter.firstChapter && selectedCharacter.lastChapter && " | "}
                            {selectedCharacter.lastChapter && `最后出场: 第 ${selectedCharacter.lastChapter} 章`}
                          </p>
                        </div>
                      )}

                      {selectedCharacter.tags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">标签</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCharacter.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* 关系 */}
                    <TabsContent value="relations" className="space-y-3 mt-4">
                      {selectedCharacter.relations.length > 0 ? (
                        selectedCharacter.relations.map((rel, index) => (
                          <Card key={index} className="bg-card/50">
                            <CardContent className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {rel.name[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{rel.name}</span>
                              </div>
                              <Badge variant="outline">{rel.type}</Badge>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          暂无关系数据
                        </p>
                      )}
                    </TabsContent>

                    {/* 事件 */}
                    <TabsContent value="events" className="space-y-3 mt-4">
                      {selectedCharacter.events.length > 0 ? (
                        selectedCharacter.events.map((event, index) => (
                          <Card key={index} className="bg-card/50">
                            <CardContent className="flex items-center gap-3 p-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary shrink-0">
                                {index + 1}
                              </div>
                              <span className="flex-1">{event}</span>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          暂无事件数据
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
