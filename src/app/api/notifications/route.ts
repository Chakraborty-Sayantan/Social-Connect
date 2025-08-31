import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Call the secure RPC function instead of the insecure view
        const { data, error } = await supabase
            .rpc('get_detailed_notifications');
        
        if (error) {
            console.error("Error calling RPC get_detailed_notifications:", error);
            return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Unexpected error in notifications API:", error);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}

// PATCH method to mark notifications as read
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { notificationId, all } = await request.json().catch(() => ({}));

        let query = supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id); // Ensure user can only update their own notifications

        if (notificationId) {
            query = query.eq('id', notificationId);
        } else if (all) {
            query = query.eq('is_read', false);
        } else {
             return new NextResponse(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
        }

        const { error } = await query;

        if (error) {
            console.error("Error marking notification(s) as read:", error);
            return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unexpected error in PATCH notifications:", error);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}