import { createClient } from "@/lib/supabase/server-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/admin/DataTable";
import { userColumns } from "@/components/admin/UserColumns";
import { postColumns } from "@/components/admin/PostColumns";
import DashboardClient from "@/components/admin/DashboardClient";
import { Profile, AdminPost, AdminStats } from "@/lib/types";

export const revalidate = 0;

async function getStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    { count: total_users },
    { count: total_posts },
    { count: active_today },
    { count: new_users_today },
    { count: new_users_week },
    { count: new_posts_week },
    { data: daily_signups },
    { data: daily_posts },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_active_at", today.toISOString()),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase.rpc("get_daily_signups"),
    supabase.rpc("get_daily_posts"),
  ]);

  return {
    total_users: total_users ?? 0,
    total_posts: total_posts ?? 0,
    active_today: active_today ?? 0,
    new_users_today: new_users_today ?? 0,
    new_users_week: new_users_week ?? 0,
    new_posts_week: new_posts_week ?? 0,
    daily_signups: daily_signups ?? [],
    daily_posts: daily_posts ?? [],
  };
}

async function getUsers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function getPosts(): Promise<AdminPost[]> {
  const supabase = await createClient();
 const { data, error } = await supabase
  .from("posts")
  .select(
    `
    id,
    created_at,
    content,
    is_active,
    author:profiles!author_id(  
      username,
      avatar_url
    )
    `
  )
  .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts for admin:", error.message);
    return [];
  }

  return (data as unknown as AdminPost[]) ?? [];
}

export default async function AdminPage() {
  const [stats, users, posts] = await Promise.all([
    getStats(),
    getUsers(),
    getPosts(),
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
          <DashboardClient initialStats={stats} />
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