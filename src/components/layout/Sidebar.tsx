"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
    HelpCircle,
    MoreHorizontal,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { InviteMemberDialog } from "@/components/spaces/InviteMemberDialog";
import { SpaceSettingsDialog } from "@/components/spaces/SpaceSettingsDialog";

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
    const [spaces, setSpaces] = useState<any[]>([]); // TODO: Add proper type
    const [isLoading, setIsLoading] = useState(true);
    const [editingSpace, setEditingSpace] = useState<any>(null); // Space being edited

    // Fetch spaces on mount
    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('spaces')
                    .select('id, name, color, logo_url')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Error fetching spaces:", error);
                } else {
                    setSpaces(data || []);
                }
            } catch (err) {
                console.error("Failed to fetch spaces:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpaces();
    }, []);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative group",
                    isCollapsed ? "w-20 px-3" : "w-[280px] px-4"
                )}
            >
                {/* Logo Section */}
                <div className="flex h-32 items-center justify-center py-6">
                    <Link href="/dashboard" className="flex items-center justify-center transition-all bg-transparent group/logo w-full">
                        <div className={cn(
                            "relative flex items-center justify-center transition-all duration-300",
                            isCollapsed ? "w-10 h-10" : "w-[60%]"
                        )}>
                            <Image
                                src="/Zark-Laranja.png"
                                alt="ZARK"
                                width={180}
                                height={80}
                                className="object-contain w-full h-auto"
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
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
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
                                        <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
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
                                {isLoading ? (
                                    // Loading Skeleton
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="px-4 py-2">
                                            <div className="h-8 bg-zinc-800/50 rounded-lg animate-pulse" />
                                        </div>
                                    ))
                                ) : (
                                    spaces.map((space) => {
                                        const spaceUrl = `/dashboard/spaces/${space.id}`;
                                        const isActiveSpace = pathname === spaceUrl;

                                        return (
                                            <div key={space.id} className="relative group/space-container">
                                                <Link
                                                    href={spaceUrl}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all hover:bg-sidebar-accent/50 group/space relative",
                                                        isActiveSpace
                                                            ? "text-sidebar-accent-foreground bg-sidebar-accent"
                                                            : "text-sidebar-foreground/60",
                                                        isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                                    )}
                                                >
                                                    {space.logo_url ? (
                                                        <div className={cn(
                                                            "relative overflow-hidden rounded-lg transition-transform group-hover/space:scale-110 border border-zinc-800 shrink-0",
                                                            isCollapsed ? "h-6 w-6" : "h-8 w-8"
                                                        )}>
                                                            <Image
                                                                src={space.logo_url}
                                                                alt={space.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={cn(
                                                                "flex items-center justify-center rounded-lg text-xs transition-transform group-hover/space:scale-110 shrink-0",
                                                                isCollapsed ? "h-6 w-6" : "h-8 w-8"
                                                            )}
                                                            style={{ backgroundColor: (space.color || "#f56f10") + "15", color: space.color || "#f56f10" }}
                                                        >
                                                            {space.icon || (space.name ? space.name.charAt(0).toUpperCase() : "S")}
                                                        </span>
                                                    )}

                                                    {!isCollapsed && (
                                                        <span className="truncate flex-1">{space.name}</span>
                                                    )}

                                                    {/* Settings Trigger for Desktop (Hover) */}
                                                    {!isCollapsed && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <div
                                                                    role="button"
                                                                    className={cn(
                                                                        "opacity-0 group-hover/space-container:opacity-100 transition-opacity p-1 rounded-md hover:bg-zinc-800 absolute right-2",
                                                                        "focus:opacity-100"
                                                                    )}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                    }}
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                                </div>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-800 text-zinc-300" align="start" side="right">
                                                                <DropdownMenuLabel className="text-xs text-zinc-500 uppercase">Obções de {space.name}</DropdownMenuLabel>
                                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingSpace(space);
                                                                    }}
                                                                    className="cursor-pointer focus:bg-zinc-800 focus:text-white gap-2"
                                                                >
                                                                    <Settings className="w-4 h-4" /> Configurações do Espaço
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Trigger deletion via dialog for safety or direct?
                                                                        // Let's open settings dialog as it has delete?
                                                                        // Or add specific delete here?
                                                                        // User wanted "clickup style", usually settings opens a modal.
                                                                        setEditingSpace(space);
                                                                    }}
                                                                    className="cursor-pointer focus:bg-red-950/30 text-red-500 focus:text-red-400 gap-2"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </Link>
                                            </div>
                                        );
                                    })
                                )}

                                <CreateSpaceDialog>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-2xl h-10 border border-dashed border-sidebar-border hover:border-sidebar-foreground/20 transition-colors",
                                            isCollapsed && "justify-center px-0 w-12 h-10 border-0"
                                        )}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {!isCollapsed && "Novo Espaço"}
                                    </Button>
                                </CreateSpaceDialog>

                                {/* Invite Members - Only show when not collapsed AND we have spaces */}
                                {!isCollapsed && spaces.length > 0 && (
                                    <div className="mt-2">
                                        <InviteMemberDialog
                                            spaceId={spaces[0].id}
                                            spaceName={spaces[0].name}
                                        />
                                    </div>
                                )}
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

                {/* Settings Dialog */}
                {editingSpace && (
                    <SpaceSettingsDialog
                        space={editingSpace}
                        open={!!editingSpace}
                        onOpenChange={(open) => !open && setEditingSpace(null)}
                    />
                )}
            </aside>
        </TooltipProvider>
    );
}

function DropdownMenuWrapper({ children, isCollapsed }: { children: React.ReactNode, isCollapsed: boolean }) {
    if (isCollapsed) return <>{children}</>;

    // In a real app this would trigger a dropdown
    return <Link href="/dashboard/settings">{children}</Link>;
}

