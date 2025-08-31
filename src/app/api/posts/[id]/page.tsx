import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import Image from 'next/image';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  try {
    // Get the currently logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the post with author details, likes, and comments
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url,
          first_name,
          last_name
        ),
        likes (user_id),
        comments (
          id,
          content,
          created_at,
          profiles:author_id (
            id,
            username,
            avatar_url,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (postError || !post) {
      console.error("Error fetching post:", postError);
      notFound();
    }

    const likesArray = post.likes || [];
    const commentsArray = post.comments || [];
    const isLiked = likesArray.some(like => like.user_id === user?.id);

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Feed
          </Link>
        </Button>

        {/* Post Card */}
        <Card className="mb-6">
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
            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                <span>{likesArray.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} />
                <span>{commentsArray.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          
          {/* Comment Input - only show if logged in */}
          {user && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{user.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea 
                      placeholder="Write a comment..."
                      className="w-full p-2 border rounded-lg resize-none"
                      rows={3}
                    />
                    <Button className="mt-2" size="sm">
                      Post Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {commentsArray.length > 0 ? (
              commentsArray.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{comment.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/${comment.profiles?.username || ''}`} className="font-semibold hover:underline text-sm">
                            {comment.profiles?.username || 'Unknown User'}
                          </Link>
                          <time className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </time>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    notFound();
  }
}