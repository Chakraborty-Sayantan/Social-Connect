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
    const { count: total_users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: total_posts } = await supabase.from('posts').select('*', { count: 'exact', head: true });

   // Count users whose last_active_at is greater than or equal to the start of today
    const { count: active_today } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', today.toISOString());

    
    const stats = { total_users, total_posts, active_today };

    return NextResponse.json(stats);
}