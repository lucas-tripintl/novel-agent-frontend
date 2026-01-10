"use client";

import { useEnumLabel, useFieldValueLabel, useEnumItem, useEnumItems } from "@/hooks/use-enums";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { KnownEnumName, KnownFieldName } from "@/types/enums";
import type { VariantProps } from "class-variance-authority";

interface EnumLabelProps {
  /** 枚举名称 */
  enumName: KnownEnumName | string;
  /** 枚举值 */
  value: string | undefined | null;
  /** 是否显示描述 tooltip */
  showTooltip?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 当枚举值不存在时的回退文本 */
  fallback?: string;
}

/**
 * 枚举标签组件
 * 自动将枚举值转换为中文标签，未找到时显示原值或回退文本
 */
export function EnumLabel({
  enumName,
  value,
  showTooltip = false,
  className,
  fallback,
}: EnumLabelProps) {
  // Always call hooks at the top level
  const label = useEnumLabel(enumName || '', value);
  const item = useEnumItem(enumName || '', value);

  // Handle null/undefined values
  if (!value) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  // Handle invalid enumName
  if (!enumName || typeof enumName !== 'string') {
    console.warn(`[EnumLabel] Invalid enumName: ${enumName}`);
    return <span className={className}>{fallback || value}</span>;
  }

  // Use fallback if label is same as value (indicating no localization found)
  const displayLabel = (label === value && fallback) ? fallback : label;

  if (showTooltip && item?.description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{displayLabel}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{item.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <span className={className}>{displayLabel}</span>;
}

interface FieldValueLabelProps {
  /** 字段名称 */
  fieldName: KnownFieldName | string;
  /** 字段值 */
  value: string | undefined | null;
  /** 自定义类名 */
  className?: string;
  /** 当字段值不存在时的回退文本 */
  fallback?: string;
}

/**
 * 字段值标签组件
 * 用于 attributes 中的字段值转换
 */
export function FieldValueLabel({
  fieldName,
  value,
  className,
  fallback,
}: FieldValueLabelProps) {
  // Always call hooks at the top level
  const label = useFieldValueLabel(fieldName || '', value);

  // Handle null/undefined values
  if (!value) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  // Handle invalid fieldName
  if (!fieldName || typeof fieldName !== 'string') {
    console.warn(`[FieldValueLabel] Invalid fieldName: ${fieldName}`);
    return <span className={className}>{fallback || value}</span>;
  }

  // Use fallback if label is same as value (indicating no localization found)
  const displayLabel = (label === value && fallback) ? fallback : label;

  return <span className={className}>{displayLabel}</span>;
}

interface EnumBadgeProps {
  /** 枚举名称 */
  enumName: KnownEnumName | string;
  /** 枚举值 */
  value: string | undefined | null;
  /** Badge 变体 */
  variant?: VariantProps<typeof badgeVariants>['variant'];
  /** 自定义类名 */
  className?: string;
  /** 当枚举值不存在时的回退文本 */
  fallback?: string;
  /** 颜色映射 - 将枚举值映射到特定的 CSS 类 */
  colorMapping?: Record<string, string>;
}

/**
 * 枚举徽章组件
 * 将枚举值显示为带样式的徽章，支持颜色映射
 */
export function EnumBadge({
  enumName,
  value,
  variant = "secondary",
  className,
  fallback,
  colorMapping,
}: EnumBadgeProps) {
  // Always call hooks at the top level
  const label = useEnumLabel(enumName || '', value);

  // Handle null/undefined values
  if (!value) {
    return fallback ? (
      <Badge variant={variant} className={className}>
        {fallback}
      </Badge>
    ) : null;
  }

  // Handle invalid enumName
  if (!enumName || typeof enumName !== 'string') {
    console.warn(`[EnumBadge] Invalid enumName: ${enumName}`);
    return (
      <Badge variant={variant} className={className}>
        {fallback || value}
      </Badge>
    );
  }

  const displayLabel = (label === value && fallback) ? fallback : label;

  // Apply color mapping if provided
  const colorClass = colorMapping?.[value];
  const badgeClassName = cn(
    colorClass,
    className
  );

  return (
    <Badge variant={variant} className={badgeClassName}>
      {displayLabel}
    </Badge>
  );
}

interface EnumSelectProps {
  /** 枚举名称 */
  enumName: KnownEnumName | string;
  /** 当前选中的值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否显示空选项 */
  allowEmpty?: boolean;
  /** 空选项的标签 */
  emptyLabel?: string;
  /** 选择器大小 */
  size?: "sm" | "default";
}

/**
 * 枚举选择器组件
 * 提供下拉选择器，显示本地化的枚举选项
 */
export function EnumSelect({
  enumName,
  value,
  onChange,
  placeholder = "请选择...",
  disabled = false,
  className,
  allowEmpty = false,
  emptyLabel = "无",
  size = "default",
}: EnumSelectProps) {
  // Always call hooks at the top level
  const enumItems = useEnumItems(enumName || '');

  // Handle invalid enumName
  if (!enumName || typeof enumName !== 'string') {
    console.warn(`[EnumSelect] Invalid enumName: ${enumName}`);
    return (
      <Select disabled>
        <SelectTrigger className={className} size={size}>
          <SelectValue placeholder="Invalid enum" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && (
          <SelectItem value="">
            {emptyLabel}
          </SelectItem>
        )}
        {enumItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
