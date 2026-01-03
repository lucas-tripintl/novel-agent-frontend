"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// 人物数据类型
interface Character {
  id: string;
  name: string;
  alias: string;
  avatar: string;
  role: string;
  faction: string;
  description: string;
  source: { id: string; title: string; color: string };
  traits: string[];
  powerLevel: string;
  relations: { name: string; type: string }[];
  events: string[];
}

// 模拟人物数据
const initialCharacters: Character[] = [
  {
    id: "1",
    name: "萧炎",
    alias: "炎帝",
    avatar: "萧",
    role: "主角",
    faction: "萧族 / 迦南学院",
    description: "天才少年，从废物逆袭成为斗帝强者",
    source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
    traits: ["坚韧不拔", "重情重义", "天赋异禀"],
    powerLevel: "斗帝",
    relations: [
      { name: "萧薰儿", type: "恋人" },
      { name: "药老", type: "师父" },
      { name: "云韵", type: "红颜" },
    ],
    events: ["废柴逆袭", "覆灭云岚宗", "大战魂天帝"],
  },
  {
    id: "2",
    name: "药尘",
    alias: "药老",
    avatar: "药",
    role: "配角",
    faction: "丹塔",
    description: "曾经的丹圣，萧炎的恩师与引路人",
    source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
    traits: ["睿智", "护短", "丹道宗师"],
    powerLevel: "斗圣",
    relations: [
      { name: "萧炎", type: "徒弟" },
      { name: "韩枫", type: "仇人" },
    ],
    events: ["魂体寄宿戒指", "恢复肉身", "重返丹塔"],
  },
  {
    id: "3",
    name: "萧薰儿",
    alias: "古族圣女",
    avatar: "薰",
    role: "女主",
    faction: "古族",
    description: "古族圣女，萧炎青梅竹马的恋人",
    source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
    traits: ["温柔", "深情", "天赋卓越"],
    powerLevel: "斗圣",
    relations: [
      { name: "萧炎", type: "恋人" },
      { name: "古元", type: "族长" },
    ],
    events: ["离开萧家", "古族试炼", "陀舍古帝洞府"],
  },
  {
    id: "4",
    name: "叶凡",
    alias: "天帝",
    avatar: "叶",
    role: "主角",
    faction: "荒古世家",
    description: "从地球穿越的少年，最终成为无始大帝后的最强者",
    source: { id: "2", title: "遮天", color: "#a855f7" },
    traits: ["心性坚定", "机智过人", "逆天改命"],
    powerLevel: "大帝",
    relations: [
      { name: "姬紫月", type: "道侣" },
      { name: "黑皇", type: "伙伴" },
    ],
    events: ["九龙拉棺", "斩杀圣子", "成就大帝"],
  },
  {
    id: "5",
    name: "狠人大帝",
    alias: "狠人",
    avatar: "狠",
    role: "配角",
    faction: "狠人大帝道统",
    description: "为兄长斩仙的女帝，战力无双",
    source: { id: "2", title: "遮天", color: "#a855f7" },
    traits: ["霸道", "专情", "战力滔天"],
    powerLevel: "大帝",
    relations: [
      { name: "狠人兄长", type: "兄长" },
      { name: "叶凡", type: "旧识" },
    ],
    events: ["斩杀仙尊", "成就大帝", "仙界大战"],
  },
  {
    id: "6",
    name: "石昊",
    alias: "荒天帝",
    avatar: "石",
    role: "主角",
    faction: "石国 / 荒天帝道统",
    description: "至尊骨被夺的少年，最终成为荒天帝",
    source: { id: "3", title: "完美世界", color: "#06b6d4" },
    traits: ["豁达", "护短", "天资绝世"],
    powerLevel: "仙帝",
    relations: [
      { name: "柳神", type: "恩师" },
      { name: "石毅", type: "兄弟" },
    ],
    events: ["被夺至尊骨", "荒主之战", "独战仙域"],
  },
];

const roleIcons: Record<string, typeof Crown> = {
  主角: Crown,
  女主: Heart,
  配角: Users,
  反派: Skull,
};

