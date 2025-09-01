"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { UserActions } from "./UserActions"

export const userColumns: ColumnDef<Profile>[] = [
  {
    accessorKey: "avatar_url",
    header: "Avatar",
    cell: ({ row }) => {
      const user = row.original
      return (
        <Avatar>
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
        </Avatar>
      )
    },
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
        const role = row.getValue("role") as string
        return <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
]