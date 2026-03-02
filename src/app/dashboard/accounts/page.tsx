'use client';

import { useState, useCallback, useEffect } from 'react';
import { AccountsToolbar } from '@/components/accounts/AccountsToolbar';
import {
    AccountsTable,
    type AccountRow,
} from '@/components/accounts/AccountsTable';
import { BulkActionBar } from '@/components/accounts/BulkActionBar';
import { AccountDetailPanel } from '@/components/accounts/AccountDetailPanel';
import { CreateAccountDialog } from '@/components/accounts/CreateAccountDialog';
import { DeleteConfirmDialog } from '@/components/accounts/DeleteConfirmDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocations, useCreateLocation, useDeleteLocation } from '@/hooks/useLocations';
import { useSaasPlans, useSaasAccounts } from '@/hooks/useSaasPlans';
import { useBulkDelete, useBulkEnableSaas, useBulkUpdate } from '@/hooks/useBulkOperations';
import { toast } from 'sonner';
import type { CreateLocationData } from '@/lib/ghl-types';

// ─── Color palette for plan badges ───────────────────────────────────────────
const DEFAULT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

function buildColorMap(plans: { id: string; name: string }[]): Record<string, string> {
    const map: Record<string, string> = {};
    plans.forEach((p, i) => { map[p.id] = DEFAULT_COLORS[i % DEFAULT_COLORS.length]; });
    return map;
}

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
    // ── Filters ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [rebillingFilter, setRebillingFilter] = useState('all');
    const [saasStatusFilter, setSaasStatusFilter] = useState('all');
    const [page] = useState(0); // TODO: hook up pagination controls

    const debouncedSearch = useDebounce(search, 350);

    // ── Queries ───────────────────────────────────────────────────────────────
    const locationsQuery = useLocations({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
    });

    const plansQuery = useSaasPlans();
    const accountsQuery = useSaasAccounts();

    const createMutation = useCreateLocation();
    const deleteMutation = useDeleteLocation();
    const bulkDelete = useBulkDelete();
    const bulkEnableSaas = useBulkEnableSaas();
    const bulkUpdate = useBulkUpdate();

    // ── Dialog / panel state ──────────────────────────────────────────────────
    const [detailAccount, setDetailAccount] = useState<AccountRow | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // ── Build plan / color maps ───────────────────────────────────────────────
    const plans = plansQuery.data?.plans ?? [];
    const colorMap = buildColorMap(plans);
    const planNameMap = Object.fromEntries(plans.map((p) => [p.id, p.name]));
    const saasActiveSet = new Set(
        (accountsQuery.data?.accounts ?? []).filter((a) => a.active).map((a) => a.locationId)
    );

    // ── Map raw locations → AccountRow ────────────────────────────────────────
    const rawLocations = locationsQuery.data?.locations ?? [];

    const accountRows: AccountRow[] = rawLocations
        .map((loc): AccountRow => {
            const saasEntry = (accountsQuery.data?.accounts ?? []).find((a) => a.locationId === loc.id);
            const planId = saasEntry?.planId ?? '';
            const planName = saasEntry?.planName ?? planNameMap[planId] ?? '—';
            const planColor = colorMap[planId] ?? '#94a3b8';

            return {
                id: loc.id,
                name: loc.name,
                email: loc.email ?? '',
                phone: loc.phone ?? '',
                planId,
                planName,
                planColor,
                rebillingEnabled: false, // GHLSaasSubAccount lacks rebilling data; Phase 5 TODO
                saasActive: saasActiveSet.has(loc.id),
                dateAdded: loc.dateAdded ?? '',
                city: loc.city,
                state: loc.state,
            };
        })
        .filter((acc) => {
            const matchPlan = planFilter === 'all' || acc.planId === planFilter;
            const matchRebilling = rebillingFilter === 'all' ||
                (rebillingFilter === 'on' && acc.rebillingEnabled) ||
                (rebillingFilter === 'off' && !acc.rebillingEnabled);
            const matchSaas = saasStatusFilter === 'all' ||
                (saasStatusFilter === 'active' && acc.saasActive) ||
                (saasStatusFilter === 'inactive' && !acc.saasActive);
            return matchPlan && matchRebilling && matchSaas;
        });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleViewDetails = useCallback((account: AccountRow) => {
        setDetailAccount(account);
        setShowDetail(true);
    }, []);

    const handleEdit = useCallback((account: AccountRow) => {
        toast.info(`Edit: ${account.name} (coming in Phase 5)`);
        setShowDetail(false);
    }, []);

    const handleDelete = useCallback((account: AccountRow) => {
        setDeleteTarget(account);
        setShowDelete(true);
        setShowDetail(false);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (deleteTarget) {
            // Single delete — toast + invalidation handled inside the hook
            deleteMutation.mutate(deleteTarget.id);
            setShowDelete(false);
            setDeleteTarget(null);
        } else if (selectedIds.length > 0) {
            // Bulk delete via SSE stream
            setShowDelete(false);
            void bulkDelete.start(selectedIds);
            setSelectedIds([]);
        }
    }, [deleteTarget, deleteMutation, selectedIds, bulkDelete]);

    const handleToggleRebilling = useCallback((_account: AccountRow) => {
        toast.info('Rebilling toggle coming in Phase 5');
    }, []);

    const handleChangePlan = useCallback((_account: AccountRow) => {
        toast.info('Plan change picker coming in Phase 5');
    }, []);

    const handleBulkEnableSaas = useCallback(() => {
        if (selectedIds.length === 0) return;
        bulkEnableSaas.mutate({ locationIds: selectedIds });
    }, [selectedIds, bulkEnableSaas]);

    const handleBulkToggleRebilling = useCallback(() => {
        toast.info('Bulk rebilling toggle coming in Phase 5');
    }, []);

    const handleBulkChangePlan = useCallback((planId: string) => {
        if (selectedIds.length === 0) return;
        void bulkUpdate.start(selectedIds, { planId });
        setSelectedIds([]);
    }, [selectedIds, bulkUpdate]);

    const handleBulkDelete = useCallback(() => {
        setDeleteTarget(null);
        setShowDelete(true);
    }, []);

    const handleCreateSubmit = useCallback(
        async (data: Record<string, string>, addAnother: boolean) => {
            const payload: CreateLocationData = {
                name: data.name,
                email: data.email || undefined,
                phone: data.phone || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                country: data.country || undefined,
                postalCode: data.postalCode || undefined,
                website: data.website || undefined,
                timezone: data.timezone || undefined,
            };

            await createMutation.mutateAsync(payload);
            if (!addAnother) setShowCreate(false);
        },
        [createMutation]
    );

    // ── Render ────────────────────────────────────────────────────────────────
    const isLoading = locationsQuery.isLoading && accountRows.length === 0;
    const isRefreshing = locationsQuery.isFetching && !locationsQuery.isLoading;

    return (
        <>
            <div className="space-y-4">
                <AccountsToolbar
                    search={search}
                    onSearchChange={setSearch}
                    planFilter={planFilter}
                    onPlanFilterChange={setPlanFilter}
                    rebillingFilter={rebillingFilter}
                    onRebillingFilterChange={setRebillingFilter}
                    saasStatusFilter={saasStatusFilter}
                    onSaasStatusFilterChange={setSaasStatusFilter}
                    onCreateAccount={() => setShowCreate(true)}
                    onRefresh={() => void locationsQuery.refetch()}
                    isRefreshing={isRefreshing}
                    plans={plans}
                />

                {isLoading ? (
                    <LoadingState />
                ) : locationsQuery.isError ? (
                    <EmptyState
                        title="Failed to load accounts"
                        description={locationsQuery.error?.message ?? 'Unknown error'}
                    />
                ) : (
                    <AccountsTable
                        accounts={accountRows}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEdit}
                        onToggleRebilling={handleToggleRebilling}
                        onChangePlan={handleChangePlan}
                        onDelete={handleDelete}
                        onSelectionChange={setSelectedIds}
                    />
                )}
            </div>

            {/* Bulk action floating bar */}
            <BulkActionBar
                selectedCount={selectedIds.length}
                onDeselectAll={() => setSelectedIds([])}
                onBulkDelete={handleBulkDelete}
                onBulkEnableSaas={handleBulkEnableSaas}
                onBulkChangePlan={handleBulkChangePlan}
                onBulkToggleRebilling={handleBulkToggleRebilling}
                plans={plans}
            />

            {/* Account detail sheet */}
            <AccountDetailPanel
                account={detailAccount}
                open={showDetail}
                onClose={() => setShowDetail(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Create dialog */}
            <CreateAccountDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onSubmit={handleCreateSubmit}
                plans={plans}
            />

            {/* Delete confirm dialog */}
            <DeleteConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                accountName={deleteTarget?.name}
                count={!deleteTarget ? selectedIds.length : undefined}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteMutation.isPending || bulkDelete.isRunning}
            />
        </>
    );
}
