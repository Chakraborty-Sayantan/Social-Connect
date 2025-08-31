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
import { Link as LinkIcon, MapPin } from "lucide-react";

export const revalidate = 0;

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
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  try {
    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch the profile. RLS is enforced here by Supabase.
    // If the profile is private or followers-only and the current user
    // doesn't have access, this will return `null`.
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();

    // If no profile is returned, it's either non-existent or private.
    // Show a 404 page for security to avoid leaking profile existence.
    if (!profile) {
      notFound();
    }

    // 3. If we get here, the user has permission to view the profile.
    // Now, we can fetch all the details.
    const [
      postsCountRes,
      followersCountRes,
      followingCountRes,
      postsDataRes
    ] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", profile.id).eq("is_active", true),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
      supabase
        .from("posts")
        .select("*, likes(user_id), comments!left(count)")
        .eq("author_id", profile.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);

    const profileDetails: ProfileDetails = {
      ...profile,
      post_count: postsCountRes.count ?? 0,
      follower_count: followersCountRes.count ?? 0,
      following_count: followingCountRes.count ?? 0,
    };
    
    // 4. Check if the current user is following this profile
    let isFollowing = false;
    const isOwnProfile = user?.id === profile.id;
    if (user && !isOwnProfile) {
      const { data: follow } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle();
      isFollowing = !!follow;
    }

    // Attach the profile to each post for the PostCard component
    const posts: PostForCard[] = (postsDataRes.data ?? []).map((p) => ({
      ...p,
      profiles: profile,
      likes: p.likes ?? [],
      comments: p.comments as [{ count: number }] ?? [{ count: 0 }],
    }));

    // 5. Render the page
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md">
              <AvatarImage src={profileDetails.avatar_url || undefined} alt={profileDetails.username} />
              <AvatarFallback className="text-4xl">
                {profileDetails.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-3xl font-bold">{profileDetails.username}</h1>
                 {isOwnProfile ? (
                    <Button asChild variant="secondary" className="mt-2 sm:mt-0">
                      <Link href="/settings">Edit Profile</Link>
                    </Button>
                  ) : user ? (
                    <FollowButton targetUserId={profileDetails.id} initialIsFollowing={isFollowing} />
                  ) : (
                    <Button asChild>
                      <Link href="/login">Follow</Link>
                    </Button>
                  )}
              </div>
              <p className="text-muted-foreground mt-1">
                {profileDetails.first_name || ""} {profileDetails.last_name || ""}
              </p>
              
              <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                <p><strong>{profileDetails.post_count}</strong> Posts</p>
                <FollowerListModal userId={profileDetails.id} type="followers">
                  <button className="hover:underline"><strong>{profileDetails.follower_count}</strong> Followers</button>
                </FollowerListModal>
                <FollowerListModal userId={profileDetails.id} type="following">
                  <button className="hover:underline"><strong>{profileDetails.following_count}</strong> Following</button>
                </FollowerListModal>
              </div>

               <div className="flex flex-col sm:flex-row gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground justify-center sm:justify-start">
                    {profileDetails.location && (
                        <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{profileDetails.location}</span>
                        </div>
                    )}
                    {profileDetails.website && (
                        <div className="flex items-center gap-1">
                            <LinkIcon size={14} />
                            <a href={profileDetails.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                {profileDetails.website.replace(/https?:\/\//, '')}
                            </a>
                        </div>
                    )}
                </div>

              <p className="mt-4 max-w-prose">{profileDetails.bio || "No bio yet."}</p>
            </div>
          </div>
        </div>

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