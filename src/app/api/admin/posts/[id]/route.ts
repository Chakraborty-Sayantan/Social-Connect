import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

async function isAdmin(supabase: SupabaseClient) { 
      const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
 }

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
    const supabase = await createClient();
    if (!await isAdmin(supabase)) { 
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
     }

    
    const { error } = await supabase
        .from('posts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', params.id);
        
    if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    
    return NextResponse.json({ success: true });
}