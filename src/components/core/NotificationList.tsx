'use client'

import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { DetailedNotification } from "@/lib/types";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'like': return <Heart size={16} className="text-red-500" />;
        case 'comment': return <MessageCircle size={16} className="text-blue-500" />;
        case 'follow': return <UserPlus size={16} className="text-green-500" />;
        default: return <Bell size={16} />;
    }
};

interface NotificationListProps {
    notifications: DetailedNotification[];
    loading: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onMarkAsRead: (id: number) => void;
}

export default function NotificationList({ notifications, loading, onOpenChange, onMarkAsRead }: NotificationListProps) {
    
    return (
        <TooltipProvider>
            <div className="max-h-96 overflow-y-auto">
                {loading && (
                    <div className="space-y-3 p-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-4/5" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && notifications.length === 0 && (
                    <div className="text-center py-8">
                        <Bell className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-center text-sm text-muted-foreground">No new notifications.</p>
                    </div>
                )}
                {!loading && (
                    <ul className="space-y-1 p-2">
                        {notifications.map(notif => (
                            <li key={notif.id} className="flex items-center justify-between gap-2 p-3 rounded-md hover:bg-accent">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0 pt-1">
                                        {getNotificationIcon(notif.notification_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2">
                                            <Link href={`/${notif.sender_username}`} onClick={() => onOpenChange(false)} className="flex-shrink-0">
                                                <Avatar className="h-6 w-6">
                                                        <AvatarImage src={notif.sender_avatar_url || undefined} />
                                                        <AvatarFallback>{notif.sender_username.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">
                                                    <Link href={`/${notif.sender_username}`} onClick={() => onOpenChange(false)} className="font-semibold hover:underline cursor-pointer">
                                                        {notif.sender_username}
                                                    </Link>{' '}
                                                    {notif.message.replace(notif.sender_username, '').trim()}
                                                </p>
                                                <time className="text-xs text-muted-foreground mt-0.5 block">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </time>
                                                {notif.post_id && notif.post_content && (
                                                    <Link href={`/posts/${notif.post_id}`} onClick={() => onOpenChange(false)} className="cursor-pointer">
                                                        <p className="text-xs text-muted-foreground mt-1 truncate hover:underline">
                                                            &quot;{notif.post_content}&quot;
                                                        </p>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {!notif.is_read && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onMarkAsRead(notif.id)}>
                                                <span className="h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Mark as read</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </TooltipProvider>
    );
}