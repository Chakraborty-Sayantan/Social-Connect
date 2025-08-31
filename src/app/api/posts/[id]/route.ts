import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles updating a specific post's content and category.
 * A user can only update their own post.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const { content, category } = await request.json();

    const { error } = await supabase
        .from('posts')
        .update({
            content,
            category,
            updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(id))
        .eq('author_id', user.id);

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/**
 * Handles soft deleting a specific post by setting is_active to false.
 * A user can only "delete" their own post.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
        .from('posts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', parseInt(id))
        .eq('author_id', user.id);

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return NextResponse.json({ success: true });
}