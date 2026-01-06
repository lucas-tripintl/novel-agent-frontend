"use client";

import { useState } from "react";
import {
  useChatSessions,
  useDeleteChatSession,
} from "@/hooks/use-chat";
import { useChatSessionState } from "@/stores/writing-store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import {
  History,
  Trash2,
  MessageSquare,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionHistoryProps {
  projectId: string;
}

export function SessionHistory({ projectId }: SessionHistoryProps) {
  const [open, setOpen] = useState(false);
  const { currentSessionId, setCurrentChatSession } = useChatSessionState();
  const { data, isLoading } = useChatSessions(
    projectId,
    { status: "active" },
    { enabled: open }
  );
  const deleteSession = useDeleteChatSession(projectId);

  const sessions = data?.items ?? [];

  const handleSelectSession = (sessionId: string) => {
    setCurrentChatSession(sessionId);
    setOpen(false);
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.stopPropagation();
    try {
      await deleteSession.mutateAsync(sessionId);
      // 如果删除的是当前会话，切换到其他会话或清空
      if (currentSessionId === sessionId) {
        const otherSession = sessions.find((s) => s.id !== sessionId);
        setCurrentChatSession(otherSession?.id ?? null);
      }
    } catch (error) {
      console.error("删除会话失败:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="历史对话"
        >
          <History className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            历史对话
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">暂无历史对话</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => {
                const isActive = session.id === currentSessionId;

                return (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectSession(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectSession(session.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left cursor-pointer group",
                      "transition-colors hover:bg-muted/50",
                      isActive && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isActive ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isActive && "text-primary"
                        )}
                      >
                        {session.title || "新对话"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{session.message_count} 条消息</span>
                        <span>·</span>
                        <span>{formatTime(session.updated_at)}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      disabled={deleteSession.isPending}
                    >
                      {deleteSession.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
