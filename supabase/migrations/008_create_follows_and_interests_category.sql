-- Follows: who follows whom
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own follow"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follow"
  ON public.follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Link interests to categories for "My Interests" feed (posts by category)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interests' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.interests
      ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_interests_category_id ON public.interests(category_id);
    -- Link existing interests to "Other" category so My Interests feed can return posts
    UPDATE public.interests i
    SET category_id = (SELECT id FROM public.categories WHERE slug = 'other' LIMIT 1)
    WHERE i.category_id IS NULL;
  END IF;
END $$;
