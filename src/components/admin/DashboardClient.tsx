"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "./StatsCard";
import { UsersChart } from "./UsersChart";
import { PostsChart } from "./PostsChart";
import {
  Users,
  FileText,
  Activity,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { AdminStats } from "@/lib/types";

export default function DashboardClient({ initialStats }: { initialStats: AdminStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Users"
        value={initialStats.total_users}
        icon={Users}
        color="text-sky-500"
      />
      <StatsCard
        title="New Users (Today)"
        value={initialStats.new_users_today}
        icon={UserPlus}
        color="text-amber-500"
      />
      <StatsCard
        title="Total Posts"
        value={initialStats.total_posts}
        icon={FileText}
        color="text-emerald-500"
      />
      <StatsCard
        title="New Posts (Week)"
        value={initialStats.new_posts_week}
        icon={TrendingUp}
        color="text-indigo-500"
      />
      <StatsCard
        title="Active Today"
        value={initialStats.active_today}
        icon={Activity}
        color="text-rose-500"
      />

      <div className="sm:col-span-2 lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle>New Users (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersChart data={initialStats.daily_signups} />
          </CardContent>
        </Card>
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle>New Posts (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsChart data={initialStats.daily_posts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}