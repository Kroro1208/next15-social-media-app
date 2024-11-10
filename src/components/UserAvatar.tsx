import Image from "next/image"
import userAvatar from "../../public/avatar.png"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
    avatarUrl: string | null | undefined
    size?: number
    className?: string
}

export default function UserAvatar({
    avatarUrl,
    size,
    className
}: UserAvatarProps) {
    return (
        <Image
            src={userAvatar || avatarUrl }
            alt="userAvatar"
            width={size ?? 48}
            height={size ?? 48}
            className={cn("aspect-square h-fit flex-none rounded-full bg-secondary object-cover", className)}
        />
    )
}