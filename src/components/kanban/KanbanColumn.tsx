"use client";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MoreHorizontal, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { Column, Task } from "@/types";

interface KanbanColumnProps {
    column: Column;
    tasks: Task[];
    onAddTask?: () => void;
    onCardClick?: (task: Task) => void;
    index?: number;
}

const columnThemes: Record<string, {
    dot: string;
    header: string;
    glow: string;
}> = {
    new: {
        dot: "bg-slate-400",
        header: "from-slate-500/20",
        glow: "group-hover:shadow-slate-500/10"
    },
    waiting: {
        dot: "bg-amber-400",
        header: "from-amber-500/20",
        glow: "group-hover:shadow-amber-500/10"
    },
    approved: {
        dot: "bg-blue-400",
        header: "from-blue-500/20",
        glow: "group-hover:shadow-blue-500/10"
    },
    active: {
        dot: "bg-emerald-400",
        header: "from-emerald-500/20",
        glow: "group-hover:shadow-emerald-500/10"
    },
    review: {
        dot: "bg-purple-400",
        header: "from-purple-500/20",
        glow: "group-hover:shadow-purple-500/10"
    },
    done: {
        dot: "bg-green-400",
        header: "from-green-500/20",
        glow: "group-hover:shadow-green-500/10"
    },
};

function getColumnTheme(name: string) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('new') || lowerName.includes('backlog')) return columnThemes.new;
    if (lowerName.includes('waiting') || lowerName.includes('fazer')) return columnThemes.waiting;
    if (lowerName.includes('approved') || lowerName.includes('aprovad')) return columnThemes.approved;
    if (lowerName.includes('active') || lowerName.includes('execut') || lowerName.includes('progress')) return columnThemes.active;
    if (lowerName.includes('review') || lowerName.includes('revis')) return columnThemes.review;
    if (lowerName.includes('done') || lowerName.includes('finaliz') || lowerName.includes('conclu')) return columnThemes.done;
    return columnThemes.new;
}

export function KanbanColumn({
    column,
    tasks,
    onAddTask,
    onCardClick,
    index = 0,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    const theme = getColumnTheme(column.name);
    const isAtWipLimit = column.wip_limit && tasks.length >= column.wip_limit;

    return (
        <div
            className={cn(
                // Base
                "group flex flex-col w-80 min-w-80",
                // Appearance
                "rounded-2xl",
                "bg-gradient-to-b from-muted/40 to-muted/20",
                "border border-border/30",
                // Animation on mount
                "animate-slide-in-right",
                // Hover
                "transition-all duration-300",
                theme.glow,
                // Drop target
                isOver && "ring-2 ring-zark/50 border-zark/30 scale-[1.01] shadow-lg shadow-zark/10"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* Column Header */}
            <div className={cn(
                "flex items-center justify-between p-4",
                "border-b border-border/20",
                "bg-gradient-to-r to-transparent",
                theme.header
            )}>
                <div className="flex items-center gap-3">
                    {/* Status dot with pulse for active */}
                    <div className="relative">
                        <div className={cn("w-2.5 h-2.5 rounded-full", theme.dot)} />
                        {column.name.toLowerCase().includes('active') && (
                            <div className={cn(
                                "absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping",
                                theme.dot,
                                "opacity-50"
                            )} />
                        )}
                    </div>

                    {/* Column name */}
                    <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/90">
                        {column.name}
                    </h3>

                    {/* Task count */}
                    <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        "bg-muted/60 text-muted-foreground",
                        isAtWipLimit && "bg-red-500/20 text-red-400"
                    )}>
                        {tasks.length}
                    </span>

                    {/* WIP limit warning */}
                    {isAtWipLimit && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            WIP LIMIT
                        </span>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-xl">
                        <DropdownMenuItem className="cursor-pointer">
                            ✏️ Renomear coluna
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            ⚡ Editar limite WIP
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            ➡️ Mover todas tarefas
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-destructive">
                            🗑️ Excluir coluna
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Cards Container */}
            <ScrollArea className="flex-1 p-3">
                <div
                    ref={setNodeRef}
                    className="space-y-3 min-h-[200px]"
                >
                    <SortableContext
                        items={tasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.map((task, taskIndex) => (
                            <KanbanCard
                                key={task.id}
                                task={task}
                                index={taskIndex}
                                onClick={() => onCardClick?.(task)}
                            />
                        ))}
                    </SortableContext>

                    {/* Empty state */}
                    {tasks.length === 0 && (
                        <div className={cn(
                            "flex flex-col items-center justify-center py-12 px-4",
                            "border-2 border-dashed border-border/30 rounded-xl",
                            "text-muted-foreground/50",
                            "transition-all duration-300",
                            isOver && "border-zark/30 bg-zark/5"
                        )}>
                            <Sparkles className="h-8 w-8 mb-3 opacity-30" />
                            <p className="text-sm font-medium">Arraste tarefas aqui</p>
                            <p className="text-xs mt-1">ou crie uma nova</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Add Task Button */}
            <div className="p-3 pt-0">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-center gap-2",
                        "text-muted-foreground/70 hover:text-foreground",
                        "border border-dashed border-border/30 hover:border-zark/30",
                        "rounded-xl h-10",
                        "transition-all duration-300",
                        "hover:bg-zark/5"
                    )}
                    onClick={onAddTask}
                >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Nova tarefa</span>
                </Button>
            </div>
        </div>
    );
}
