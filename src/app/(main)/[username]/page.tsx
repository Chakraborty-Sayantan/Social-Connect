import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowerListModal from "@/components/core/FollowerListModal";
import FollowButton from "@/components/core/FollowButton";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/core/PostCard";
import { Post, Profile } from "@/lib/types";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

export const revalidate = 0;

// This is the shape of data the PostCard component expects
type PostForCard = Post & {
  likes: { user_id: string }[];
  comments: [{ count: number }];
  category?: string;
};

type ProfileDetails = Profile & {
  post_count: number;
  follower_count: number;
  following_count: number;
};

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createClient();

  try {
    const { username } = params;

    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch the profile by username (case-insensitive)
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

    // 3. Fetch aggregate counts in parallel
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

    // 4. Check if the current user is following this profile
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

    // 5. Fetch the user's posts with correct comment count
    const { data: postsData } = await supabase
      .from("posts")
      .select("*, likes(user_id), comments!left(count)") // Fixed: Fetches comment count correctly
      .eq("author_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Attach the profile to each post for the PostCard component
    const posts: PostForCard[] = (postsData ?? []).map((p) => ({
      ...p,
      profiles: profile,
      likes: p.likes ?? [],
      comments: p.comments as [{ count: number }] ?? [{ count: 0 }],
    }));

    const isOwnProfile = user?.id === profile.id;

    // 6. Render the page
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
              <AvatarFallback className="text-4xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                 {isOwnProfile ? (
                    <Button asChild variant="secondary" className="mt-2 sm:mt-0">
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
              <p className="text-muted-foreground mt-1">
                {profile.first_name || ""} {profile.last_name || ""}
              </p>
              
              <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                <p><strong>{profile.post_count}</strong> Posts</p>
                <FollowerListModal userId={profile.id} type="followers">
                  <button className="hover:underline"><strong>{profile.follower_count}</strong> Followers</button>
                </FollowerListModal>
                <FollowerListModal userId={profile.id} type="following">
                  <button className="hover:underline"><strong>{profile.following_count}</strong> Following</button>
                </FollowerListModal>
              </div>

              <p className="mt-4 max-w-prose">{profile.bio || "No bio yet."}</p>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user as User | null}
                isFollowingAuthor={isOwnProfile ? true : isFollowing}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border">
              <p className="text-lg">
                {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
              </p>
              {isOwnProfile && (
                <Button asChild variant="link" className="mt-2">
                  <Link href="/feed">Create your first post</Link>
                </Button>
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