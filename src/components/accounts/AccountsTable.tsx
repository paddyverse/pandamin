'use client';

import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type RowSelectionState,
} from '@tanstack/react-table';
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    Pencil,
    RefreshCw,
    CreditCard,
    Trash2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';

// ─── Placeholder Data — TODO: Phase 4 replace with useLocations() ─────────────

export interface AccountRow {
    id: string;
    name: string;
    email: string;
    phone: string;
    planId: string;
    planName: string;
    planColor: string;
    rebillingEnabled: boolean;
    saasActive: boolean;
    dateAdded: string;
    city?: string;
    state?: string;
}

export const PLACEHOLDER_ACCOUNTS: AccountRow[] = [
    { id: 'loc_01', name: 'Apex Dental Group', email: 'admin@apexdental.com', phone: '(512) 555-0101', planId: 'plan_pro', planName: 'Pro', planColor: '#f59e0b', rebillingEnabled: true, saasActive: true, dateAdded: '2024-11-03', city: 'Austin', state: 'TX' },
    { id: 'loc_02', name: 'Blue Ridge Realty', email: 'contact@blueridge.io', phone: '(303) 555-0182', planId: 'plan_growth', planName: 'Growth', planColor: '#22c55e', rebillingEnabled: true, saasActive: true, dateAdded: '2024-10-15', city: 'Denver', state: 'CO' },
    { id: 'loc_03', name: 'Summit Financial LLC', email: 'info@summitfin.com', phone: '(206) 555-0239', planId: 'plan_starter', planName: 'Starter', planColor: '#6366f1', rebillingEnabled: false, saasActive: true, dateAdded: '2025-01-22', city: 'Seattle', state: 'WA' },
    { id: 'loc_04', name: 'Sunrise Med Spa', email: 'hello@sunrisemedspa.com', phone: '(310) 555-0347', planId: 'plan_enterprise', planName: 'Enterprise', planColor: '#3b82f6', rebillingEnabled: true, saasActive: true, dateAdded: '2024-09-10', city: 'Los Angeles', state: 'CA' },
    { id: 'loc_05', name: 'Greenfield Landscaping', email: 'ops@greenfield.biz', phone: '(919) 555-0412', planId: 'plan_starter', planName: 'Starter', planColor: '#6366f1', rebillingEnabled: false, saasActive: false, dateAdded: '2025-02-01', city: 'Raleigh', state: 'NC' },
    { id: 'loc_06', name: 'Harbor View Chiropractic', email: 'dr.k@harborview.net', phone: '(415) 555-0588', planId: 'plan_growth', planName: 'Growth', planColor: '#22c55e', rebillingEnabled: true, saasActive: true, dateAdded: '2024-12-05', city: 'San Diego', state: 'CA' },
    { id: 'loc_07', name: 'Pinnacle Legal Group', email: 'office@pinnaclelegal.com', phone: '(617) 555-0691', planId: 'plan_pro', planName: 'Pro', planColor: '#f59e0b', rebillingEnabled: false, saasActive: true, dateAdded: '2025-01-08', city: 'Boston', state: 'MA' },
    { id: 'loc_08', name: 'Riverbend Auto Sales', email: 'sales@riverbend.auto', phone: '(214) 555-0702', planId: 'plan_growth', planName: 'Growth', planColor: '#22c55e', rebillingEnabled: true, saasActive: true, dateAdded: '2024-08-19', city: 'Dallas', state: 'TX' },
    { id: 'loc_09', name: 'Coastal Yoga Studio', email: 'namaste@coastalyoga.com', phone: '(813) 555-0815', planId: 'plan_starter', planName: 'Starter', planColor: '#6366f1', rebillingEnabled: false, saasActive: false, dateAdded: '2025-02-14', city: 'Tampa', state: 'FL' },
    { id: 'loc_10', name: 'NorthStar Consulting', email: 'hello@northstar.co', phone: '(312) 555-0920', planId: 'plan_enterprise', planName: 'Enterprise', planColor: '#3b82f6', rebillingEnabled: true, saasActive: true, dateAdded: '2024-07-30', city: 'Chicago', state: 'IL' },
    { id: 'loc_11', name: 'Timberline Roofing Co.', email: 'bids@timberline.build', phone: '(602) 555-1032', planId: 'plan_growth', planName: 'Growth', planColor: '#22c55e', rebillingEnabled: true, saasActive: true, dateAdded: '2024-11-28', city: 'Phoenix', state: 'AZ' },
    { id: 'loc_12', name: 'Cascade Health Clinic', email: 'admin@cascadehealth.org', phone: '(503) 555-1148', planId: 'plan_pro', planName: 'Pro', planColor: '#f59e0b', rebillingEnabled: true, saasActive: true, dateAdded: '2025-01-17', city: 'Portland', state: 'OR' },
];

// ─── Column Header with sort ───────────────────────────────────────────────────

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
    if (isSorted === 'asc') return <ChevronUp className="ml-1 h-3 w-3" />;
    if (isSorted === 'desc') return <ChevronDown className="ml-1 h-3 w-3" />;
    return <ChevronsUpDown className="ml-1 h-3 w-3 text-slate-300" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AccountsTableProps {
    accounts?: AccountRow[];
    onViewDetails: (account: AccountRow) => void;
    onEdit: (account: AccountRow) => void;
    onToggleRebilling: (account: AccountRow) => void;
    onChangePlan: (account: AccountRow) => void;
    onDelete: (account: AccountRow) => void;
    onSelectionChange: (selectedIds: string[]) => void;
}

