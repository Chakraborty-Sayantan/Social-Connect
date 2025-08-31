import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Reusable admin check function
async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
}

export async function GET() {
    const supabase = await createClient();
    if (!await isAdmin(supabase)) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);
    
    // Perform all queries in parallel for better performance
    const [
        { count: total_users },
        { count: total_posts },
        { count: active_today },
        { count: new_users_today },
        { count: new_users_week },
        { count: new_posts_week },
        dailySignupsRes,
        dailyPostsRes
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.rpc('get_daily_signups'),
        supabase.rpc('get_daily_posts')
    ]);

    const stats = {
        total_users,
        total_posts,
        active_today,
        new_users_today,
        new_users_week,
        new_posts_week,
        daily_signups: dailySignupsRes.data,
        daily_posts: dailyPostsRes.data
    };

    return NextResponse.json(stats);
}