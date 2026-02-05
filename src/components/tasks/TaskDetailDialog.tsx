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
    CheckCircle2,
    Flag,
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
    urgent: { label: "Urgente", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

// Add Status Config
const statusConfig = {
    "todo": { label: "A Fazer", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
    "in_progress": { label: "Em Progresso", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    "review": { label: "Em Revisão", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    "done": { label: "Concluído", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
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

    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
    // Mock status for now since it's on the column, not the task directly in this simplistic view
    // In a real app we'd derive this from column_id
    const status = statusConfig["todo"]; // Defaulting to todo for UI demo purposes

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
            <DialogContent className="sm:max-w-7xl w-full h-[calc(100vh-2rem)] p-0 bg-[#09090b] border-[#1f1f23] overflow-hidden flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-[#1f1f23] flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">

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

                {/* Content - Dual Pane Layout */}
                <div className="flex flex-1 overflow-hidden min-h-0 bg-zinc-950">
                    {/* Main Content - Left Pane */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                        <div className="max-w-3xl space-y-8">
                            {/* Header Section in Main Content */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={cn("text-xs font-mono uppercase tracking-wider bg-transparent border-zinc-800", priority.color)}>
                                        {priority.label}
                                    </Badge>
                                    <span className="text-xs font-mono text-zinc-600">
                                        #{task.id.slice(0, 7).toUpperCase()}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
                                    {task.title}
                                </h2>
                            </div>
                            <div className="space-y-6 pr-4">
                                {/* Description */}
                                <div className="space-y-4 group">
                                    <label className="text-sm font-semibold text-zinc-500 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                                        <AlertCircle className="h-3.5 w-3.5" /> Descrição
                                    </label>
                                    <div className="relative">
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={handleDescriptionBlur}
                                            placeholder="Adicione uma descrição detalhada..."
                                            className="min-h-[120px] bg-transparent border-zinc-800/50 hover:border-zinc-700 text-zinc-300 resize-none focus:border-zinc-600 focus:ring-0 p-0 text-base leading-relaxed placeholder:text-zinc-700 transition-colors"
                                        />
                                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-zinc-600 font-mono">Markdown supported</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-zinc-500 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                                            <CheckSquare className="h-3.5 w-3.5" /> Checklist
                                        </label>
                                        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
                                            {completedCount}/{checklist.length} concluídos
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-500 ease-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>

                                    {/* Checklist items */}
                                    <div className="space-y-2">
                                        {checklist.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-3 p-3 rounded-md bg-zinc-900/20 border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40 transition-all group"
                                            >
                                                <div className="pt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.is_completed}
                                                        onChange={() => handleToggleChecklistItem(item.id, item.is_completed)}
                                                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900/50 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all border-2 checked:bg-white checked:border-white"
                                                    />
                                                </div>
                                                <span
                                                    className={cn(
                                                        "flex-1 text-sm transition-colors",
                                                        item.is_completed
                                                            ? "text-zinc-600 line-through"
                                                            : "text-zinc-300"
                                                    )}
                                                >
                                                    {item.content}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteChecklistItem(item.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add new item */}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                value={newChecklistItem}
                                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                                placeholder="Adicionar item..."
                                                className="bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-0"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddChecklistItem();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddChecklistItem}
                                            variant="outline"
                                            size="icon"
                                            className="bg-zinc-900 border-zinc-800 hover:bg-white hover:text-black transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Comments */}
                                <div className="space-y-6 pt-6 border-t border-zinc-800/50">
                                    <label className="text-sm font-semibold text-zinc-500 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                                        <MessageSquare className="h-3.5 w-3.5" /> Comentários ({comments.length})
                                    </label>

                                    {/* Comment list */}
                                    <div className="space-y-6">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-4 group">
                                                <Avatar className="h-8 w-8 border border-zinc-800 shrink-0">
                                                    <AvatarImage src={comment.user?.avatar_url || "https://github.com/shadcn.png"} />
                                                    <AvatarFallback className="bg-zinc-900 text-zinc-500 text-[10px]">
                                                        {comment.user?.full_name?.[0] || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-zinc-200">
                                                            {comment.user?.full_name || comment.user?.email || "Usuário"}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600">
                                                            {new Date(comment.created_at).toLocaleString('pt-BR', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add comment */}
                                    <div className="flex gap-3 pt-2">
                                        <Avatar className="h-8 w-8 border border-zinc-800 shrink-0 opacity-50">
                                            <AvatarImage src="https://github.com/shadcn.png" />
                                            <AvatarFallback className="bg-zinc-900 text-zinc-500 text-[10px]">
                                                RK
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-2">
                                            <Textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Escreva um comentário..."
                                                className="min-h-[80px] bg-zinc-900/30 border-zinc-800 text-zinc-300 resize-none focus:border-zinc-700 focus:bg-zinc-900/50 focus:ring-0 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault();
                                                        handleAddComment();
                                                    }
                                                }}
                                            />
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleAddComment}
                                                    size="sm"
                                                    className="bg-white text-black hover:bg-zinc-200 transition-colors font-medium px-4"
                                                    disabled={!newComment.trim()}
                                                >
                                                    Comentar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Pane - Sidebar */}
                    <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {/* Status Section */}
                            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3" /> Status
                            </label>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto py-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 transition-all group"
                            >
                                <Badge
                                    variant="outline"
                                    className={cn("text-xs font-mono uppercase tracking-wider bg-transparent border-zinc-800", status.color)}
                                >
                                    {status.label}
                                </Badge>
                                <span className="flex-1 text-sm font-medium group-hover:text-white transition-colors">
                                    {status.label}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
                            </Button>
                        </div>

                        <Separator className="bg-zinc-800/50" />

                        {/* Priority Section */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Flag className="h-3 w-3" /> Prioridade
                            </label>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto py-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 transition-all group"
                            >
                                <Badge
                                    variant="outline"
                                    className={cn("text-xs font-mono uppercase tracking-wider bg-transparent border-zinc-800", priority.color)}
                                >
                                    {priority.label}
                                </Badge>
                                <span className="flex-1 text-sm font-medium group-hover:text-white transition-colors">
                                    {priority.label}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
                            </Button>
                        </div>

                        <Separator className="bg-zinc-800/50" />

                        {/* Assignee Section */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-3 w-3" /> Responsável
                            </label>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto py-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 transition-all group"
                            >
                                <Avatar className="h-6 w-6 border border-zinc-700">
                                    <AvatarImage src={task.assignee?.avatar_url || "https://github.com/shadcn.png"} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px]">
                                        {task.assignee?.full_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="flex-1 text-sm font-medium group-hover:text-white transition-colors">
                                    {task.assignee?.full_name || "Sem responsável"}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
                            </Button>
                        </div>

                        <Separator className="bg-zinc-800/50" />

                        {/* Due Date Section */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Data de Entrega
                            </label>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto py-2.5 bg-transparent border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/30 text-zinc-300 font-mono text-sm transition-all group"
                            >
                                <span className="flex-1 text-left">
                                    {task.due_date
                                        ? new Date(task.due_date).toLocaleDateString("pt-BR")
                                        : "Sem data"}
                                </span>
                                <Calendar className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
                            </Button>
                        </div>

                        {/* Time Spent Section */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Tempo Gasto
                            </label>
                            <div className="flex items-center gap-3 p-3 rounded-md border border-zinc-800 bg-zinc-900/30">
                                <div className="h-8 w-8 rounded flex items-center justify-center bg-zinc-800/50 text-zinc-400">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-mono font-medium text-white">
                                        {Math.floor(task.time_spent / 60)}h {task.time_spent % 60}m
                                    </div>
                                    <div className="text-[10px] text-zinc-500">Total registrado</div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Paperclip className="h-3 w-3" /> Anexos
                                </label>
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">0</span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-dashed border-zinc-700/50 bg-transparent hover:bg-zinc-800/30 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 h-20 flex flex-col gap-1 items-center justify-center transition-all"
                            >
                                <Plus className="h-4 w-4 mb-1" />
                                <span className="text-xs">Adicionar arquivo</span>
                            </Button>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-8 mt-auto space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            >
                                <Archive className="h-4 w-4" /> Arquivar Tarefa
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-red-900/60 hover:text-red-400 hover:bg-red-950/20"
                            >
                                <Trash2 className="h-4 w-4" /> Excluir Tarefa
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
}
