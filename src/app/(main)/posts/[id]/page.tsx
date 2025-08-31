import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import Image from 'next/image';
import CommentSection from "@/components/core/CommentSection";


export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url
        ),
        likes (user_id),
        comments (id)
      `)
      .eq('id', params.id)
      .single();

    if (postError || !post) {
      console.error("Error fetching post:", postError);
      notFound();
    }

    const likesArray = post.likes || [];
    const commentsArray = post.comments || [];
    const isLiked = likesArray.some((like: { user_id: string }) => like.user_id === user?.id);

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/feed" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Feed
          </Link>
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>{post.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/${post.profiles?.username || ''}`} className="font-semibold hover:underline">
                {post.profiles?.username || 'Unknown User'}
              </Link>
              <time className="text-sm text-muted-foreground block">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </time>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="whitespace-pre-wrap mb-4">{post.content}</p>
            {post.image_url && (
              <div className="relative aspect-video mb-4">
                <Image
                  src={post.image_url}
                  alt={`Image for post by ${post.profiles?.username || 'user'}`}
                  fill
                  className="rounded-lg border object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                  <Heart size={16} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                  <span>{likesArray.length} Likes</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <MessageCircle size={16} />
                  <span>{commentsArray.length} Comments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <CommentSection postId={post.id} />

      </div>
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    notFound();
  }
}