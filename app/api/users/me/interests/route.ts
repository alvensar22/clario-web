import { createClient } from '@/lib/supabase/server';
import type { UserInterestsInsert } from '@/types/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/users/me/interests
 * Returns the current user's selected interest IDs. Requires authentication.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
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
  return NextResponse.json({ interestIds });
}

/**
 * PUT /api/users/me/interests
 * Replaces the current user's interests with the given list.
 * Body: { interestIds: string[] }
 */
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: { interestIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const interestIds = Array.isArray(body.interestIds) ? body.interestIds : [];
  const validIds = interestIds.filter((id): id is string => typeof id === 'string');

  // Delete existing, then insert new (replace semantics)
  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  if (validIds.length > 0) {
    const inserts: UserInterestsInsert[] = validIds.map((interest_id) => ({
      user_id: user.id,
      interest_id,
    }));
    const { error: insertError } = await supabase
      .from('user_interests')
      .insert(inserts as never[]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ interestIds: validIds });
}
