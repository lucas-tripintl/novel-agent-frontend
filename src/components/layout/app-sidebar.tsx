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
  Blend,
  BookOpen,
  Database,
  FolderOpen,
  Library,
  LogOut,
  Sparkles,
  Zap,
  Wand2,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    titleKey: "projects" as const,
    icon: FolderOpen,
    href: "/",
  },
  {
    titleKey: "analyze" as const,
    icon: Zap,
    href: "/analyze",
  },
  {
    titleKey: "skills" as const,
    icon: Wand2,
    href: "/skills",
  },
  {
    titleKey: "entities" as const,
    icon: Database,
    href: "/entities",
  },
];

const creationNavItems = [
  {
    titleKey: "elementsExtract" as const,
    icon: Sparkles,
    href: "/elements/extract",
  },
  {
    titleKey: "elementsLibrary" as const,
    icon: Library,
    href: "/elements",
  },
  {
    titleKey: "fusion" as const,
    icon: Blend,
    href: "/fusion",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const t = useTranslations("nav");
  const tLayout = useTranslations("layout");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // 获取用户首字母
  const userInitial = user?.nickname?.[0] || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-foreground">{tLayout("brand")}</span>
            <span className="text-xs text-muted-foreground">{tLayout("tagline")}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            {tLayout("workspace")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={t(item.titleKey)}
                    className="transition-colors hover:bg-accent/50"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            {tLayout("creativeWorkshop")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {creationNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={t(item.titleKey)}
                    className="transition-colors hover:bg-accent/50"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 rounded-lg bg-card/50 p-3 cursor-pointer hover:bg-accent/50 transition-colors group-data-[collapsible=icon]:hidden">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user.nickname || user.email}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {tLayout("account")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                {tLayout("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="group-data-[collapsible=icon]:hidden">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              {tLayout("login")}
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
