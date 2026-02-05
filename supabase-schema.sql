-- =============================================
-- ZARK CRM - Database Schema
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES (Usuários)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. SPACES (Espaços/Clientes)
-- =============================================
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  color TEXT DEFAULT '#f56f10',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. SPACE MEMBERS (Membros do Espaço)
-- =============================================
CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view spaces they are members of
CREATE POLICY "Users can view their spaces" ON spaces
  FOR SELECT USING (
    id IN (
      SELECT space_id FROM space_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Policy: Users can view space_members for their spaces
CREATE POLICY "Users can view space members" ON space_members
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 4. LISTS (Projetos/Listas)
-- =============================================
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lists in their spaces" ON lists
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage lists" ON lists
  FOR ALL USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- =============================================
-- 5. COLUMNS (Colunas do Kanban)
-- =============================================
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  position INTEGER DEFAULT 0,
  wip_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view columns in their lists" ON columns
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM lists WHERE space_id IN (
        SELECT space_id FROM space_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage columns" ON columns
  FOR ALL USING (
    list_id IN (
      SELECT id FROM lists WHERE space_id IN (
        SELECT space_id FROM space_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'member')
      )
    )
  );

-- =============================================
-- 6. TASKS (Tarefas/Cards)
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  assignee_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  position INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their spaces" ON tasks
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM lists WHERE space_id IN (
        SELECT space_id FROM space_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage tasks" ON tasks
  FOR ALL USING (
    list_id IN (
      SELECT id FROM lists WHERE space_id IN (
        SELECT space_id FROM space_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'member')
      )
    )
  );

-- =============================================
-- 7. COMMENTS (Comentários)
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their tasks" ON comments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE list_id IN (
        SELECT id FROM lists WHERE space_id IN (
          SELECT space_id FROM space_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE list_id IN (
        SELECT id FROM lists WHERE space_id IN (
          SELECT space_id FROM space_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- 8. ATTACHMENTS (Anexos)
-- =============================================
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments" ON attachments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE list_id IN (
        SELECT id FROM lists WHERE space_id IN (
          SELECT space_id FROM space_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- 9. CHECKLISTS
-- =============================================
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checklists" ON checklists
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE list_id IN (
        SELECT id FROM lists WHERE space_id IN (
          SELECT space_id FROM space_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view checklist items" ON checklist_items
  FOR SELECT USING (
    checklist_id IN (SELECT id FROM checklists)
  );

-- =============================================
-- 10. ACTIVITY LOGS (Histórico)
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs" ON activity_logs
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE list_id IN (
        SELECT id FROM lists WHERE space_id IN (
          SELECT space_id FROM space_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- 11. DOCUMENTS (Docs estilo Notion)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  icon TEXT DEFAULT '📄',
  parent_id UUID REFERENCES documents(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their spaces" ON documents
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 12. USER INTEGRATIONS (Google Calendar, WhatsApp, etc)
-- =============================================
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_calendar', 'whatsapp', 'slack', 'zapier')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  provider_user_id TEXT,
  provider_email TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations" ON user_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integrations" ON user_integrations
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 13. VERIFICATION CODES (WhatsApp, etc)
-- =============================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own verification codes" ON verification_codes
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 14. NOTIFICATION PREFERENCES
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  daily_digest BOOLEAN DEFAULT TRUE,
  digest_time TIME DEFAULT '08:00',
  task_reminders BOOLEAN DEFAULT TRUE,
  due_soon_alerts BOOLEAN DEFAULT TRUE,
  overdue_alerts BOOLEAN DEFAULT TRUE,
  comment_mentions BOOLEAN DEFAULT TRUE,
  whatsapp_digest BOOLEAN DEFAULT FALSE,
  whatsapp_reminders BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create default notification preferences on user creation
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_notif ON profiles;
CREATE TRIGGER on_profile_created_notif
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_notification_preferences();

-- =============================================
-- Indexes for integrations
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON verification_codes(user_id);

-- =============================================
-- 15. SPACE INVITATIONS (Convites para Espaços)
-- =============================================
CREATE TABLE IF NOT EXISTS space_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  invited_by UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE space_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Space admins can create invitations
CREATE POLICY "Space admins can create invitations" ON space_invitations
  FOR INSERT WITH CHECK (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
    OR space_id IN (
      SELECT id FROM spaces WHERE created_by = auth.uid()
    )
  );

-- Policy: Anyone can view invitations by token (for acceptance)
CREATE POLICY "Anyone can view invitations by token" ON space_invitations
  FOR SELECT USING (true);

-- Policy: Space admins can view their space invitations
CREATE POLICY "Space admins can view space invitations" ON space_invitations
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
    OR space_id IN (
      SELECT id FROM spaces WHERE created_by = auth.uid()
    )
  );

-- Policy: System can update invitations when accepted
CREATE POLICY "System can update invitations" ON space_invitations
  FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_space_invitations_token ON space_invitations(token);
CREATE INDEX IF NOT EXISTS idx_space_invitations_email ON space_invitations(email);
CREATE INDEX IF NOT EXISTS idx_space_invitations_space ON space_invitations(space_id);

-- =============================================
-- Done!
-- =============================================

