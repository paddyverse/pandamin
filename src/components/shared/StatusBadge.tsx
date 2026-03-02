'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'active' | 'inactive' | 'on' | 'off' | 'error' | 'trialing' | 'past_due';

const STATUS_CONFIG: Record<
    StatusType,
    { label: string; className: string }
> = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
    trialing: { label: 'Trialing', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-500 border-slate-200' },
    past_due: { label: 'Past Due', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    on: { label: 'On', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    off: { label: 'Off', className: 'bg-red-100 text-red-600 border-red-200' },
    error: { label: 'Error', className: 'bg-red-100 text-red-700 border-red-200' },
};

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
    return (
        <Badge
            variant="outline"
            className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full border',
                config.className,
                className
            )}
        >
            {label ?? config.label}
        </Badge>
    );
}
