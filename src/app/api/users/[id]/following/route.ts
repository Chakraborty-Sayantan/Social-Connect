import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // people this user **is following**
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!following_id(*)')
    .eq('follower_id', params.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data.map((d) => d.following));
}