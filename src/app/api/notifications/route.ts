import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error("Auth error:", authError);
            return new NextResponse(JSON.stringify({ error: 'Authentication failed' }), { status: 401 });
        }

        if (!user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Fetch notifications with sender profile information
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender:sender_id (
                    username,
                    avatar_url,
                    first_name,
                    last_name
                ),
                post:post_id (
                    id,
                    content
                )
            `)
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50); // Limit to prevent too many notifications
        
        if (error) {
            console.error("Error fetching notifications:", error);
            return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Mark unread notifications as read (optional - you might want to do this on click instead)
        const { error: updateError } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

        if (updateError) {
            console.error("Error marking notifications as read:", updateError);
            // Don't fail the request if this fails
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Unexpected error in notifications API:", error);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}

// Add a PATCH method to mark specific notifications as read
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { notificationId } = await request.json();

        if (!notificationId) {
            return new NextResponse(JSON.stringify({ error: 'Notification ID required' }), { status: 400 });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('recipient_id', user.id); // Ensure user can only update their own notifications

        if (error) {
            console.error("Error marking notification as read:", error);
            return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unexpected error in PATCH notifications:", error);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}