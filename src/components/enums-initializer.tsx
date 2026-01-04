"use client";

import { useEnumsInit } from "@/hooks/use-enums";

/**
 * 枚举数据初始化组件
 * 放在 Providers 中，登录后自动加载枚举数据
 */
export function EnumsInitializer() {
  useEnumsInit();
  return null;
}
