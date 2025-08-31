import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles updating a specific post.
 * A user can only update their own post.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Ensure the user is authenticated
    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { content, category } = await request.json();

    // Perform the update, ensuring the post's author_id matches the current user's ID
    const { error } = await supabase
        .from('posts')
        .update({ 
            content, 
            category, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', parseInt(params.id))
        .eq('author_id', user.id);

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/**
 * Handles deleting a specific post.
 * A user can only delete their own post.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Ensure the user is authenticated
    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Perform the delete, ensuring the post's author_id matches the current user's ID
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', parseInt(params.id))
        .eq('author_id', user.id);

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return NextResponse.json({ success: true });
}