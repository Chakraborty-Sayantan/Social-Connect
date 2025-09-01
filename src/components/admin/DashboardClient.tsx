"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "./StatsCard";
import { UsersChart } from "./UsersChart";
import { PostsChart } from "./PostsChart";
import { RoleDistributionChart } from "./RoleDistributionChart";
import { PostsByCategoryChart } from "./PostsByCategoryChart";
import { SignupsByDayOfWeekChart } from "./SignupsByDayOfWeekChart";
import { PostsByHourChart } from "./PostsByHourChart";
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
} from "lucide-react";
import { AdminStats } from "@/lib/types";

export default function DashboardClient({ initialStats }: { initialStats: AdminStats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Users"
          value={initialStats.total_users}
          icon={Users}
          color="text-sky-500"
        />
        <StatsCard
          title="Total Posts"
          value={initialStats.total_posts}
          icon={FileText}
          color="text-emerald-500"
        />
        <StatsCard
          title="Active Today"
          value={initialStats.active_today}
          icon={Activity}
          color="text-rose-500"
        />
        <StatsCard
          title="New Users (Week)"
          value={initialStats.new_users_week}
          icon={Users}
          color="text-amber-500"
        />
        <StatsCard
          title="New Posts (Week)"
          value={initialStats.new_posts_week}
          icon={TrendingUp}
          color="text-indigo-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3 sm:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>New Users (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersChart data={initialStats.daily_signups} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Posts (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsChart data={initialStats.daily_posts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleDistributionChart data={initialStats.role_distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posts by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsByCategoryChart data={initialStats.posts_by_category} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Signups by Day of the Week</CardTitle>
          </CardHeader>
          <CardContent>
            <SignupsByDayOfWeekChart data={initialStats.signups_by_day_of_week} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posts by Hour of the Day</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsByHourChart data={initialStats.posts_by_hour} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}