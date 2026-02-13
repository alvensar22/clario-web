-- Add reply_to to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages(reply_to_id);

-- Reactions: one row per (message, user, emoji)
CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON public.chat_message_reactions(message_id);

ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can see reactions on messages in their chats
CREATE POLICY "Users can view reactions in their chats"
  ON public.chat_message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_participants p ON p.chat_id = m.chat_id AND p.user_id = auth.uid()
      WHERE m.id = message_id
    )
  );

-- Users can add/remove their own reactions
CREATE POLICY "Users can insert own reactions"
  ON public.chat_message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_participants p ON p.chat_id = m.chat_id AND p.user_id = auth.uid()
      WHERE m.id = message_id
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON public.chat_message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add reactions to Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
  END IF;
END $$;
