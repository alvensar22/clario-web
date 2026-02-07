-- Interests (fixed catalog)
CREATE TABLE IF NOT EXISTS public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- If table already existed without slug (e.g. from a partial run), add and backfill it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interests' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.interests ADD COLUMN slug text;
    UPDATE public.interests
    SET slug = lower(regexp_replace(trim(name), '\s+', '-', 'g'))
    WHERE slug IS NULL;
    ALTER TABLE public.interests ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS interests_slug_key ON public.interests(slug);
  END IF;
END $$;

-- User interests (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, interest_id)
);

-- RLS
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Anyone can read interests
CREATE POLICY "Interests are viewable by everyone"
  ON public.interests FOR SELECT
  USING (true);

-- Users can read their own user_interests
CREATE POLICY "Users can view own interests"
  ON public.user_interests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own user_interests
CREATE POLICY "Users can insert own interests"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own user_interests
CREATE POLICY "Users can delete own interests"
  ON public.user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Seed interests (idempotent by slug)
INSERT INTO public.interests (name, slug) VALUES
  ('Technology', 'technology'),
  ('Business', 'business'),
  ('Self Improvement', 'self-improvement'),
  ('Fitness', 'fitness'),
  ('Religion', 'religion'),
  ('Education', 'education'),
  ('Startups', 'startups'),
  ('Productivity', 'productivity'),
  ('Finance', 'finance'),
  ('Health', 'health'),
  ('Travel', 'travel'),
  ('Food', 'food'),
  ('Fashion', 'fashion'),
  ('Art', 'art'),
  ('Music', 'music'),
  ('Movies', 'movies')
ON CONFLICT (slug) DO NOTHING;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
