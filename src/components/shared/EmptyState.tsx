import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {Icon && (
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
                </div>
            )}
            <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-400 max-w-xs mb-5">{description}</p>
            )}
            {actionLabel && onAction && (
                <Button size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
