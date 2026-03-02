'use client';

import {
    Building2,
    Zap,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
    totalAccounts: number;
    activeSaas: number;
    rebillingOn: number;
    rebillingOff: number;
}

interface StatCardConfig {
    label: string;
    icon: React.ElementType;
    value: number;
    trend: number | null; // % change vs last month
    iconBg: string;
    iconColor: string;
}

function StatCard({
    label,
    icon: Icon,
    value,
    trend,
    iconBg,
    iconColor,
}: StatCardConfig) {
    const trendPositive = trend !== null && trend > 0;
    const trendNegative = trend !== null && trend < 0;

    return (
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {label}
                    </span>
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
                        <Icon className={cn('h-4.5 w-4.5', iconColor)} />
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-slate-800 tabular-nums">
                        {value.toLocaleString()}
                    </span>
                    {trend !== null && (
                        <span
                            className={cn(
                                'flex items-center gap-0.5 text-xs font-medium',
                                trendPositive && 'text-green-600',
                                trendNegative && 'text-red-500',
                                !trendPositive && !trendNegative && 'text-slate-400'
                            )}
                        >
                            {trendPositive ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                            ) : trendNegative ? (
                                <TrendingDown className="h-3.5 w-3.5" />
                            ) : (
                                <Minus className="h-3.5 w-3.5" />
                            )}
                            {Math.abs(trend)}% vs last mo.
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function StatsCards({
    totalAccounts,
    activeSaas,
    rebillingOn,
    rebillingOff,
}: StatsCardsProps) {
    const cards: StatCardConfig[] = [
        {
            label: 'Total Subaccounts',
            icon: Building2,
            value: totalAccounts,
            trend: 8,   // TODO: Phase 4 — calculate real trend
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
        },
        {
            label: 'Active SaaS',
            icon: Zap,
            value: activeSaas,
            trend: 12,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
        },
        {
            label: 'Rebilling On',
            icon: CheckCircle,
            value: rebillingOn,
            trend: 3,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
        },
        {
            label: 'Rebilling Off',
            icon: XCircle,
            value: rebillingOff,
            trend: -5,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <StatCard key={card.label} {...card} />
            ))}
        </div>
    );
}
