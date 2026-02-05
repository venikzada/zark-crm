"use client";

import {
    CheckCircle2,
    Clock,
    TrendingUp,
    ArrowUpRight,
    Zap,
    Target,
    MoreHorizontal,
    Calendar,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock Data
const stats = {
    weeklyFocus: 82, // percentage
    completedTasks: 24,
    totalTasks: 32,
    productivityScore: 94,
};

const tasks = [
    {
        id: "1",
        title: "Finalizar Landing Page",
        client: "Cliente ABC",
        status: "doing",
        priority: "high",
        due: "Hoje, 14:00",
        avatar: "https://github.com/shadcn.png",
    },
    {
        id: "2",
        title: "Aprovação de Campanha",
        client: "Cliente XYZ",
        status: "waiting",
        priority: "normal",
        due: "Amanhã",
        avatar: null,
    },
    {
        id: "3",
        title: "Relatório Mensal SEO",
        client: "ZARK Internal",
        status: "todo",
        priority: "high",
        due: "Sex, 18:00",
        avatar: null,
    },
    {
        id: "4",
        title: "Reunião de Kick-off",
        client: "Novo Projeto",
        status: "todo",
        priority: "normal",
        due: "Segunda",
        avatar: "https://github.com/vercel.png",
    },
];

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-10 font-sans selection:bg-zark/30">
            {/* Header / Hero Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-zark/20 ring-4 ring-black">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>RK</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Renan Kennedy <span className="text-muted-foreground font-normal">👋</span>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Quarta-feira, 04 de Fevereiro • <span className="text-zark font-medium">Foco Total</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-secondary/50 rounded-full px-4 py-2 flex items-center gap-2 border border-border">
                        <Zap className="w-4 h-4 text-zark fill-zark" />
                        <span className="text-sm font-medium text-foreground">Mode Foco: Ativo</span>
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-full h-10 w-10 p-0 border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                        <Calendar className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Asymmetric Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Main Stats & focus (7 cols) */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Hero Stat Card */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-card border border-border p-8 group transition-colors hover:border-zark/30">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="w-48 h-48 text-zark rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="flex h-2 w-2 rounded-full bg-zark animate-pulse" />
                                <span className="text-sm font-medium text-muted-foreground">Produtividade Semanal</span>
                            </div>

                            <div className="flex items-end gap-4 mb-4">
                                <span className="text-8xl font-black tracking-tighter text-foreground">
                                    {stats.productivityScore}
                                </span>
                                <span className="text-xl font-medium text-muted-foreground mb-4">/100</span>
                            </div>

                            <div className="h-32 flex items-end gap-1 w-full max-w-sm mb-6">
                                {[40, 65, 45, 80, 55, 90, stats.productivityScore].map((h, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 bg-secondary rounded-t-sm transition-all duration-500 group-hover:bg-secondary/80",
                                            i === 6 && "bg-zark"
                                        )}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>

                            <p className="text-muted-foreground max-w-md">
                                Você está <span className="text-foreground font-bold">12% acima</span> da sua média.
                                Mantenha o ritmo para bater a meta mensal.
                            </p>
                        </div>
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-[1.5rem] bg-card/50 border border-border p-6 flex flex-col justify-between hover:bg-card transition-colors">
                            <div className="flex justify-between items-start">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                <span className="text-xs font-mono text-muted-foreground">+4 hoje</span>
                            </div>
                            <div>
                                <span className="text-3xl font-bold text-foreground block mt-4">{stats.completedTasks}</span>
                                <span className="text-muted-foreground text-sm">Tarefas Concluídas</span>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] bg-card/50 border border-border p-6 flex flex-col justify-between hover:bg-card transition-colors">
                            <div className="flex justify-between items-start">
                                <Clock className="w-6 h-6 text-orange-400" />
                                <span className="text-xs font-mono text-muted-foreground">2h restantes</span>
                            </div>
                            <div>
                                <span className="text-3xl font-bold text-foreground block mt-4">{stats.weeklyFocus}%</span>
                                <span className="text-muted-foreground text-sm">Meta de Foco</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Task Stream (5 cols) */}
                <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-zark" />
                            <h2 className="text-lg font-bold tracking-tight">Fluxo de Hoje</h2>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-accent">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>

                    <div className="space-y-3 flex-1 overflow-auto pr-2">
                        {tasks.map((task, i) => (
                            <div
                                key={task.id}
                                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent transition-all cursor-pointer"
                            >
                                {/* Priority Indicator */}
                                <div className={cn(
                                    "absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all group-hover:w-1.5",
                                    task.priority === 'high' ? "bg-orange-500" : "bg-muted"
                                )} />

                                <div className="pl-2">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                        task.status === 'done' ? "bg-zark border-zark" : "border-muted group-hover:border-zark"
                                    )}>
                                        {task.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "font-semibold text-sm truncate transition-colors",
                                        task.status === 'done' ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                                    )}>
                                        {task.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                        {task.client}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-transparent">
                                        {task.due}
                                    </span>
                                    {task.avatar && (
                                        <Avatar className="w-5 h-5 border border-background mt-1">
                                            <AvatarImage src={task.avatar} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 bg-background shadow-xl"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="ghost"
                            className="w-full py-6 text-muted-foreground hover:text-foreground hover:bg-accent border border-dashed border-border rounded-2xl group"
                        >
                            <span className="group-hover:scale-105 transition-transform">+ Adicionar Nova Tarefa</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}
