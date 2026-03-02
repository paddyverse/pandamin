'use client';

import { Trash2, Zap, CreditCard, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// TODO: Phase 4 — load plans from useSaasPlans()
const PLACEHOLDER_PLANS = [
    { id: 'plan_starter', name: 'Starter' },
    { id: 'plan_growth', name: 'Growth' },
    { id: 'plan_pro', name: 'Pro' },
    { id: 'plan_enterprise', name: 'Enterprise' },
];

interface BulkActionBarProps {
    selectedCount: number;
    onDeselectAll: () => void;
    onBulkDelete: () => void;
    onBulkEnableSaas: () => void;
    onBulkChangePlan: (planId: string) => void;
    onBulkToggleRebilling: () => void;
    plans?: { id: string; name: string }[];
}

export function BulkActionBar({
    selectedCount,
    onDeselectAll,
    onBulkDelete,
    onBulkEnableSaas,
    onBulkChangePlan,
    onBulkToggleRebilling,
    plans = PLACEHOLDER_PLANS,
}: BulkActionBarProps) {
    const isVisible = selectedCount > 0;

    return (
        <div
            aria-hidden={!isVisible}
            className={cn(
                'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out',
                isVisible
                    ? 'translate-y-0 opacity-100 pointer-events-auto'
                    : 'translate-y-10 opacity-0 pointer-events-none'
            )}
        >
            <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 min-w-[580px] border border-slate-700">
                {/* Selection count */}
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-sm font-semibold text-white">
                        {selectedCount} selected
                    </span>
                    <button
                        onClick={onDeselectAll}
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                        title="Deselect all"
                    >
                        <X className="h-3 w-3 text-slate-300" />
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-700" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onBulkEnableSaas}
                        className="h-8 gap-1.5 text-green-400 hover:text-green-300 hover:bg-slate-800"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        Enable SaaS
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onBulkToggleRebilling}
                        className="h-8 gap-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Toggle Rebilling
                    </Button>

                    {/* Change Plan dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                            >
                                <CreditCard className="h-3.5 w-3.5" />
                                Change Plan
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="mb-2">
                            {plans.map((plan) => (
                                <DropdownMenuItem
                                    key={plan.id}
                                    onClick={() => onBulkChangePlan(plan.id)}
                                >
                                    {plan.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    <Button
                        size="sm"
                        onClick={onBulkDelete}
                        className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete ({selectedCount})
                    </Button>
                </div>
            </div>
        </div>
    );
}
