'use client';

import { useEffect, useState, Suspense, type ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

function AuthGuardInner({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Skip auth check if we are already on the login page or public routes
        if (pathname.startsWith('/login')) {
            setIsAuthenticated(true);
            return;
        }

        const session = sessionStorage.getItem('auth_session');
        if (session === 'authenticated') {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);

            // Redirect to login while preserving the location_id so we don't lose context
            const locationId = searchParams.get('location_id') || sessionStorage.getItem('ghl_location_id');
            const newUrl = new URL('/login', window.location.origin);
            if (locationId) {
                newUrl.searchParams.set('location_id', locationId);
            }
            router.push(newUrl.pathname + newUrl.search);
        }
    }, [pathname, router, searchParams]);

    // Show nothing (or a loading spinner) while we verify authentication
    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // If they aren't authenticated but the effect is redirecting them, show nothing
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-slate-50">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            }
        >
            <AuthGuardInner>{children}</AuthGuardInner>
        </Suspense>
    );
}
