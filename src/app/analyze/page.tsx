"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  ChevronRight,
  CheckCircle,
  BookOpen,
  Pause,
  Users,
  Earth,
  Zap,
  GitBranch,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import { Dropzone, SelectedFile, formatFileSize } from "@/components/common/dropzone";
import { Steps } from "@/components/common/steps";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

// 解析后的章节数据类型
interface ParsedChapter {
  number: number;
  title: string;
  wordCount: number;
}

// 模拟解析后的章节数据
const mockParsedChapters: ParsedChapter[] = Array.from({ length: 50 }, (_, i) => ({
  number: i + 1,
  title: `第${i + 1}章 ${["陨落的天才", "斗之气", "纳戒", "魂力", "炎帝", "药老", "云岚宗", "萧薰儿", "斗技", "修炼"][i % 10]}`,
  wordCount: Math.floor(Math.random() * 3000) + 2000,
}));

// 模拟正在分析的项目
const mockAnalyzingProjects = [
  {
    id: "2",
    name: "遮天",
    status: "analyzing" as const,
    progress: 67,
    currentChapter: 1200,
    totalChapters: 1800,
    stats: {
      characters: 189,
      worldview: 76,
      goldenFingers: 3,
      plotlines: 18,
    },
  },
  {
    id: "3",
    name: "完美世界",
    status: "analyzing" as const,
    progress: 23,
    currentChapter: 450,
    totalChapters: 2000,
    stats: {
      characters: 78,
      worldview: 32,
      goldenFingers: 2,
      plotlines: 8,
    },
  },
];

// 导入向导步骤
const importSteps = [
  { id: 1, title: "上传文件" },
  { id: 2, title: "章节预览" },
  { id: 3, title: "导入中" },
];

