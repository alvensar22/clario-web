-- Add bio column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.users ADD COLUMN bio TEXT;
  END IF;
END $$;
