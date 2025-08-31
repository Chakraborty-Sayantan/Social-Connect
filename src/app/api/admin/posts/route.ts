import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function isAdmin(supabase: SupabaseClient) { 
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

    const { data, error } = await supabase.from('posts').select('id, content, author:profiles(username)');
    if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    return NextResponse.json(data);
}