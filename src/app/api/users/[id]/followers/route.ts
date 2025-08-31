import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // people who **follow** this user
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follower_id(*)')
    .eq('following_id', id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data.map((d) => d.follower));
}