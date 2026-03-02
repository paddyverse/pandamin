'use client';

import { CheckCircle2, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { GHLSaasPlan } from '@/lib/ghl-types';

const PLAN_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

function formatPrice(price: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
}

interface PlanCardsProps {
    plans: GHLSaasPlan[];
    accountCounts: Record<string, number>;
    activePlanFilter: string;
    onFilterChange: (planId: string) => void;
    isLoading?: boolean;
}

export function PlanCards({
    plans,
    accountCounts,
    activePlanFilter,
    onFilterChange,
    isLoading = false,
}: PlanCardsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-28 mb-1" />
                            <Skeleton className="h-8 w-20" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {Array.from({ length: 3 }).map((__, j) => (
                                <Skeleton key={j} className="h-4 w-full" />
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-9 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 text-sm">
                No SaaS plans configured. Add plans in your GHL agency settings.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, idx) => {
                const color = PLAN_COLORS[idx % PLAN_COLORS.length];
                const count = accountCounts[plan.id] ?? 0;
                const isActive = activePlanFilter === plan.id;

                return (
                    <Card
                        key={plan.id}
                        className={`border shadow-sm bg-white transition-all duration-150 hover:shadow-md ${isActive ? 'ring-2 ring-offset-1' : ''
                            }`}
                        style={isActive ? { borderColor: color, '--tw-ring-color': color } as React.CSSProperties : {}}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                                        style={{ backgroundColor: color }}
                                    />
                                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                                        {plan.name}
                                    </h3>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="text-xs gap-1 shrink-0 border"
                                    style={{ backgroundColor: `${color}14`, color, borderColor: `${color}30` }}
                                >
                                    <Users className="h-3 w-3" />
                                    {count} {count === 1 ? 'account' : 'accounts'}
                                </Badge>
                            </div>

                            <p className="text-2xl font-extrabold text-slate-800 mt-2">
                                {formatPrice(plan.price, plan.currency)}
                                <span className="text-sm font-normal text-slate-400 ml-1">/mo</span>
                            </p>

                            {plan.description && (
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                    {plan.description}
                                </p>
                            )}
                        </CardHeader>

                        <CardContent className="pb-4">
                            {plan.features.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {plan.features.map((feat) => (
                                        <li key={feat} className="flex items-start gap-2 text-sm text-slate-600">
                                            <CheckCircle2
                                                className="h-4 w-4 shrink-0 mt-0.5"
                                                style={{ color }}
                                            />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-400">No features listed.</p>
                            )}

                            {plan.trialDays != null && (
                                <p className="mt-3 text-xs font-semibold" style={{ color }}>
                                    ✦ {plan.trialDays}-day free trial included
                                </p>
                            )}
                        </CardContent>

                        <CardFooter className="pt-0">
                            <Button
                                size="sm"
                                className="w-full h-9 font-medium transition-colors"
                                style={
                                    isActive
                                        ? { backgroundColor: color, borderColor: color, color: '#fff' }
                                        : { backgroundColor: `${color}10`, borderColor: `${color}40`, color }
                                }
                                variant="outline"
                                onClick={() => onFilterChange(isActive ? 'all' : plan.id)}
                            >
                                {isActive ? '✓ Showing this plan' : 'View Accounts'}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
