-- Add chat_participants to Realtime so clients can receive last_read_at updates (for seen status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
  END IF;
END $$;
