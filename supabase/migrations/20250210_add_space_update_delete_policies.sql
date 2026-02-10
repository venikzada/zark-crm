-- =============================================
-- Fix: Missing UPDATE and DELETE policies for Spaces
-- =============================================

-- Problem: 
-- The previous migrations defined SELECT and INSERT policies, but missed UPDATE and DELETE.
-- By default, Supabase (PostgreSQL RLS) denies any operation not explicitly allowed.
-- This caused the "Cannot coerce result to single JSON object" error because UPDATE returned 0 rows.

-- Solution:
-- Add policies allowing users to UPDATE and DELETE spaces they created.


-- 1. UPDATE Policy
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
CREATE POLICY "Users can update their own spaces" ON spaces
  FOR UPDATE USING (
    auth.uid() = created_by
  );

-- 2. DELETE Policy
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;
CREATE POLICY "Users can delete their own spaces" ON spaces
  FOR DELETE USING (
    auth.uid() = created_by
  );
