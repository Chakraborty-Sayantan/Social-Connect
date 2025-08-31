import { createClient } from "@/lib/supabase/server";
import { PostgrestError } from '@supabase/supabase-js';
import { Post } from "@/lib/types";
import PostCard from "@/components/core/PostCard";
import CreatePost from "@/components/core/CreatePost";

export const revalidate = 0; // Make sure the feed is always dynamic

export default async function FeedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch feed posts
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`*, profiles:author_id (*)`)
        .order('created_at', { ascending: false })
        .limit(20) as { data: Post[] | null; error: PostgrestError | null };

    // Fetch the list of users the current user follows
    const { data: followingList } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user!.id);
        
    const followingIds = new Set(followingList?.map(f => f.following_id));

    if (error) {
        return <div className="text-center py-8">Error loading feed. Please try again later.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <CreatePost />
            <div className="space-y-4 mt-8">
                {posts?.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post}
                        currentUser={user}
                        isFollowingAuthor={followingIds.has(post.author_id)}
                    />
                ))}
            </div>
        </div>
    );
}