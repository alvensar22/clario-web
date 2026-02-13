-- Expo push tokens for native app (React Native / Expo)
-- One row per device token; same token can be re-registered by the same user (upsert).
CREATE TABLE IF NOT EXISTS public.expo_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user_id ON public.expo_push_tokens(user_id);

ALTER TABLE public.expo_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expo push tokens"
  ON public.expo_push_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
