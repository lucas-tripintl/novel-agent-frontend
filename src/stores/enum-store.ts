/**
 * 枚举本地化状态管理
 */

import { create } from "zustand";
import type {
  EnumsResponse,
  EnumDefinition,
  EnumItem,
  FieldValueDefinition,
  KnownEnumName,
  KnownFieldName,
} from "@/types/enums";

interface EnumState {
  /** 是否已加载 */
  loaded: boolean;
  /** 是否正在加载 */
  loading: boolean;
  /** API 版本 */
  version: string | null;
  /** 当前语言 */
  locale: string | null;
  /** 枚举定义 */
  enums: Record<string, EnumDefinition>;
  /** 字段值定义 */
  fieldValues: Record<string, FieldValueDefinition>;

  /** 设置枚举数据 */
  setEnums: (data: EnumsResponse) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;

  /**
   * 获取枚举项的标签
   * @param enumName 枚举名称，如 "EntityType"
   * @param value 枚举值，如 "character"
   * @returns 中文标签，如 "角色"；未找到则返回原值
   */
  getLabel: (enumName: KnownEnumName | string, value: string) => string;

  /**
   * 获取枚举项的完整信息
   * @param enumName 枚举名称
   * @param value 枚举值
   * @returns EnumItem 或 undefined
   */
  getEnumItem: (
    enumName: KnownEnumName | string,
    value: string
  ) => EnumItem | undefined;

  /**
   * 获取枚举的所有项
   * @param enumName 枚举名称
   * @returns 所有枚举项
   */
  getEnumItems: (enumName: KnownEnumName | string) => EnumItem[];

  /**
   * 获取枚举的中文名称
   * @param enumName 枚举名称
   * @returns 中文名称，如 "实体类型"
   */
  getEnumLabel: (enumName: KnownEnumName | string) => string;

  /**
   * 获取字段值的标签
   * @param fieldName 字段名称，如 "importance"
   * @param value 字段值，如 "core"
   * @returns 中文标签，如 "核心"；未找到则返回原值
   */
  getFieldValueLabel: (
    fieldName: KnownFieldName | string,
    value: string
  ) => string;

  /**
   * 获取字段的所有值映射
   * @param fieldName 字段名称
   * @returns { value: label } 映射
   */
  getFieldValues: (
    fieldName: KnownFieldName | string
  ) => Record<string, string>;
}

export const useEnumStore = create<EnumState>((set, get) => ({
  loaded: false,
  loading: false,
  version: null,
  locale: null,
  enums: {},
  fieldValues: {},

  setEnums: (data) =>
    set({
      loaded: true,
      loading: false,
      version: data.version,
      locale: data.locale,
      enums: data.enums,
      fieldValues: data.field_values,
    }),

  setLoading: (loading) => set({ loading }),

  getLabel: (enumName, value) => {
    const state = get();
    const enumDef = state.enums[enumName];
    if (!enumDef) {
      // 调试：打印可用的 enum keys
      if (Object.keys(state.enums).length > 0) {
        console.log(`[getLabel] 找不到 ${enumName}, 可用: ${Object.keys(state.enums).join(", ")}`);
      }
      return value; // fallback: 返回原值
    }
    const item = enumDef.items.find((i) => i.value === value);
    return item?.label ?? value; // fallback: 返回原值
  },

  getEnumItem: (enumName, value) => {
    const enumDef = get().enums[enumName];
    if (!enumDef) return undefined;
    return enumDef.items.find((i) => i.value === value);
  },

  getEnumItems: (enumName) => {
    const enumDef = get().enums[enumName];
    return enumDef?.items ?? [];
  },

  getEnumLabel: (enumName) => {
    const enumDef = get().enums[enumName];
    return enumDef?.label ?? enumName;
  },

  getFieldValueLabel: (fieldName, value) => {
    const fieldDef = get().fieldValues[fieldName];
    if (!fieldDef) return value; // fallback: 返回原值
    return fieldDef.values[value] ?? value; // fallback: 返回原值
  },

  getFieldValues: (fieldName) => {
    const fieldDef = get().fieldValues[fieldName];
    return fieldDef?.values ?? {};
  },
}));
