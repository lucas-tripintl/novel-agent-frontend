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
    title: "关系网络",
    icon: Network,
    href: "/relations",
  },
  {
    title: "剧情线",
    icon: FileText,
    href: "/storylines",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeStore();

  // 循环切换主题
  const cycleTheme = () => {
    const themeOrder = ["cyberpunk", "ink", "bamboo"] as const;
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

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
            <span className="text-xs text-muted-foreground">智能写文助手</span>
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
            <SidebarMenuButton
              onClick={cycleTheme}
              className="hover:bg-accent/50 cursor-pointer"
            >
              <Palette className="h-4 w-4" />
              <span>{currentTheme?.name}</span>
            </SidebarMenuButton>
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
