'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className,
}: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={cn('relative flex items-center', className)}>
            <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-8 h-9 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 h-6 w-6 text-slate-400 hover:text-slate-600"
                    onClick={() => {
                        onChange('');
                        inputRef.current?.focus();
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
