"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    X,
    Calendar,
    Clock,
    User,
    MessageSquare,
    Paperclip,
    CheckSquare,
    MoreHorizontal,
    Send,
    Plus,
    Trash2,
    Timer,
    Play,
    Pause,
    RotateCcw,
    AlertTriangle,
    Zap,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (task: Task) => void;
}

// Mock comments
const mockComments = [
    {
        id: "1",
        user: { name: "Renan Kennedy", avatar: null },
        content: "Precisamos finalizar a preparação da sala antes das 14h.",
        createdAt: new Date("2024-02-10T10:00:00"),
    },
    {
        id: "2",
        user: { name: "Maria Silva", avatar: null },
        content: "Entendido! Já estou organizando os equipamentos.",
        createdAt: new Date("2024-02-10T10:15:00"),
    },
];

// Mock checklist
const mockChecklist = [
    { id: "1", content: "Preparar apresentação", completed: true },
    { id: "2", content: "Testar equipamentos de áudio", completed: true },
    { id: "3", content: "Organizar cadeiras", completed: false },
    { id: "4", content: "Verificar projetor", completed: false },
];

const priorityOptions = [
    { value: "low", label: "Baixa", color: "text-emerald-400", icon: null },
    { value: "medium", label: "Média", color: "text-blue-400", icon: null },
    { value: "high", label: "Alta", color: "text-amber-400", icon: AlertTriangle },
    { value: "urgent", label: "Urgente", color: "text-red-400", icon: Zap },
];

export function TaskDetailModal({
    task,
    isOpen,
    onClose,
    onUpdate,
}: TaskDetailModalProps) {
    const [newComment, setNewComment] = useState("");
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [checklist, setChecklist] = useState(mockChecklist);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [pomodoroMinutes, setPomodoroMinutes] = useState(25);

    if (!task) return null;

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        // TODO: Add comment to Supabase
        console.log("Adding comment:", newComment);
        setNewComment("");
    };

    const handleAddChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        setChecklist([
            ...checklist,
            { id: Date.now().toString(), content: newChecklistItem, completed: false },
        ]);
        setNewChecklistItem("");
    };

    const handleToggleChecklistItem = (id: string) => {
        setChecklist(
            checklist.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const handleDeleteChecklistItem = (id: string) => {
        setChecklist(checklist.filter((item) => item.id !== id));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const completedItems = checklist.filter((item) => item.completed).length;
    const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/50">
                <div className="flex h-full">
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        <DialogHeader className="px-6 py-4 border-b border-border/30">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono">XJ-{task.id.slice(0, 7).toUpperCase()}</span>
                                        <span>•</span>
                                        <span>{task.assignee?.full_name || "Sem responsável"}</span>
                                    </div>
                                    <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Detalhes da tarefa {task.title}, comentários e checklist.
                                    </DialogDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="flex-1 px-6 py-4">
                            <div className="space-y-6">
                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Descrição</Label>
                                    <Textarea
                                        placeholder="Adicione uma descrição..."
                                        defaultValue={task.description || ""}
                                        className="min-h-24 resize-none bg-muted/30 border-border/30"
                                    />
                                </div>

                                {/* Tabs */}
                                <Tabs defaultValue="comments" className="w-full">
                                    <TabsList className="bg-muted/30 w-full justify-start">
                                        <TabsTrigger value="comments" className="gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Comentários
                                        </TabsTrigger>
                                        <TabsTrigger value="checklist" className="gap-2">
                                            <CheckSquare className="h-4 w-4" />
                                            Checklist
                                        </TabsTrigger>
                                        <TabsTrigger value="attachments" className="gap-2">
                                            <Paperclip className="h-4 w-4" />
                                            Anexos
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Comments Tab */}
                                    <TabsContent value="comments" className="mt-4 space-y-4">
                                        {mockComments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={comment.user.avatar || undefined} />
                                                    <AvatarFallback className="bg-zark/20 text-zark text-xs">
                                                        {comment.user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{comment.user.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(comment.createdAt, "HH:mm", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Comment */}
                                        <div className="flex gap-3 pt-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-zark/20 text-zark text-xs">RK</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 flex gap-2">
                                                <Input
                                                    placeholder="Escreva um comentário..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="bg-muted/30 border-border/30"
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                                />
                                                <Button size="icon" onClick={handleAddComment} className="bg-zark hover:bg-zark-dark">
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Checklist Tab */}
                                    <TabsContent value="checklist" className="mt-4 space-y-4">
                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Progresso</span>
                                                <span>{completedItems}/{checklist.length}</span>
                                            </div>
                                            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-zark transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Checklist Items */}
                                        <div className="space-y-2">
                                            {checklist.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 group"
                                                >
                                                    <Checkbox
                                                        checked={item.completed}
                                                        onCheckedChange={() => handleToggleChecklistItem(item.id)}
                                                        className="border-border/50 data-[state=checked]:bg-zark data-[state=checked]:border-zark"
                                                    />
                                                    <span
                                                        className={cn(
                                                            "flex-1 text-sm transition-all",
                                                            item.completed && "line-through text-muted-foreground"
                                                        )}
                                                    >
                                                        {item.content}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Item */}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Adicionar item..."
                                                value={newChecklistItem}
                                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                                className="bg-muted/30 border-border/30"
                                                onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                                            />
                                            <Button onClick={handleAddChecklistItem} variant="outline" size="icon">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    {/* Attachments Tab */}
                                    <TabsContent value="attachments" className="mt-4">
                                        <div className="border-2 border-dashed border-border/30 rounded-xl p-8 text-center">
                                            <Paperclip className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Arraste arquivos aqui ou clique para fazer upload
                                            </p>
                                            <Button variant="outline" size="sm">
                                                Selecionar arquivos
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Sidebar */}
                    <div className="w-72 border-l border-border/30 p-4 space-y-6 bg-muted/10">
                        {/* Priority */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Prioridade
                            </Label>
                            <Select defaultValue={task.priority}>
                                <SelectTrigger className="bg-muted/30 border-border/30">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                {option.icon && <option.icon className={cn("h-3 w-3", option.color)} />}
                                                <span className={option.color}>{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Responsável
                            </Label>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-zark/20 text-zark text-xs">
                                        {task.assignee?.full_name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{task.assignee?.full_name || "Sem responsável"}</span>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Data de entrega
                            </Label>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {task.due_date
                                        ? format(new Date(task.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })
                                        : "Sem data"}
                                </span>
                            </div>
                        </div>

                        <Separator className="border-border/30" />

                        {/* Pomodoro Timer */}
                        <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Timer className="h-3 w-3" />
                                Timer Pomodoro
                            </Label>
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-zark/10 to-zark/5 border border-zark/20">
                                <div className="text-3xl font-mono font-bold text-zark mb-3">
                                    {formatTime(isTimerRunning ? timerSeconds : pomodoroMinutes * 60)}
                                </div>
                                <div className="flex justify-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={isTimerRunning ? "destructive" : "default"}
                                        className={cn(!isTimerRunning && "bg-zark hover:bg-zark-dark")}
                                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    >
                                        {isTimerRunning ? (
                                            <>
                                                <Pause className="h-3 w-3 mr-1" /> Pausar
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-3 w-3 mr-1" /> Iniciar
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setIsTimerRunning(false);
                                            setTimerSeconds(0);
                                        }}
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Time Spent */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Tempo gasto
                            </Label>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{Math.floor((task.time_spent || 0) / 60)}h {(task.time_spent || 0) % 60}m</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
