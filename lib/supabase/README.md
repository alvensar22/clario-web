# Supabase Setup

This directory contains Supabase client utilities for both server and client-side usage in Next.js App Router.

## Files

- `server.ts` - Server-side Supabase client (for Server Components, Server Actions, Route Handlers)
- `client.ts` - Client-side Supabase client (for Client Components)

## Usage

### Server Components / Server Actions

```typescript
import { createClient } from '@/lib/supabase/server';

// In a Server Component
export default async function ServerComponent() {
  const supabase = createClient();
  const { data, error } = await supabase.from('your_table').select('*');
  
  return <div>{/* render data */}</div>;
}

// In a Server Action
export async function serverAction() {
  'use server';
  const supabase = createClient();
  const { data, error } = await supabase.from('your_table').insert({...});
  return { success: !error };
}
```

### Client Components

```typescript
'use client';

import { useSupabase, useUser } from '@/hooks/use-supabase';

export default function ClientComponent() {
  const supabase = useSupabase();
  const { user, loading } = useUser();
  
  // Use supabase client for queries
  // Access user state
  
  return <div>{/* component */}</div>;
}
```

### Route Handlers

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('your_table').select('*');
  
  return NextResponse.json({ data, error });
}
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ROLE_KEY=your-role-key
```

## Type Safety

Generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

Or use the Supabase CLI:

```bash
supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

## Authentication

The middleware (`middleware.ts`) automatically refreshes user sessions on each request. Authentication state is managed through cookies and works seamlessly across server and client components.
