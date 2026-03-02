import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/** Skeleton matching the StatsCards + table layout of the accounts page */
export function LoadingState() {
    return (
        <div className="space-y-6">
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar skeleton */}
            <div className="flex gap-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-9" />
                </div>
            </div>

            {/* Table skeleton */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                {/* Header */}
                <div className="flex gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <Skeleton className="h-4 w-4" />
                    {[140, 120, 100, 100, 80, 80, 80].map((w, i) => (
                        <Skeleton key={i} className={`h-4 w-[${w}px]`} />
                    ))}
                </div>
                {/* Rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0"
                    >
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
