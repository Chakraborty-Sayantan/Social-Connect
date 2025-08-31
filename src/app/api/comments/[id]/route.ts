import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string }}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', params.id)
        .eq('author_id', user.id);
    
    if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    return NextResponse.json({ success: true });
}