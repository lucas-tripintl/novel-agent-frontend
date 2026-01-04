/**
 * 枚举本地化 API
 */

import { apiClient } from "./client";
import type { EnumsResponse } from "@/types/enums";

const CACHE_KEY = "novel-agent-enums";
const CACHE_VERSION_KEY = "novel-agent-enums-version";

/** 获取枚举数据 */
export async function fetchEnums(locale = "zh-CN"): Promise<EnumsResponse> {
  return apiClient.get<EnumsResponse>("/enums", {
    params: { locale },
  });
}

/** 从 localStorage 读取缓存 */
export function getCachedEnums(): EnumsResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // ignore
  }
  return null;
}

/** 缓存到 localStorage */
export function cacheEnums(data: EnumsResponse): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_VERSION_KEY, data.version);
  } catch {
    // ignore - localStorage 可能满了
  }
}

/** 获取缓存版本 */
export function getCachedVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CACHE_VERSION_KEY);
}
