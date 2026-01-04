"use client";

import { useEnumLabel, useFieldValueLabel, useEnumItem } from "@/hooks/use-enums";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { KnownEnumName, KnownFieldName } from "@/types/enums";

interface EnumLabelProps {
  /** 枚举名称 */
  enumName: KnownEnumName | string;
  /** 枚举值 */
  value: string | undefined | null;
  /** 是否显示描述 tooltip */
  showTooltip?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 枚举标签组件
 * 自动将枚举值转换为中文标签，未找到时显示原值
 */
export function EnumLabel({
  enumName,
  value,
  showTooltip = false,
  className,
}: EnumLabelProps) {
  const label = useEnumLabel(enumName, value);
  const item = useEnumItem(enumName, value);

  if (!value) return null;

  if (showTooltip && item?.description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{label}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{item.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <span className={className}>{label}</span>;
}

interface FieldValueLabelProps {
  /** 字段名称 */
  fieldName: KnownFieldName | string;
  /** 字段值 */
  value: string | undefined | null;
  /** 自定义类名 */
  className?: string;
}

/**
 * 字段值标签组件
 * 用于 attributes 中的字段值转换
 */
export function FieldValueLabel({
  fieldName,
  value,
  className,
}: FieldValueLabelProps) {
  const label = useFieldValueLabel(fieldName, value);

  if (!value) return null;

  return <span className={className}>{label}</span>;
}
