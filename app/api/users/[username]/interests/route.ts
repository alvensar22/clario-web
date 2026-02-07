import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]/interests
 * Returns a user's interests (id, name, slug) by username. Public.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { error: 'Username required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: user, error: userError } = (await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()) as { data: { id: string } | null; error: unknown };

  if (userError || !user) {
    const message = (userError as { message?: string } | null)?.message ?? 'User not found';
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }

  const { data: rows, error } = (await supabase
    .from('user_interests')
    .select('interest_id')
    .eq('user_id', user.id)) as { data: { interest_id: string }[] | null; error: unknown };

  if (error) {
    return NextResponse.json(
      { error: (error as { message?: string }).message ?? 'Failed to fetch' },
      { status: 500 }
    );
  }

  const interestIds = (rows ?? []).map((r) => r.interest_id);
  if (interestIds.length === 0) {
    return NextResponse.json({ interests: [] });
  }

  const { data: interests, error: interestsError } = await supabase
    .from('interests')
    .select('id, name, slug')
    .in('id', interestIds)
    .order('name');

  if (interestsError) {
    return NextResponse.json(
      { error: interestsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ interests: interests ?? [] });
}
