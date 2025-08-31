import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowerListModal from "@/components/core/FollowerListModal";
import FollowButton from "@/components/core/FollowButton";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/core/PostCard";
import { Post } from "@/lib/types";
import Link from "next/link";

export const revalidate = 0;

interface ProfileDetails {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  post_count: number;
  follower_count: number;
  following_count: number;
}

type PostCardPost = Post & { 
  likes: { user_id: string; }[]; 
  _count: { comments: number; }; 
};

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error fetching user:", userError);
    }

    const { data: profile, error: profileError } = await supabase
      .rpc('get_profile_details', { p_username: params.username })
      .single<ProfileDetails>();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      notFound();
    }

    let isFollowing = false;
    if (user && user.id !== profile.id) {
      try {
        const { data: follow, error: followError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle();
        
        if (followError) {
          console.error("Error checking follow status:", followError);
        } else {
          isFollowing = !!follow;
        }
      } catch (error) {
        console.error("Unexpected error checking follow status:", error);
      }
    }

    // Try a simpler query first to debug
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url,
          first_name,
          last_name,
          bio,
          role
        ),
        likes:likes (user_id),
        comments (id)
      `)
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    }

    // Debug: Log the raw posts data
    console.log("Raw posts data:", posts);

    const postsForPostCard: PostCardPost[] = (posts || []).map(post => {
      // Debug: Log each post transformation
      console.log("Transforming post:", post.id, "likes:", post.likes, "comments:", post.comments);
      
      return {
        ...post,
        profiles: {
          id: post.profiles?.id || profile.id,
          username: post.profiles?.username || profile.username,
          avatar_url: post.profiles?.avatar_url || profile.avatar_url,
          first_name: post.profiles?.first_name || profile.first_name,
          last_name: post.profiles?.last_name || profile.last_name,
          bio: post.profiles?.bio || profile.bio,
          role: post.profiles?.role || 'user',
        },
        likes: Array.isArray(post.likes) ? post.likes : [],
        _count: {
          comments: Array.isArray(post.comments) ? post.comments.length : 0
        }
      };
    });

    const isOwnProfile = user?.id === profile.id;

    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-6 bg-white rounded-lg border shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
              <AvatarImage 
                src={profile.avatar_url || undefined} 
                alt={`${profile.username}'s avatar`} 
              />
              <AvatarFallback className="text-3xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              <p className="text-muted-foreground mt-1">
                {profile.first_name || ''} {profile.last_name || ''}
              </p>
              <p className="mt-4 max-w-prose">{profile.bio || "No bio yet."}</p>
              
              <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                <p><strong>{profile.post_count || 0}</strong> Posts</p>
                <FollowerListModal userId={profile.id} type="followers">
                  <button className="hover:underline">
                    <strong>{profile.follower_count || 0}</strong> Followers
                  </button>
                </FollowerListModal>
                <FollowerListModal userId={profile.id} type="following">
                  <button className="hover:underline">
                    <strong>{profile.following_count || 0}</strong> Following
                  </button>
                </FollowerListModal>
              </div>
            </div>
            
            <div className="sm:ml-auto">
              {isOwnProfile ? (
                <Button asChild variant="secondary">
                  <Link href="/settings">Edit Profile</Link>
                </Button>
              ) : user ? (
                <FollowButton targetUserId={profile.id} initialIsFollowing={isFollowing} />
              ) : (
                <Button asChild>
                  <Link href="/login">Follow</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {postsForPostCard.length > 0 ? (
            postsForPostCard.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                currentUser={user}
                isFollowingAuthor={isFollowing}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              This user hasn&apos;t posted anything yet.
            </p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error in ProfilePage:", error);
    notFound();
  }
}