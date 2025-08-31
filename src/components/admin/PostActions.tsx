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
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Use a more generic type to avoid circular dependencies or complex types
interface PostLike {
    id: number;
}

export function PostActions({ post }: { post: PostLike }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm("Are you sure you want to archive this post?")) {
             const res = await fetch(`/api/admin/posts/${post.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success("Post archived");
                router.refresh();
            } else {
                toast.error("Failed to archive post");
            }
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
            <DropdownMenuItem onClick={handleDelete} className="text-red-500">Delete</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    )
}

