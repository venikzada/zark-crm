"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    FolderKanban,
    Users,
    Settings,
    FileText,
    ChevronDown,
    Plus,
    Focus,
    LogOut,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Mock data for spaces - will be replaced with Supabase data
const mockSpaces = [
    { id: "1", name: "ZARK Internal", color: "#f56f10", icon: "🏢" },
    { id: "2", name: "Cliente ABC", color: "#22c55e", icon: "🏪" },
    { id: "3", name: "Cliente XYZ", color: "#3b82f6", icon: "💼" },
];

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meus Espaços", href: "/dashboard/spaces", icon: FolderKanban },
    { name: "Documentos", href: "/dashboard/docs", icon: FileText },
    { name: "Equipe", href: "/dashboard/team", icon: Users },
];

interface SidebarProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function AppSidebar({ isCollapsed = false }: SidebarProps) {
    const pathname = usePathname();
    const [spacesExpanded, setSpacesExpanded] = useState(true);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image
                            src="/Zark-Laranja.png"
                            alt="ZARK"
                            width={isCollapsed ? 32 : 100}
                            height={isCollapsed ? 32 : 30}
                            className="drop-shadow-lg"
                        />
                    </Link>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-sidebar-accent text-zark"
                                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                            )}
                                        >
                                            <item.icon
                                                className={cn("h-5 w-5 shrink-0", isActive && "text-zark")}
                                            />
                                            {!isCollapsed && <span>{item.name}</span>}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right">{item.name}</TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </nav>

                    <Separator className="my-4" />

                    {/* Spaces Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setSpacesExpanded(!spacesExpanded)}
                            className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent",
                                isCollapsed && "justify-center"
                            )}
                        >
                            {!isCollapsed && <span>Espaços</span>}
                            {!isCollapsed && (
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 transition-transform",
                                        spacesExpanded && "rotate-180"
                                    )}
                                />
                            )}
                        </button>

                        {spacesExpanded && !isCollapsed && (
                            <div className="space-y-1 pl-2">
                                {mockSpaces.map((space) => (
                                    <Link
                                        key={space.id}
                                        href={`/dashboard/spaces/${space.id}`}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                                            pathname === `/dashboard/spaces/${space.id}`
                                                ? "bg-sidebar-accent text-sidebar-foreground"
                                                : "text-sidebar-foreground/70"
                                        )}
                                    >
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded text-xs"
                                            style={{ backgroundColor: space.color + "20", color: space.color }}
                                        >
                                            {space.icon}
                                        </span>
                                        <span className="truncate">{space.name}</span>
                                    </Link>
                                ))}

                                {/* Add Space Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                                >
                                    <Plus className="h-4 w-4" />
                                    Novo Espaço
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Bottom Section */}
                <div className="border-t border-sidebar-border p-3 space-y-2">
                    {/* Zen Mode Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size={isCollapsed ? "icon" : "default"}
                                className={cn(
                                    "w-full gap-2 text-sidebar-foreground/70 hover:text-zark hover:bg-zark/10",
                                    isCollapsed && "h-10 w-10"
                                )}
                            >
                                <Focus className="h-5 w-5" />
                                {!isCollapsed && "Modo Zen"}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Modo Zen</TooltipContent>}
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size={isCollapsed ? "icon" : "default"}
                                className={cn(
                                    "w-full gap-2 text-sidebar-foreground/70 relative",
                                    isCollapsed && "h-10 w-10"
                                )}
                            >
                                <Bell className="h-5 w-5" />
                                {!isCollapsed && "Notificações"}
                                <Badge className="absolute right-2 top-1 h-5 w-5 rounded-full bg-zark p-0 text-[10px]">
                                    3
                                </Badge>
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right">Notificações</TooltipContent>
                        )}
                    </Tooltip>

                    <Separator />

                    {/* Settings */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/dashboard/settings"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent",
                                    pathname === "/dashboard/settings" && "bg-sidebar-accent text-sidebar-foreground"
                                )}
                            >
                                <Settings className="h-5 w-5" />
                                {!isCollapsed && "Configurações"}
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right">Configurações</TooltipContent>
                        )}
                    </Tooltip>

                    {/* Logout */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size={isCollapsed ? "icon" : "default"}
                                className={cn(
                                    "w-full gap-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10",
                                    isCollapsed && "h-10 w-10"
                                )}
                            >
                                <LogOut className="h-5 w-5" />
                                {!isCollapsed && "Sair"}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
                    </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
}
