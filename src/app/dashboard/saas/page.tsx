'use client';

import { useState } from 'react';
import { CreditCard, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanCards } from '@/components/saas/PlanCards';
import { PlanAssignmentTable } from '@/components/saas/PlanAssignmentTable';
import { BulkEnableSaasDialog } from '@/components/saas/BulkEnableSaasDialog';
import { useSaasPlans, useSaasAccounts } from '@/hooks/useSaasPlans';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAccountCounts(
    accounts: Array<{ planId: string; active: boolean }>,
    planIds: string[]
): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const id of planIds) counts[id] = 0;
    for (const a of accounts) {
        if (a.active && a.planId && counts[a.planId] !== undefined) {
            counts[a.planId]++;
        }
    }
    return counts;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SaasPage() {
    const plansQuery = useSaasPlans();
    const accountsQuery = useSaasAccounts();

    const [planFilter, setPlanFilter] = useState('all');
    const [showBulkEnableDialog, setShowBulkEnableDialog] = useState(false);

    const plans = plansQuery.data?.plans ?? [];
    const accounts = accountsQuery.data?.accounts ?? [];

    const accountCounts = buildAccountCounts(accounts, plans.map((p) => p.id));
    const inactiveAccounts = accounts.filter((a) => !a.active);

    const totalAssigned = Object.values(accountCounts).reduce((s, c) => s + c, 0);
    const totalAccounts = accounts.length;

    const isLoading = plansQuery.isLoading || accountsQuery.isLoading;

    return (
        <div className="space-y-8">
            {/* ── Page header ────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                            <CreditCard className="h-4.5 w-4.5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">SaaS Plans</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1.5 ml-0.5">
                        Manage plans and assignments across all subaccounts
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Summary badges */}
                    {!isLoading && (
                        <div className="flex gap-2 text-xs">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-medium">
                                {plans.length} plan{plans.length !== 1 ? 's' : ''}
                            </span>
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full font-medium">
                                {totalAssigned}/{totalAccounts} assigned
                            </span>
                        </div>
                    )}
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 h-9 gap-1.5"
                        onClick={() => setShowBulkEnableDialog(true)}
                        disabled={inactiveAccounts.length === 0}
                    >
                        <UserPlus className="h-4 w-4" />
                        Bulk Enable SaaS
                    </Button>
                </div>
            </div>

            {/* ── Plan Cards ─────────────────────────────────────────────────── */}
            <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Plans
                </h2>
                <PlanCards
                    plans={plans}
                    accountCounts={accountCounts}
                    activePlanFilter={planFilter}
                    onFilterChange={setPlanFilter}
                    isLoading={plansQuery.isLoading}
                />
            </section>

            {/* ── Plan Assignment Table ──────────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        Account Assignments
                    </h2>
                    {accountsQuery.isFetching && !isLoading && (
                        <span className="text-xs text-slate-400">Refreshing…</span>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-11 w-full rounded-lg" />
                        ))}
                    </div>
                ) : accountsQuery.isError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-sm text-red-600">
                            {accountsQuery.error?.message ?? 'Failed to load account assignments.'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => void accountsQuery.refetch()}
                        >
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <PlanAssignmentTable
                        accounts={accounts}
                        plans={plans}
                        planFilter={planFilter}
                        isLoading={false}
                    />
                )}
            </section>

            {/* ── Bulk Enable SaaS Dialog ────────────────────────────────────── */}
            <BulkEnableSaasDialog
                open={showBulkEnableDialog}
                onOpenChange={setShowBulkEnableDialog}
                inactiveAccounts={inactiveAccounts}
                plans={plans}
            />
        </div>
    );
}
