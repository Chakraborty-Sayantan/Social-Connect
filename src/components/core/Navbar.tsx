'use client'

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, DetailedNotification } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Cog, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import NotificationList from './NotificationList';

interface NavbarProps {
  user: User | null;
  profile: Profile | null;
}

export default function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<DetailedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
            const data: DetailedNotification[] = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.is_read).length);
        }
    } catch (error) {
        console.error("Failed to fetch initial notifications", error);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkOneAsRead = useCallback((notificationId: number) => {
    setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
    });
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
    });
  }, []);
  
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
            const { data: newNotification } = await supabase
                .from('detailed_notifications')
                .select('*')
                .eq('id', payload.new.id)
                .single();
            
            if (newNotification) {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                toast.info(newNotification.message, {
                    icon: <Bell size={16} />,
                    action: {
                        label: 'View',
                        onClick: () => setPopoverOpen(true),
                    },
                });
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-14">
                <Link href="/feed" className="text-xl font-bold text-gray-800 hover:text-gray-900 transition-colors">
                    SocialConnect
                </Link>

                {user && profile && (
                    <div className="flex items-center gap-4">
                        <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <div className="relative">
                                        <Bell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-medium text-sm">Notifications</h4>
                                    {unreadCount > 0 && (
                                        <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                                            Mark all as read
                                        </Button>
                                    )}
                                </div>
                                <NotificationList 
                                    notifications={notifications}
                                    loading={isLoading}
                                    onOpenChange={setPopoverOpen}
                                    onMarkAsRead={handleMarkOneAsRead}
                                />
                            </PopoverContent>
                        </Popover>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar>
                                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                                <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{profile.username}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/${profile.username}`)}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/settings')}>
                                <Cog className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            
                            {profile.role === 'admin' && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/admin')}>
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    <span>Admin Dashboard</span>
                                </DropdownMenuItem>
                                </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    </nav>
  );
}