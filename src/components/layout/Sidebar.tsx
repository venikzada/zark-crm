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
    CreditCard,
    HelpCircle,
    MoreVertical,
    Pencil,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { InviteMemberDialog } from "@/components/spaces/InviteMemberDialog";
import { EditSpaceDialog } from "@/components/spaces/EditSpaceDialog";
import { DeleteSpaceDialog } from "@/components/spaces/DeleteSpaceDialog";

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

    const [spaceToEdit, setSpaceToEdit] = useState<any>(null);
    const [spaceToDelete, setSpaceToDelete] = useState<any>(null);

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
        // Listen for router refresh events if possible, but for now we rely on the dialogs triggering router.refresh()
        // verifying if we need to manually re-fetch. 
        // Since router.refresh() re-runs server components but this is a client component fetching data on mount, 
        // we might actually NOT see updates unless we trigger a re-fetch.
        // A better approach for the future is using TanStack Query or a context, but for now:
        // We will pass a callback to the dialogs or simply rely on the fact that 
        // create/edit/delete might trigger a full page navigation or we can expose a refresh function.
        // For this immediate task, let's keep it simple. If valid RLS is ensuring we only see what we have access to.
    }, [pathname]); // Re-fetch on path change might be too aggressive, but ensures updates after actions. 
    // Actually, router.refresh() does NOT re-mount client components.
    // We should probably move fetchSpaces outside useEffect or add a trigger.
    // For now, let's add a custom event listener or just depend on pathname which changes often enough
    // OR allow the dialogs to trigger a refresh.
    // Let's stick to the current pattern but add `pathname` as dependency so it refreshes when navigating.

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
                                        const isActive = pathname === spaceUrl;

                                        const SpaceLink = (
                                            <div
                                                className={cn(
                                                    "relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all hover:bg-sidebar-accent/50 group/space cursor-pointer",
                                                    isActive
                                                        ? "text-sidebar-accent-foreground bg-sidebar-accent"
                                                        : "text-sidebar-foreground/60",
                                                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                                )}
                                            >
                                                <Link href={spaceUrl} className="absolute inset-0 z-0" />

                                                {/* Icon/Logo */}
                                                <div className="relative z-10 pointer-events-none">
                                                    {space.logo_url ? (
                                                        <div className={cn(
                                                            "relative overflow-hidden rounded-lg transition-transform group-hover/space:scale-110 border border-zinc-800",
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
                                                                "flex items-center justify-center rounded-lg text-xs transition-transform group-hover/space:scale-110",
                                                                isCollapsed ? "h-6 w-6" : "h-8 w-8"
                                                            )}
                                                            style={{ backgroundColor: (space.color || "#f56f10") + "15", color: space.color || "#f56f10" }}
                                                        >
                                                            {space.icon || (space.name ? space.name.charAt(0).toUpperCase() : "S")}
                                                        </span>
                                                    )}
                                                </div>

                                                {!isCollapsed && (
                                                    <span className="truncate flex-1 relative z-10 pointer-events-none">{space.name}</span>
                                                )}

                                                {/* Options Dropdown - Only show when NOT collapsed and on hover (or active) */}
                                                {!isCollapsed && (
                                                    <div className="relative z-20 opacity-0 group-hover/space:opacity-100 transition-opacity">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 bg-[#09090b] border-[#1f1f23]">
                                                                <DropdownMenuItem
                                                                    onClick={() => setSpaceToEdit(space)}
                                                                    className="text-zinc-400 focus:text-white focus:bg-zinc-800"
                                                                >
                                                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setSpaceToDelete(space)}
                                                                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                                                >
                                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </div>
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
                                    <AvatarImage src="https://ui-avatars.com/api/?name=Renan+Kennedy&background=18181b&color=fff" />
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

                {/* Dialogs */}
                {spaceToEdit && (
                    <EditSpaceDialog
                        open={!!spaceToEdit}
                        onOpenChange={(open) => !open && setSpaceToEdit(null)}
                        space={spaceToEdit}
                    />
                )}
                {spaceToDelete && (
                    <DeleteSpaceDialog
                        open={!!spaceToDelete}
                        onOpenChange={(open) => !open && setSpaceToDelete(null)}
                        spaceId={spaceToDelete.id}
                        spaceName={spaceToDelete.name}
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

