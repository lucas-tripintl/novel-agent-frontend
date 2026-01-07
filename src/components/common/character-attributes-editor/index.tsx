"use client";

import { useCallback, useMemo } from "react";
import { User, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { AttributeItem } from "./attribute-item";
import { AddAttributePopover } from "./add-attribute-popover";
import {
  getConfigByKey,
  getInitialValue,
  CHARACTER_ATTRIBUTE_CONFIGS,
} from "./config";
import type {
  CharacterAttributesEditorProps,
  CharacterAttributeKey,
} from "./types";

// 导出类型和配置供外部使用
export * from "./types";
export * from "./config";
export { AttributeItem } from "./attribute-item";
export { AddAttributePopover } from "./add-attribute-popover";

/**
 * 角色属性编辑器
 *
 * 仅适用于 entity_type = "character" 的实体
 * 支持编辑、删除、添加属性
 *
 * @example
 * ```tsx
 * <CharacterAttributesEditor
 *   attributes={attributes}
 *   onChange={setAttributes}
 * />
 * ```
 */
export function CharacterAttributesEditor({
  attributes,
  onChange,
  readOnly = false,
  compact = false,
}: CharacterAttributesEditorProps) {
  // 更新单个属性
  const handleUpdate = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...attributes, [key]: value });
    },
    [attributes, onChange]
  );

  // 删除属性
  const handleDelete = useCallback(
    (key: string) => {
      const rest = Object.fromEntries(
        Object.entries(attributes).filter(([k]) => k !== key)
      );
      onChange(rest);
    },
    [attributes, onChange]
  );

  // 添加属性
  const handleAdd = useCallback(
    (key: CharacterAttributeKey) => {
      const initialValue = getInitialValue(key);
      onChange({ ...attributes, [key]: initialValue });
    },
    [attributes, onChange]
  );

  // 获取已存在的属性键名列表
  const existingKeys = useMemo(() => Object.keys(attributes), [attributes]);

  // 按配置顺序排序属性
  const sortedEntries = useMemo(() => {
    const configOrder = new Map(
      CHARACTER_ATTRIBUTE_CONFIGS.map((c, i) => [c.key, i])
    );

    return Object.entries(attributes)
      .filter(([, value]) => {
        // 过滤掉 null/undefined，但保留空字符串和空数组（用于编辑）
        if (value === null || value === undefined) return false;
        return true;
      })
      .sort(([keyA], [keyB]) => {
        const orderA = configOrder.get(keyA as CharacterAttributeKey) ?? 999;
        const orderB = configOrder.get(keyB as CharacterAttributeKey) ?? 999;
        return orderA - orderB;
      });
  }, [attributes]);

  const isEmpty = sortedEntries.length === 0;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {/* 标题区域（仅在非紧凑模式下显示） */}
      {!compact && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pb-1">
          <User className="h-4 w-4" />
          <span>角色属性</span>
          {!readOnly && sortedEntries.length > 0 && (
            <span className="text-xs text-muted-foreground/60">
              {sortedEntries.length} 项
            </span>
          )}
        </div>
      )}

      {/* 属性列表 */}
      {sortedEntries.length > 0 ? (
        <div className={cn("space-y-3", compact && "space-y-2")}>
          {sortedEntries.map(([key, value]) => (
            <AttributeItem
              key={key}
              attrKey={key}
              value={value}
              config={getConfigByKey(key)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : (
        // 空状态
        !readOnly && (
          <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-dashed border-border/40 bg-card/20">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              暂无属性
            </p>
            <p className="text-xs text-muted-foreground/60 text-center mt-1">
              点击下方按钮添加角色属性
            </p>
          </div>
        )
      )}

      {/* 空状态（只读模式） */}
      {isEmpty && readOnly && (
        <div className="flex items-center justify-center py-4 px-4 rounded-lg border border-dashed border-border/30 bg-card/10">
          <p className="text-sm text-muted-foreground/60">暂无属性信息</p>
        </div>
      )}

      {/* 添加属性按钮 */}
      {!readOnly && <AddAttributePopover existingKeys={existingKeys} onAdd={handleAdd} />}
    </div>
  );
}
