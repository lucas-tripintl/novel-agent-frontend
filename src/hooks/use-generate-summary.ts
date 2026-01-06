import { useMutation } from "@tanstack/react-query";
import { generateChapterSummary } from "@/lib/api/writing";

export function useGenerateChapterSummary() {
  return useMutation({
    mutationFn: (content: string) => generateChapterSummary(content),
  });
}
