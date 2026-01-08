import { useMutation } from "@tanstack/react-query";
import { generateChapterSummary } from "@/lib/api/writing";

interface GenerateSummaryParams {
  chapterId: string;
  save?: boolean;
}

export function useGenerateChapterSummary() {
  return useMutation({
    mutationFn: ({ chapterId, save = false }: GenerateSummaryParams) =>
      generateChapterSummary(chapterId, save),
  });
}
