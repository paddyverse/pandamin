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
    Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { useGHLContext } from '@/hooks/useGHLContext';
import { type ReactNode } from 'react';

const NAV_ITEMS = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/accounts', icon: Users, label: 'Accounts' },
    { href: '/dashboard/saas', icon: CreditCard, label: 'SaaS Plans' },
    { href: '/dashboard/saas/rebilling', icon: RefreshCw, label: 'Rebilling' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Overview',
    '/dashboard/accounts': 'Accounts',
    '/dashboard/accounts/create': 'Create Account',
    '/dashboard/saas': 'SaaS Plans',
    '/dashboard/saas/rebilling': 'Rebilling',
    '/dashboard/settings': 'Settings',
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex flex-col w-64 shrink-0 bg-slate-900 text-white min-h-screen">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-base select-none">
                    🐼
                </div>
                <span className="font-semibold text-[15px] tracking-tight text-white">
                    PandaDash
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
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
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group',
                                isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                            )}
                        >
                            {/* Active left border accent */}
                            {isActive && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-500 rounded-full" />
                            )}
                            <Icon
                                className={cn(
                                    'h-4 w-4 shrink-0',
                                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                                )}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-800">
                <p className="text-[10px] text-slate-600 font-medium tracking-wide uppercase">
                    Powered by Padiverse LLC
                </p>
            </div>
        </aside>
    );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

interface TopBarProps {
    onOpenPalette: () => void;
}

function TopBar({ onOpenPalette }: TopBarProps) {
    const pathname = usePathname();
    const { userFirstName } = useGHLContext();
    const title = PAGE_TITLES[pathname] ?? 'Dashboard';

    return (
        <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-6">
            <div>
                <h1 className="text-[15px] font-semibold text-slate-800">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
                {/* Greeting from iframe URL params */}
                {userFirstName && (
                    <>
                        <span className="text-sm text-slate-500 hidden sm:block">
                            Hello, <span className="font-medium text-slate-700">{userFirstName}</span>
                        </span>
                        <Separator orientation="vertical" className="h-5" />
                    </>
                )}

                {/* Cmd+K search trigger */}
                <Button
                    variant="outline"
                    size="sm"
                    aria-label="Open command palette"
                    className="h-8 gap-2 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 text-xs font-normal"
                    onClick={onOpenPalette}
                >
                    <Command className="h-3 w-3" />
                    Search
                    <kbd className="ml-1 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                        ⌘K
                    </kbd>
                </Button>
            </div>
        </header>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [paletteOpen, setPaletteOpen] = useState(false);

    const openPalette = useCallback(() => setPaletteOpen(true), []);

    // Global Cmd+K / Ctrl+K keyboard shortcut
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
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Suspense
                    fallback={
                        <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center px-6">
                            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                        </header>
                    }
                >
                    <TopBar onOpenPalette={openPalette} />
                </Suspense>
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">{children}</div>
                </main>
            </div>

            {/* Global command palette — rendered once at layout level */}
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
    );
}
