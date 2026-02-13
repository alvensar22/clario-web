-- Revert the RLS policy change from migration 021 back to the original restrictive policy
-- Drop the new policy if it exists
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;

-- Restore the original restrictive policy that only allows users to see their own rows
CREATE POLICY "Users can view own chat participants"
  ON public.chat_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
