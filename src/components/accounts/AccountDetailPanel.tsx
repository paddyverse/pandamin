'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import {
    Mail,
    Phone,
    MapPin,
    Globe,
    Clock,
    Pencil,
    Trash2,
    CreditCard,
    RefreshCw,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import type { AccountRow } from './AccountsTable';

interface AccountDetailPanelProps {
    account: AccountRow | null;
    open: boolean;
    onClose: () => void;
    onEdit: (account: AccountRow) => void;
    onDelete: (account: AccountRow) => void;
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
}) {
    if (!value) return null;
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    {label}
                </p>
                <p className="text-sm text-slate-700 break-all">{value}</p>
            </div>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {children}
        </h3>
    );
}

export function AccountDetailPanel({
    account,
    open,
    onClose,
    onEdit,
    onDelete,
}: AccountDetailPanelProps) {
    if (!account) return null;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col p-0 gap-0">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <SheetTitle className="text-lg font-semibold text-slate-900 leading-tight">
                        {account.name}
                    </SheetTitle>
                    <div className="flex gap-2 mt-2">
                        <StatusBadge status={account.saasActive ? 'active' : 'inactive'} />
                        <StatusBadge
                            status={account.rebillingEnabled ? 'on' : 'off'}
                            label={account.rebillingEnabled ? 'Rebilling On' : 'Rebilling Off'}
                        />
                    </div>
                </SheetHeader>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* Contact Info */}
                    <section>
                        <SectionTitle>Contact Info</SectionTitle>
                        <div className="space-y-3">
                            <DetailRow icon={Mail} label="Email" value={account.email} />
                            <DetailRow icon={Phone} label="Phone" value={account.phone} />
                            <DetailRow icon={Globe} label="Website" value={undefined} />
                        </div>
                    </section>

                    <Separator />

                    {/* Address */}
                    <section>
                        <SectionTitle>Address</SectionTitle>
                        <div className="space-y-3">
                            <DetailRow
                                icon={MapPin}
                                label="Location"
                                value={[account.city, account.state].filter(Boolean).join(', ') || undefined}
                            />
                            <DetailRow icon={Clock} label="Timezone" value={undefined} />
                        </div>
                    </section>

                    <Separator />

                    {/* SaaS Subscription */}
                    <section>
                        <SectionTitle>SaaS Subscription</SectionTitle>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${account.planColor}18` }}>
                                <CreditCard className="h-4 w-4" style={{ color: account.planColor }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{account.planName}</p>
                                <p className="text-xs text-slate-400">
                                    {/* TODO: Phase 4 — show next billing date */}
                                    Next billing: —
                                </p>
                            </div>
                            <StatusBadge
                                status={account.saasActive ? 'active' : 'inactive'}
                                className="ml-auto"
                            />
                        </div>
                    </section>

                    <Separator />

                    {/* Rebilling Config */}
                    <section>
                        <SectionTitle>Rebilling Config</SectionTitle>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${account.rebillingEnabled ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                {account.rebillingEnabled ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Rebilling {account.rebillingEnabled ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {/* TODO: Phase 4 — show markup % */}
                                    Markup: —
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Metadata */}
                    <section>
                        <SectionTitle>Settings</SectionTitle>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Account ID</span>
                                <span className="text-slate-600 font-mono text-xs">{account.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Created</span>
                                <span className="text-slate-600">{formatDate(account.dateAdded)}</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <SheetFooter className="px-6 py-4 border-t border-slate-100 flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 gap-1.5 border-slate-200"
                        onClick={() => onEdit(account)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={() => onDelete(account)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
