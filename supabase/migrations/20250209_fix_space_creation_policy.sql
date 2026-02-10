-- =============================================
-- Fix: Allow authenticated users to create spaces
-- =============================================

-- The 'spaces' table has RLS enabled, but likely missed an INSERT policy for authenticated users.
-- This policy allows any authenticated user to create a space, provided they set themselves as the owner (created_by).

CREATE POLICY "Users can create spaces" ON spaces
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Also ensure they can add themselves as a member (admin) to that space immediately
-- (The existing schema likely covers this or uses a separate logic, but explicit policy helps)
CREATE POLICY "Users can join spaces they created" ON space_members
  FOR INSERT 
  WITH CHECK (
    space_id IN (SELECT id FROM spaces WHERE created_by = auth.uid())
  );
