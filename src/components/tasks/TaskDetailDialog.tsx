"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    X,
    Calendar,
    Clock,
    User,
    AlertCircle,
    Paperclip,
    MessageSquare,
    CheckSquare,
    MoreHorizontal,
    Trash2,
    Copy,
    MoveRight,
    Archive,
    Plus,
    Send,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { useChecklistItems, useComments, useTasks } from "@/hooks/use-supabase";
import { toast } from "sonner";

interface TaskDetailDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const priorityConfig = {
    low: { label: "Baixa", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    medium: { label: "Média", color: "text-blue-400", bg: "bg-blue-500/10" },
    high: { label: "Alta", color: "text-amber-400", bg: "bg-amber-500/10" },
    urgent: { label: "Urgente", color: "text-red-400", bg: "bg-red-500/10" },
};

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
    const [description, setDescription] = useState(task?.description || "");
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [newComment, setNewComment] = useState("");

    // Real Supabase hooks
    const { items: checklist, createItem, toggleItem, deleteItem } = useChecklistItems(task?.id || null);
    const { comments, createComment, deleteComment } = useComments(task?.id || null);
    const { updateTask } = useTasks(task?.list_id || null);

    // Update description state when task changes
    useEffect(() => {
        setDescription(task?.description || "");
    }, [task?.id]);

    if (!task) return null;

    const priority = priorityConfig[task.priority] || priorityConfig.medium;

    const handleToggleChecklistItem = async (id: string, currentStatus: boolean) => {
        const result = await toggleItem(id, !currentStatus);
        if (!result) {
            toast.error("Erro ao atualizar item do checklist");
        }
    };

    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;
        const result = await createItem(newChecklistItem);
        if (result) {
            setNewChecklistItem("");
            toast.success("Item adicionado!");
        } else {
            toast.error("Erro ao adicionar item");
        }
    };

    const handleDeleteChecklistItem = async (id: string) => {
        const result = await deleteItem(id);
        if (!result) {
            toast.error("Erro ao excluir item");
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const result = await createComment(newComment);
        if (result) {
            setNewComment("");
            toast.success("Comentário adicionado!");
        } else {
            toast.error("Erro ao adicionar comentário");
        }
    };

    const handleDescriptionBlur = async () => {
        if (description === task.description) return; // No change
        const result = await updateTask(task.id, { description });
        if (result) {
            toast.success("Descrição atualizada!");
        } else {
            toast.error("Erro ao salvar descrição");
        }
    };

    const completedCount = checklist.filter((item) => item.is_completed).length;
    const progressPercentage = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] p-0 bg-[#09090b] border-[#1f1f23] overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-[#1f1f23] flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-zinc-500">
                                    #{task.id.slice(0, 7).toUpperCase()}
                                </span>
                                <Badge className={cn("text-xs", priority.bg, priority.color)}>
                                    {priority.label}
                                </Badge>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white pr-8">
                                {task.title}
                            </DialogTitle>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#09090b] border-[#1f1f23]">
                                <DropdownMenuItem className="cursor-pointer">
                                    <Copy className="mr-2 h-4 w-4" /> Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <MoveRight className="mr-2 h-4 w-4" /> Mover para...
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Archive className="mr-2 h-4 w-4" /> Arquivar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-red-400">
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content */}
                    <ScrollArea className="flex-1 px-6 py-6">
                        <div className="space-y-6 pr-4">
                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Descrição
                                </label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleDescriptionBlur}
                                    placeholder="Adicione uma descrição detalhada..."
                                    className="min-h-[120px] bg-zinc-900/50 border-zinc-800 text-white resize-none focus:border-zark/50"
                                />
                            </div>

                            {/* Checklist */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4" /> Checklist
                                    </label>
                                    <span className="text-xs text-zinc-500">
                                        {completedCount}/{checklist.length} concluídos
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-zark to-orange-600 transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>

                                {/* Checklist items */}
                                <div className="space-y-2">
                                    {checklist.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={item.is_completed}
                                                onChange={() => handleToggleChecklistItem(item.id, item.is_completed)}
                                                className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zark focus:ring-zark focus:ring-offset-0 cursor-pointer"
                                            />
                                            <span
                                                className={cn(
                                                    "flex-1 text-sm",
                                                    item.is_completed
                                                        ? "text-zinc-500 line-through"
                                                        : "text-zinc-200"
                                                )}
                                            >
                                                {item.content}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
                                                onClick={() => handleDeleteChecklistItem(item.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add new item */}
                                <div className="flex gap-2">
                                    <Input
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        placeholder="Adicionar item..."
                                        className="bg-zinc-900/50 border-zinc-800 text-white focus:border-zark/50"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddChecklistItem();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleAddChecklistItem}
                                        className="bg-zark hover:bg-zark/90 text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" /> Comentários ({comments.length})
                                </label>

                                {/* Comment list */}
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="h-8 w-8 border-2 border-zinc-900">
                                                <AvatarImage src={comment.user?.avatar_url || "https://github.com/shadcn.png"} />
                                                <AvatarFallback className="bg-zinc-800 text-white text-xs">
                                                    {comment.user?.full_name?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-white">
                                                        {comment.user?.full_name || comment.user?.email || "Usuário"}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(comment.created_at).toLocaleString('pt-BR', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-300 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add comment */}
                                <div className="flex gap-2">
                                    <Avatar className="h-8 w-8 border-2 border-zinc-900">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback className="bg-zinc-800 text-white text-xs">
                                            V
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-2">
                                        <Textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Adicionar comentário..."
                                            className="min-h-[80px] bg-zinc-900/50 border-zinc-800 text-white resize-none focus:border-zark/50"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                                    e.preventDefault();
                                                    handleAddComment();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleAddComment}
                                            className="bg-zark hover:bg-zark/90 text-white h-10"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Sidebar */}
                    <div className="w-80 border-l border-[#1f1f23] bg-zinc-950/50 p-6 space-y-6 overflow-y-auto flex-shrink-0">
                        {/* Assignee */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-3 w-3" /> Responsável
                            </label>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-white"
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback className="bg-zinc-800 text-white text-xs">
                                        RK
                                    </AvatarFallback>
                                </Avatar>
                                <span className="flex-1 text-left">
                                    {task.assignee?.full_name || "Sem responsável"}
                                </span>
                                <ChevronDown className="h-4 w-4 text-zinc-500" />
                            </Button>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Data de Entrega
                            </label>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-white"
                            >
                                <Calendar className="h-4 w-4 text-zinc-500" />
                                <span className="flex-1 text-left">
                                    {task.due_date
                                        ? new Date(task.due_date).toLocaleDateString("pt-BR")
                                        : "Sem data"}
                                </span>
                                <ChevronDown className="h-4 w-4 text-zinc-500" />
                            </Button>
                        </div>

                        {/* Time Spent */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Tempo Gasto
                            </label>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                <div className="text-2xl font-bold text-white">
                                    {Math.floor(task.time_spent / 60)}h {task.time_spent % 60}m
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">Total registrado</div>
                            </div>
                        </div>

                        <Separator className="bg-zinc-800" />

                        {/* Attachments */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Paperclip className="h-3 w-3" /> Anexos (0)
                            </label>
                            <Button
                                variant="outline"
                                className="w-full bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Adicionar arquivo
                            </Button>
                        </div>

                        <Separator className="bg-zinc-800" />

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-white"
                            >
                                <Archive className="mr-2 h-4 w-4" /> Arquivar Tarefa
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start border-red-900/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Tarefa
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
