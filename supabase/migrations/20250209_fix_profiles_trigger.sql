-- =============================================
-- Fix: Missing Profiles (Foreign Key Violation)
-- =============================================

-- Problem: 
-- The "spaces" table references "profiles" via "created_by".
-- If a user exists in Auth but not in Profiles (e.g. trigger failed), creation fails.

-- Solution:
-- 1. Make the trigger function robust (Idempotent).
-- 2. Backfill missing profiles for existing users.

-- 1. Update/Robustify the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent crashing if already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Trigger is Active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. BACKFILL SCRIPT (CRITICAL)
-- Insert a profile for ANY user in auth.users that doesn't have one in public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
