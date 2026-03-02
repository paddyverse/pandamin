'use client';

import { useState, useMemo } from 'react';
import { CheckSquare, Square, ChevronRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBulkEnableSaas } from '@/hooks/useBulkOperations';
import type { GHLSaasSubAccount, GHLSaasPlan } from '@/lib/ghl-types';

type Step = 1 | 2 | 3;

interface BulkEnableSaasDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Accounts NOT currently on SaaS (active = false)
    inactiveAccounts: GHLSaasSubAccount[];
    plans: GHLSaasPlan[];
}

const PLAN_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export function BulkEnableSaasDialog({
    open,
    onOpenChange,
    inactiveAccounts,
    plans,
}: BulkEnableSaasDialogProps) {
    const [step, setStep] = useState<Step>(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedPlan, setSelectedPlan] = useState('');
    const [results, setResults] = useState<{ success: boolean; count: number } | null>(null);

    const bulkEnable = useBulkEnableSaas();

    const planMeta = useMemo(
        () => Object.fromEntries(plans.map((p, i) => [p.id, { name: p.name, color: PLAN_COLORS[i % PLAN_COLORS.length] }])),
        [plans]
    );

    const planName = selectedPlan ? planMeta[selectedPlan]?.name ?? '—' : '—';
    const planColor = selectedPlan ? planMeta[selectedPlan]?.color ?? '#6366f1' : '#6366f1';

    function toggleAccount(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (selectedIds.size === inactiveAccounts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(inactiveAccounts.map((a) => a.locationId)));
        }
    }

    function handleClose() {
        onOpenChange(false);
        // Reset after close animation
        setTimeout(() => {
            setStep(1);
            setSelectedIds(new Set());
            setSelectedPlan('');
            setResults(null);
        }, 300);
    }

    async function handleConfirm() {
        const locationIds = Array.from(selectedIds);
        try {
            await bulkEnable.mutateAsync({ locationIds, planId: selectedPlan || undefined });
            setResults({ success: true, count: locationIds.length });
        } catch {
            setResults({ success: false, count: 0 });
        }
        setStep(3);
    }

    const allSelected = selectedIds.size === inactiveAccounts.length && inactiveAccounts.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                {/* Header */}
                <DialogHeader>
                    <DialogTitle>Bulk Enable SaaS</DialogTitle>
                    <DialogDescription>
                        Enable SaaS for multiple subaccounts at once.
                    </DialogDescription>
                </DialogHeader>

                {/* Step indicators */}
                {step !== 3 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        {(['1. Select Accounts', '2. Choose Plan', '3. Confirm'] as const).map((label, i) => (
                            <span key={label} className="flex items-center gap-2">
                                <span
                                    className={`font-semibold ${step === i + 1 ? 'text-indigo-600' : step > i + 1 ? 'text-green-600' : ''
                                        }`}
                                >
                                    {label}
                                </span>
                                {i < 2 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Step 1: Select Accounts ── */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                                {inactiveAccounts.length} accounts without SaaS
                            </span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAll}>
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        {inactiveAccounts.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-6">
                                All accounts already have SaaS enabled. 🎉
                            </p>
                        ) : (
                            <ScrollArea className="h-56 rounded-md border border-slate-200">
                                <div className="p-1">
                                    {inactiveAccounts.map((acc) => (
                                        <label
                                            key={acc.locationId}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedIds.has(acc.locationId)}
                                                onCheckedChange={() => toggleAccount(acc.locationId)}
                                                className="shrink-0"
                                            />
                                            <span className="text-sm text-slate-700 flex-1">
                                                {acc.locationName}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        {selectedIds.size > 0 && (
                            <p className="text-xs text-indigo-600 font-medium">
                                {selectedIds.size} account{selectedIds.size !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>
                )}

                {/* ── Step 2: Choose Plan ── */}
                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Choose a SaaS plan to assign to the{' '}
                            <span className="font-semibold text-slate-900">{selectedIds.size}</span> selected accounts.
                        </p>

                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a plan…" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((p, i) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                                            />
                                            {p.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedPlan && plans.filter((p) => p.id === selectedPlan)[0] && (
                            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                                <p className="text-xs font-semibold text-slate-700">
                                    {plans.find((p) => p.id === selectedPlan)?.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                                        plans.find((p) => p.id === selectedPlan)?.price ?? 0
                                    )}{' '}
                                    / month
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 3: Results / Confirm ── */}
                {step === 3 && results && (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                        {results.success ? (
                            <>
                                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckSquare className="h-7 w-7 text-green-600" />
                                </div>
                                <p className="font-semibold text-slate-900">
                                    SaaS enabled for {results.count} account{results.count !== 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-slate-500">
                                    Plan assigned:{' '}
                                    <Badge
                                        variant="secondary"
                                        style={{ backgroundColor: `${planColor}14`, color: planColor }}
                                    >
                                        {planName}
                                    </Badge>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                                    <Square className="h-7 w-7 text-red-500" />
                                </div>
                                <p className="font-semibold text-slate-900">Something went wrong</p>
                                <p className="text-sm text-slate-500">
                                    Please try again or contact support.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Confirm summary (before submit) */}
                {step === 2 && selectedPlan && (
                    <div
                        className="rounded-lg p-3 text-sm text-slate-700 border"
                        style={{ backgroundColor: `${planColor}08`, borderColor: `${planColor}25` }}
                    >
                        Enable SaaS for{' '}
                        <strong>{selectedIds.size} account{selectedIds.size !== 1 ? 's' : ''}</strong>{' '}
                        on{' '}
                        <strong style={{ color: planColor }}>{planName}</strong>?
                    </div>
                )}

                {/* Footer actions */}
                <DialogFooter className="gap-2">
                    {step === 3 ? (
                        <Button onClick={handleClose}>Done</Button>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={step === 1 ? handleClose : () => setStep(1)}>
                                {step === 1 ? 'Cancel' : 'Back'}
                            </Button>

                            {step === 1 && (
                                <Button
                                    size="sm"
                                    disabled={selectedIds.size === 0}
                                    onClick={() => setStep(2)}
                                >
                                    Next →
                                </Button>
                            )}

                            {step === 2 && (
                                <Button
                                    size="sm"
                                    disabled={!selectedPlan || bulkEnable.isPending}
                                    onClick={() => void handleConfirm()}
                                >
                                    {bulkEnable.isPending ? 'Enabling…' : `Enable SaaS for ${selectedIds.size}`}
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
