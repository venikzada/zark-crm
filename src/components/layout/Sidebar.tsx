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
    Plus,
    Focus,
    LogOut,
    Bell,
    ChevronRight,
    Search,
    CreditCard,
    HelpCircle
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";

// Mock data for spaces
const mockSpaces = [
    { id: "1", name: "ZARK Internal", color: "#f56f10", icon: "🏢", logo: "/Zark-Laranja.png" },
    { id: "2", name: "Cliente ABC", color: "#22c55e", icon: "🏪", logo: null },
    { id: "3", name: "Cliente XYZ", color: "#3b82f6", icon: "💼", logo: null },
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

export function AppSidebar({ isCollapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex h-screen flex-col bg-[#09090b] border-r border-[#1f1f23] transition-all duration-300 relative group",
                    isCollapsed ? "w-20 px-3" : "w-[280px] px-4"
                )}
            >
                {/* Logo Section */}
                <div className="flex h-24 items-center justify-center py-6">
                    <Link href="/dashboard" className="flex items-center justify-center transition-all bg-transparent p-2 rounded-full hover:bg-white/5 group/logo">
                        <div className="relative flex items-center justify-center">
                            {/* Glow Effect */}
                            <div className={cn(
                                "absolute inset-0 bg-zark/20 blur-xl rounded-full opacity-50 group-hover/logo:opacity-100 transition-opacity",
                                isCollapsed ? "w-8 h-8" : "w-16 h-16"
                            )} />
                            <Image
                                src="/Zark-Laranja.png"
                                alt="ZARK"
                                width={64}
                                height={64}
                                className={cn(
                                    "relative z-10 object-contain transition-all duration-300",
                                    isCollapsed ? "w-8 h-8" : "w-14 h-14"
                                )}
                            />
                        </div>
                    </Link>
                </div>

                {/* Main Navigation */}
                <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-6">
                        {/* Primary Menu */}
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                const LinkComponent = (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 group/item",
                                            isActive
                                                ? "bg-zinc-900 text-white shadow-inner shadow-black/50"
                                                : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100",
                                            isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "transition-colors",
                                                isCollapsed ? "h-5 w-5" : "h-[22px] w-[22px]",
                                                isActive ? "text-zark" : "text-zinc-400 group-hover/item:text-zark/80"
                                            )}
                                        />
                                        {!isCollapsed && <span>{item.name}</span>}
                                    </Link>
                                );

                                if (!isCollapsed) return <div key={item.name}>{LinkComponent}</div>;

                                return (
                                    <Tooltip key={item.name}>
                                        <TooltipTrigger asChild>
                                            {LinkComponent}
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-zinc-900 text-white border-zinc-800">
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>

                        {/* Spaces Section */}
                        <div className="space-y-2">
                            {!isCollapsed && (
                                <div className="flex items-center justify-between px-4 mb-2">
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        Espaços
                                    </span>
                                </div>
                            )}

                            <div className="space-y-1">
                                {mockSpaces.map((space) => {
                                    const SpaceLink = (
                                        <Link
                                            href={`/dashboard/spaces/${space.id}`}
                                            className={cn(
                                                "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all hover:bg-zinc-900/50 group/space",
                                                pathname === `/dashboard/spaces/${space.id}`
                                                    ? "text-white bg-zinc-900"
                                                    : "text-zinc-400",
                                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                            )}
                                        >
                                            {space.logo ? (
                                                <div className={cn(
                                                    "relative overflow-hidden rounded-lg transition-transform group-hover/space:scale-110 border border-zinc-800",
                                                    isCollapsed ? "h-6 w-6" : "h-8 w-8"
                                                )}>
                                                    <Image
                                                        src={space.logo}
                                                        alt={space.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <span
                                                    className={cn(
                                                        "flex items-center justify-center rounded-lg text-xs transition-transform group-hover/space:scale-110",
                                                        isCollapsed ? "h-6 w-6" : "h-8 w-8"
                                                    )}
                                                    style={{ backgroundColor: space.color + "15", color: space.color }}
                                                >
                                                    {space.icon}
                                                </span>
                                            )}

                                            {!isCollapsed && (
                                                <span className="truncate flex-1">{space.name}</span>
                                            )}
                                        </Link>
                                    );

                                    if (!isCollapsed) return <div key={space.id}>{SpaceLink}</div>;

                                    return (
                                        <Tooltip key={space.id}>
                                            <TooltipTrigger asChild>
                                                {SpaceLink}
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="bg-zinc-900 text-white border-zinc-800">
                                                {space.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}

                                <CreateSpaceDialog>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-2 text-zinc-500 hover:text-white hover:bg-zinc-900/50 rounded-2xl h-10 border border-dashed border-zinc-800/50 hover:border-zinc-700 transition-colors",
                                            isCollapsed && "justify-center px-0 w-12 h-10 border-0"
                                        )}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {!isCollapsed && "Novo Espaço"}
                                    </Button>
                                </CreateSpaceDialog>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Bottom Section */}
                <div className="pt-4 space-y-4 mb-4">
                    {/* Collapse Toggle (Desktop) */}
                    <div className={cn("hidden lg:flex px-2", isCollapsed ? "justify-center" : "justify-end")}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="text-zinc-500 hover:text-white hover:bg-zinc-900/80 rounded-full h-8 w-8"
                        >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-180" />}
                        </Button>
                    </div>

                    {/* Check if we should show Progress Card (Only Expanded and Desktop) */}
                    {!isCollapsed && (
                        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 relative overflow-hidden group mx-2">
                            {/* ... Progress content ... */}
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-zark/10 rounded-full blur-2xl group-hover:bg-zark/20 transition-all" />

                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <span className="text-sm font-semibold text-white">Meta Mensal</span>
                                <span className="text-xs text-zark font-bold">75%</span>
                            </div>
                            <Progress value={75} className="h-2 bg-zinc-800" indicatorClassName="bg-gradient-to-r from-zark to-orange-400" />
                        </div>
                    )}

                    {/* User Profile */}
                    <DropdownMenuWrapper isCollapsed={isCollapsed}>
                        {/* ... User Button ... */}
                        <div className={cn(
                            "flex items-center gap-3 p-2 rounded-2xl transition-colors cursor-pointer hover:bg-zinc-900",
                            isCollapsed && "justify-center p-0 hover:bg-transparent"
                        )}>
                            <div className="relative">
                                <Avatar className={cn("border-2 border-zinc-900", isCollapsed ? "h-9 w-9" : "h-10 w-10")}>
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#09090b] rounded-full" />
                            </div>

                            {!isCollapsed && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate">Renan Kennedy</p>
                                    <p className="text-xs text-zinc-500 truncate">renan@zark.com</p>
                                </div>
                            )}

                            {!isCollapsed && (
                                <Settings className="h-4 w-4 text-zinc-500 hover:text-white transition-colors" />
                            )}
                        </div>
                    </DropdownMenuWrapper>
                </div>
            </aside>
        </TooltipProvider>
    );
}

function DropdownMenuWrapper({ children, isCollapsed }: { children: React.ReactNode, isCollapsed: boolean }) {
    if (isCollapsed) return <>{children}</>;

    // In a real app this would trigger a dropdown
    return <Link href="/dashboard/settings">{children}</Link>;
}

