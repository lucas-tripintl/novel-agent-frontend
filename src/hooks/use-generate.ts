/**
 * 生成设定相关 hooks
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateEntity,
  type GenerateEntityRequest,
} from "@/lib/api/generate";
import { createEntity, type EntityCreateData } from "@/lib/api/projects";
import { entityLibraryKeys } from "./use-entities";

/**
 * 生成设定 mutation
 */
export function useGenerateEntity(projectId: string) {
  return useMutation({
    mutationFn: (params: GenerateEntityRequest) =>
      generateEntity(projectId, params),
  });
}

/**
 * 创建实体 mutation
 */
export function useCreateEntity(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EntityCreateData) => createEntity(projectId, data),
    onSuccess: () => {
      // 刷新实体列表缓存
      queryClient.invalidateQueries({ queryKey: entityLibraryKeys.all });
    },
  });
}
