'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminStats {
    total_users: number;
    total_posts: number;
    active_today: number;
}
interface UserProfile { id: string; username: string; email: string; is_active: boolean; }
interface Post { id: number; content: string; author: { username: string }; }

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const router = useRouter();

    const fetchData = async () => {
        const [statsRes, usersRes, postsRes] = await Promise.all([
            fetch('/api/admin/stats'),
            fetch('/api/admin/users'),
            fetch('/api/admin/posts')
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (postsRes.ok) setPosts(await postsRes.json());
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleDeletePost = async (postId: number) => {
        if (confirm("Are you sure you want to delete this post?")) {
            const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Post deleted.");
                fetchData();
            } else {
                toast.error("Failed to delete post.");
            }
        }
    };

    return (
        <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.total_users ?? '...'}</p></CardContent></Card>
                <Card><CardHeader><CardTitle>Total Posts</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.total_posts ?? '...'}</p></CardContent></Card>
                <Card><CardHeader><CardTitle>Active Today</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.active_today ?? '...'}</p></CardContent></Card>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4">Users</h2>
                <div className="bg-white rounded-lg border shadow-sm">
                    {users.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-4 border-b">
                            <div>
                                <p className="font-semibold">{user.username}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold mb-4">Posts</h2>
                 <div className="bg-white rounded-lg border shadow-sm">
                    {posts.map(post => (
                        <div key={post.id} className="flex justify-between items-center p-4 border-b">
                            <p className="truncate pr-4">{post.content}</p>
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post.id)}>Delete</Button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}