"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VibeKanbanWebCompanion } from "vibe-kanban-web-companion";
import { EnumsInitializer } from "./enums-initializer";
import { handleApiError } from "@/lib/api/error-handler";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: handleApiError, // 全局 mutation 错误处理
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EnumsInitializer />
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
      <VibeKanbanWebCompanion />
    </QueryClientProvider>
  );
}
