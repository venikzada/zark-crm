"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Filter,
    Table,
    Kanban,
    GanttChart,
    UserPlus,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/kanban";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import type { Column, Task } from "@/types";

// Real Supabase IDs from seed-demo-data.sql
const mockColumns: Column[] = [
    {
        id: "c3d4e5f6-a789-4901-c234-56789abcdef0", // Real NEW column ID
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef", // Real list ID
        name: "NEW",
        color: "#6B7280",
        position: 0,
        wip_limit: null,
        created_at: new Date().toISOString()
    },
    {
        id: "d4e5f6a7-8901-4a12-d345-6789abcdef01", // Real WAITING column ID
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        name: "WAITING",
        color: "#EAB308",
        position: 1,
        wip_limit: null,
        created_at: new Date().toISOString()
    },
    {
        id: "e5f6a789-0123-4b23-e456-789abcdef012", // Real APPROVED column ID
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        name: "APPROVED",
        color: "#3B82F6",
        position: 2,
        wip_limit: null,
        created_at: new Date().toISOString()
    },
];

const mockTasks: Task[] = [
    {
        id: "f6a78901-2345-4c34-f567-89abcdef0123", // Real Table B24 ID
        column_id: "c3d4e5f6-a789-4901-c234-56789abcdef0", // NEW column
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef", // Real list ID
        title: "Table B24",
        description: "Room preparation needed for the VIP client meeting. Ensure all equipment is functioning properly.",
        priority: "urgent",
        due_date: "2025-09-27",
        assignee_id: "user1",
        created_by: "", // Empty string because no authenticated user
        position: 0,
        time_spent: 45,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { id: "user1", email: "kretov@email.com", full_name: "Kretov Mikhail Ilyich", avatar_url: null, role: "member", created_at: "", updated_at: "" }
    },
    {
        id: "89012345-6789-4e56-9012-abcdef012345", // Real Coworking V223 ID
        column_id: "c3d4e5f6-a789-4901-c234-56789abcdef0", // NEW column
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        title: "Coworking V223",
        description: "Configurar mesa de coworking",
        priority: "medium",
        due_date: "2025-09-27",
        assignee_id: "user2",
        created_by: "", // Empty string because no authenticated user
        position: 1,
        time_spent: 60,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { id: "user2", email: "nikitin@email.com", full_name: "Nikitin Vladislav", avatar_url: null, role: "member", created_at: "", updated_at: "" }
    },
    {
        id: "a7890123-4567-4d45-a678-9abcdef01234", // Real Family table 2 ID
        column_id: "d4e5f6a7-8901-4a12-d345-6789abcdef01", // WAITING column
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        title: "Family table 2",
        description: "Reserva para família de 6 pessoas",
        priority: "high",
        due_date: "2025-09-27",
        assignee_id: "user3",
        created_by: "", // Empty string because no authenticated user
        position: 0,
        time_spent: 30,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { id: "user3", email: "bondar@email.com", full_name: "Bondar Daniil", avatar_url: null, role: "member", created_at: "", updated_at: "" }
    },
    {
        id: "task4",
        column_id: "d4e5f6a7-8901-4a12-d345-6789abcdef01", // WAITING column (updated)
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        title: "Table C23",
        description: null,
        priority: "urgent",
        due_date: "2025-09-28",
        assignee_id: "user4",
        created_by: "user1",
        position: 1,
        time_spent: 30,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { id: "user4", email: "evgen@email.com", full_name: "Evgen Solomin", avatar_url: null, role: "member", created_at: "", updated_at: "" }
    },
    {
        id: "task5",
        column_id: "e5f6a789-0123-4b23-e456-789abcdef012", // APPROVED column
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        title: "VIP zone",
        description: "Training session",
        priority: "medium",
        due_date: "2025-09-28",
        assignee_id: "user5",
        created_by: "user1",
        position: 0,
        time_spent: 60,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { id: "user5", email: "botkin@email.com", full_name: "Botkin Nikita", avatar_url: null, role: "member", created_at: "", updated_at: "" }
    },
    {
        id: "task6",
        column_id: "e5f6a789-0123-4b23-e456-789abcdef012", // APPROVED column  
        list_id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
        title: "Meeting room A228",
        description: "Problematic request",
        priority: "high",
        due_date: "2025-09-28",
        assignee_id: "user6",
        created_by: "user1",
        position: 1,
        time_spent: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { id: "user6", email: "spiridonov@email.com", full_name: "Spiridonov Mikhail", avatar_url: null, role: "member", created_at: "", updated_at: "" }
    },
];

// Generate week days
function getWeekDays(centerDate: Date) {
    const days = [];
    const startOfWeek = new Date(centerDate);
    startOfWeek.setDate(centerDate.getDate() - 3);

    for (let i = 0; i < 14; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push({
            date,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: date.getDate(),
            isToday: date.toDateString() === new Date().toDateString(),
        });
    }
    return days;
}

export default function SpacePage() {
    const params = useParams();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<"table" | "kanban" | "gantt">("kanban");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const weekDays = getWeekDays(selectedDate);

    const handlePrevWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Booking Requests</h1>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 text-white border-zinc-700 hover:bg-zinc-800">
                        <UserPlus className="h-4 w-4" />
                        New Client
                    </Button>
                    <Button className="gap-2 bg-zark hover:bg-zark-dark">
                        <Plus className="h-4 w-4" />
                        Create Request
                    </Button>
                </div>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-1">
                    {weekDays.map((day, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedDate(day.date)}
                            className={cn(
                                "flex flex-col items-center min-w-12 px-3 py-2 rounded-lg transition-all duration-200",
                                day.isToday && "bg-zark text-white shadow-lg shadow-zark/30",
                                selectedDate.toDateString() === day.date.toDateString() && !day.isToday && "bg-muted ring-2 ring-zark/30",
                                !day.isToday && selectedDate.toDateString() !== day.date.toDateString() && "hover:bg-muted/50"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium",
                                day.isToday ? "text-white/80" : "text-zinc-400"
                            )}>
                                {day.dayName}
                            </span>
                            <span className={cn(
                                "text-lg font-semibold",
                                day.isToday ? "text-white" : "text-zinc-200"
                            )}>
                                {day.dayNum}
                            </span>
                        </button>
                    ))}
                </div>

                <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* View Tabs & Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                    <TabsList className="bg-muted/50">
                        <TabsTrigger value="table" className="gap-2">
                            <Table className="h-4 w-4" />
                            Table
                        </TabsTrigger>
                        <TabsTrigger value="kanban" className="gap-2">
                            <Kanban className="h-4 w-4" />
                            Kanban
                        </TabsTrigger>
                        <TabsTrigger value="gantt" className="gap-2">
                            <GanttChart className="h-4 w-4" />
                            Gantt
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64 bg-muted/50"
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            {view === "kanban" && (
                <KanbanBoard
                    columns={mockColumns}
                    tasks={mockTasks}
                    onTaskClick={handleTaskClick}
                    onAddTask={(columnId) => console.log("Add task to column:", columnId)}
                    onTaskMove={(taskId, columnId, position) =>
                        console.log("Move task:", taskId, "to column:", columnId, "at position:", position)
                    }
                />
            )}

            {view === "table" && (
                <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                    Visualização em tabela (em breve)
                </div>
            )}

            {view === "gantt" && (
                <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                    Visualização Gantt (em breve)
                </div>
            )}

            {/* Task Detail Modal */}
            <TaskDetailDialog
                task={selectedTask}
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setSelectedTask(null);
                }}
            />
        </div>
    );
}
