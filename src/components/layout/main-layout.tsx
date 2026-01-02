"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-grid">
        {/* 渐变背景效果 */}
        <div className="pointer-events-none fixed inset-0 bg-gradient-radial" />
        
        {/* 左侧导航 */}
        <AppSidebar />

        {/* 主内容区 */}
        <SidebarInset className="flex flex-1 flex-col relative">
          {/* 顶部区域 */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-2" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">系统就绪</span>
            </div>
            {/* 右侧工具栏 */}
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
            </div>
          </header>

          {/* 主要内容 */}
          <main className="flex-1 overflow-auto p-6 scrollbar-thin">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
