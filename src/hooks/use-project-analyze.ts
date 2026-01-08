"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeProject, analyzeStyle, synthesizeWorldview } from "@/lib/api/projects";
import type { TaskCreateResponse, AnalysisType } from "@/types/api";

interface AnalyzeConfig {
  analysisTypes: AnalysisType[];
  startChapter?: number;
  endChapter?: number;
  force?: boolean;
  autoExtractPatterns?: boolean;
}

export function useProjectAnalyze(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaskCreateResponse, Error, AnalyzeConfig>({
    mutationFn: async (config) => {
      return analyzeProject(projectId, {
        analysis_types: config.analysisTypes,
        start_chapter: config.startChapter,
        end_chapter: config.endChapter,
        force: config.force,
        auto_extract_patterns: config.autoExtractPatterns,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

interface StyleAnalyzeConfig {
  sampleChapters?: number;
}

export function useStyleAnalyze(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaskCreateResponse, Error, StyleAnalyzeConfig>({
    mutationFn: async (config) => {
      return analyzeStyle(projectId, {
        sample_chapters: config.sampleChapters ?? 10,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useWorldviewSynthesize(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaskCreateResponse, Error, void>({
    mutationFn: async () => {
      return synthesizeWorldview(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["entities", projectId] });
    },
  });
}
