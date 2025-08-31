'use client'

import { useState, PropsWithChildren } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { Profile } from "@/lib/types";

interface FollowerListModalProps {
    userId: string;
    type: 'followers' | 'following';
}

export default function FollowerListModal({ userId, type, children }: PropsWithChildren<FollowerListModalProps>) {
    const [list, setList] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchList = async () => {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}/${type}`);
        if (res.ok) {
            setList(await res.json());
        }
        setLoading(false);
    };

    return (
        <Dialog onOpenChange={(open) => open && fetchList()}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="capitalize">{type}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                    {loading ? <p>Loading...</p> : list.map(profile => (
                        <div key={profile.id} className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback>{profile.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/${profile.username}`} className="font-semibold hover:underline">{profile.username}</Link>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}