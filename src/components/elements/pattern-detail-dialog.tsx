"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { getPatternTypeLabel } from "@/types/pattern";
import { formatTimeAgo } from "@/lib/utils/time";
import { updatePattern } from "@/lib/api/patterns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patternKeys } from "@/hooks/use-patterns";
import type { PatternRead } from "@/types/pattern";

interface PatternDetailDialogProps {
  pattern: PatternRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function PatternDetailDialog({
  pattern,
  open,
  onOpenChange,
  onSave,
}: PatternDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const queryClient = useQueryClient();

  // 当 pattern 改变时，重置编辑状态
  useEffect(() => {
    if (pattern) {
      setEditedName(pattern.name);
      setEditedContent(pattern.content || "");
      setIsEditing(false);
    }
  }, [pattern]);

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
      if (!pattern) throw new Error("No pattern selected");
      return updatePattern(pattern.id, data);
    },
    onSuccess: () => {
      // 使缓存失效
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      setIsEditing(false);
      onSave?.();
    },
  });

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (pattern) {
      setEditedName(pattern.name);
      setEditedContent(pattern.content || "");
    }
    setIsEditing(false);
  }, [pattern]);

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      name: editedName,
      content: editedContent,
    });
  }, [editedName, editedContent, updateMutation]);

  if (!pattern) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline" className="shrink-0">
                {getPatternTypeLabel(pattern.entity_type)}
              </Badge>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="font-semibold"
                  placeholder="模式名称"
                />
              ) : (
                <DialogTitle className="truncate">{pattern.name}</DialogTitle>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {formatTimeAgo(pattern.created_at)}
            </span>
          </div>
        </DialogHeader>

        <Separator />

        {/* 标签区域 */}
        {pattern.tags && pattern.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pattern.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 内容区域 */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="pr-4">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="输入模式内容（支持 Markdown 格式）"
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {pattern.content ? (
                  <MarkdownContent content={pattern.content} />
                ) : (
                  <p className="text-muted-foreground italic">暂无内容</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                保存
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleStartEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 简单的 Markdown 渲染组件
 * 支持基本的 Markdown 语法
 */
function MarkdownContent({ content }: { content: string }) {
  // 简单的 Markdown 渲染：处理换行、标题、列表等
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className="my-2">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 标题
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-base font-semibold mt-4 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={i} className="text-xl font-bold mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // 无序列表
    else if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(line.replace(/^[-*]\s/, ""));
    }
    // 有序列表
    else if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(line.replace(/^\d+\.\s/, ""));
    }
    // 空行
    else if (line.trim() === "") {
      flushList();
      // 不添加空段落
    }
    // 普通段落
    else {
      flushList();
      elements.push(
        <p key={i} className="my-2">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();

  return <>{elements}</>;
}

/**
 * 渲染行内 Markdown 元素
 */
function renderInline(text: string): React.ReactNode {
  // 处理粗体 **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // 处理斜体 *text*
    const italicParts = part.split(/(\*[^*]+\*)/g);
    if (italicParts.length > 1) {
      return italicParts.map((iPart, iIdx) => {
        if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length > 2) {
          return (
            <em key={`${idx}-${iIdx}`} className="italic">
              {iPart.slice(1, -1)}
            </em>
          );
        }
        return iPart;
      });
    }
    return part;
  });
}
