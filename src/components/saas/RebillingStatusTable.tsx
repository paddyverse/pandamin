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
    type RowSelectionState,
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateRebilling } from '@/hooks/useSubscription';
import type { GHLSaasSubAccount } from '@/lib/ghl-types';

// ─── Extended row type (rebilling data comes from a future Phase 5 endpoint) ──
interface RebillingRow {
    locationId: string;
    locationName: string;
    rebillingOn: boolean;
    phoneEnabled: boolean;
    emailEnabled: boolean;
    markupPct: number | null;
    walletBalance: number | null;
}

function buildRows(accounts: GHLSaasSubAccount[]): RebillingRow[] {
    // Rebilling fields are not yet in GHLSaasSubAccount — stubbed with defaults.
    // Phase 5 will wire up a dedicated /api/saas/rebilling/[locationId] lookup.
    return accounts.map((a) => ({
        locationId: a.locationId,
        locationName: a.locationName,
        rebillingOn: false,  // TODO Phase 5
        phoneEnabled: false,
        emailEnabled: false,
        markupPct: null,
        walletBalance: null,
    }));
}

const columnHelper = createColumnHelper<RebillingRow>();

type QuickFilter = 'all' | 'enabled' | 'disabled';

interface RebillingStatusTableProps {
    accounts: GHLSaasSubAccount[];
    isLoading?: boolean;
}

export function RebillingStatusTable({ accounts, isLoading = false }: RebillingStatusTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [confirmOff, setConfirmOff] = useState<RebillingRow | null>(null);

    // Local toggle state (persisted until Phase 5 backend lands)
    const [toggleState, setToggleState] = useState<Record<string, boolean>>({});

    const updateRebilling = useUpdateRebilling();

    const data: RebillingRow[] = useMemo(() => {
        const rows = buildRows(accounts);
        return rows.map((r) => ({
            ...r,
            rebillingOn: toggleState[r.locationId] ?? r.rebillingOn,
        }));
    }, [accounts, toggleState]);

    const filtered = useMemo(() => {
        if (quickFilter === 'enabled') return data.filter((r) => r.rebillingOn);
        if (quickFilter === 'disabled') return data.filter((r) => !r.rebillingOn);
        return data;
    }, [data, quickFilter]);

    const handleToggle = (row: RebillingRow, newValue: boolean) => {
        if (!newValue) {
            // Require confirmation before turning off
            setConfirmOff(row);
        } else {
            applyToggle(row, true);
        }
    };

    const applyToggle = (row: RebillingRow, newValue: boolean) => {
        setToggleState((prev) => ({ ...prev, [row.locationId]: newValue }));
        updateRebilling.mutate({ locationId: row.locationId, enabled: newValue });
    };

    // ── Bulk actions ──────────────────────────────────────────────────────────
    const selectedRowIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

    const handleBulkEnable = () => {
        selectedRowIds.forEach((id) => {
            const row = data.find((r) => r.locationId === id);
            if (row && !row.rebillingOn) applyToggle(row, true);
        });
        setRowSelection({});
    };

    const handleBulkDisable = () => {
        selectedRowIds.forEach((id) => {
            const row = data.find((r) => r.locationId === id);
            if (row && row.rebillingOn) applyToggle(row, false);
        });
        setRowSelection({});
    };

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                    aria-label="Select row"
                />
            ),
            size: 40,
        }),
        columnHelper.accessor('locationName', {
            header: 'Account Name',
            cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
        }),
        columnHelper.accessor('rebillingOn', {
            header: 'Rebilling',
            cell: (info) => {
                const row = info.row.original;
                const value = info.getValue();
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={value}
                            onCheckedChange={(v) => handleToggle(row, v)}
                            className="data-[state=checked]:bg-green-500"
                        />
                        <span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-slate-400'}`}>
                            {value ? 'On' : 'Off'}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('phoneEnabled', {
            header: 'Phone',
            cell: (info) => featureBadge(info.getValue()),
        }),
        columnHelper.accessor('emailEnabled', {
            header: 'Email',
            cell: (info) => featureBadge(info.getValue()),
        }),
        columnHelper.accessor('markupPct', {
            header: 'Markup %',
            cell: (info) => {
                const v = info.getValue();
                return v != null ? (
                    <span className="text-sm text-slate-700 font-medium">{v}%</span>
                ) : (
                    <span className="text-slate-400 text-xs">—</span>
                );
            },
        }),
        columnHelper.accessor('walletBalance', {
            header: 'Wallet',
            cell: (info) => {
                const v = info.getValue();
                return v != null ? (
                    <span className="text-sm text-slate-700">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)}
                    </span>
                ) : (
                    <span className="text-slate-400 text-xs">—</span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {r.rebillingOn ? (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={() => setConfirmOff(r)}
                                >
                                    Disable Rebilling
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onSelect={() => applyToggle(r, true)}>
                                    Enable Rebilling
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [data]);

    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting, globalFilter, rowSelection },
        getRowId: (row) => row.locationId,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                {/* Quick filters */}
                <div className="flex items-center gap-1">
                    {(['all', 'enabled', 'disabled'] as QuickFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setQuickFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${quickFilter === f
                                    ? f === 'enabled'
                                        ? 'bg-green-600 text-white'
                                        : f === 'disabled'
                                            ? 'bg-slate-600 text-white'
                                            : 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f === 'all' ? 'Show All' : f === 'enabled' ? 'Enabled Only' : 'Disabled Only'}
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

            {/* Bulk action strip */}
            {selectedRowIds.length > 0 && (
                <div className="flex items-center gap-3 mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                    <span className="font-medium text-indigo-700">
                        {selectedRowIds.length} selected
                    </span>
                    <Button
                        size="sm"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleBulkEnable}
                    >
                        Enable Rebilling
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={handleBulkDisable}
                    >
                        Disable Rebilling
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs ml-auto text-slate-500"
                        onClick={() => setRowSelection({})}
                    >
                        Deselect All
                    </Button>
                </div>
            )}

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
                                <TableCell colSpan={8} className="h-32 text-center text-slate-400 text-sm">
                                    No accounts match this filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={`hover:bg-slate-50 border-b border-slate-100 last:border-0 ${row.getIsSelected() ? 'bg-indigo-50' : ''
                                        }`}
                                >
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

            {/* Disable confirmation dialog */}
            <AlertDialog open={!!confirmOff} onOpenChange={() => setConfirmOff(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disable Rebilling?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Turning off rebilling for{' '}
                            <strong>{confirmOff?.locationName}</strong> will stop billing their clients
                            for usage. This cannot be undone automatically.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (confirmOff) applyToggle(confirmOff, false);
                                setConfirmOff(null);
                            }}
                        >
                            Disable Rebilling
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function featureBadge(enabled: boolean) {
    return enabled ? (
        <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">On</Badge>
    ) : (
        <Badge variant="secondary" className="text-xs text-slate-400">Off</Badge>
    );
}
