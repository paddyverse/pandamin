'use client';

import { RefreshCw, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/shared/SearchInput';

interface AccountsToolbarProps {
    search: string;
    onSearchChange: (v: string) => void;
    planFilter: string;
    onPlanFilterChange: (v: string) => void;
    rebillingFilter: string;
    onRebillingFilterChange: (v: string) => void;
    saasStatusFilter: string;
    onSaasStatusFilterChange: (v: string) => void;
    onCreateAccount: () => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
    // TODO: Phase 4 — load plans from useSaasPlans()
    plans?: { id: string; name: string }[];
}

export function AccountsToolbar({
    search,
    onSearchChange,
    planFilter,
    onPlanFilterChange,
    rebillingFilter,
    onRebillingFilterChange,
    saasStatusFilter,
    onSaasStatusFilterChange,
    onCreateAccount,
    onRefresh,
    isRefreshing = false,
    plans = [],
}: AccountsToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="Search accounts..."
                className="w-64"
            />

            {/* Filters */}
            <Select value={planFilter} onValueChange={onPlanFilterChange}>
                <SelectTrigger className="h-9 w-[160px] bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="SaaS Plan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={rebillingFilter} onValueChange={onRebillingFilterChange}>
                <SelectTrigger className="h-9 w-[160px] bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Rebilling" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Rebilling: All</SelectItem>
                    <SelectItem value="on">Rebilling: On</SelectItem>
                    <SelectItem value="off">Rebilling: Off</SelectItem>
                </SelectContent>
            </Select>

            <Select value={saasStatusFilter} onValueChange={onSaasStatusFilterChange}>
                <SelectTrigger className="h-9 w-[160px] bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="SaaS Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">SaaS: All</SelectItem>
                    <SelectItem value="active">SaaS: Active</SelectItem>
                    <SelectItem value="inactive">SaaS: Inactive</SelectItem>
                </SelectContent>
            </Select>

            {/* Right-side actions */}
            <div className="ml-auto flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-slate-200 text-slate-500 hover:text-slate-700"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Refresh"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </Button>
                <Button
                    size="sm"
                    className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={onCreateAccount}
                >
                    <PlusCircle className="h-4 w-4" />
                    Create Account
                </Button>
            </div>
        </div>
    );
}
