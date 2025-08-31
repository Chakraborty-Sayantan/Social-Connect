'use client'

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

interface Notification {
    id: number;
    message: string;
    created_at: string;
    is_read: boolean;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
            setLoading(false);
        };
        fetchNotifications();
    }, []);

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            <div className="bg-white rounded-lg border shadow-sm">
                {loading && (
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
                {!loading && notifications.length === 0 && (
                    <p className="text-center text-muted-foreground p-8">You have no new notifications.</p>
                )}
                <ul className="divide-y">
                    {!loading && notifications.map(notif => (
                        <li key={notif.id} className="p-4 flex items-start gap-4">
                            <div className="bg-primary/10 text-primary p-2 rounded-full">
                                <Bell size={20}/>
                            </div>
                            <div>
                                <p>{notif.message}</p>
                                <time className="text-sm text-muted-foreground">
                                    {new Date(notif.created_at).toLocaleString()}
                                </time>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}