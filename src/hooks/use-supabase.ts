"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { Task, Column, Space, Profile } from "@/types";

// ============================================
// useSpaces - Manage user's spaces
// ============================================
export function useSpaces() {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const fetchSpaces = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setSpaces([]);
                return;
            }

            const { data, error } = await supabase
                .from("spaces")
                .select(`
          *,
          members:space_members(user_id, role)
        `)
                .or(`owner_id.eq.${user.id},members.user_id.eq.${user.id}`)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSpaces(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error fetching spaces");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const createSpace = async (name: string, description?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("spaces")
                .insert({
                    name,
                    description,
                    owner_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            setSpaces((prev) => [data, ...prev]);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error creating space");
            return null;
        }
    };

    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    return { spaces, loading, error, refetch: fetchSpaces, createSpace };
}

// ============================================
// useTasks - Manage tasks within a list
// ============================================
export function useTasks(listId: string | null) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const fetchTasks = useCallback(async () => {
        if (!listId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("tasks")
                .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, email, full_name, avatar_url)
        `)
                .eq("list_id", listId)
                .eq("is_archived", false)
                .order("position", { ascending: true });

            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error fetching tasks");
        } finally {
            setLoading(false);
        }
    }, [listId, supabase]);

    const createTask = async (task: Partial<Task>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Get the highest position in the column
            const { data: maxPosTask } = await supabase
                .from("tasks")
                .select("position")
                .eq("column_id", task.column_id)
                .order("position", { ascending: false })
                .limit(1)
                .single();

            const newPosition = (maxPosTask?.position ?? -1) + 1;

            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    ...task,
                    list_id: listId,
                    created_by: user.id,
                    position: newPosition,
                })
                .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, email, full_name, avatar_url)
        `)
                .single();

            if (error) throw error;
            setTasks((prev) => [...prev, data]);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error creating task");
            return null;
        }
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        try {
            const { data, error } = await supabase
                .from("tasks")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", taskId)
                .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, email, full_name, avatar_url)
        `)
                .single();

            if (error) throw error;
            setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error updating task");
            return null;
        }
    };

    const moveTask = async (taskId: string, newColumnId: string, newPosition: number) => {
        try {
            // Optimistic update
            const oldTasks = [...tasks];
            const taskIndex = tasks.findIndex((t) => t.id === taskId);
            if (taskIndex === -1) return;

            const movedTask = { ...tasks[taskIndex], column_id: newColumnId, position: newPosition };
            const updatedTasks = tasks.filter((t) => t.id !== taskId);

            // Update positions in the same column
            const columnTasks = updatedTasks
                .filter((t) => t.column_id === newColumnId)
                .sort((a, b) => a.position - b.position);

            columnTasks.splice(newPosition, 0, movedTask);
            columnTasks.forEach((t, i) => (t.position = i));

            setTasks([...updatedTasks.filter((t) => t.column_id !== newColumnId), ...columnTasks]);

            // Persist to Supabase
            const { error } = await supabase
                .from("tasks")
                .update({ column_id: newColumnId, position: newPosition, updated_at: new Date().toISOString() })
                .eq("id", taskId);

            if (error) {
                // Rollback on error
                setTasks(oldTasks);
                throw error;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error moving task");
        }
    };

    const archiveTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from("tasks")
                .update({ is_archived: true, updated_at: new Date().toISOString() })
                .eq("id", taskId);

            if (error) throw error;
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error archiving task");
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Realtime subscription
    useEffect(() => {
        if (!listId) return;

        const channel = supabase
            .channel(`tasks:${listId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks", filter: `list_id=eq.${listId}` },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        fetchTasks(); // Refetch to get assignee
                    } else if (payload.eventType === "UPDATE") {
                        fetchTasks();
                    } else if (payload.eventType === "DELETE") {
                        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [listId, supabase, fetchTasks]);

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        createTask,
        updateTask,
        moveTask,
        archiveTask,
    };
}

// ============================================
// useColumns - Manage columns within a list
// ============================================
export function useColumns(listId: string | null) {
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const fetchColumns = useCallback(async () => {
        if (!listId) {
            setColumns([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("columns")
                .select("*")
                .eq("list_id", listId)
                .order("position", { ascending: true });

            if (error) throw error;
            setColumns(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error fetching columns");
        } finally {
            setLoading(false);
        }
    }, [listId, supabase]);

    const createColumn = async (name: string, color?: string) => {
        try {
            const { data: maxPosCol } = await supabase
                .from("columns")
                .select("position")
                .eq("list_id", listId)
                .order("position", { ascending: false })
                .limit(1)
                .single();

            const newPosition = (maxPosCol?.position ?? -1) + 1;

            const { data, error } = await supabase
                .from("columns")
                .insert({
                    list_id: listId,
                    name,
                    color: color || "#6B7280",
                    position: newPosition,
                })
                .select()
                .single();

            if (error) throw error;
            setColumns((prev) => [...prev, data]);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error creating column");
            return null;
        }
    };

    const updateColumn = async (columnId: string, updates: Partial<Column>) => {
        try {
            const { data, error } = await supabase
                .from("columns")
                .update(updates)
                .eq("id", columnId)
                .select()
                .single();

            if (error) throw error;
            setColumns((prev) => prev.map((c) => (c.id === columnId ? data : c)));
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error updating column");
            return null;
        }
    };

    const deleteColumn = async (columnId: string) => {
        try {
            const { error } = await supabase
                .from("columns")
                .delete()
                .eq("id", columnId);

            if (error) throw error;
            setColumns((prev) => prev.filter((c) => c.id !== columnId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error deleting column");
        }
    };

    useEffect(() => {
        fetchColumns();
    }, [fetchColumns]);

    return {
        columns,
        loading,
        error,
        refetch: fetchColumns,
        createColumn,
        updateColumn,
        deleteColumn,
    };
}

// ============================================
// useComments - Manage task comments
// ============================================
export function useComments(taskId: string | null) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();

    const fetchComments = useCallback(async () => {
        if (!taskId) {
            setComments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("comments")
                .select(`
          *,
          user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `)
                .eq("task_id", taskId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoading(false);
        }
    }, [taskId, supabase]);

    const addComment = async (content: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("comments")
                .insert({
                    task_id: taskId,
                    user_id: user.id,
                    content,
                })
                .select(`
          *,
          user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `)
                .single();

            if (error) throw error;
            setComments((prev) => [...prev, data]);
            return data;
        } catch (err) {
            console.error("Error adding comment:", err);
            return null;
        }
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return { comments, loading, addComment, refetch: fetchComments };
}

// ============================================
// useAuth - Authentication state
// ============================================
export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return { user, loading, signOut };
}
