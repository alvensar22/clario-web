# Supabase Database Setup

This directory contains SQL migrations for setting up the Supabase database schema and Row-Level Security (RLS) policies.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/001_create_users_table_and_policies.sql`
4. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## What This Migration Does

1. **Creates the `users` table** with:
   - `id` (UUID, references auth.users)
   - `email` (TEXT)
   - `username` (TEXT, unique)
   - `created_at` and `updated_at` timestamps

2. **Enables Row-Level Security (RLS)** on the users table

3. **Creates RLS Policies**:
   - Users can insert their own record (during signup)
   - Users can read their own data
   - Users can update their own data
   - All authenticated users can read usernames (for availability checks)

4. **Creates indexes** for performance optimization

5. **Creates triggers** to automatically update the `updated_at` timestamp

## Manual Setup (Alternative)

If you prefer to set up manually in the Supabase Dashboard:

### Step 1: Create the Table

Go to **Table Editor** → **New Table** and create a table named `users` with:

- `id` (uuid, primary key)
- `email` (text, not null)
- `username` (text, nullable, unique)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, nullable)

### Step 2: Add Foreign Key

In the table settings, add a foreign key:
- Column: `id`
- References: `auth.users(id)`
- On delete: CASCADE

### Step 3: Enable RLS

In the table settings, toggle **Enable Row Level Security** to ON.

### Step 4: Create Policies

Go to **Authentication** → **Policies** → **users** and create these policies:

1. **Insert Policy**:
   - Name: "Users can insert own record"
   - Operation: INSERT
   - Target roles: authenticated
   - USING expression: `auth.uid() = id`
   - WITH CHECK expression: `auth.uid() = id`

2. **Select Policy**:
   - Name: "Users can read own data"
   - Operation: SELECT
   - Target roles: authenticated
   - USING expression: `auth.uid() = id`

3. **Update Policy**:
   - Name: "Users can update own data"
   - Operation: UPDATE
   - Target roles: authenticated
   - USING expression: `auth.uid() = id`
   - WITH CHECK expression: `auth.uid() = id`

4. **Select Usernames Policy** (for availability checks):
   - Name: "Users can read usernames"
   - Operation: SELECT
   - Target roles: authenticated
   - USING expression: `auth.role() = 'authenticated'`

## Verifying the Setup

After running the migration, verify:

1. The `users` table exists in your database
2. RLS is enabled on the table
3. The policies are created and active
4. You can insert a test record (it should work after authentication)

## Troubleshooting

### "new row violates row-level security policy"

This means RLS policies are not set up correctly. Make sure:
- RLS is enabled on the table
- The INSERT policy allows `auth.uid() = id`
- You're authenticated when trying to insert

### "permission denied for table users"

Check that:
- RLS policies are active
- You're using the authenticated user's session
- The policy expressions are correct
