import { Skeleton } from "@/components/ui/skeleton"

export default function SessionLoading() {
  return (
    <div className="min-h-dvh p-4 space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
