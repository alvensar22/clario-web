# 🚀 Quick Start: Fix "My Interests" Tab

## The Problem
The "My Interests" tab is empty because the database migration hasn't been applied yet. Your code is correct, but the database still has the old structure.

## The Solution (5 minutes)

### Step 1: Apply the Migration

**Go to Supabase SQL Editor:**
👉 https://app.supabase.com/project/blmlhgpqfdmrwvslawln/sql/new

**Copy and paste the contents of:**
`apply_migration_010.sql`

**Click "Run"**

That's it! The migration will:
- ✅ Add `interest_id` to posts table
- ✅ Migrate existing posts
- ✅ Remove old `category_id` columns
- ✅ Drop the `categories` table

### Step 2: Test It

1. **Refresh your app** (hard reload: Cmd+Shift+R)
2. **Create a new post** at `/create`
   - Select an interest (Technology, Music, etc.)
   - Post something
3. **Go to Feed → My Interests tab**
   - You should now see posts matching your selected interests!

## How It Works Now

### Before Migration
```
User selects: Technology, Music
↓
interests.category_id → "Discussion", "Other"  
↓
posts.category_id → Show posts in Discussion/Other categories
```

### After Migration ✨
```
User selects: Technology, Music
↓
posts.interest_id → Show posts tagged with Technology or Music
```

**Much simpler and more intuitive!**

## Verification Commands

Run these in Supabase SQL Editor after migration:

```sql
-- ✅ Check posts table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name IN ('interest_id', 'category_id');
-- Should show only interest_id

-- ✅ Check your interests
SELECT ui.interest_id, i.name
FROM user_interests ui
JOIN interests i ON ui.interest_id = i.id
WHERE ui.user_id = 'YOUR_USER_ID_HERE';

-- ✅ Check posts in your interests feed
SELECT p.id, LEFT(p.content, 30) as preview, i.name as interest
FROM posts p
JOIN interests i ON p.interest_id = i.id
WHERE p.interest_id IN (
  SELECT interest_id 
  FROM user_interests 
  WHERE user_id = 'YOUR_USER_ID_HERE'
)
ORDER BY p.created_at DESC;
```

## If You Still See No Posts

### Scenario 1: No posts have interest_id
**Solution:** Create new posts
- Go to `/create`
- Select an interest from dropdown
- Create a post
- Check "My Interests" tab

### Scenario 2: You haven't selected interests
**Solution:** Complete onboarding
- Go to `/onboarding/interests`
- Select at least one interest
- Save and return to feed

### Scenario 3: No posts match your interests
**Solution:** Either:
- Create posts with your interests, or
- Select more interests in onboarding

## Technical Details

### Database Changes
- `posts.category_id` → `posts.interest_id`
- `interests.category_id` → *removed*
- `categories` table → *dropped*

### API Changes
- `POST /api/posts` now accepts `interest_id` instead of `category_id`
- `GET /api/posts?feed=interests` filters by `post.interest_id IN (user's interests)`

### UI Changes
- Post composer: "Category" dropdown → "Interest" dropdown
- Post cards: Show interest name instead of category name
- Feed: Direct interest matching

## Need Help?

Check `MIGRATION_GUIDE.md` for detailed troubleshooting and rollback instructions.
