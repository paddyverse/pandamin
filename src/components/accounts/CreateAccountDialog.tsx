'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle } from 'lucide-react';

// TODO: Phase 4 — load from useSaasPlans()
const PLACEHOLDER_PLANS = [
    { id: 'plan_starter', name: 'Starter' },
    { id: 'plan_growth', name: 'Growth' },
    { id: 'plan_pro', name: 'Pro' },
    { id: 'plan_enterprise', name: 'Enterprise' },
];

const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
];

interface CreateAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Record<string, string>, addAnother: boolean) => Promise<void>;
    plans?: { id: string; name: string }[];
}

export function CreateAccountDialog({
    open,
    onOpenChange,
    onSubmit,
    plans = PLACEHOLDER_PLANS,
}: CreateAccountDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
        addAnother: boolean
    ) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries()) as Record<string, string>;
        await onSubmit(data, addAnother);
        setIsSubmitting(false);
        if (!addAnother) onOpenChange(false);
        else e.currentTarget.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <PlusCircle className="h-4 w-4 text-indigo-500" />
                        Create Account
                    </DialogTitle>
                </DialogHeader>

                <form
                    id="create-account-form"
                    onSubmit={(e) => handleSubmit(e, false)}
                    className="px-6 py-5 space-y-5"
                >
                    {/* Business Info */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Business Info
                        </h3>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Business Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                placeholder="Acme Inc."
                                className="border-slate-200 focus:border-indigo-400"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@acme.com"
                                    className="border-slate-200 focus:border-indigo-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="(555) 000-0000"
                                    className="border-slate-200 focus:border-indigo-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                            <Input
                                id="website"
                                name="website"
                                type="url"
                                placeholder="https://acme.com"
                                className="border-slate-200 focus:border-indigo-400"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Address
                        </h3>
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="123 Main St"
                                className="border-slate-200 focus:border-indigo-400"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="Austin"
                                    className="border-slate-200 focus:border-indigo-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="state" className="text-sm font-medium">State</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    placeholder="TX"
                                    className="border-slate-200 focus:border-indigo-400"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    name="postalCode"
                                    placeholder="78701"
                                    className="border-slate-200 focus:border-indigo-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                                <Input
                                    id="country"
                                    name="country"
                                    defaultValue="US"
                                    className="border-slate-200 focus:border-indigo-400"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Settings */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Settings
                        </h3>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Timezone</Label>
                            <Select name="timezone">
                                <SelectTrigger className="border-slate-200">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map((tz) => (
                                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">SaaS Plan (optional)</Label>
                            <Select name="planId">
                                <SelectTrigger className="border-slate-200">
                                    <SelectValue placeholder="No plan selected" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </form>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-600"
                        disabled={isSubmitting}
                        onClick={() => {
                            const form = document.getElementById('create-account-form') as HTMLFormElement | null;
                            if (form) {
                                const e = { currentTarget: form, preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
                                void handleSubmit(e, true);
                            }
                        }}
                    >
                        Create &amp; Add Another
                    </Button>
                    <Button
                        form="create-account-form"
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
