"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useOutlineEditing, useEditorSettings } from "@/stores/writing-store";
import type { EditingOutline } from "@/stores/writing-store";
import type { NovelOutline, VolumeOutline, NovelOutlineUpdateParams, VolumeOutlineUpdateParams } from "@/types/outline";
import type { QuickAction } from "@/types/inline-edit";
import { fontFamilies, type EditorFontFamily } from "@/types/writing";
import { useUpdateNovelOutline, useUpdateVolumeOutline } from "@/hooks/use-outlines";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookText,
  FileText,
  Target,
  Sparkles,
  Swords,
  TrendingUp,
  ListChecks,
  Compass,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

function getFontClass(fontFamily: EditorFontFamily): string {
  const font = fontFamilies.find((f) => f.id === fontFamily);
  return font?.fontClass ?? "font-sans";
}

interface OutlineEditorProps {
  outline: EditingOutline;
  projectId: string;
}

export function OutlineEditor({ outline, projectId }: OutlineEditorProps) {
  const { closeOutlineEditor } = useOutlineEditing();
  const { settings } = useEditorSettings();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 切换到不同大纲时重置滚动位置
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [outline.data.id]);

  if (outline.type === "novel") {
    return (
      <NovelOutlineEditor
        outline={outline.data as NovelOutline}
        projectId={projectId}
        onBack={closeOutlineEditor}
        scrollAreaRef={scrollAreaRef}
        fontClass={getFontClass(settings.fontFamily)}
        fontSize={settings.fontSize}
        lineHeight={settings.lineHeight}
      />
    );
  }

  return (
    <VolumeOutlineEditor
      outline={outline.data as VolumeOutline}
      projectId={projectId}
      onBack={closeOutlineEditor}
      scrollAreaRef={scrollAreaRef}
      fontClass={getFontClass(settings.fontFamily)}
      fontSize={settings.fontSize}
      lineHeight={settings.lineHeight}
    />
  );
}

// ============ 总纲编辑器 ============

interface NovelOutlineEditorProps {
  outline: NovelOutline;
  projectId: string;
  onBack: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  fontClass: string;
  fontSize: number;
  lineHeight: number;
}

