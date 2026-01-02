"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BookOpen,
  FileText,
  FolderOpen,
  Network,
  Palette,
  Settings,
  Sparkles,
  Users,
  Zap,
  Earth
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeStore, themes } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    title: "作品中心",
    icon: FolderOpen,
    href: "/",
  },
  {
    title: "设定提取",
    icon: Zap,
    href: "/analyze",
  },
  {
    title: "创意工具",
    icon: Sparkles,
    href: "/ideas",
  },
];

const analysisNavItems = [
  {
    title: "世界观",
    icon: Earth,
    href: "/worldview",
  },
  {
    title: "人物图谱",
    icon: Users,
    href: "/characters",
  },
  {
    title: "剧情大纲",
    icon: FileText,
    href: "/storylines",
  },
  {
    title: "关系网络",
    icon: Network,
    href: "/relations",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeStore();

  const currentTheme = themes.find((t) => t.id === theme);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-foreground">Astra Codex</span>
            <span className="text-xs text-muted-foreground">创作星图</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            工作区
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="transition-colors hover:bg-accent/50"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            设定集
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="transition-colors hover:bg-accent/50"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          {/* 主题切换 */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover:bg-accent/50 cursor-pointer">
                  <Palette className="h-4 w-4" />
                  <span>{currentTheme?.name}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  选择主题
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {themes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer rounded-md hover:bg-transparent focus:bg-transparent focus:text-foreground",
                      theme === t.id && "border-2 border-primary"
                    )}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg"
                      style={{ backgroundColor: t.preview.bg }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: t.preview.primary }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {theme === t.id && (
                          <span className="text-xs text-primary">✓ 当前</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <div className="flex gap-1.5 pt-1">
                        <div
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: t.preview.bg }}
                          title="背景色"
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: t.preview.primary }}
                          title="主色"
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: t.preview.accent }}
                          title="强调色"
                        />
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          {/* 设置 */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-accent/50">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>设置</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-card/50 p-3 group-data-[collapsible=icon]:hidden">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">用户</span>
            <span className="text-xs text-muted-foreground">免费版</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
