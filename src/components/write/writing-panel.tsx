"use client";

import { useEffect } from "react";
import type { ProjectRead } from "@/types/api";
import { useWritingStore } from "@/stores/writing-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { WritingToolbar } from "./writing-toolbar";
import { SettingsPane } from "./panes/settings-pane";
import { EditorPane } from "./panes/editor-pane";
import { AssistantPane } from "./panes/assistant-pane";
import { cn } from "@/lib/utils";

interface WritingPanelProps {
  project: ProjectRead;
}

export function WritingPanel({ project }: WritingPanelProps) {
  const { isLeftPaneCollapsed, isRightPaneCollapsed, setContext } =
    useWritingStore();

  // 设置项目上下文
  useEffect(() => {
    setContext(project.id, null);
  }, [project.id, setContext]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* 顶部工具栏 */}
      <WritingToolbar project={project} />

      {/* 三栏主体 */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1"
      >
        {/* 左栏 - 设定面板 */}
        <ResizablePanel
          id="settings"
          defaultSize="20%"
          minSize="15%"
          maxSize="30%"
          collapsible
          collapsedSize="0%"
          className={cn(
            "transition-all duration-300",
            isLeftPaneCollapsed && "hidden"
          )}
        >
          <SettingsPane projectId={project.id} />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className={cn(
            "bg-border/50 hover:bg-primary/20 transition-colors",
            isLeftPaneCollapsed && "hidden"
          )}
        />

        {/* 中栏 - 编辑器 */}
        <ResizablePanel
          id="editor"
          defaultSize="50%"
          minSize="30%"
        >
          <EditorPane projectId={project.id} />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className={cn(
            "bg-border/50 hover:bg-primary/20 transition-colors",
            isRightPaneCollapsed && "hidden"
          )}
        />

        {/* 右栏 - AI 助手 */}
        <ResizablePanel
          id="assistant"
          defaultSize="30%"
          minSize="20%"
          maxSize="40%"
          collapsible
          collapsedSize="0%"
          className={cn(
            "transition-all duration-300",
            isRightPaneCollapsed && "hidden"
          )}
        >
          <AssistantPane projectId={project.id} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
