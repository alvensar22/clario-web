-- ============================================================================
-- Migration 010: Remove Categories, Use Interests
-- ============================================================================
-- This migration makes posts directly reference interests instead of categories.
-- The "My Interests" feed will show posts matching your selected interests.
--
-- INSTRUCTIONS:
-- 1. Go to: https://app.supabase.com/project/blmlhgpqfdmrwvslawln/sql/new
-- 2. Copy this entire file
-- 3. Paste into the SQL Editor
-- 4. Click "Run"
-- ============================================================================

-- Step 1: Add interest_id column to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS interest_id uuid REFERENCES public.interests(id) ON DELETE SET NULL;

-- Step 2: Backfill existing posts
-- For each post with a category, find an interest that had that category
-- and set the post's interest_id to that interest
UPDATE public.posts p
SET interest_id = (
  SELECT i.id 
  FROM public.interests i
  WHERE i.category_id = p.category_id
  LIMIT 1
)
WHERE p.category_id IS NOT NULL AND p.interest_id IS NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_interest_id ON public.posts(interest_id);

-- Step 4: Drop old category_id from posts
DROP INDEX IF EXISTS public.idx_posts_category_id;
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_category_id_fkey;
ALTER TABLE public.posts
  DROP COLUMN IF EXISTS category_id;

-- Step 5: Drop category_id from interests
DROP INDEX IF EXISTS public.idx_interests_category_id;
ALTER TABLE public.interests
  DROP CONSTRAINT IF EXISTS interests_category_id_fkey;
ALTER TABLE public.interests
  DROP COLUMN IF EXISTS category_id;

-- Step 6: Drop categories table
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP TABLE IF EXISTS public.categories;

-- ============================================================================
-- Verification Queries (run these after migration)
-- ============================================================================

-- Check 1: Verify posts table has interest_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts' 
  AND column_name IN ('interest_id', 'category_id');
-- Expected: Should show interest_id only (category_id should be gone)

-- Check 2: Verify categories table is dropped
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'categories'
) as categories_exists;
-- Expected: false

-- Check 3: Count posts with interest_id
SELECT 
  COUNT(*) FILTER (WHERE interest_id IS NOT NULL) as posts_with_interest,
  COUNT(*) FILTER (WHERE interest_id IS NULL) as posts_without_interest,
  COUNT(*) as total_posts
FROM public.posts;
-- All posts should ideally have interest_id (unless created after migration without selecting interest)

-- Check 4: See posts with their interests
SELECT 
  p.id,
  LEFT(p.content, 50) as content_preview,
  i.name as interest_name,
  p.created_at
FROM public.posts p
LEFT JOIN public.interests i ON p.interest_id = i.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================================
-- Success! 
-- The migration is complete. Now:
-- 1. Reload your app
-- 2. Go to "My Interests" tab  
-- 3. You should see posts matching your selected interests
-- ============================================================================
