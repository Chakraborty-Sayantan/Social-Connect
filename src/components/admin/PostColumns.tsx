"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AdminPost } from "@/lib/types" 
import { PostActions } from "./PostActions"

export const postColumns: ColumnDef<AdminPost>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
        const author = row.original.author
        return <span>{author?.username ?? 'N/A'}</span>
    }
  },
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => {
        const content = row.getValue("content") as string
        return <p className="truncate max-w-xs">{content}</p>
    }
  },
  {
    accessorKey: "is_active",
    header: "Status",
     cell: ({ row }) => {
        const isActive = row.getValue("is_active")
        return isActive ? "Active" : "Archived"
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <PostActions post={row.original} />,
  },
]