// Database Types for ZARK CRM

export type UserRole = 'admin' | 'member' | 'guest';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  user?: User;
}

export interface List {
  id: string;
  space_id: string;
  name: string;
  description: string | null;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  list_id: string;
  name: string;
  color: string;
  position: number;
  wip_limit: number | null;
  created_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  list_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string;
  position: number;
  time_spent: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
  checklists?: Checklist[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Checklist {
  id: string;
  task_id: string;
  title: string;
  position: number;
  created_at: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: User;
}

export interface Document {
  id: string;
  space_id: string;
  title: string;
  content: Record<string, unknown>;
  icon: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Kanban specific types
export interface KanbanColumn extends Column {
  tasks: Task[];
}

export interface KanbanBoard {
  list: List;
  columns: KanbanColumn[];
}

// Profile alias for Supabase auth integration
export type Profile = User;

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'comment' | 'mention' | 'due_soon' | 'overdue';
  is_read: boolean;
  task_id: string | null;
  created_at: string;
}

// Timer/Pomodoro session
export interface PomodoroSession {
  id: string;
  task_id: string;
  user_id: string;
  duration: number; // in minutes
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