export function AccountsTable({
    accounts = PLACEHOLDER_ACCOUNTS,
    onViewDetails,
    onEdit,
    onToggleRebilling,
    onChangePlan,
    onDelete,
    onSelectionChange,
}: AccountsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Notify parent when selection changes
    const handleRowSelectionChange = (
        updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)
    ) => {
        const next = typeof updater === 'function' ? updater(rowSelection) : updater;
        setRowSelection(next);
        const selectedIds = Object.keys(next)
            .filter((k) => next[k])
            .map((rowIndex) => accounts[parseInt(rowIndex)]?.id)
            .filter(Boolean);
        onSelectionChange(selectedIds);
    };

    const columns = useMemo<ColumnDef<AccountRow>[]>(
        () => [
            // Checkbox column
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected()
                                ? true
                                : table.getIsSomePageRowsSelected()
                                    ? 'indeterminate'
                                    : false
                        }
                        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(!!v)}
                        aria-label="Select row"
                        onClick={(e) => e.stopPropagation()}
                    />
                ),
                enableSorting: false,
                size: 40,
            },
            // Account Name
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <button
                        className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                        onClick={() => column.toggleSorting()}
                    >
                        Account Name
                        <SortIcon isSorted={column.getIsSorted()} />
                    </button>
                ),
                cell: ({ row, getValue }) => (
                    <button
                        className="font-medium text-slate-800 hover:text-indigo-600 text-left transition-colors"
                        onClick={() => onViewDetails(row.original)}
                    >
                        {getValue<string>()}
                    </button>
                ),
            },
            // Email
            {
                accessorKey: 'email',
                header: ({ column }) => (
                    <button
                        className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                        onClick={() => column.toggleSorting()}
                    >
                        Email
                        <SortIcon isSorted={column.getIsSorted()} />
                    </button>
                ),
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-500">{truncate(getValue<string>(), 28)}</span>
                ),
            },
            // Phone
            {
                accessorKey: 'phone',
                header: () => <span className="text-xs font-semibold text-slate-600">Phone</span>,
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-500">{getValue<string>() || '—'}</span>
                ),
                enableSorting: false,
            },
            // SaaS Plan
            {
                accessorKey: 'planName',
                header: ({ column }) => (
                    <button
                        className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                        onClick={() => column.toggleSorting()}
                    >
                        SaaS Plan
                        <SortIcon isSorted={column.getIsSorted()} />
                    </button>
                ),
                cell: ({ row }) => (
                    <Badge
                        variant="outline"
                        className="text-xs font-medium rounded-full border"
                        style={{
                            backgroundColor: `${row.original.planColor}18`,
                            borderColor: `${row.original.planColor}40`,
                            color: row.original.planColor,
                        }}
                    >
                        {row.original.planName}
                    </Badge>
                ),
            },
            // Rebilling
            {
                accessorKey: 'rebillingEnabled',
                header: () => <span className="text-xs font-semibold text-slate-600">Rebilling</span>,
                cell: ({ getValue }) => (
                    <StatusBadge status={getValue<boolean>() ? 'on' : 'off'} />
                ),
            },
            // SaaS Status
            {
                accessorKey: 'saasActive',
                header: () => <span className="text-xs font-semibold text-slate-600">SaaS</span>,
                cell: ({ getValue }) => (
                    <StatusBadge status={getValue<boolean>() ? 'active' : 'inactive'} />
                ),
            },
            // Date Added
            {
                accessorKey: 'dateAdded',
                header: ({ column }) => (
                    <button
                        className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                        onClick={() => column.toggleSorting()}
                    >
                        Created
                        <SortIcon isSorted={column.getIsSorted()} />
                    </button>
                ),
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-400">{formatDate(getValue<string>())}</span>
                ),
            },
            // Actions
            {
                id: 'actions',
                header: () => null,
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-slate-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(row.original)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleRebilling(row.original)}>
                                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Toggle Rebilling
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangePlan(row.original)}>
                                <CreditCard className="mr-2 h-3.5 w-3.5" /> Change Plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => onDelete(row.original)}
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
                enableSorting: false,
                size: 48,
            },
        ],
        [onViewDetails, onEdit, onToggleRebilling, onChangePlan, onDelete]
    );

    const table = useReactTable({
        data: accounts,
        columns,
        state: { sorting, rowSelection },
        onSortingChange: setSorting,
        onRowSelectionChange: handleRowSelectionChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 15 } },
    });

    const totalRows = accounts.length;
    const { pageIndex, pageSize } = table.getState().pagination;
    const fromRow = pageIndex * pageSize + 1;
    const toRow = Math.min(fromRow + pageSize - 1, totalRows);

    return (
        <div className="flex flex-col">
            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id} className="border-slate-200 hover:bg-transparent">
                                    {hg.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="py-3 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="py-0">
                                        <EmptyState
                                            icon={Users}
                                            title="No accounts found"
                                            description="Try adjusting your search or filter criteria."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className="border-slate-100 hover:bg-slate-50/80 cursor-pointer data-[state=selected]:bg-indigo-50/50 transition-colors"
                                        onClick={() => onViewDetails(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-3 px-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-slate-500">
                    {totalRows === 0
                        ? 'No accounts'
                        : `Showing ${fromRow}–${toRow} of ${totalRows} accounts`}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-slate-200"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-slate-600 min-w-[60px] text-center">
                        Page {pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-slate-200"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