function NovelOutlineEditor({
  outline,
  projectId,
  onBack,
  scrollAreaRef,
  fontClass,
  fontSize,
  lineHeight,
}: NovelOutlineEditorProps) {
  // 本地编辑状态
  const [editData, setEditData] = useState<NovelOutlineUpdateParams>({
    title: outline.title,
    core_theme: outline.core_theme,
    core_conflict: outline.core_conflict ?? "",
    protagonist_arc: outline.protagonist_arc ?? "",
    ending_direction: outline.ending_direction ?? "",
    content: outline.content ?? "",
    key_plotlines: outline.key_plotlines ?? [],
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // 检查是否有修改
  const isDirty = JSON.stringify(editData) !== JSON.stringify({
    title: outline.title,
    core_theme: outline.core_theme,
    core_conflict: outline.core_conflict ?? "",
    protagonist_arc: outline.protagonist_arc ?? "",
    ending_direction: outline.ending_direction ?? "",
    content: outline.content ?? "",
    key_plotlines: outline.key_plotlines ?? [],
  });

  // 更新 mutation
  const updateMutation = useUpdateNovelOutline(projectId);

  // 内联编辑 hook
  const {
    inlineEdit,
    executeQuickAction,
    startCustomEdit,
    acceptEdit,
    rejectEdit,
  } = useInlineEdit({
    projectId,
    onEditComplete: (suggestion) => {
      console.log("总纲编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("内联编辑错误:", error);
    },
  });

  // 同步外部数据变化
  useEffect(() => {
    setEditData({
      title: outline.title,
      core_theme: outline.core_theme,
      core_conflict: outline.core_conflict ?? "",
      protagonist_arc: outline.protagonist_arc ?? "",
      ending_direction: outline.ending_direction ?? "",
      content: outline.content ?? "",
      key_plotlines: outline.key_plotlines ?? [],
    });
    setSaveStatus("idle");
  }, [outline.id]);

  // 保存
  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync(editData);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // 更新字段
  const updateField = useCallback((field: keyof NovelOutlineUpdateParams, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 处理快捷操作
  const handleQuickAction = useCallback(
    (action: QuickAction, selectedText: string, range: { from: number; to: number }) => {
      executeQuickAction(action, selectedText, range, "novel-outline");
    },
    [executeQuickAction]
  );

  // 处理自定义编辑
  const handleCustomEdit = useCallback(
    (selectedText: string, range: { from: number; to: number }) => {
      startCustomEdit(selectedText, range, "novel-outline");
    },
    [startCustomEdit]
  );

  // 处理接受编辑
  const handleAcceptEdit = useCallback(() => {
    acceptEdit();
  }, [acceptEdit]);

  // 处理拒绝编辑
  const handleRejectEdit = useCallback(() => {
    rejectEdit();
  }, [rejectEdit]);

  // 添加剧情线
  const addPlotline = () => {
    setEditData((prev) => ({
      ...prev,
      key_plotlines: [...(prev.key_plotlines ?? []), ""],
    }));
  };

  // 更新剧情线
  const updatePlotline = (index: number, value: string) => {
    setEditData((prev) => ({
      ...prev,
      key_plotlines: prev.key_plotlines?.map((p, i) => (i === index ? value : p)),
    }));
  };

  // 删除剧情线
  const removePlotline = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      key_plotlines: prev.key_plotlines?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 头部 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BookText className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <SimpleTiptapEditor
            value={editData.title ?? ""}
            onChange={(v) => updateField("title", v)}
            targetType="novel-outline"
            mode="single-line"
            placeholder="总纲标题..."
            className="text-lg font-semibold"
            enableInlineEdit={!!projectId}
            onQuickAction={handleQuickAction}
            onOpenCustomEdit={handleCustomEdit}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
          />
          <p className="text-xs text-muted-foreground">总纲</p>
        </div>

        {/* 状态和保存 */}
        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === "success" && (
            <Badge variant="outline" className="text-green-500 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              已保存
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="outline" className="text-red-500 border-red-500/50">
              <XCircle className="h-3 w-3 mr-1" />
              保存失败
            </Badge>
          )}
          {isDirty && saveStatus === "idle" && (
            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
              <AlertCircle className="h-3 w-3 mr-1" />
              未保存
            </Badge>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saveStatus === "saving"}
            className="gap-1.5"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>

        {outline.genre && (
          <Badge variant="outline" className="shrink-0">
            {outline.genre}
          </Badge>
        )}
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* 目标数据（只读） */}
          <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">目标字数:</span>
              <span className="font-medium">{(outline.target_words / 10000).toFixed(0)}万字</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">目标卷数:</span>
              <span className="font-medium">{outline.target_volumes}卷</span>
            </div>
          </div>

          {/* 核心主题 */}
          <OutlineSection icon={Sparkles} title="核心主题">
            <SimpleTiptapEditor
              value={editData.core_theme ?? ""}
              onChange={(v) => updateField("core_theme", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述核心主题..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 核心冲突 */}
          <OutlineSection icon={Swords} title="核心冲突">
            <SimpleTiptapEditor
              value={editData.core_conflict ?? ""}
              onChange={(v) => updateField("core_conflict", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述核心冲突..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 主角成长弧 */}
          <OutlineSection icon={TrendingUp} title="主角成长弧">
            <SimpleTiptapEditor
              value={editData.protagonist_arc ?? ""}
              onChange={(v) => updateField("protagonist_arc", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述主角成长轨迹..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 结局走向 */}
          <OutlineSection icon={Compass} title="结局走向">
            <SimpleTiptapEditor
              value={editData.ending_direction ?? ""}
              onChange={(v) => updateField("ending_direction", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述结局走向..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 主要剧情线 */}
          <OutlineSection
            icon={ListChecks}
            title="主要剧情线"
            action={
              <Button variant="ghost" size="sm" onClick={addPlotline}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            }
          >
            <div className="space-y-2">
              {(editData.key_plotlines ?? []).map((plotline, index) => (
                <div key={index} className="flex gap-2 items-start group">
                  <span className="text-primary font-medium shrink-0 mt-2">{index + 1}.</span>
                  <SimpleTiptapEditor
                    value={plotline}
                    onChange={(v) => updatePlotline(index, v)}
                    targetType="novel-outline"
                    mode="single-line"
                    placeholder="剧情线描述..."
                    className={cn("flex-1", fontClass)}
                    enableInlineEdit={!!projectId}
                    onQuickAction={handleQuickAction}
                    onOpenCustomEdit={handleCustomEdit}
                    onAcceptEdit={handleAcceptEdit}
                    onRejectEdit={handleRejectEdit}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removePlotline(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(editData.key_plotlines ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground italic">暂无剧情线，点击添加</p>
              )}
            </div>
          </OutlineSection>

          {/* 详细内容 */}
          <OutlineSection icon={FileText} title="详细内容">
            <SimpleTiptapEditor
              value={editData.content ?? ""}
              onChange={(v) => updateField("content", v)}
              targetType="novel-outline"
              mode="multi-line"
              markdown
              placeholder="详细的大纲内容（支持 Markdown 格式）..."
              className={cn("min-h-[200px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 底部留白 */}
          <div className="h-[20vh]" />
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ 卷纲编辑器 ============

interface VolumeOutlineEditorProps {
  outline: VolumeOutline;
  projectId: string;
  onBack: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  fontClass: string;
  fontSize: number;
  lineHeight: number;
}

function VolumeOutlineEditor({
  outline,
  projectId,
  onBack,
  scrollAreaRef,
  fontClass,
  fontSize,
  lineHeight,
}: VolumeOutlineEditorProps) {
  // 本地编辑状态
  const [editData, setEditData] = useState<VolumeOutlineUpdateParams>({
    title: outline.title,
    volume_goal: outline.volume_goal,
    main_conflict: outline.main_conflict ?? "",
    key_events: outline.key_events ?? [],
    ending_hook: outline.ending_hook ?? "",
    content: outline.content ?? "",
    plotline_goals: outline.plotline_goals ?? {},
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // 检查是否有修改
  const isDirty = JSON.stringify(editData) !== JSON.stringify({
    title: outline.title,
    volume_goal: outline.volume_goal,
    main_conflict: outline.main_conflict ?? "",
    key_events: outline.key_events ?? [],
    ending_hook: outline.ending_hook ?? "",
    content: outline.content ?? "",
    plotline_goals: outline.plotline_goals ?? {},
  });

  // 更新 mutation
  const updateMutation = useUpdateVolumeOutline(projectId);

  // 内联编辑 hook
  const {
    inlineEdit,
    executeQuickAction,
    startCustomEdit,
    acceptEdit,
    rejectEdit,
  } = useInlineEdit({
    projectId,
    onEditComplete: (suggestion) => {
      console.log("卷纲编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("内联编辑错误:", error);
    },
  });

  // 同步外部数据变化
  useEffect(() => {
    setEditData({
      title: outline.title,
      volume_goal: outline.volume_goal,
      main_conflict: outline.main_conflict ?? "",
      key_events: outline.key_events ?? [],
      ending_hook: outline.ending_hook ?? "",
      content: outline.content ?? "",
      plotline_goals: outline.plotline_goals ?? {},
    });
    setSaveStatus("idle");
  }, [outline.id]);

  // 保存
  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync({
        volumeNumber: outline.volume_number,
        data: editData,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // 更新字段
  const updateField = useCallback((field: keyof VolumeOutlineUpdateParams, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 处理快捷操作
  const handleQuickAction = useCallback(
    (action: QuickAction, selectedText: string, range: { from: number; to: number }) => {
      executeQuickAction(action, selectedText, range, "novel-outline");
    },
    [executeQuickAction]
  );

  // 处理自定义编辑
  const handleCustomEdit = useCallback(
    (selectedText: string, range: { from: number; to: number }) => {
      startCustomEdit(selectedText, range, "novel-outline");
    },
    [startCustomEdit]
  );

  // 处理接受编辑
  const handleAcceptEdit = useCallback(() => {
    acceptEdit();
  }, [acceptEdit]);

  // 处理拒绝编辑
  const handleRejectEdit = useCallback(() => {
    rejectEdit();
  }, [rejectEdit]);

  // 添加关键事件
  const addKeyEvent = () => {
    setEditData((prev) => ({
      ...prev,
      key_events: [...(prev.key_events ?? []), ""],
    }));
  };

  // 更新关键事件
  const updateKeyEvent = (index: number, value: string) => {
    setEditData((prev) => ({
      ...prev,
      key_events: prev.key_events?.map((e, i) => (i === index ? value : e)),
    }));
  };

  // 删除关键事件
  const removeKeyEvent = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      key_events: prev.key_events?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 头部 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <SimpleTiptapEditor
            value={editData.title ?? ""}
            onChange={(v) => updateField("title", v)}
            targetType="novel-outline"
            mode="single-line"
            placeholder="卷纲标题..."
            className="text-lg font-semibold"
            enableInlineEdit={!!projectId}
            onQuickAction={handleQuickAction}
            onOpenCustomEdit={handleCustomEdit}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
          />
          <p className="text-xs text-muted-foreground">
            第{outline.volume_number}卷 · 第{outline.chapter_start}-{outline.chapter_end}章
          </p>
        </div>

        {/* 状态和保存 */}
        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === "success" && (
            <Badge variant="outline" className="text-green-500 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              已保存
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="outline" className="text-red-500 border-red-500/50">
              <XCircle className="h-3 w-3 mr-1" />
              保存失败
            </Badge>
          )}
          {isDirty && saveStatus === "idle" && (
            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
              <AlertCircle className="h-3 w-3 mr-1" />
              未保存
            </Badge>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saveStatus === "saving"}
            className="gap-1.5"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>

        {outline.target_words && (
          <Badge variant="outline" className="shrink-0">
            {(outline.target_words / 10000).toFixed(0)}万字
          </Badge>
        )}
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* 卷目标 */}
          <OutlineSection icon={Target} title="本卷目标">
            <SimpleTiptapEditor
              value={editData.volume_goal ?? ""}
              onChange={(v) => updateField("volume_goal", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述本卷目标..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 主要冲突 */}
          <OutlineSection icon={Swords} title="主要冲突">
            <SimpleTiptapEditor
              value={editData.main_conflict ?? ""}
              onChange={(v) => updateField("main_conflict", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述主要冲突..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 关键事件 */}
          <OutlineSection
            icon={ListChecks}
            title="关键事件"
            action={
              <Button variant="ghost" size="sm" onClick={addKeyEvent}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            }
          >
            <div className="space-y-2">
              {(editData.key_events ?? []).map((event, index) => (
                <div key={index} className="flex gap-2 items-start group">
                  <span className="text-primary font-medium shrink-0 mt-2">{index + 1}.</span>
                  <SimpleTiptapEditor
                    value={event}
                    onChange={(v) => updateKeyEvent(index, v)}
                    targetType="novel-outline"
                    mode="single-line"
                    placeholder="事件描述..."
                    className={cn("flex-1", fontClass)}
                    enableInlineEdit={!!projectId}
                    onQuickAction={handleQuickAction}
                    onOpenCustomEdit={handleCustomEdit}
                    onAcceptEdit={handleAcceptEdit}
                    onRejectEdit={handleRejectEdit}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removeKeyEvent(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(editData.key_events ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground italic">暂无关键事件，点击添加</p>
              )}
            </div>
          </OutlineSection>

          {/* 剧情线目标 */}
          {editData.plotline_goals && Object.keys(editData.plotline_goals).length > 0 && (
            <OutlineSection icon={TrendingUp} title="剧情线目标">
              <div className="space-y-3">
                {Object.entries(editData.plotline_goals).map(([plotline, goal]) => (
                  <div key={plotline} className="space-y-1">
                    <h4 className="text-sm font-medium text-primary">{plotline}</h4>
                    <SimpleTiptapEditor
                      value={goal}
                      onChange={(v) => {
                        setEditData((prev) => ({
                          ...prev,
                          plotline_goals: {
                            ...prev.plotline_goals,
                            [plotline]: v,
                          },
                        }));
                      }}
                      targetType="novel-outline"
                      mode="multi-line"
                      placeholder="剧情线目标..."
                      className={cn("pl-3 border-l-2 border-border/50", fontClass)}
                      enableInlineEdit={!!projectId}
                      onQuickAction={handleQuickAction}
                      onOpenCustomEdit={handleCustomEdit}
                      onAcceptEdit={handleAcceptEdit}
                      onRejectEdit={handleRejectEdit}
                    />
                  </div>
                ))}
              </div>
            </OutlineSection>
          )}

          {/* 结尾钩子 */}
          <OutlineSection icon={Compass} title="结尾钩子">
            <SimpleTiptapEditor
              value={editData.ending_hook ?? ""}
              onChange={(v) => updateField("ending_hook", v)}
              targetType="novel-outline"
              mode="multi-line"
              placeholder="描述结尾钩子..."
              className={cn("min-h-[60px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 详细内容 */}
          <OutlineSection icon={FileText} title="详细内容">
            <SimpleTiptapEditor
              value={editData.content ?? ""}
              onChange={(v) => updateField("content", v)}
              targetType="novel-outline"
              mode="multi-line"
              markdown
              placeholder="详细的卷纲内容（支持 Markdown 格式）..."
              className={cn("min-h-[200px]", fontClass)}
              enableInlineEdit={!!projectId}
              onQuickAction={handleQuickAction}
              onOpenCustomEdit={handleCustomEdit}
              onAcceptEdit={handleAcceptEdit}
              onRejectEdit={handleRejectEdit}
            />
          </OutlineSection>

          {/* 底部留白 */}
          <div className="h-[20vh]" />
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ 通用组件 ============

interface OutlineSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function OutlineSection({ icon: Icon, title, children, action }: OutlineSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
