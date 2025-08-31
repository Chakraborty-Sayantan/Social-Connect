'use client';

import { useState } from "react";
import Image from 'next/image';
import { Post } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "../ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import FollowButton from "./FollowButton";
import { toast } from "sonner";

interface PostCardProps {
  post: Post & {
    likes: { user_id: string }[];
    comments: [{ count: number }];
  };
  currentUser: User | null;
  isFollowingAuthor: boolean;
}

export default function PostCard({ post, currentUser, isFollowingAuthor }: PostCardProps) {
  const likesArray = post.likes || [];
  const commentsCount = post.comments?.[0]?.count ?? 0;

  const [likeCount, setLikeCount] = useState(likesArray.length);
  const [isLiked, setIsLiked] = useState(likesArray.some(like => like.user_id === currentUser?.id));
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to like a post.");
      return;
    }

    if (isLiking) return;

    const newIsLiked = !isLiked;
    const previousLikeCount = likeCount;
    const previousIsLiked = isLiked;

    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    setIsLiking(true);

    try {
      const method = newIsLiked ? 'POST' : 'DELETE';
      const response = await fetch(`/api/posts/${post.id}/like`, { 
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Add any necessary body data
        body: method === 'POST' ? JSON.stringify({ 
          postId: post.id, 
          authorId: post.author_id 
        }) : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update like status');
      }
    } catch (error) {
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      toast.error("Failed to update like. Please try again.");
      console.error("Error updating like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentClick = () => {
    // Navigate to post detail page where comments can be viewed/added
    window.location.href = `/posts/${post.id}`;
  };
  
  const isOwnPost = currentUser?.id === post.author_id;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
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
        </div>
        {!isOwnPost && currentUser && (
          <FollowButton targetUserId={post.author_id} initialIsFollowing={isFollowingAuthor} />
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-4 relative aspect-video">
            <Image 
              src={post.image_url} 
              alt={`Image for post by ${post.profiles?.username || 'user'}`}
              fill
              className="rounded-lg border object-cover"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-start gap-4 p-4 pt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLike} 
          className="flex items-center gap-2"
          disabled={isLiking}
        >
          <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} /> 
          {likeCount}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={handleCommentClick}
        >
          <MessageCircle size={18} /> {commentsCount}
        </Button>
      </CardFooter>
    </Card>
  );
}