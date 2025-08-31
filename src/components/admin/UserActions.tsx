"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { Profile } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function UserActions({ user }: { user: Profile }) {
    const router = useRouter();

    const handleRoleChange = async (role: 'user' | 'admin') => {
        const res = await fetch(`/api/admin/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        if (res.ok) {
            toast.success(`User role updated to ${role}`);
            router.refresh();
        } else {
            toast.error("Failed to update user role");
        }
    }

    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleRoleChange('admin')}>Make Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange('user')}>Make User</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    )
}

