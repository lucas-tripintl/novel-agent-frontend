/**
 * 章节细纲相关 hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChapterOutline,
  getChapterOutlines,
  upsertChapterOutline,
  deleteChapterOutline,
  generateChapterOutline,
} from "@/lib/api/chapter-outlines";
import type { ChapterOutlineCreate } from "@/types/chapter-outline";

// Query keys
export const chapterOutlineKeys = {
  all: ["chapterOutlines"] as const,
  lists: () => [...chapterOutlineKeys.all, "list"] as const,
  list: (projectId: string, params?: { chapter_start?: number; chapter_end?: number }) =>
    [...chapterOutlineKeys.lists(), projectId, params] as const,
  details: () => [...chapterOutlineKeys.all, "detail"] as const,
  detail: (projectId: string, chapterNumber: number) =>
    [...chapterOutlineKeys.details(), projectId, chapterNumber] as const,
};

/**
 * 获取章节细纲列表
 */
export function useChapterOutlines(
  projectId: string | null,
  params?: {
    chapter_start?: number;
    chapter_end?: number;
  }
) {
  return useQuery({
    queryKey: chapterOutlineKeys.list(projectId ?? "", params),
    queryFn: async () => {
      const response = await getChapterOutlines(projectId!, params);
      return response.data;
    },
    enabled: !!projectId,
  });
}

/**
 * 获取单个章节细纲
 *
 * 注意：细纲可能不存在（404），此时返回 null
 */
export function useChapterOutline(
  projectId: string | null,
  chapterNumber: number | null
) {
  return useQuery({
    queryKey: chapterOutlineKeys.detail(projectId ?? "", chapterNumber ?? 0),
    queryFn: async () => {
      try {
        const response = await getChapterOutline(projectId!, chapterNumber!);
        return response.data;
      } catch (error) {
        // 细纲不存在时返回 null（而不是 undefined）
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        // 检查是否是 API 错误响应
        const apiError = error as { status?: number };
        if (apiError.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!projectId && !!chapterNumber && chapterNumber > 0,
    // 细纲可能不存在，不重试
    retry: false,
  });
}

/**
 * 创建/更新章节细纲 (Upsert)
 */
export function useUpsertChapterOutline(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterNumber,
      data,
    }: {
      chapterNumber: number;
      data: ChapterOutlineCreate;
    }) => {
      const response = await upsertChapterOutline(projectId, chapterNumber, data);
      return response.data;
    },
    onSuccess: (_, { chapterNumber }) => {
      // 刷新该章节的细纲缓存
      queryClient.invalidateQueries({
        queryKey: chapterOutlineKeys.detail(projectId, chapterNumber),
      });
      // 刷新细纲列表
      queryClient.invalidateQueries({
        queryKey: chapterOutlineKeys.lists(),
      });
      console.log("细纲已保存");
    },
    onError: (error) => {
      console.error("保存细纲失败:", error);
    },
  });
}

/**
 * 删除章节细纲
 */
export function useDeleteChapterOutline(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterNumber: number) => {
      await deleteChapterOutline(projectId, chapterNumber);
    },
    onSuccess: (_, chapterNumber) => {
      // 移除该章节的细纲缓存
      queryClient.removeQueries({
        queryKey: chapterOutlineKeys.detail(projectId, chapterNumber),
      });
      // 刷新细纲列表
      queryClient.invalidateQueries({
        queryKey: chapterOutlineKeys.lists(),
      });
      console.log("细纲已删除");
    },
    onError: (error) => {
      console.error("删除细纲失败:", error);
    },
  });
}

/**
 * 异步生成章节细纲
 *
 * 返回任务 ID，需要轮询任务状态获取结果
 */
export function useGenerateChapterOutline(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterNumber,
      prompt,
    }: {
      chapterNumber: number;
      prompt?: string;
    }) => {
      const response = await generateChapterOutline(projectId, chapterNumber, { prompt });
      return response.data;
    },
    onSuccess: (data, { chapterNumber }) => {
      console.log(`细纲生成任务已创建: ${data.message}`);
      // 稍后刷新细纲（任务完成后）
      // 这里可以启动轮询逻辑，但目前先简单处理
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: chapterOutlineKeys.detail(projectId, chapterNumber),
        });
      }, 5000);
    },
    onError: (error) => {
      console.error("生成细纲任务创建失败:", error);
    },
  });
}
