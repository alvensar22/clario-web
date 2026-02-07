# Migration Guide: Remove Categories, Use Interests

## Overview
This migration removes the `categories` table and makes posts directly reference the `interests` table. After this migration, the "My Interests" feed will show posts where `post.interest_id` matches your selected interests.

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/project/blmlhgpqfdmrwvslawln/sql/new

2. **Run the Migration SQL**
   Copy and paste the entire content from:
   `supabase/migrations/010_remove_categories_use_interests.sql`

3. **Execute**
   Click "Run" to apply the migration

### Option 2: Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Push migrations
npx supabase db push
```

## What This Migration Does

1. **Adds `interest_id` column to posts**
   - Posts now reference interests directly

2. **Backfills data**
   - Migrates existing posts: sets `interest_id` based on the old `category_id`
   - For each category, picks one interest that previously mapped to it

3. **Removes old structure**
   - Drops `posts.category_id` column
   - Drops `interests.category_id` column
   - Drops `categories` table entirely

## After Migration

### Creating Posts
- Users select an **interest** (Technology, Music, Business, etc.) when creating a post
- Posts are tagged with `interest_id`

### My Interests Feed
- Shows posts where `post.interest_id` is in your selected interests from onboarding
- Direct match: Your interests → Posts with those interests

### Data Flow
```
Before:
user_interests → interests.category_id → posts.category_id

After:
user_interests → posts.interest_id (direct)
```

## Verification

After applying the migration, verify in Supabase:

1. **Check posts table has interest_id**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'posts' AND column_name = 'interest_id';
   ```

2. **Check categories table is gone**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'categories';
   -- Should return 0 rows
   ```

3. **Check posts are linked to interests**
   ```sql
   SELECT p.id, p.content, i.name as interest_name
   FROM posts p
   LEFT JOIN interests i ON p.interest_id = i.id
   LIMIT 5;
   ```

## Troubleshooting

### "My Interests" tab is empty

**Check 1: Are there posts with interest_id?**
```sql
SELECT COUNT(*) as posts_with_interest
FROM posts 
WHERE interest_id IS NOT NULL;
```

**Check 2: Do you have selected interests?**
```sql
SELECT ui.interest_id, i.name
FROM user_interests ui
JOIN interests i ON ui.interest_id = i.id
WHERE ui.user_id = 'YOUR_USER_ID';
```

**Check 3: Do any posts match your interests?**
```sql
-- Replace YOUR_USER_ID with your actual user ID
SELECT p.*, i.name as interest_name
FROM posts p
JOIN interests i ON p.interest_id = i.id
WHERE p.interest_id IN (
  SELECT interest_id 
  FROM user_interests 
  WHERE user_id = 'YOUR_USER_ID'
)
ORDER BY p.created_at DESC;
```

### No posts have interest_id after migration

This happens if there were no posts, or if the backfill didn't work (e.g., no interests had `category_id` set).

**Solution:** Create new posts with interests:
- Go to `/create` in your app
- Select an interest from the dropdown (Technology, Music, etc.)
- Create a post
- Check "My Interests" tab

## Rolling Back (if needed)

If you need to rollback this migration:

```sql
-- 1. Recreate categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Update', 'update'),
  ('Question', 'question'),
  ('Idea', 'idea'),
  ('Discussion', 'discussion'),
  ('Other', 'other');

-- 3. Add category_id back to posts
ALTER TABLE public.posts
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- 4. Remove interest_id from posts
ALTER TABLE public.posts DROP COLUMN interest_id;
```

**Note:** You'll also need to revert all code changes in the application.
