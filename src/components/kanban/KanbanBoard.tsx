"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { Column, Task } from "@/types";

interface KanbanBoardProps {
    columns: Column[];
    tasks: Task[];
    onTaskMove?: (taskId: string, newColumnId: string, newPosition: number) => void;
    onTaskClick?: (task: Task) => void;
    onAddTask?: (columnId: string) => void;
}

export function KanbanBoard({
    columns: initialColumns,
    tasks: initialTasks,
    onTaskMove,
    onTaskClick,
    onAddTask,
}: KanbanBoardProps) {
    const [columns] = useState(initialColumns);
    const [tasks, setTasks] = useState(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getTasksByColumn = useCallback(
        (columnId: string) => {
            return tasks
                .filter((task) => task.column_id === columnId)
                .sort((a, b) => a.position - b.position);
        },
        [tasks]
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        setActiveTask(task || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        if (!activeTask) return;

        // Check if dragging over a column
        const isOverColumn = columns.some((col) => col.id === over.id);

        if (isOverColumn && activeTask.column_id !== over.id) {
            setTasks((tasks) =>
                tasks.map((t) =>
                    t.id === active.id ? { ...t, column_id: over.id as string } : t
                )
            );
        }

        // Check if dragging over another task
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask && activeTask.id !== overTask.id) {
            setTasks((tasks) => {
                const oldIndex = tasks.findIndex((t) => t.id === active.id);
                const newIndex = tasks.findIndex((t) => t.id === over.id);

                const updatedTasks = [...tasks];
                updatedTasks[oldIndex] = {
                    ...updatedTasks[oldIndex],
                    column_id: overTask.column_id,
                };

                return arrayMove(updatedTasks, oldIndex, newIndex);
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        if (!activeTask) return;

        // Calculate new position
        const columnTasks = getTasksByColumn(activeTask.column_id);
        const newPosition = columnTasks.findIndex((t) => t.id === active.id);

        // Notify parent of the move
        onTaskMove?.(active.id as string, activeTask.column_id, newPosition);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-5 overflow-x-auto pb-6 min-h-[600px] px-1">
                {columns.map((column, index) => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        tasks={getTasksByColumn(column.id)}
                        onCardClick={onTaskClick}
                        onAddTask={() => onAddTask?.(column.id)}
                        index={index}
                    />
                ))}
            </div>

            {/* Drag Overlay - shows card being dragged */}
            <DragOverlay dropAnimation={{
                duration: 300,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {activeTask && (
                    <div className="rotate-3 scale-105 opacity-90">
                        <KanbanCard task={activeTask} />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
