"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Calendar,
    Clock,
    MoreHorizontal,
    Hash,
    AlertTriangle,
    Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface KanbanCardProps {
    task: Task;
    onClick?: () => void;
    index?: number;
}

const priorityConfig: Record<string, {
    label: string;
    color: string;
    bg: string;
    icon?: React.ReactNode;
    ring?: string;
}> = {
    low: {
        label: "Baixa",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    medium: {
        label: "Média",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
    },
    high: {
        label: "Alta",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: <AlertTriangle className="h-3 w-3" />,
    },
    urgent: {
        label: "Urgente",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        icon: <Zap className="h-3 w-3" />,
        ring: "ring-1 ring-red-500/30",
    },
};

export function KanbanCard({ task, onClick, index = 0 }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const priority = priorityConfig[task.priority] || priorityConfig.medium;

    // Format date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Check if overdue
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            suppressHydrationWarning
            className={cn(
                // Base styles
                "group relative cursor-grab active:cursor-grabbing",
                // Card appearance
                "bg-gradient-to-br from-card/90 to-card/70",
                "border border-border/40 rounded-xl",
                "p-4",
                // Transitions
                "transition-all duration-300 ease-out",
                // Hover effects
                "hover:border-zark/40 hover:shadow-lg hover:shadow-black/20",
                "hover:-translate-y-1",
                // Animation on mount
                "animate-slide-up",
                // Dragging state
                isDragging && "!opacity-50 scale-105 shadow-2xl shadow-zark/20 ring-2 ring-zark rotate-2",
                // Priority ring for urgent
                priority.ring
            )}
            // Stagger animation delay based on index
            // @ts-ignore
            style={{ ...style, animationDelay: `${index * 0.05}s` }}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Header with Client */}
            {task.assignee && (
                <div className="flex items-center gap-2 mb-3 relative z-10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                        Client:
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate">
                        {task.assignee.full_name || "Sem nome"}
                    </span>
                </div>
            )}

            {/* Title */}
            <h4 className="font-bold text-foreground mb-3 line-clamp-2 text-[15px] leading-tight relative z-10 group-hover:text-zark transition-colors">
                {task.title}
            </h4>

            {/* Metadata row */}
            <div className="space-y-2 relative z-10">
                {/* Task ID */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                    <Hash className="h-3 w-3 text-muted-foreground/50" />
                    <span className="font-mono tracking-tight">
                        XJ-{task.id.slice(0, 7).toUpperCase()}
                    </span>
                </div>

                {/* Date */}
                {task.due_date && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs",
                        isOverdue ? "text-red-400" : "text-muted-foreground/80"
                    )}>
                        <Calendar className={cn(
                            "h-3 w-3",
                            isOverdue ? "text-red-400/70" : "text-muted-foreground/50"
                        )} />
                        <span className="font-medium">{formatDate(task.due_date)}</span>
                    </div>
                )}

                {/* Time */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <span>10:00 AM - 2:00 PM</span>
                </div>
            </div>

            {/* Tags / Labels */}
            <div className="flex flex-wrap gap-1.5 mt-4 relative z-10">
                <Badge
                    variant="outline"
                    className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide border px-2 py-0.5",
                        priority.bg,
                        priority.color
                    )}
                >
                    {priority.icon && <span className="mr-1">{priority.icon}</span>}
                    {priority.label}
                </Badge>

                {/* Additional tags */}
                {task.description && (
                    <Badge
                        variant="outline"
                        className="text-[10px] font-medium bg-purple-500/10 text-purple-400 border-purple-500/20 px-2 py-0.5"
                    >
                        📝 Detalhes
                    </Badge>
                )}

                {isOverdue && (
                    <Badge
                        variant="outline"
                        className="text-[10px] font-medium bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0.5"
                    >
                        ⚠️ Atrasada
                    </Badge>
                )}

                {/* Add tag button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full bg-muted/30 hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="text-xs text-muted-foreground">+</span>
                </Button>
            </div>

            {/* Context Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute top-3 right-3 h-7 w-7 rounded-lg",
                            "opacity-0 group-hover:opacity-100 transition-all",
                            "bg-muted/50 hover:bg-muted border border-transparent hover:border-border/50"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-48 bg-popover/95 backdrop-blur-xl border-border/50"
                >
                    <DropdownMenuItem className="cursor-pointer">
                        ✏️ Editar tarefa
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        📋 Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        ➡️ Mover para...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                        🗑️ Arquivar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zark/5 to-transparent" />
            </div>
        </div>
    );
}
