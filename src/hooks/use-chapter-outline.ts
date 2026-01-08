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
import { useTaskStore } from "@/stores/task-store";
import type { ChapterOutlineCreate, ChapterOutlineRead } from "@/types/chapter-outline";

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
      // API Client 已自动解包 v2 响应的 data 字段
      return getChapterOutlines(projectId!, params);
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
  const queryKey = chapterOutlineKeys.detail(projectId ?? "", chapterNumber ?? 0);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ChapterOutlineRead | null> => {
      console.log("[useChapterOutline] 开始查询:", { projectId, chapterNumber, queryKey });
      try {
        // API Client 已自动解包 v2 响应的 data 字段
        const data = await getChapterOutline(projectId!, chapterNumber!);
        console.log("[useChapterOutline] 获取数据:", {
          projectId,
          chapterNumber,
          hasData: !!data,
          dataContent: data?.content?.slice(0, 100),
        });
        return data;
      } catch (error) {
        console.log("[useChapterOutline] 查询异常:", { projectId, chapterNumber, error });
        // 检查是否是 ApiError（有 status 属性）
        const apiError = error as { status?: number };
        if (apiError.status === 404) {
          return null;
        }
        // 兜底：检查 message 中是否包含 404
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!projectId && !!chapterNumber && chapterNumber > 0,
    // 细纲可能不存在，不重试
    retry: false,
    // 细纲数据经常更新（AI 生成），不使用 staleTime
    staleTime: 0,
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
      // API Client 已自动解包 v2 响应的 data 字段
      return upsertChapterOutline(projectId, chapterNumber, data);
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
  const setHasNewTask = useTaskStore((state) => state.setHasNewTask);

  return useMutation({
    mutationFn: async ({
      chapterNumber,
      prompt,
    }: {
      chapterNumber: number;
      prompt?: string;
    }) => {
      // API Client 已自动解包 v2 响应的 data 字段
      return generateChapterOutline(projectId, chapterNumber, { prompt });
    },
    onSuccess: (data) => {
      console.log(`细纲生成任务已创建: ${data.message}`);
      // 标记有新任务，自动展开任务面板
      setHasNewTask(true);
    },
    onError: (error) => {
      console.error("生成细纲任务创建失败:", error);
    },
  });
}
