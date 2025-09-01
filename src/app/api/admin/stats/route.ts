import { createClient } from "@/lib/supabase/server-service";
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
        { count: new_users_week },
        { count: new_posts_week },
        dailySignupsRes,
        dailyPostsRes,
        roleDistributionRes,
        postsByCategoryRes,
        signupsByDayOfWeekRes,
        postsByHourRes,
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.rpc('get_daily_signups'),
        supabase.rpc('get_daily_posts'),
        supabase.rpc('get_user_role_distribution'),
        supabase.rpc('get_posts_per_category'),
        supabase.rpc('get_signups_by_day_of_week'),
        supabase.rpc('get_posts_by_hour_of_day')
    ]);

    const stats = {
        total_users,
        total_posts,
        active_today,
        new_users_week,
        new_posts_week,
        daily_signups: dailySignupsRes.data,
        daily_posts: dailyPostsRes.data,
        role_distribution: roleDistributionRes.data,
        posts_by_category: postsByCategoryRes.data,
        signups_by_day_of_week: signupsByDayOfWeekRes.data,
        posts_by_hour: postsByHourRes.data,
    };

    return NextResponse.json(stats);
}