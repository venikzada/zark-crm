"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Task, Column, Space, Profile, ChecklistItem, Comment } from "@/types";

// Helper to create Supabase client for browser
function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return document.cookie
                        .split('; ')
                        .find(row => row.startsWith(`${name}=`))
                        ?.split('=')[1];
                },
                set(name: string, value: string, options) {
                    document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge}`;
                },
                remove(name: string) {
                    document.cookie = `${name}=; path=/; max-age=0`;
                },
            },
        }
    );
}

// ============================================
// useSpaces - Manage user's spaces
// ============================================
export function useSpaces() {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

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
    const supabase = createClient();

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
    const supabase = createClient();

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
// useAuth - Authentication state
// ============================================
export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

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

// ============================================
// useChecklistItems - Manage checklist items for a task
// ============================================
export function useChecklistItems(taskId: string | null) {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchItems = useCallback(async () => {
        if (!taskId) {
            setItems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Note: The schema uses `checklist_items` with `task_id` directly
            const { data, error } = await supabase
                .from("checklist_items")
                .select("*")
                .eq("task_id", taskId)
                .order("position", { ascending: true });

            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error fetching checklist items");
        } finally {
            setLoading(false);
        }
    }, [taskId, supabase]);

    const createItem = async (content: string) => {
        if (!taskId) return null;

        try {
            // Get max position
            const { data: maxPosItem } = await supabase
                .from("checklist_items")
                .select("position")
                .eq("task_id", taskId)
                .order("position", { ascending: false })
                .limit(1)
                .single();

            const newPosition = (maxPosItem?.position ?? -1) + 1;

            const { data, error } = await supabase
                .from("checklist_items")
                .insert({
                    task_id: taskId,
                    content,
                    is_completed: false,
                    position: newPosition,
                })
                .select()
                .single();

            if (error) throw error;
            setItems((prev) => [...prev, data]);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error creating checklist item");
            return null;
        }
    };

    const toggleItem = async (itemId: string, isCompleted: boolean) => {
        try {
            const { data, error } = await supabase
                .from("checklist_items")
                .update({ is_completed: isCompleted })
                .eq("id", itemId)
                .select()
                .single();

            if (error) throw error;
            setItems((prev) => prev.map((item) => (item.id === itemId ? data : item)));
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error updating checklist item");
            return null;
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from("checklist_items")
                .delete()
                .eq("id", itemId);

            if (error) throw error;
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error deleting checklist item");
            return false;
        }
    };

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return { items, loading, error, refetch: fetchItems, createItem, toggleItem, deleteItem };
}

// ============================================
// useComments - Manage comments for a task
// ============================================
export function useComments(taskId: string | null) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

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
          user:profiles(id, email, full_name, avatar_url)
        `)
                .eq("task_id", taskId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error fetching comments");
        } finally {
            setLoading(false);
        }
    }, [taskId, supabase]);

    const createComment = async (content: string) => {
        if (!taskId) return null;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Fallback for when auth is not set up - use a mock ID
                console.warn("No authenticated user, using mock user ID");
            }

            const userId = user?.id || "00000000-0000-0000-0000-000000000000";

            const { data, error } = await supabase
                .from("comments")
                .insert({
                    task_id: taskId,
                    user_id: userId,
                    content,
                })
                .select(`
          *,
          user:profiles(id, email, full_name, avatar_url)
        `)
                .single();

            if (error) throw error;
            setComments((prev) => [...prev, data]);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error creating comment");
            return null;
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId);

            if (error) throw error;
            setComments((prev) => prev.filter((comment) => comment.id !== commentId));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error deleting comment");
            return false;
        }
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return { comments, loading, error, refetch: fetchComments, createComment, deleteComment };
}
