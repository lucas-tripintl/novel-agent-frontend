/**
 * 枚举本地化 Hooks
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEnumStore } from "@/stores/enum-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  fetchEnums,
  getCachedEnums,
  cacheEnums,
} from "@/lib/api/enums";
import type { KnownEnumName, KnownFieldName, EnumItem } from "@/types/enums";

/**
 * 初始化枚举数据的 Hook
 * 应在 App 顶层调用一次
 */
export function useEnumsInit() {
  const { loaded, setEnums, setLoading } = useEnumStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 只有登录后才请求枚举数据
  const shouldFetch = !loaded && isAuthenticated;

  const query = useQuery({
    queryKey: ["enums"],
    queryFn: () => fetchEnums("zh-CN"),
    staleTime: Infinity, // 永不过期，只加载一次
    gcTime: Infinity, // 永不清理缓存
    enabled: shouldFetch,
    retry: 2,
  });

  // 初始化时尝试从缓存加载
  useEffect(() => {
    if (!loaded && isAuthenticated) {
      const cached = getCachedEnums();
      console.log("[useEnumsInit] 从缓存加载:", cached ? Object.keys(cached.enums || {}) : "无缓存");
      if (cached) {
        setEnums(cached);
      } else {
        setLoading(true);
      }
    }
  }, [loaded, isAuthenticated, setEnums, setLoading]);

  // API 请求成功后更新 store 并缓存
  useEffect(() => {
    if (query.data) {
      console.log("[useEnumsInit] API 返回数据:", Object.keys(query.data.enums || {}));
      console.log("[useEnumsInit] EntityType:", query.data.enums?.EntityType);
      setEnums(query.data);
      cacheEnums(query.data);
    }
  }, [query.data, setEnums]);

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * 获取枚举项标签的 Hook
 * @param enumName 枚举名称
 * @param value 枚举值
 * @returns 中文标签，未找到返回原值
 */
export function useEnumLabel(
  enumName: KnownEnumName | string,
  value: string | undefined | null
): string {
  const getLabel = useEnumStore((state) => state.getLabel);
  if (value == null) return "";
  return getLabel(enumName, value);
}

/**
 * 获取枚举项完整信息的 Hook
 * @param enumName 枚举名称
 * @param value 枚举值
 * @returns EnumItem 或 undefined
 */
export function useEnumItem(
  enumName: KnownEnumName | string,
  value: string | undefined | null
): EnumItem | undefined {
  const getEnumItem = useEnumStore((state) => state.getEnumItem);
  if (value == null) return undefined;
  return getEnumItem(enumName, value);
}

/**
 * 获取枚举所有项的 Hook
 * @param enumName 枚举名称
 * @returns 所有枚举项数组
 */
export function useEnumItems(enumName: KnownEnumName | string): EnumItem[] {
  const getEnumItems = useEnumStore((state) => state.getEnumItems);
  return getEnumItems(enumName);
}

/**
 * 获取字段值标签的 Hook
 * @param fieldName 字段名称
 * @param value 字段值
 * @returns 中文标签，未找到返回原值
 */
export function useFieldValueLabel(
  fieldName: KnownFieldName | string,
  value: string | undefined | null
): string {
  const getFieldValueLabel = useEnumStore((state) => state.getFieldValueLabel);
  if (value == null) return "";
  return getFieldValueLabel(fieldName, value);
}

/**
 * 获取字段所有值映射的 Hook
 * @param fieldName 字段名称
 * @returns { value: label } 映射
 */
export function useFieldValues(
  fieldName: KnownFieldName | string
): Record<string, string> {
  const getFieldValues = useEnumStore((state) => state.getFieldValues);
  return getFieldValues(fieldName);
}

/**
 * 直接获取 store 方法（用于非 React 环境或事件处理）
 */
export function getEnumLabel(
  enumName: KnownEnumName | string,
  value: string
): string {
  return useEnumStore.getState().getLabel(enumName, value);
}

export function getFieldValueLabel(
  fieldName: KnownFieldName | string,
  value: string
): string {
  return useEnumStore.getState().getFieldValueLabel(fieldName, value);
}
