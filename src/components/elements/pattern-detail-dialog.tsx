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
import { Separator } from "@/components/ui/separator";
import { Pencil, Save, X, Loader2, Trash2 } from "lucide-react";
import { getPatternTypeLabel } from "@/types/pattern";
import { formatTimeAgo } from "@/lib/utils/time";
import { updatePattern, deletePattern } from "@/lib/api/patterns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patternKeys } from "@/hooks/use-patterns";
import { useDeleteWithConfirmation } from "@/hooks/use-delete-with-confirmation";
import type { PatternRead } from "@/types/pattern";

interface PatternDetailDialogProps {
  pattern: PatternRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedPattern: PatternRead) => void;
  onDelete?: () => void;
}

export function PatternDetailDialog({
  pattern,
  open,
  onOpenChange,
  onSave,
  onDelete,
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
    onSuccess: (updatedPattern) => {
      // 使缓存失效
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      setIsEditing(false);
      onSave?.(updatedPattern);
    },
  });

  // 删除操作 - 使用 useDeleteWithConfirmation 进行标准化删除流程
  const {
    showConfirmDialog,
    setShowConfirmDialog,
    isDeleting,
    ConfirmDialog,
  } = useDeleteWithConfirmation({
    targetName: pattern ? `模式「${pattern.name}」` : "",
    deleteFn: async () => {
      if (!pattern) throw new Error("No pattern selected");
      await deletePattern(pattern.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      onOpenChange(false);
      onDelete?.();
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
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

          <Separator className="shrink-0" />

          {/* 标签区域 */}
          {pattern.tags && pattern.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {pattern.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 内容区域 - 可滚动 */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
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
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                {pattern.content ? (
                  <MarkdownContent content={pattern.content} />
                ) : (
                  <p className="text-muted-foreground italic">暂无内容</p>
                )}
              </div>
            )}
          </div>

          <Separator className="shrink-0" />

          <DialogFooter className="shrink-0">
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
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
                <Button variant="outline" onClick={handleStartEdit} disabled={isDeleting}>
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 - 使用标准化的删除确认组件 */}
      <ConfirmDialog />
    </>
  );
}

/**
 * 简单的 Markdown 渲染组件
 * 使用唯一计数器避免 key 冲突
 */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listStartLine = 0;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      const key = `list-${listStartLine}`;
      elements.push(
        <ListTag key={key} className="my-2 pl-4">
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
        <h3 key={`h3-${i}`} className="text-base font-semibold mt-4 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-semibold mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // 无序列表
    else if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
        listStartLine = i;
      }
      listItems.push(line.replace(/^[-*]\s/, ""));
    }
    // 有序列表
    else if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        listStartLine = i;
      }
      listItems.push(line.replace(/^\d+\.\s/, ""));
    }
    // 空行
    else if (line.trim() === "") {
      flushList();
    }
    // 普通段落
    else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="my-2 break-words">
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
