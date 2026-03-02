'use client';

import Link from 'next/link';
import { PlusCircle, Users, ArrowRight } from 'lucide-react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { PlanDistributionChart } from '@/components/dashboard/PlanDistributionChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocations } from '@/hooks/useLocations';
import { useSaasPlans, useSaasAccounts } from '@/hooks/useSaasPlans';

// ─── Color palette for plan chart ─────────────────────────────────────────────
const PLAN_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const LOADING_STATS = { totalAccounts: 0, activeSaas: 0, rebillingOn: 0, rebillingOff: 0 };

export default function DashboardPage() {
    const locationsQuery = useLocations({ limit: 1 }); // only need total count
    const plansQuery = useSaasPlans();
    const accountsQuery = useSaasAccounts();

    const isLoading = locationsQuery.isLoading || plansQuery.isLoading || accountsQuery.isLoading;

    // ── Derived stats ────────────────────────────────────────────────────────────
    const totalAccounts = locationsQuery.data?.total ?? 0;
    const saasAccounts = accountsQuery.data?.accounts ?? [];
    const activeSaas = saasAccounts.filter((a) => a.active).length;
    // Rebilling on/off — GHLSaasSubAccount doesn't carry rebilling state, so
    // we use activeSaas as a proxy for now; Phase 5 can add a dedicated endpoint.
    const rebillingOn = activeSaas;
    const rebillingOff = totalAccounts - activeSaas;

    const stats = isLoading
        ? LOADING_STATS
        : { totalAccounts, activeSaas, rebillingOn, rebillingOff };

    // ── Plan distribution chart data ─────────────────────────────────────────────
    const planData = (() => {
        const plans = plansQuery.data?.plans ?? [];
        const counts: Record<string, number> = {};
        saasAccounts.forEach((a) => {
            if (a.active) counts[a.planId] = (counts[a.planId] ?? 0) + 1;
        });
        return plans.map((plan, i) => ({
            planName: plan.name,
            count: counts[plan.id] ?? 0,
            color: PLAN_COLORS[i % PLAN_COLORS.length],
        }));
    })();

    return (
        <div className="space-y-6">
            {/* Stats */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border-0 shadow-sm p-5">
                            <div className="flex justify-between mb-4">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <StatsCards {...stats} />
            )}

            {/* Charts + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    {isLoading ? (
                        <div className="bg-white rounded-xl shadow-sm p-5">
                            <Skeleton className="h-5 w-36 mb-4" />
                            <Skeleton className="h-56 w-full rounded-lg" />
                        </div>
                    ) : (
                        <PlanDistributionChart data={planData} />
                    )}
                </div>

                {/* Quick actions */}
                <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700">
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            asChild
                            className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Link href="/dashboard/accounts/create">
                                <PlusCircle className="h-4 w-4" />
                                Create Account
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="w-full justify-start gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            <Link href="/dashboard/accounts">
                                <Users className="h-4 w-4" />
                                View All Accounts
                            </Link>
                        </Button>

                        <Separator className="my-3" />

                        <Button
                            asChild
                            variant="ghost"
                            className="w-full justify-start gap-2 text-slate-500 hover:text-slate-700"
                        >
                            <Link href="/dashboard/saas">
                                Manage SaaS Plans
                                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="ghost"
                            className="w-full justify-start gap-2 text-slate-500 hover:text-slate-700"
                        >
                            <Link href="/dashboard/saas/rebilling">
                                Rebilling Overview
                                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
