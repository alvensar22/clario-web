-- ============================================================================
-- Migration 010: Add interest_id to posts (Safe Version)
-- ============================================================================
-- This version safely handles cases where category_id may not exist yet
-- ============================================================================

-- Step 1: Check current state
DO $$
BEGIN
  RAISE NOTICE '=== Checking current database state ===';
  
  -- Check if posts has category_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'category_id'
  ) THEN
    RAISE NOTICE 'Posts table has category_id column - will migrate data';
  ELSE
    RAISE NOTICE 'Posts table does NOT have category_id - fresh setup, no migration needed';
  END IF;
  
  -- Check if posts has interest_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'interest_id'
  ) THEN
    RAISE NOTICE 'Posts table already has interest_id column';
  ELSE
    RAISE NOTICE 'Posts table needs interest_id column - will add';
  END IF;
END $$;

-- Step 2: Add interest_id column (safe - uses IF NOT EXISTS)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS interest_id uuid REFERENCES public.interests(id) ON DELETE SET NULL;

-- Step 3: Backfill data ONLY if category_id exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'category_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'interests' AND column_name = 'category_id'
  ) THEN
    RAISE NOTICE 'Backfilling interest_id from category_id...';
    
    UPDATE public.posts p
    SET interest_id = (
      SELECT i.id 
      FROM public.interests i
      WHERE i.category_id = p.category_id
      LIMIT 1
    )
    WHERE p.category_id IS NOT NULL AND p.interest_id IS NULL;
    
    RAISE NOTICE 'Backfill complete';
  ELSE
    RAISE NOTICE 'Skipping backfill - category_id does not exist';
  END IF;
END $$;

-- Step 4: Create index
CREATE INDEX IF NOT EXISTS idx_posts_interest_id ON public.posts(interest_id);

-- Step 5: Drop old category_id from posts (safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'category_id'
  ) THEN
    RAISE NOTICE 'Dropping category_id from posts...';
    DROP INDEX IF EXISTS public.idx_posts_category_id;
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_id_fkey;
    ALTER TABLE public.posts DROP COLUMN IF EXISTS category_id;
    RAISE NOTICE 'Dropped category_id from posts';
  ELSE
    RAISE NOTICE 'Skipping - posts.category_id does not exist';
  END IF;
END $$;

-- Step 6: Drop category_id from interests (safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'interests' AND column_name = 'category_id'
  ) THEN
    RAISE NOTICE 'Dropping category_id from interests...';
    DROP INDEX IF EXISTS public.idx_interests_category_id;
    ALTER TABLE public.interests DROP CONSTRAINT IF EXISTS interests_category_id_fkey;
    ALTER TABLE public.interests DROP COLUMN IF EXISTS category_id;
    RAISE NOTICE 'Dropped category_id from interests';
  ELSE
    RAISE NOTICE 'Skipping - interests.category_id does not exist';
  END IF;
END $$;

-- Step 7: Drop categories table (safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'categories'
  ) THEN
    RAISE NOTICE 'Dropping categories table...';
    DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
    DROP TABLE IF EXISTS public.categories;
    RAISE NOTICE 'Dropped categories table';
  ELSE
    RAISE NOTICE 'Skipping - categories table does not exist';
  END IF;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'posts' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts' 
  AND column_name IN ('interest_id', 'category_id')
ORDER BY column_name;

SELECT 
  'interests' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'interests' 
  AND column_name IN ('category_id')
ORDER BY column_name;

SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'categories'
  ) as categories_table_exists;

SELECT 
  COUNT(*) FILTER (WHERE interest_id IS NOT NULL) as posts_with_interest,
  COUNT(*) FILTER (WHERE interest_id IS NULL) as posts_without_interest,
  COUNT(*) as total_posts
FROM public.posts;

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Migration Complete! ===';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your app (Cmd+Shift+R)';
  RAISE NOTICE '2. Create a new post at /create with an interest';
  RAISE NOTICE '3. Check "My Interests" tab - you should see posts!';
END $$;
