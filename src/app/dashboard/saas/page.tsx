'use client';

import { useState } from 'react';
import { CreditCard, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanCards } from '@/components/saas/PlanCards';
import { PlanAssignmentTable } from '@/components/saas/PlanAssignmentTable';
import { BulkEnableSaasDialog } from '@/components/saas/BulkEnableSaasDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSaasPlans, useSaasAccounts } from '@/hooks/useSaasPlans';
import { useDebounce } from '@/hooks/useDebounce';

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

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const accountsQuery = useSaasAccounts(debouncedSearch);

    const [planFilter, setPlanFilter] = useState('all');
    const [showBulkEnableDialog, setShowBulkEnableDialog] = useState(false);

    const plans = plansQuery.data?.plans ?? [];
    const accounts = accountsQuery.data?.accounts ?? [];
    const metadata = accountsQuery.data?.metadata;
    const serverTotal = accountsQuery.data?.total ?? accounts.length;

    const accountCounts = metadata?.planCounts ?? buildAccountCounts(accounts, plans.map((p) => p.id));

    // We still need the array for the dropdown in the UI Dialog
    const inactiveAccounts = accounts.filter((a) => !a.active);

    const totalAssigned = metadata ? Object.values(metadata.planCounts).reduce((s, c) => s + c, 0) : 0;
    const totalAccounts = serverTotal;

    const isLoading = plansQuery.isLoading;

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        Account Assignments
                    </h2>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search accounts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        {accountsQuery.isFetching && !accountsQuery.isLoading && (
                            <span className="text-xs text-slate-400 shrink-0">Refreshing…</span>
                        )}
                    </div>
                </div>

                {accountsQuery.isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-11 w-full rounded-lg" />
                        ))}
                    </div>
                ) : accountsQuery.isError || plansQuery.isError ? (
                    (accountsQuery.error?.message?.includes('Forbidden') || accountsQuery.error?.message?.includes('Unauthorized') || plansQuery.error?.message?.includes('Forbidden') || plansQuery.error?.message?.includes('Unauthorized')) ? (
                        <EmptyState
                            title="Missing Agency SaaS API Scopes"
                            description="Your HighLevel API Token does not have permission to read SaaS data. Please generate a new OAuth token with 'saas.agency.readonly' and 'saas.agency.write' scopes and update your environment variables."
                        />
                    ) : (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                            <p className="text-sm text-red-600">
                                {accountsQuery.error?.message ?? plansQuery.error?.message ?? 'Failed to load account assignments.'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                                onClick={() => void accountsQuery.refetch()}
                            >
                                Try Again
                            </Button>
                        </div>
                    )
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
