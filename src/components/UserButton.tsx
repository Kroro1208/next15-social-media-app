"use client"

import { useSession } from "@/app/(main)/SessionProvider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import UserAvatar from "./UserAvatar";
import { LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/action";

interface UserButtonProps {
    className?: string
}

export default function UserButton({className}: UserButtonProps) {
    const { user } = useSession();

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" className={cn("flex-none rounded-full", className)}>
                        <UserAvatar avatarUrl={user.avatarUrl} size={40}/>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-5 space-y-3">
                    <DropdownMenuLabel>
                        Logged in as @{user.username}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={`/users/${user.username}`}>
                        <DropdownMenuItem>
                            <UserIcon className="mr-2 size-4"/>
                            Profile
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => {logout()}}
                    >
                        <LogOutIcon className="mr-2 size-4"/>
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}