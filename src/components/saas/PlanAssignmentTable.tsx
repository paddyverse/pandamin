'use client';

import { useState, useMemo } from 'react';
import { MoreHorizontal, ChevronDown, Search } from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateSubscription } from '@/hooks/useSubscription';
import type { GHLSaasSubAccount, GHLSaasPlan } from '@/lib/ghl-types';
import { format } from 'date-fns';

const PLAN_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

interface PlanAssignmentTableProps {
    accounts: GHLSaasSubAccount[];
    plans: GHLSaasPlan[];
    planFilter: string; // 'all' | planId
    isLoading?: boolean;
}

type ActionKind = 'changePlan' | 'remove';

interface PendingAction {
    account: GHLSaasSubAccount;
    kind: ActionKind;
}

const columnHelper = createColumnHelper<GHLSaasSubAccount>();

export function PlanAssignmentTable({
    accounts,
    plans,
    planFilter,
    isLoading = false,
}: PlanAssignmentTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [localFilter, setLocalFilter] = useState('all'); // tabs within this component
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [selectedPlan, setSelectedPlan] = useState('');

    const updateSubscription = useUpdateSubscription();

    // Build color / name lookups
    const planMap = useMemo(() =>
        Object.fromEntries(plans.map((p, i) => [p.id, { name: p.name, color: PLAN_COLORS[i % PLAN_COLORS.length] }])),
        [plans]
    );

    // Active filter = prop (from PlanCards) OR local tab
    const activeFilter = planFilter !== 'all' ? planFilter : localFilter;

    const filtered = useMemo(() => {
        if (activeFilter === 'all') return accounts;
        return accounts.filter((a) => a.planId === activeFilter);
    }, [accounts, activeFilter]);

    const columns = useMemo(() => [
        columnHelper.accessor('locationName', {
            header: 'Account Name',
            cell: (info) => (
                <span className="font-medium text-slate-900">{info.getValue()}</span>
            ),
        }),
        columnHelper.accessor('planId', {
            header: 'Current Plan',
            cell: (info) => {
                const meta = planMap[info.getValue()];
                if (!meta) return <span className="text-slate-400 text-xs">—</span>;
                return (
                    <Badge
                        variant="secondary"
                        className="text-xs border font-medium"
                        style={{ backgroundColor: `${meta.color}14`, color: meta.color, borderColor: `${meta.color}30` }}
                    >
                        {meta.name}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor('active', {
            header: 'Status',
            cell: (info) => info.getValue()
                ? <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">Active</Badge>
                : <Badge variant="secondary" className="text-xs">Inactive</Badge>,
        }),
        columnHelper.display({
            id: 'assignedDate',
            header: 'Assigned Date',
            cell: () => (
                <span className="text-slate-500 text-sm">
                    {format(new Date(), 'MMM d, yyyy')}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onSelect={() => {
                                setPending({ account: row.original, kind: 'changePlan' });
                                setSelectedPlan(row.original.planId ?? '');
                            }}
                        >
                            Change Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={() => setPending({ account: row.original, kind: 'remove' })}
                        >
                            Remove from Plan
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        }),
    ], [planMap]);

    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const handleConfirmAction = () => {
        if (!pending) return;

        if (pending.kind === 'changePlan' && selectedPlan) {
            updateSubscription.mutate({
                locationId: pending.account.locationId,
                planId: selectedPlan,
            });
        } else if (pending.kind === 'remove') {
            // Remove = set to empty plan
            updateSubscription.mutate({
                locationId: pending.account.locationId,
                planId: '',
            });
        }
        setPending(null);
        setSelectedPlan('');
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Tab filter + search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                {/* Tabs */}
                <div className="flex items-center gap-1 flex-wrap">
                    {[{ id: 'all', name: 'All' }, ...plans].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setLocalFilter(p.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === p.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {p.name}
                            {p.id !== 'all' && (
                                <span className="ml-1.5 opacity-70">
                                    {accounts.filter((a) => a.planId === p.id).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative sm:ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Search accounts…"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-8 h-8 text-sm w-52"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id} className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                                {hg.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-2.5 cursor-pointer select-none"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === 'asc' && <ChevronDown className="h-3 w-3 rotate-180" />}
                                            {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-3 w-3" />}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-sm">
                                    No accounts match this filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Change Plan Dialog */}
            <Dialog open={!!pending && pending.kind === 'changePlan'} onOpenChange={() => setPending(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Change Plan</DialogTitle>
                        <DialogDescription>
                            Select a new SaaS plan for{' '}
                            <span className="font-semibold text-slate-900">{pending?.account.locationName}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a plan…" />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPending(null)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={!selectedPlan || updateSubscription.isPending}
                            onClick={handleConfirmAction}
                        >
                            {updateSubscription.isPending ? 'Saving…' : 'Save Change'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove from Plan Confirm Dialog */}
            <Dialog open={!!pending && pending.kind === 'remove'} onOpenChange={() => setPending(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove from Plan?</DialogTitle>
                        <DialogDescription>
                            This will unassign{' '}
                            <span className="font-semibold text-slate-900">{pending?.account.locationName}</span>{' '}
                            from their current SaaS plan. They will lose access to SaaS features immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPending(null)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={updateSubscription.isPending}
                            onClick={handleConfirmAction}
                        >
                            {updateSubscription.isPending ? 'Removing…' : 'Remove'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
