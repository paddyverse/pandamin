'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, CreditCard } from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useLocations } from '@/hooks/useLocations';
import { useSaasPlans } from '@/hooks/useSaasPlans';
import { useDebounce } from '@/hooks/useDebounce';

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 200);

    // Fetch locations filtered by query (limit 8 for palette)
    const locationsQuery = useLocations({
        search: debouncedQuery || undefined,
        limit: 8,
    });
    const plansQuery = useSaasPlans();

    const locations = locationsQuery.data?.locations ?? [];
    const plans = (plansQuery.data?.plans ?? []).filter((p) =>
        !debouncedQuery ||
        p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );

    const handleSelect = useCallback(
        (action: () => void) => {
            onOpenChange(false);
            setQuery('');
            // Let dialog close before navigating
            setTimeout(action, 50);
        },
        [onOpenChange]
    );

    const goToAccount = useCallback(
        (name: string) => {
            handleSelect(() => {
                router.push(`/dashboard/accounts?search=${encodeURIComponent(name)}`);
            });
        },
        [handleSelect, router]
    );

    const goToPlan = useCallback(
        (planId: string) => {
            handleSelect(() => {
                router.push(`/dashboard/saas?plan=${encodeURIComponent(planId)}`);
            });
        },
        [handleSelect, router]
    );

    // Reset query when closed
    useEffect(() => {
        if (!open) setQuery('');
    }, [open]);

    const showLocationGroup = locations.length > 0;
    const showPlanGroup = plans.length > 0;
    const isEmpty = !locationsQuery.isLoading && !showLocationGroup && !showPlanGroup;

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Search accounts, plans…"
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {isEmpty && (
                    <CommandEmpty>
                        <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
                            <Search className="h-8 w-8 opacity-30" />
                            <span className="text-sm">No results for &ldquo;{query}&rdquo;</span>
                        </div>
                    </CommandEmpty>
                )}

                {locationsQuery.isLoading && (
                    <div className="p-4 text-center text-sm text-slate-400">
                        Searching…
                    </div>
                )}

                {showLocationGroup && (
                    <CommandGroup heading="Accounts">
                        {locations.map((loc) => (
                            <CommandItem
                                key={loc.id}
                                value={`account-${loc.id}-${loc.name}`}
                                onSelect={() => goToAccount(loc.name)}
                                className="gap-2.5"
                            >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-50">
                                    <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm text-slate-800 truncate">{loc.name}</span>
                                    {(loc.city || loc.state) && (
                                        <span className="text-xs text-slate-400 truncate">
                                            {[loc.city, loc.state].filter(Boolean).join(', ')}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {showLocationGroup && showPlanGroup && <CommandSeparator />}

                {showPlanGroup && (
                    <CommandGroup heading="SaaS Plans">
                        {plans.map((plan) => (
                            <CommandItem
                                key={plan.id}
                                value={`plan-${plan.id}-${plan.name}`}
                                onSelect={() => goToPlan(plan.id)}
                                className="gap-2.5"
                            >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-50">
                                    <CreditCard className="h-3.5 w-3.5 text-green-500" />
                                </div>
                                <span className="text-sm text-slate-800">{plan.name}</span>
                                <span className="ml-auto text-xs text-slate-400">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency ?? 'USD' }).format(plan.price)}/mo
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
