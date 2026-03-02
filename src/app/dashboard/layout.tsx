'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    RefreshCw,
    Settings,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { useGHLContext } from '@/hooks/useGHLContext';
import { type ReactNode } from 'react';

const NAV_ITEMS = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/accounts', icon: Users, label: 'Accounts' },
    { href: '/dashboard/saas', icon: CreditCard, label: 'SaaS Plans' },
    { href: '/dashboard/saas/rebilling', icon: RefreshCw, label: 'Rebilling' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

// ─── Top Nav (inner — needs useSearchParams via useGHLContext) ─────────────────

function TopNavInner({ onOpenPalette }: { onOpenPalette: () => void }) {
    const pathname = usePathname();
    const { userFirstName } = useGHLContext();

    return (
        <header className="shrink-0 bg-white border-b border-slate-200 shadow-sm">
            {/* Brand + actions row */}
            <div className="flex items-center justify-between px-4 h-11 border-b border-slate-100">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold select-none">
                        🐼
                    </div>
                    <span className="font-semibold text-sm text-slate-800 tracking-tight">
                        PandaDash
                    </span>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {userFirstName && (
                        <span className="text-xs text-slate-500 hidden sm:block">
                            Hello,{' '}
                            <span className="font-medium text-slate-700">
                                {userFirstName}
                            </span>
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        aria-label="Open command palette"
                        className="h-7 gap-1.5 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 text-xs font-normal bg-white"
                        onClick={onOpenPalette}
                    >
                        <Search className="h-3 w-3" />
                        Search
                        <kbd className="ml-0.5 hidden sm:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] text-slate-400 font-mono">
                            ⌘K
                        </kbd>
                    </Button>
                </div>
            </div>

            {/* Nav tabs row */}
            <nav className="flex items-center px-2 h-9 gap-0.5 overflow-x-auto">
                {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                    const isActive =
                        href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-colors relative whitespace-nowrap',
                                isActive
                                    ? 'text-indigo-600'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {label}
                            {/* Underline active indicator */}
                            {isActive && (
                                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [paletteOpen, setPaletteOpen] = useState(false);
    const openPalette = useCallback(() => setPaletteOpen(true), []);

    // Global Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setPaletteOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Top Navigation */}
            <Suspense
                fallback={
                    <header className="shrink-0 bg-white border-b border-slate-200 h-20" />
                }
            >
                <TopNavInner onOpenPalette={openPalette} />
            </Suspense>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 py-5">{children}</div>
            </main>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
    );
}
