import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/admin/DataTable";
import { userColumns } from "@/components/admin/UserColumns";
import { postColumns } from "@/components/admin/PostColumns";
import { SupabaseClient } from "@supabase/supabase-js";
import DashboardClient from "@/components/admin/DashboardClient";
import { Profile, AdminPost } from "@/lib/types";

async function getUsers(supabase: SupabaseClient): Promise<Profile[]> {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data ?? [];
}

async function getPosts(supabase: SupabaseClient): Promise<AdminPost[]> {
    // Corrected the query to ensure the author is fetched as a single object.
    const { data, error } = await supabase
        .from('posts')
        .select(`
            id,
            created_at,
            content,
            is_active,
            author:profiles!author_id (
                username,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching posts for admin:", error.message || 'An unknown error occurred');
        return [];
    }

    // This handles cases where Supabase might return a single-item array for a to-one join.
    const formattedData = (data || []).map(post => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
    }));

    return formattedData as AdminPost[];
}


export default async function AdminPage() {
    const supabase = await createClient();
    const [users, posts] = await Promise.all([
        getUsers(supabase),
        getPosts(supabase),
    ]);
    
    return (
        <div className="space-y-8">
             <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                     <DashboardClient />
                </TabsContent>
                <TabsContent value="users" className="mt-4">
                    <DataTable columns={userColumns} data={users} />
                </TabsContent>
                <TabsContent value="posts" className="mt-4">
                    <DataTable columns={postColumns} data={posts} />
                </TabsContent>
            </Tabs>
        </div>
    );
}