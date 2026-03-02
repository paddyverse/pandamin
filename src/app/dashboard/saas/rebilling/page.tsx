'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RebillingStatusTable } from '@/components/saas/RebillingStatusTable';
import { useSaasAccounts } from '@/hooks/useSaasPlans';

export default function RebillingPage() {
    const accountsQuery = useSaasAccounts();

    const accounts = accountsQuery.data?.accounts ?? [];
    const totalEnabled = 0; // Phase 5: derive from rebilling config endpoint
    const totalDisabled = accounts.length - totalEnabled;

    const isLoading = accountsQuery.isLoading;

    return (
        <div className="space-y-6">
            {/* ── Page header ────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
                            <RefreshCw className="h-4.5 w-4.5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Rebilling Status</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1.5 ml-0.5">
                        Monitor and control rebilling for all SaaS subaccounts
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => void accountsQuery.refetch()}
                    disabled={accountsQuery.isFetching}
                >
                    <RefreshCw className={`h-4 w-4 ${accountsQuery.isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* ── Stats row ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))
                ) : (
                    <>
                        <StatCard
                            label="Total Accounts"
                            value={accounts.length}
                            color="#6366f1"
                        />
                        <StatCard
                            label="Rebilling Enabled"
                            value={totalEnabled}
                            color="#22c55e"
                        />
                        <StatCard
                            label="Rebilling Disabled"
                            value={totalDisabled}
                            color="#94a3b8"
                        />
                    </>
                )}
            </div>

            {/* ── Rebilling table ────────────────────────────────────────────── */}
            {accountsQuery.isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm text-red-600">
                        {accountsQuery.error?.message ?? 'Failed to load account data.'}
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
                <RebillingStatusTable
                    accounts={accounts}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}

// ─── Small stat card ──────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div
            className="rounded-xl border bg-white p-4 shadow-sm"
            style={{ borderColor: `${color}30` }}
        >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                {label}
            </p>
            <p className="text-3xl font-extrabold" style={{ color }}>
                {value.toLocaleString()}
            </p>
        </div>
    );
}
