'use client'

import { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Comment {
    id: number;
    content: string;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string | null;
    }
}

export default function CommentSection({ postId }: { postId: number }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
            const data = await res.json();
            setComments(data);
        }
        setLoading(false);
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        
        const res = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newComment }),
        });

        if (res.ok) {
            setNewComment("");
            toast.success("Comment added!");
            fetchComments(); // Refresh comments
        } else {
            toast.error("Failed to add comment.");
        }
        setSubmitting(false);
    };

    return (
        <div className="pt-4 mt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>
            <form onSubmit={handleSubmitComment} className="flex gap-2 mb-6">
                <Textarea 
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={1}
                    className="resize-none"
                />
                <Button type="submit" disabled={submitting}>
                    {submitting ? "..." : "Post"}
                </Button>
            </form>
            <div className="space-y-4">
                {loading ? (
                    <Skeleton className="h-20 w-full" />
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles.avatar_url || undefined} />
                                <AvatarFallback>{comment.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg p-3 w-full">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{comment.profiles.username}</span>
                                    <time className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </time>
                                </div>
                                <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
                 {!loading && comments.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No comments yet. Be the first!</p>}
            </div>
        </div>
    );
}