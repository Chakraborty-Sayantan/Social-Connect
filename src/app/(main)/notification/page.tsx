'use client'

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface NotificationSender {
    username: string;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
}

interface NotificationPost {
    id: number;
    content: string;
}

interface Notification {
    id: number;
    message: string;
    created_at: string;
    is_read: boolean;
    notification_type: 'follow' | 'like' | 'comment';
    sender: NotificationSender;
    post: NotificationPost | null;
    sender_id: string;
    post_id: number | null;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'like':
            return <Heart size={20} className="text-red-500" />;
        case 'comment':
            return <MessageCircle size={20} className="text-blue-500" />;
        case 'follow':
            return <UserPlus size={20} className="text-green-500" />;
        default:
            return <Bell size={20} />;
    }
};

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'like':
            return 'bg-red-50 border-red-200';
        case 'comment':
            return 'bg-blue-50 border-blue-200';
        case 'follow':
            return 'bg-green-50 border-green-200';
        default:
            return 'bg-gray-50 border-gray-200';
    }
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to fetch notifications');
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
                setError('Failed to load notifications');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (notificationId: number) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notificationId }),
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId
                            ? { ...notif, is_read: true }
                            : notif
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg border shadow-sm">
                {loading && (
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {!loading && !error && notifications.length === 0 && (
                    <div className="text-center py-12">
                        <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-center text-muted-foreground">You have no notifications yet.</p>
                    </div>
                )}
                
                <ul className="divide-y">
                    {!loading && notifications.map(notif => (
                        <li 
                            key={notif.id} 
                            className={`p-4 transition-colors hover:bg-gray-50 ${
                                !notif.is_read ? 'bg-blue-50/30 border-l-4 border-l-blue-400' : ''
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className={`p-2 rounded-full border ${getNotificationColor(notif.notification_type)}`}>
                                        {getNotificationIcon(notif.notification_type)}
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3">
                                        <Link href={`/${notif.sender.username}`}>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage 
                                                    src={notif.sender.avatar_url || undefined}
                                                    alt={notif.sender.username}
                                                />
                                                <AvatarFallback>
                                                    {notif.sender.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                <Link 
                                                    href={`/${notif.sender.username}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {notif.sender.username}
                                                </Link>
                                                {' '}
                                                {notif.notification_type === 'like' && 'liked your post'}
                                                {notif.notification_type === 'comment' && 'commented on your post'}
                                                {notif.notification_type === 'follow' && 'started following you'}
                                            </p>
                                            
                                            {notif.post && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    &quot;{notif.post.content}&quot;
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center gap-2 mt-2">
                                                <time className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(notif.created_at)}
                                                </time>
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}