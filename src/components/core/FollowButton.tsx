'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${targetUserId}/follow`, { 
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Something went wrong.');
      }

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Unfollowed successfully!' : 'Followed successfully!');
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update follow status.';
      toast.error(message);
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleFollow} 
      disabled={isLoading} 
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
    >
      {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}