const roleColors: Record<string, string> = {
  主角: "bg-primary/20 text-primary border-primary/30",
  女主: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  配角: "bg-muted text-muted-foreground border-border",
  反派: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [selectedNovels, setSelectedNovels] = useState<string[]>(["1"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Character | null>(null);
  const [newTrait, setNewTrait] = useState("");
  const [newRelation, setNewRelation] = useState({ name: "", type: "" });
  const [newEvent, setNewEvent] = useState("");

  // 过滤数据
  const filteredCharacters = characters.filter((char) => {
    const matchesNovel =
      selectedNovels.length === 0 || selectedNovels.includes(char.source.id);
    const matchesSearch =
      !searchQuery ||
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.faction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNovel && matchesSearch;
  });

  // 开始编辑
  const startEditing = () => {
    if (selectedCharacter) {
      setEditForm({ ...selectedCharacter });
      setIsEditing(true);
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditForm(null);
    setIsEditing(false);
    setNewTrait("");
    setNewRelation({ name: "", type: "" });
    setNewEvent("");
  };

  // 保存编辑
  const saveEditing = () => {
    if (editForm) {
      setCharacters((prev) =>
        prev.map((char) => (char.id === editForm.id ? editForm : char))
      );
      setSelectedCharacter(editForm);
      cancelEditing();
    }
  };

  // 更新编辑表单
  const updateEditForm = (field: keyof Character, value: unknown) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  // 添加特点
  const addTrait = () => {
    if (editForm && newTrait.trim()) {
      setEditForm({
        ...editForm,
        traits: [...editForm.traits, newTrait.trim()],
      });
      setNewTrait("");
    }
  };

  // 删除特点
  const removeTrait = (index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        traits: editForm.traits.filter((_, i) => i !== index),
      });
    }
  };

  // 添加关系
  const addRelation = () => {
    if (editForm && newRelation.name.trim() && newRelation.type.trim()) {
      setEditForm({
        ...editForm,
        relations: [...editForm.relations, { ...newRelation }],
      });
      setNewRelation({ name: "", type: "" });
    }
  };

  // 删除关系
  const removeRelation = (index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        relations: editForm.relations.filter((_, i) => i !== index),
      });
    }
  };

  // 更新关系
  const updateRelation = (index: number, field: "name" | "type", value: string) => {
    if (editForm) {
      const newRelations = [...editForm.relations];
      newRelations[index] = { ...newRelations[index], [field]: value };
      setEditForm({ ...editForm, relations: newRelations });
    }
  };

  // 添加事件
  const addEvent = () => {
    if (editForm && newEvent.trim()) {
      setEditForm({
        ...editForm,
        events: [...editForm.events, newEvent.trim()],
      });
      setNewEvent("");
    }
  };

  // 删除事件
  const removeEvent = (index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        events: editForm.events.filter((_, i) => i !== index),
      });
    }
  };

  // 更新事件
  const updateEvent = (index: number, value: string) => {
    if (editForm) {
      const newEvents = [...editForm.events];
      newEvents[index] = value;
      setEditForm({ ...editForm, events: newEvents });
    }
  };

  // 当前显示的角色数据（编辑时显示编辑中的数据）
  const displayCharacter = isEditing ? editForm : selectedCharacter;

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
              {filteredCharacters.length} 个角色
            </Badge>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          <NovelFilter
            selectedIds={selectedNovels}
            onSelectionChange={setSelectedNovels}
          />
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

        {/* 人物列表 - 网格视图 */}
        {viewMode === "grid" && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCharacters.map((char) => {
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
                            backgroundColor: `${char.source.color}20`,
                            color: char.source.color,
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
                          {char.faction}
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
                        className={cn("text-xs", roleColors[char.role])}
                      >
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {char.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: char.source.color,
                          color: char.source.color,
                        }}
                      >
                        {char.source.title}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {char.traits.slice(0, 3).map((trait) => (
                        <Badge key={trait} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 人物列表 - 列表视图 */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {filteredCharacters.map((char) => {
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
                          backgroundColor: `${char.source.color}20`,
                          color: char.source.color,
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
                          className={cn("text-xs", roleColors[char.role])}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {char.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {char.faction} · {char.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0"
                      style={{
                        borderColor: char.source.color,
                        color: char.source.color,
                      }}
                    >
                      {char.source.title}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 空状态 */}
        {filteredCharacters.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的角色</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                尝试选择其他小说或调整搜索关键词
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
              cancelEditing();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0" showCloseButton={false}>
            {displayCharacter && (
              <>
                {/* 头部 */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 shrink-0">
                      <AvatarFallback
                        className="text-2xl font-bold"
                        style={{
                          backgroundColor: `${displayCharacter.source.color}20`,
                          color: displayCharacter.source.color,
                        }}
                      >
                        {displayCharacter.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                        {isEditing ? (
                          <Input
                            value={editForm?.name || ""}
                            onChange={(e) => updateEditForm("name", e.target.value)}
                            className="h-8 text-xl font-semibold w-32"
                          />
                        ) : (
                          displayCharacter.name
                        )}
                        {!isEditing && displayCharacter.alias && (
                          <span className="text-base text-muted-foreground font-normal">
                            ({displayCharacter.alias})
                          </span>
                        )}
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                        {isEditing ? (
                          <Input
                            value={editForm?.alias || ""}
                            onChange={(e) => updateEditForm("alias", e.target.value)}
                            placeholder="别名/称号"
                            className="h-7 text-sm w-24"
                          />
                        ) : null}
                        <Badge variant="outline" className="text-xs">
                          {isEditing ? (
                            <Input
                              value={editForm?.powerLevel || ""}
                              onChange={(e) => updateEditForm("powerLevel", e.target.value)}
                              className="h-5 text-xs w-16 border-0 p-0"
                            />
                          ) : (
                            displayCharacter.powerLevel
                          )}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: displayCharacter.source.color,
                            color: displayCharacter.source.color,
                          }}
                        >
                          {displayCharacter.source.title}
                        </Badge>
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isEditing && (
                        <Button variant="outline" size="sm" onClick={startEditing}>
                          <Pencil className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedCharacter(null);
                          cancelEditing();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">所属势力</Label>
                        {isEditing ? (
                          <Input
                            value={editForm?.faction || ""}
                            onChange={(e) => updateEditForm("faction", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {displayCharacter.faction}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">角色简介</Label>
                        {isEditing ? (
                          <Textarea
                            value={editForm?.description || ""}
                            onChange={(e) => updateEditForm("description", e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {displayCharacter.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">性格特点</Label>
                        <div className="flex flex-wrap gap-2">
                          {displayCharacter.traits.map((trait, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className={cn(isEditing && "pr-1")}
                            >
                              {trait}
                              {isEditing && (
                                <button
                                  onClick={() => removeTrait(index)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                          {isEditing && (
                            <div className="flex items-center gap-1">
                              <Input
                                value={newTrait}
                                onChange={(e) => setNewTrait(e.target.value)}
                                placeholder="添加特点"
                                className="h-7 w-24 text-xs"
                                onKeyDown={(e) => e.key === "Enter" && addTrait()}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={addTrait}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">角色类型</Label>
                        {isEditing ? (
                          <Input
                            value={editForm?.role || ""}
                            onChange={(e) => updateEditForm("role", e.target.value)}
                            placeholder="主角/配角/反派..."
                          />
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn("text-xs", roleColors[displayCharacter.role])}
                          >
                            {displayCharacter.role}
                          </Badge>
                        )}
                      </div>
                    </TabsContent>

                    {/* 关系 */}
                    <TabsContent value="relations" className="space-y-3 mt-4">
                      {displayCharacter.relations.map((rel, index) => (
                        <Card key={index} className="bg-card/50">
                          <CardContent className="flex items-center justify-between p-3">
                            {isEditing ? (
                              <>
                                <div className="flex items-center gap-2 flex-1">
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {rel.name[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Input
                                    value={rel.name}
                                    onChange={(e) => updateRelation(index, "name", e.target.value)}
                                    placeholder="人物名称"
                                    className="h-8 flex-1"
                                  />
                                  <Input
                                    value={rel.type}
                                    onChange={(e) => updateRelation(index, "type", e.target.value)}
                                    placeholder="关系"
                                    className="h-8 w-20"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive ml-2"
                                  onClick={() => removeRelation(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {rel.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{rel.name}</span>
                                </div>
                                <Badge variant="outline">{rel.type}</Badge>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {isEditing && (
                        <Card className="bg-card/30 border-dashed">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={newRelation.name}
                                onChange={(e) =>
                                  setNewRelation({ ...newRelation, name: e.target.value })
                                }
                                placeholder="人物名称"
                                className="h-8 flex-1"
                              />
                              <Input
                                value={newRelation.type}
                                onChange={(e) =>
                                  setNewRelation({ ...newRelation, type: e.target.value })
                                }
                                placeholder="关系类型"
                                className="h-8 w-24"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={addRelation}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {displayCharacter.relations.length === 0 && !isEditing && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          暂无关系数据
                        </p>
                      )}
                    </TabsContent>

                    {/* 事件 */}
                    <TabsContent value="events" className="space-y-3 mt-4">
                      {displayCharacter.events.map((event, index) => (
                        <Card key={index} className="bg-card/50">
                          <CardContent className="flex items-center gap-3 p-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary shrink-0">
                              {index + 1}
                            </div>
                            {isEditing ? (
                              <>
                                <Input
                                  value={event}
                                  onChange={(e) => updateEvent(index, e.target.value)}
                                  className="h-8 flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeEvent(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="flex-1">{event}</span>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {isEditing && (
                        <Card className="bg-card/30 border-dashed">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={newEvent}
                                onChange={(e) => setNewEvent(e.target.value)}
                                placeholder="添加新事件..."
                                className="h-8 flex-1"
                                onKeyDown={(e) => e.key === "Enter" && addEvent()}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={addEvent}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {displayCharacter.events.length === 0 && !isEditing && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          暂无事件数据
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </ScrollArea>

                {/* 底部 */}
                {isEditing && (
                  <DialogFooter className="px-6 py-4 border-t border-border/50">
                    <Button variant="outline" onClick={cancelEditing}>
                      取消
                    </Button>
                    <Button onClick={saveEditing}>
                      <Save className="h-4 w-4 mr-1" />
                      保存修改
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
