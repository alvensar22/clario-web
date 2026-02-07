-- Allow anyone to read user_interests so public profiles can display interests.
-- Existing policy "Users can view own interests" is redundant once this exists (OR semantics).
CREATE POLICY "Anyone can view user interests for profiles"
  ON public.user_interests FOR SELECT
  USING (true);
