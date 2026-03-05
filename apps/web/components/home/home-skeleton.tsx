import { Skeleton } from "@/components/ui/skeleton";

export function HomeScreenSkeleton() {
  return (
    <div>
      {/* Greeting */}
      <div className="px-5 pt-1 pb-2">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Score gauge area */}
      <div className="px-5">
        <Skeleton className="h-3 w-36 mx-auto mb-3" />
        <Skeleton className="mx-auto rounded-full w-[260px] h-[260px]" />

        {/* Score label (overlaps empty half of gauge) */}
        <div className="text-center -mt-24 mb-5">
          <Skeleton className="h-5 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-52 mx-auto" />
        </div>

        {/* CTA button */}
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-3 w-44 mx-auto mt-3 mb-6" />
      </div>

      {/* Coverage list */}
      <div className="bg-muted/50 px-4 pt-4 pb-10">
        <Skeleton className="h-3 w-24 mb-3" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[54px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
