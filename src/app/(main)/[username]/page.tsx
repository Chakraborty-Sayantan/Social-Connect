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

// ── Types that exactly match PostCard expectations ──
type PostCardPost = Post & {
  likes: { user_id: string }[];
  comments: { id: string }[];        
  profiles: AuthorSnapshot;                     
};

interface AuthorSnapshot {
  id: string;
  username: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  role: string;
}
type ProfileDetails = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website?: string | null;
  location?: string | null;
  visibility?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  post_count: number;
  follower_count: number;
  following_count: number;
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string };
}) {
  const supabase = await createClient();

  try {
    // Next.js 15 compat
    const resolvedParams = await Promise.resolve(params);
    const username = resolvedParams.username;

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Profile (case-insensitive)
    const { data: basicProfile } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();

    if (!basicProfile) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <h1 className="text-2xl font-bold">404 – Profile not found</h1>
        <p className="mt-2 text-muted-foreground">
          There is no user called “<strong>{username}</strong>”.
        </p>
        <Link href="/feed" className="mt-6 inline-block text-blue-600 hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

    // 3. Aggregates
    const [
      postsCountRes,
      followersCountRes,
      followingCountRes,
    ] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", basicProfile.id).eq("is_active", true),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", basicProfile.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", basicProfile.id),
    ]);

    const profile: ProfileDetails = {
      ...basicProfile,
      post_count: postsCountRes.count ?? 0,
      follower_count: followersCountRes.count ?? 0,
      following_count: followingCountRes.count ?? 0,
    };

    // 4. Follow status
    let isFollowing = false;
    if (user && user.id !== profile.id) {
      const { data: follow } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle();
      isFollowing = !!follow;
    }

    // 5. Posts with likes & comment rows
    const { data: rawPosts } = await supabase
      .from("posts")
      .select("*, likes(user_id), comments!left(id)")
      .eq("author_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const postsForPostCard: PostCardPost[] = (rawPosts ?? []).map((p) => ({
      ...p,
      profiles: {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        role: profile.role || "user",
      },
      likes: p.likes ?? [],
      comments: p.comments ?? [],
    }));

    const isOwnProfile = user?.id === profile.id;

    // 6. Render
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="p-6 bg-white rounded-lg border shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
              <AvatarFallback className="text-3xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              <p className="text-muted-foreground mt-1">
                {profile.first_name || ""} {profile.last_name || ""}
              </p>
              <p className="mt-4 max-w-prose">{profile.bio || "No bio yet."}</p>

              <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                <p>
                  <strong>{profile.post_count}</strong> Posts
                </p>
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

        {/* Posts */}
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {postsForPostCard.length ? (
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
                {isOwnProfile
                  ? "You haven't posted anything yet."
                  : "This user hasn't posted anything yet."}
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
  } catch (err) {
    console.error("Unexpected error in ProfilePage:", err);
    notFound();
  }
}