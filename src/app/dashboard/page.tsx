"use client";

import {
    CheckCircle2,
    Clock,
    ListTodo,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    MoreVertical,
    Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Mock data for dashboard
const stats = [
    {
        title: "Tarefas Concluídas",
        value: "24",
        change: "+12%",
        trend: "up",
        icon: CheckCircle2,
        color: "#22c55e",
    },
    {
        title: "Em Progresso",
        value: "8",
        change: "+3",
        trend: "up",
        icon: Play,
        color: "#f56f10",
    },
    {
        title: "Pendentes",
        value: "15",
        change: "-5%",
        trend: "down",
        icon: ListTodo,
        color: "#3b82f6",
    },
    {
        title: "Tempo Focado",
        value: "12h 30m",
        change: "+2h",
        trend: "up",
        icon: Clock,
        color: "#a855f7",
    },
];

const recentTasks = [
    {
        id: "1",
        title: "Finalizar landing page",
        space: "Cliente ABC",
        priority: "high",
        status: "in_progress",
        assignee: { name: "Renan", avatar: null },
        dueDate: "Hoje",
    },
    {
        id: "2",
        title: "Configurar campanha Google Ads",
        space: "Cliente XYZ",
        priority: "medium",
        status: "todo",
        assignee: { name: "Ana", avatar: null },
        dueDate: "Amanhã",
    },
    {
        id: "3",
        title: "Revisar relatório mensal",
        space: "ZARK Internal",
        priority: "low",
        status: "review",
        assignee: { name: "Carlos", avatar: null },
        dueDate: "Sexta",
    },
    {
        id: "4",
        title: "Atualizar posts redes sociais",
        space: "Cliente ABC",
        priority: "medium",
        status: "todo",
        assignee: { name: "Julia", avatar: null },
        dueDate: "Hoje",
    },
];

const priorityColors: Record<string, string> = {
    low: "bg-blue-500/20 text-blue-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    high: "bg-orange-500/20 text-orange-400",
    urgent: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
    todo: "A Fazer",
    in_progress: "Executando",
    review: "Revisão",
    done: "Concluído",
};

export default function DashboardPage() {
    const dailyProgress = 65; // Percentage of daily tasks completed

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Olá, <span className="gradient-text">Renan</span>! 👋
                    </h2>
                    <p className="text-muted-foreground">
                        Você tem <span className="text-zark font-semibold">8 tarefas</span> para
                        hoje. Vamos focar?
                    </p>
                </div>

                {/* Daily Progress */}
                <Card className="w-full md:w-80 glass border-zark/20">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Progresso do dia</p>
                            <Progress value={dailyProgress} className="h-2" />
                        </div>
                        <span className="text-2xl font-bold text-zark">{dailyProgress}%</span>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="glass border-border/50 hover:border-zark/30 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon
                                className="h-5 w-5"
                                style={{ color: stat.color }}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{stat.value}</span>
                                <span
                                    className={`flex items-center text-xs ${stat.trend === "up" ? "text-green-500" : "text-red-500"
                                        }`}
                                >
                                    {stat.trend === "up" ? (
                                        <ArrowUp className="h-3 w-3 mr-0.5" />
                                    ) : (
                                        <ArrowDown className="h-3 w-3 mr-0.5" />
                                    )}
                                    {stat.change}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Tasks */}
            <Card className="glass border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-zark" />
                        Tarefas Recentes
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-zark">
                        Ver todas
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentTasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={task.assignee.avatar || undefined} />
                                        <AvatarFallback className="text-xs bg-zark/20 text-zark">
                                            {task.assignee.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">{task.space}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={priorityColors[task.priority]}
                                    >
                                        {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        {task.dueDate}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
