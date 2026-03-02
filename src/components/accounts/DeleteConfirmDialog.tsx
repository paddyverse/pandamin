'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Single account name for single-delete. Omit for bulk delete. */
    accountName?: string;
    /** Number of accounts for bulk delete. */
    count?: number;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    accountName,
    count,
    onConfirm,
    isDeleting = false,
}: DeleteConfirmDialogProps) {
    const [confirmText, setConfirmText] = useState('');
    const isBulk = !accountName && !!count;
    const confirmRequired = isBulk;
    const canConfirm = !confirmRequired || confirmText === 'DELETE';

    const handleClose = (o: boolean) => {
        if (!o) setConfirmText('');
        onOpenChange(o);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <TriangleAlert className="h-5 w-5 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-base font-semibold text-slate-900">
                            {isBulk ? `Delete ${count} accounts?` : 'Delete account?'}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed">
                        {isBulk ? (
                            <>
                                You are about to permanently delete{' '}
                                <span className="font-semibold text-slate-800">{count} accounts</span>.
                                {' '}GHL applies a 24-hour grace period before permanent deletion.
                                <br />
                                <br />
                                To confirm, type{' '}
                                <span className="font-mono font-bold text-red-600">DELETE</span> below:
                            </>
                        ) : (
                            <>
                                You are about to delete{' '}
                                <span className="font-semibold text-slate-800">{accountName}</span>.
                                {' '}GHL applies a 24-hour grace period before permanent deletion.
                                This action cannot be undone.
                            </>
                        )}
                    </AlertDialogDescription>

                    {isBulk && (
                        <div className="mt-3 space-y-1.5">
                            <Label htmlFor="confirm-delete" className="text-sm font-medium text-slate-700">
                                Type DELETE to confirm
                            </Label>
                            <Input
                                id="confirm-delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className={cn(
                                    'border-slate-200 font-mono',
                                    confirmText && confirmText !== 'DELETE' && 'border-red-300 focus:border-red-400'
                                )}
                            />
                        </div>
                    )}
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel className="border-slate-200" onClick={() => setConfirmText('')}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={!canConfirm || isDeleting}
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:opacity-40"
                    >
                        {isDeleting ? 'Deleting...' : `Delete${isBulk ? ` ${count} accounts` : ''}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
