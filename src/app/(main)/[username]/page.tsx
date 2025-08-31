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

type PostCardPost = Post & { 
  likes: { user_id: string; }[]; 
  _count: { comments: number; }; 
};

type ProfileDetails = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  post_count: number;
  follower_count: number;
  following_count: number;
  website?: string | null;
  location?: string | null;
  visibility?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

export default async function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> | { username: string }
}) {
  const supabase = await createClient();
  
  try {
    // Handle both Promise and direct params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const username = resolvedParams.username;

    console.log("Looking for username:", username);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error fetching user:", userError);
    }

    // Try multiple approaches to find the profile
    let basicProfile = null;
    let basicProfileError = null;

    // First try: exact match (case sensitive)
    const { data: exactMatch, error: exactError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (exactMatch) {
      basicProfile = exactMatch;
    } else {
      // Second try: case insensitive match
      const { data: caseInsensitiveMatch, error: caseError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .maybeSingle();

      if (caseInsensitiveMatch) {
        basicProfile = caseInsensitiveMatch;
      } else {
        basicProfileError = caseError || exactError;
      }
    }

    console.log("Profile search result:", { basicProfile, basicProfileError });

    if (basicProfileError) {
      console.error("Error fetching profile:", basicProfileError);
      notFound();
    }

    if (!basicProfile) {
      console.log("No profile found for username:", username);
      notFound();
    }

    // Get counts separately for better reliability
    const [postsCountResult, followersCountResult, followingCountResult] = await Promise.all([
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', basicProfile.id)
        .eq('is_active', true),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', basicProfile.id),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', basicProfile.id)
    ]);

    const profile: ProfileDetails = {
      id: basicProfile.id,
      username: basicProfile.username,
      first_name: basicProfile.first_name,
      last_name: basicProfile.last_name,
      bio: basicProfile.bio,
      avatar_url: basicProfile.avatar_url,
      website: basicProfile.website,
      location: basicProfile.location,
      visibility: basicProfile.visibility || 'public',
      role: basicProfile.role || 'user',
      created_at: basicProfile.created_at,
      updated_at: basicProfile.updated_at,
      post_count: postsCountResult.count || 0,
      follower_count: followersCountResult.count || 0,
      following_count: followingCountResult.count || 0,
    };

    let isFollowing = false;
    if (user && user.id !== profile.id) {
      try {
        const { data: follow, error: followError } = await supabase
          .from('follows')
          .select('follower_id')
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

    // Fetch posts with multiple fallback strategies
    let posts = null;
    let postsError = null;

    // Strategy 1: Try with explicit foreign key join
    try {
      const { data: postsData1, error: postsError1 } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_url,
            first_name,
            last_name,
            bio,
            role
          ),
          likes (user_id),
          comments (id)
        `)
        .eq('author_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (postsData1 && !postsError1) {
        posts = postsData1.map(post => ({
          ...post,
          profiles: post.author
        }));
      } else {
        console.log("Strategy 1 failed:", postsError1);
        throw new Error("Strategy 1 failed");
      }
    } catch (_error) {
      // Strategy 2: Try with simple join
      try {
        const { data: postsData2, error: postsError2 } = await supabase
          .from('posts')
          .select(`
            *,
            likes (user_id),
            comments (id)
          `)
          .eq('author_id', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (postsData2 && !postsError2) {
          posts = postsData2;
        } else {
          console.log("Strategy 2 failed:", postsError2);
          throw new Error("Strategy 2 failed");
        }
      } catch (_error2) {
        // Strategy 3: Just get basic posts without joins
        const { data: postsData3, error: postsError3 } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (postsError3) {
          console.error("All post fetching strategies failed. Last error:", postsError3);
          postsError = postsError3;
          posts = [];
        } else {
          posts = postsData3 || [];
          
          // Get likes and comments separately for each post
          const postsWithMetadata = await Promise.all(
            posts.map(async (post) => {
              const [likesResult, commentsResult] = await Promise.all([
                supabase.from('likes').select('user_id').eq('post_id', post.id),
                supabase.from('comments').select('id').eq('post_id', post.id)
              ]);

              return {
                ...post,
                likes: likesResult.data || [],
                comments: commentsResult.data || []
              };
            })
          );

          posts = postsWithMetadata;
        }
      }
    }

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      // Don't fail the page if posts can't be loaded, just show empty state
    }

    // Transform posts for PostCard component
    const postsForPostCard: PostCardPost[] = (posts || []).map(post => {
      const postProfiles = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
      
      return {
        ...post,
        profiles: postProfiles || {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          role: profile.role || 'user',
        },
        likes: Array.isArray(post.likes) ? post.likes : [],
        _count: {
          comments: Array.isArray(post.comments) ? post.comments.length : 0
        }
      };
    });

    const isOwnProfile = user?.id === profile.id;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
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
                {profile.first_name && profile.last_name 
                  ? `${profile.first_name} ${profile.last_name}`.trim()
                  : profile.first_name || profile.last_name || ''
                }
              </p>
              <p className="mt-4 max-w-prose">{profile.bio || "No bio yet."}</p>
              
              <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                <p><strong>{profile.post_count}</strong> Posts</p>
                <FollowerListModal userId={profile.id} type="followers">
                  <button className="hover:underline">
                    <strong>{profile.follower_count}</strong> Followers
                  </button>
                </FollowerListModal>
                <FollowerListModal userId={profile.id} type="following">
                  <button className="hover:underline">
                    <strong>{profile.following_count}</strong> Following
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
                isFollowingAuthor={isOwnProfile ? true : isFollowing}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-lg">
                {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
              </p>
              {isOwnProfile && (
                <p className="mt-2">
                  <Link href="/" className="text-blue-600 hover:underline">
                    Create your first post
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error in ProfilePage:", error);
    notFound();
  }
}