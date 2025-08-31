import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { 
        username, 
        first_name, 
        last_name, 
        bio, 
        website, 
        location, 
        visibility 
    } = await request.json();

    const { data, error } = await supabase
        .from('profiles')
        .update({ 
            username, 
            first_name, 
            last_name, 
            bio,
            website,
            location,
            visibility,
            updated_at: new Date().toISOString() 
        })
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) {
        if (error.code === '23505') {
             return new NextResponse(JSON.stringify({ error: 'Username is already taken.' }), { status: 409 });
        }
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return NextResponse.json(data);
}