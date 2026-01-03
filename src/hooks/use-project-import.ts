"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importProject } from "@/lib/api/projects";
import type { ProjectImportResponse, SuccessResponse } from "@/types/api";

interface ImportProjectData {
  file: File;
  projectName?: string;
  startChapter?: number;
  endChapter?: number;
}

export function useProjectImport() {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<ProjectImportResponse>,
    Error,
    ImportProjectData
  >({
    mutationFn: async (data) => {
      return importProject({
        file: data.file,
        project_name: data.projectName,
        start_chapter: data.startChapter,
        end_chapter: data.endChapter,
      });
    },
    onSuccess: () => {
      // 刷新项目列表
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
