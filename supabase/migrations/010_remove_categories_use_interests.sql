-- Replace categories with interests: posts reference an interest instead of a category.
-- My Interests feed: show posts where post.interest_id is in the user's selected interests.

-- 1. Add interest_id to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS interest_id uuid REFERENCES public.interests(id) ON DELETE SET NULL;

-- 2. Backfill: set interest_id from category (pick one interest per category that had that category_id)
UPDATE public.posts p
SET interest_id = (
  SELECT i.id FROM public.interests i
  WHERE i.category_id = p.category_id
  LIMIT 1
)
WHERE p.category_id IS NOT NULL AND p.interest_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_interest_id ON public.posts(interest_id);

-- 3. Drop category_id from posts
DROP INDEX IF EXISTS public.idx_posts_category_id;
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_category_id_fkey;
ALTER TABLE public.posts
  DROP COLUMN IF EXISTS category_id;

-- 4. Drop category_id from interests
DROP INDEX IF EXISTS public.idx_interests_category_id;
ALTER TABLE public.interests
  DROP CONSTRAINT IF EXISTS interests_category_id_fkey;
ALTER TABLE public.interests
  DROP COLUMN IF EXISTS category_id;

-- 5. Drop categories table and its policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP TABLE IF EXISTS public.categories;
