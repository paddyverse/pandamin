'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Next.js App Router error boundary for the /dashboard segment.
 * Displayed whenever an unhandled error is thrown in a dashboard page or its children.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
    useEffect(() => {
        // Log to monitoring service in production
        console.error('[DashboardError]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Something went wrong
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
                {error.message ?? 'An unexpected error occurred. Please try again.'}
            </p>

            {error.digest && (
                <p className="text-xs text-slate-400 font-mono mb-4">
                    Error ID: {error.digest}
                </p>
            )}

            <Button
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={reset}
            >
                <RefreshCw className="h-4 w-4" />
                Try Again
            </Button>
        </div>
    );
}
