import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string }}) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('follows')
        .select('follower:profiles!follower_id(*)')
        .eq('following_id', params.id);

    if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    return NextResponse.json(data.map(d => d.follower));
}