export default function AnalyzePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [projectName, setProjectName] = useState("");
  const [startChapter, setStartChapter] = useState("1");
  const [endChapter, setEndChapter] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importedProjectId, setImportedProjectId] = useState<string | null>(null);

  // 处理文件选择
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    // 从文件名提取项目名称
    const name = file.name.replace(/\.(epub|txt|md)$/i, "");
    setProjectName(name);
  }, []);

  // 解析文件
  const handleParse = useCallback(async () => {
    if (!selectedFile) return;

    // 模拟解析过程
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 使用模拟数据
    setParsedChapters(mockParsedChapters);
    setEndChapter(String(mockParsedChapters.length));
    setCurrentStep(1);
  }, [selectedFile]);

  // 开始导入
  const handleImport = useCallback(async () => {
    setCurrentStep(2);
    setIsImporting(true);

    // 模拟导入过程
    const totalChapters = parseInt(endChapter) - parseInt(startChapter) + 1;
    for (let i = 0; i <= totalChapters; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setImportProgress(Math.floor((i / totalChapters) * 100));
    }

    setIsImporting(false);
    setImportedProjectId("new-project-id");
  }, [startChapter, endChapter]);

  // 重置导入流程
  const resetImport = useCallback(() => {
    setCurrentStep(0);
    setSelectedFile(null);
    setParsedChapters([]);
    setProjectName("");
    setStartChapter("1");
    setEndChapter("");
    setImportProgress(0);
    setIsImporting(false);
    setImportedProjectId(null);
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            设定提取
          </h1>
          <p className="text-muted-foreground mt-1">
            上传小说文件，智能提取设定与角色
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="upload">上传</TabsTrigger>
            <TabsTrigger value="analyzing">
              分析中
              {mockAnalyzingProjects.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center text-xs">
                  {mockAnalyzingProjects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">历史</TabsTrigger>
          </TabsList>

          {/* 上传 Tab */}
          <TabsContent value="upload" className="space-y-6">
            {/* 步骤指示器 */}
            {currentStep > 0 && (
              <Steps steps={importSteps} currentStep={currentStep} />
            )}

            {/* 步骤 1: 上传文件 */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <Dropzone onFileSelect={handleFileSelect} />

                {selectedFile && (
                  <SelectedFile
                    file={selectedFile}
                    onRemove={() => setSelectedFile(null)}
                    onAction={handleParse}
                    actionLabel="解析章节"
                    actionIcon={<ChevronRight className="ml-2 h-4 w-4" />}
                  />
                )}
              </div>
            )}

            {/* 步骤 2: 章节预览 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* 项目名称 */}
                <div className="flex items-center gap-4">
                  <Label className="w-20">项目名称</Label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="输入项目名称"
                    className="flex-1 max-w-sm"
                  />
                </div>

                {/* 章节范围 */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono">
                    检测到 {parsedChapters.length} 个章节
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Label>导入范围</Label>
                    <Select value={startChapter} onValueChange={setStartChapter}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="起始" />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedChapters.map((ch) => (
                          <SelectItem key={ch.number} value={String(ch.number)}>
                            第 {ch.number} 章
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">~</span>
                    <Select value={endChapter} onValueChange={setEndChapter}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="结束" />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedChapters.map((ch) => (
                          <SelectItem key={ch.number} value={String(ch.number)}>
                            第 {ch.number} 章
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 章节列表 */}
                <ScrollArea className="h-[400px] border rounded-lg bg-card/30">
                  {parsedChapters.map((chapter) => {
                    const inRange =
                      chapter.number >= parseInt(startChapter) &&
                      chapter.number <= parseInt(endChapter);
                    return (
                      <div
                        key={chapter.number}
                        className={cn(
                          "flex items-center gap-4 p-3 border-b hover:bg-accent/50",
                          !inRange && "opacity-50"
                        )}
                      >
                        <span className="font-mono text-sm text-muted-foreground w-12">
                          {chapter.number}
                        </span>
                        <span className="flex-1 truncate">{chapter.title}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {chapter.wordCount.toLocaleString()} 字
                        </span>
                      </div>
                    );
                  })}
                </ScrollArea>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    返回
                  </Button>
                  <Button onClick={handleImport} className="glow-green">
                    开始导入
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* 步骤 3: 导入进度 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-primary mb-2">
                    {importProgress}%
                  </div>
                  <Progress value={importProgress} className="h-2 max-w-md mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {isImporting ? (
                      <>正在导入章节...</>
                    ) : (
                      <>导入完成！</>
                    )}
                  </p>
                </div>

                {/* 完成后的操作 */}
                {importProgress === 100 && !isImporting && (
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={resetImport}>
                      继续导入
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/">返回作品中心</Link>
                    </Button>
                    <Button asChild className="glow-green">
                      <Link href={`/projects/${importedProjectId}`}>
                        查看项目
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 分析中 Tab */}
          <TabsContent value="analyzing" className="space-y-4">
            {mockAnalyzingProjects.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-primary/50 mb-4" />
                  <p className="text-muted-foreground">暂无正在分析的项目</p>
                </CardContent>
              </Card>
            ) : (
              mockAnalyzingProjects.map((project) => (
                <Card key={project.id} className="bg-card/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          第 {project.currentChapter} 章 / 共 {project.totalChapters} 章
                        </span>
                        <span className="font-mono text-primary">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>

                    {/* 实时统计 */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="font-mono text-lg text-primary">
                          {project.stats.characters}
                        </div>
                        <div className="text-xs text-muted-foreground">角色</div>
                      </div>
                      <div>
                        <div className="font-mono text-lg text-primary">
                          {project.stats.worldview}
                        </div>
                        <div className="text-xs text-muted-foreground">世界观</div>
                      </div>
                      <div>
                        <div className="font-mono text-lg text-primary">
                          {project.stats.goldenFingers}
                        </div>
                        <div className="text-xs text-muted-foreground">金手指</div>
                      </div>
                      <div>
                        <div className="font-mono text-lg text-primary">
                          {project.stats.plotlines}
                        </div>
                        <div className="text-xs text-muted-foreground">剧情线</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Pause className="mr-1 h-3 w-3" />
                        暂停
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects/${project.id}`}>查看详情</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 历史 Tab */}
          <TabsContent value="history">
            <Card className="bg-card/30 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">导入历史记录功能即将上线</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
