"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Edit3, Trash2, X, Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getAttributeLabel, getConfigByKey } from "./config";
import type { AttributeItemProps } from "./types";

/**
 * 单个属性编辑项组件
 * 支持文本类型和数组类型的属性编辑
 */
export function AttributeItem({
  attrKey,
  value,
  config,
  onUpdate,
  onDelete,
  readOnly = false,
}: AttributeItemProps) {
  const resolvedConfig = config ?? getConfigByKey(attrKey);
  const isArrayType = resolvedConfig?.type === "array" || Array.isArray(value);
  const label = resolvedConfig?.label ?? getAttributeLabel(attrKey);
  const placeholder = resolvedConfig?.placeholder ?? "请输入...";

  // 数组类型属性
  if (isArrayType) {
    return (
      <ArrayAttributeItem
        attrKey={attrKey}
        value={value}
        label={label}
        placeholder={placeholder}
        onUpdate={onUpdate}
        onDelete={onDelete}
        readOnly={readOnly}
      />
    );
  }

  // 文本类型属性
  return (
    <TextAttributeItem
      attrKey={attrKey}
      value={value}
      label={label}
      placeholder={placeholder}
      onUpdate={onUpdate}
      onDelete={onDelete}
      readOnly={readOnly}
    />
  );
}

/** 文本类型属性编辑组件 */
function TextAttributeItem({
  attrKey,
  value,
  label,
  placeholder,
  onUpdate,
  onDelete,
  readOnly,
}: {
  attrKey: string;
  value: unknown;
  label: string;
  placeholder: string;
  onUpdate: (key: string, value: unknown) => void;
  onDelete: (key: string) => void;
  readOnly: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ""));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 进入编辑模式时聚焦
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    if (readOnly) return;
    setEditValue(String(value ?? ""));
    setIsEditing(true);
  }, [readOnly, value]);

  const handleConfirm = useCallback(() => {
    onUpdate(attrKey, editValue);
    setIsEditing(false);
  }, [attrKey, editValue, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditValue(String(value ?? ""));
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      } else if (e.key === "Enter" && e.metaKey) {
        handleConfirm();
      }
    },
    [handleCancel, handleConfirm]
  );

  const displayValue = String(value ?? "");
  const isEmpty = !displayValue.trim();

  return (
    <div className="group relative rounded-lg border border-border/40 bg-card/30 transition-all duration-200 hover:border-border/60 hover:bg-card/50">
      {/* 头部：标签 + 操作按钮 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleStartEdit}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">编辑</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(attrKey)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">删除属性</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[80px] text-sm bg-background/50 resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                确认
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "text-sm whitespace-pre-wrap break-words min-h-[24px]",
              isEmpty && "text-muted-foreground/50 italic",
              !readOnly && "cursor-text hover:bg-muted/30 rounded px-2 py-1.5 -mx-2 -my-1.5 transition-colors"
            )}
            onClick={handleStartEdit}
          >
            {isEmpty ? "点击编辑..." : displayValue}
          </div>
        )}
      </div>
    </div>
  );
}

/** 数组类型属性编辑组件 */
function ArrayAttributeItem({
  attrKey,
  value,
  label,
  placeholder,
  onUpdate,
  onDelete,
  readOnly,
}: {
  attrKey: string;
  value: unknown;
  label: string;
  placeholder: string;
  onUpdate: (key: string, value: unknown) => void;
  onDelete: (key: string) => void;
  readOnly: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const arrayValue = useMemo(
    () => (Array.isArray(value) ? (value as string[]) : []),
    [value]
  );

  const handleAddItem = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (arrayValue.includes(trimmed)) {
      // 防止重复
      setInputValue("");
      return;
    }
    onUpdate(attrKey, [...arrayValue, trimmed]);
    setInputValue("");
    inputRef.current?.focus();
  }, [attrKey, arrayValue, inputValue, onUpdate]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      const newArr = arrayValue.filter((_, i) => i !== index);
      onUpdate(attrKey, newArr);
    },
    [attrKey, arrayValue, onUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddItem();
      }
    },
    [handleAddItem]
  );

  const isEmpty = arrayValue.length === 0;

  return (
    <div className="group relative rounded-lg border border-border/40 bg-card/30 transition-all duration-200 hover:border-border/60 hover:bg-card/50">
      {/* 头部：标签 + 删除按钮 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {!readOnly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(attrKey)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">删除属性</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {/* 已有项目 */}
          {arrayValue.map((item, idx) => (
            <Badge
              key={`${item}-${idx}`}
              variant="secondary"
              className={cn(
                "gap-1 text-sm py-1.5 px-2.5 h-auto whitespace-normal text-left",
                "bg-secondary/80 hover:bg-secondary transition-colors",
                !readOnly && "pr-1.5"
              )}
            >
              <span className="break-all">{item}</span>
              {!readOnly && (
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 shrink-0 transition-colors"
                  aria-label={`删除 ${item}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}

          {/* 添加输入框 */}
          {!readOnly && (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEmpty ? placeholder : "添加..."}
                className="h-8 w-32 text-sm bg-background/50"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={handleAddItem}
                    disabled={!inputValue.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">添加</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* 空状态 */}
          {isEmpty && readOnly && (
            <span className="text-sm text-muted-foreground/50 italic">
              暂无内容
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
