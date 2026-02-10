-- =============================================
-- Fix: Infinite Recursion in RLS Policies
-- =============================================

-- Problem: 
-- "spaces" policy queries "space_members".
-- "space_members" policy queries "spaces" (or itself via similar logic).
-- This creates an infinite loop (Recursion).

-- Solution:
-- Use a SECURITY DEFINER function to check membership. 
-- SECURITY DEFINER functions run with the permissions of the function creator (usually admin),
-- effectively bypassing the RLS recursion check for that specific query.

-- 1. Create helper function
CREATE OR REPLACE FUNCTION is_space_member(_space_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM space_members
    WHERE space_id = _space_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop problematic policies (if they exist)
DROP POLICY IF EXISTS "Users can view their spaces" ON spaces;
DROP POLICY IF EXISTS "Users can view space members" ON space_members;
DROP POLICY IF EXISTS "Users can join spaces they created" ON space_members; -- From previous fix, included here to be safe

-- 3. Update "Spaces" Policy
-- Users can see spaces they created OR spaces where they are members (checked securely)
CREATE POLICY "Users can view their spaces" ON spaces
  FOR SELECT USING (
    created_by = auth.uid() 
    OR 
    is_space_member(id)
  );

-- 4. Update "Space Members" Policy
-- Users can see memberships for spaces they belong to
CREATE POLICY "Users can view space members" ON space_members
  FOR SELECT USING (
    user_id = auth.uid() -- Can always see self
    OR
    is_space_member(space_id) -- Can see others in same space
  );

-- 5. Restore Insert Policies (Creation)
-- Ensure we have the creation policies from the previous step (idempotent)
DROP POLICY IF EXISTS "Users can create spaces" ON spaces;
CREATE POLICY "Users can create spaces" ON spaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert space members" ON space_members;
CREATE POLICY "Users can insert space members" ON space_members
  FOR INSERT WITH CHECK (
    -- Can add self?
    user_id = auth.uid()
    OR
    -- Or is admin of the space?
    EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = space_members.space_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Or is the creator of the space (for initial setup)?
    EXISTS (
        SELECT 1 FROM spaces 
        WHERE id = space_members.space_id 
        AND created_by = auth.uid()
    )
  );
