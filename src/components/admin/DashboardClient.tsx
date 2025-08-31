'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import StatsCard from "./StatsCard";
import { UsersChart } from "./UsersChart";
import { PostsChart } from "./PostsChart";
import { Skeleton } from "../ui/skeleton";
import { Users, FileText, Activity, UserPlus, TrendingUp } from "lucide-react";

interface DailyData {
    day: string;
    count: number;
}
interface AdminStats {
    total_users: number;
    total_posts: number;
    active_today: number;
    new_users_today: number;
    new_users_week: number;
    new_posts_week: number;
    daily_signups: DailyData[];
    daily_posts: DailyData[];
}

export default function DashboardClient() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    console.error("Failed to fetch admin stats");
                }
            } catch (error) {
                console.error("Error in admin stats fetch:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                     <Skeleton key={i} className="h-64 mb-4 break-inside-avoid" />
                ))}
            </div>
        );
    }

    if (!stats) {
        return <div>Failed to load stats. Please try again later.</div>
    }

    return (
        <div className="columns-1 md:columns-2 gap-4">
            <div className="break-inside-avoid mb-4">
                <StatsCard title="Total Users" value={stats.total_users} icon={Users} color="text-sky-500"/>
            </div>
             <div className="break-inside-avoid mb-4">
                <StatsCard title="New Users (Today)" value={stats.new_users_today} icon={UserPlus} color="text-amber-500" />
            </div>
            <div className="break-inside-avoid mb-4">
                <StatsCard title="Total Posts" value={stats.total_posts} icon={FileText} color="text-emerald-500"/>
            </div>
            <div className="break-inside-avoid mb-4">
                <StatsCard title="New Posts (Week)" value={stats.new_posts_week} icon={TrendingUp} color="text-indigo-500"/>
            </div>
             <div className="break-inside-avoid mb-4">
                <StatsCard title="Active Today" value={stats.active_today} icon={Activity} color="text-rose-500"/>
            </div>

            <div className="break-inside-avoid mb-4">
                <Card>
                    <CardHeader>
                        <CardTitle>New Users (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UsersChart data={stats.daily_signups} />
                    </CardContent>
                </Card>
            </div>
            <div className="break-inside-avoid mb-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>New Posts (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PostsChart data={stats.daily_posts} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}