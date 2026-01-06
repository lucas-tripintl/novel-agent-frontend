"use client";

import { useRef, useEffect } from "react";
import { useOutlineEditing, useEditorSettings } from "@/stores/writing-store";
import type { EditingOutline } from "@/stores/writing-store";
import type { NovelOutline, VolumeOutline } from "@/types/outline";
import { fontFamilies, type EditorFontFamily } from "@/types/writing";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

function getFontClass(fontFamily: EditorFontFamily): string {
  const font = fontFamilies.find((f) => f.id === fontFamily);
  return font?.fontClass ?? "font-sans";
}

interface OutlineEditorProps {
  outline: EditingOutline;
}

export function OutlineEditor({ outline }: OutlineEditorProps) {
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
      <NovelOutlineView
        outline={outline.data as NovelOutline}
        onBack={closeOutlineEditor}
        scrollAreaRef={scrollAreaRef}
        fontClass={getFontClass(settings.fontFamily)}
        fontSize={settings.fontSize}
        lineHeight={settings.lineHeight}
      />
    );
  }

  return (
    <VolumeOutlineView
      outline={outline.data as VolumeOutline}
      onBack={closeOutlineEditor}
      scrollAreaRef={scrollAreaRef}
      fontClass={getFontClass(settings.fontFamily)}
      fontSize={settings.fontSize}
      lineHeight={settings.lineHeight}
    />
  );
}

// ============ 总纲视图 ============

interface NovelOutlineViewProps {
  outline: NovelOutline;
  onBack: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  fontClass: string;
  fontSize: number;
  lineHeight: number;
}

function NovelOutlineView({
  outline,
  onBack,
  scrollAreaRef,
  fontClass,
  fontSize,
  lineHeight,
}: NovelOutlineViewProps) {
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
          <h2 className="text-lg font-semibold truncate">{outline.title}</h2>
          <p className="text-xs text-muted-foreground">总纲</p>
        </div>

        {outline.genre && (
          <Badge variant="outline" className="shrink-0">
            {outline.genre}
          </Badge>
        )}
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* 目标数据 */}
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
            <p
              className={cn("text-foreground", fontClass)}
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              {outline.core_theme}
            </p>
          </OutlineSection>

          {/* 核心冲突 */}
          {outline.core_conflict && (
            <OutlineSection icon={Swords} title="核心冲突">
              <p
                className={cn("text-foreground", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.core_conflict}
              </p>
            </OutlineSection>
          )}

          {/* 主角成长弧 */}
          {outline.protagonist_arc && (
            <OutlineSection icon={TrendingUp} title="主角成长弧">
              <p
                className={cn("text-foreground", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.protagonist_arc}
              </p>
            </OutlineSection>
          )}

          {/* 结局走向 */}
          {outline.ending_direction && (
            <OutlineSection icon={Compass} title="结局走向">
              <p
                className={cn("text-foreground", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.ending_direction}
              </p>
            </OutlineSection>
          )}

          {/* 主要剧情线 */}
          {outline.key_plotlines && outline.key_plotlines.length > 0 && (
            <OutlineSection icon={ListChecks} title="主要剧情线">
              <ul className="space-y-2">
                {outline.key_plotlines.map((plotline, index) => (
                  <li
                    key={index}
                    className={cn("flex gap-3", fontClass)}
                    style={{ fontSize: `${fontSize}px`, lineHeight }}
                  >
                    <span className="text-primary font-medium shrink-0">{index + 1}.</span>
                    <span className="text-foreground">{plotline}</span>
                  </li>
                ))}
              </ul>
            </OutlineSection>
          )}

          {/* 详细内容 */}
          {outline.content && (
            <OutlineSection icon={FileText} title="详细内容">
              <div
                className={cn("text-foreground whitespace-pre-wrap", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.content}
              </div>
            </OutlineSection>
          )}

          {/* 底部留白 */}
          <div className="h-[20vh]" />
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ 卷纲视图 ============

interface VolumeOutlineViewProps {
  outline: VolumeOutline;
  onBack: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  fontClass: string;
  fontSize: number;
  lineHeight: number;
}

function VolumeOutlineView({
  outline,
  onBack,
  scrollAreaRef,
  fontClass,
  fontSize,
  lineHeight,
}: VolumeOutlineViewProps) {
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
          <h2 className="text-lg font-semibold truncate">{outline.title}</h2>
          <p className="text-xs text-muted-foreground">
            第{outline.volume_number}卷 · 第{outline.chapter_start}-{outline.chapter_end}章
          </p>
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
            <p
              className={cn("text-foreground", fontClass)}
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              {outline.volume_goal}
            </p>
          </OutlineSection>

          {/* 主要冲突 */}
          {outline.main_conflict && (
            <OutlineSection icon={Swords} title="主要冲突">
              <p
                className={cn("text-foreground", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.main_conflict}
              </p>
            </OutlineSection>
          )}

          {/* 关键事件 */}
          {outline.key_events && outline.key_events.length > 0 && (
            <OutlineSection icon={ListChecks} title="关键事件">
              <ul className="space-y-2">
                {outline.key_events.map((event, index) => (
                  <li
                    key={index}
                    className={cn("flex gap-3", fontClass)}
                    style={{ fontSize: `${fontSize}px`, lineHeight }}
                  >
                    <span className="text-primary font-medium shrink-0">{index + 1}.</span>
                    <span className="text-foreground">{event}</span>
                  </li>
                ))}
              </ul>
            </OutlineSection>
          )}

          {/* 剧情线目标 */}
          {outline.plotline_goals && Object.keys(outline.plotline_goals).length > 0 && (
            <OutlineSection icon={TrendingUp} title="剧情线目标">
              <div className="space-y-3">
                {Object.entries(outline.plotline_goals).map(([plotline, goal]) => (
                  <div key={plotline} className="space-y-1">
                    <h4 className="text-sm font-medium text-primary">{plotline}</h4>
                    <p
                      className={cn("text-foreground pl-3 border-l-2 border-border/50", fontClass)}
                      style={{ fontSize: `${fontSize}px`, lineHeight }}
                    >
                      {goal}
                    </p>
                  </div>
                ))}
              </div>
            </OutlineSection>
          )}

          {/* 结尾钩子 */}
          {outline.ending_hook && (
            <OutlineSection icon={Compass} title="结尾钩子">
              <p
                className={cn("text-foreground", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.ending_hook}
              </p>
            </OutlineSection>
          )}

          {/* 详细内容 */}
          {outline.content && (
            <OutlineSection icon={FileText} title="详细内容">
              <div
                className={cn("text-foreground whitespace-pre-wrap", fontClass)}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {outline.content}
              </div>
            </OutlineSection>
          )}

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
}

function OutlineSection({ icon: Icon, title, children }: OutlineSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
