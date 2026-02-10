import { Badge } from "@/components/ui/badge"
import { Crown, User, UserRound } from "lucide-react"
import type { UserType } from "@/types"

interface UserTypeBadgeProps {
  userType: UserType
  className?: string
}

export function UserTypeBadge({ userType, className }: UserTypeBadgeProps) {
  const config = {
    GUEST: {
      label: "Convidado",
      variant: "secondary" as const,
      icon: UserRound,
      className: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
    },
    FREE: {
      label: "Free",
      variant: "default" as const,
      icon: User,
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    },
    PREMIUM: {
      label: "Premium",
      variant: "default" as const,
      icon: Crown,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    },
  }

  const { label, icon: Icon, className: badgeClassName } = config[userType]

  return (
    <Badge variant="outline" className={`${badgeClassName} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  )
}
