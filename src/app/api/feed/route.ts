import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Who do I follow (+ myself)
  const { data: followedUsers, error: followError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followError) {
    return NextResponse.json({ error: followError.message }, { status: 500 });
  }

  const authorIds = [...followedUsers.map((f) => f.following_id), user.id];

  // 2. Get posts with likes & comment count
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id(*),
      likes(user_id),
      comments!left(id)
    `)
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  return NextResponse.json(posts);
}