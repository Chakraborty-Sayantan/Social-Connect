import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: followedUsers, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (followError) {
        return new NextResponse(JSON.stringify({ error: followError.message }), { status: 500 });
    }

    const followedUserIds = followedUsers.map(f => f.following_id);
    const authorIds = [...followedUserIds, user.id];
    
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`*, profiles:author_id (*)`) 
        .in('author_id', authorIds)
        .order('created_at', { ascending: false })
        .limit(20);

    if (postsError) {
        return new NextResponse(JSON.stringify({ error: postsError.message }), { status: 500 });
    }
    
    return NextResponse.json(posts);
}