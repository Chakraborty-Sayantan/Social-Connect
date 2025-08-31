import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET handler to fetch comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles (*)
        `)
        .eq('post_id', parseInt(id))
        .order('created_at', { ascending: true });

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return NextResponse.json(data);
}

// POST handler to add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = await params;
  const { content } = await request.json();
  
  if (!content) {
    return new NextResponse(JSON.stringify({ error: 'Comment content is required' }), { status: 400 });
  }

  const { error } = await supabase
    .from('comments')
    .insert({ content, author_id: user.id, post_id: parseInt(id) });

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true });
}