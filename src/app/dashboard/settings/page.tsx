import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center shadow-sm">
                            <Settings className="h-4.5 w-4.5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1.5 ml-0.5">
                        Configure PandaDash application settings
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm overflow-hidden flex flex-col justify-center min-h-[500px]">
                <EmptyState
                    icon={Settings}
                    title="Settings Coming Soon"
                    description="The Settings panel is currently under construction. Administrative controls will be available in Phase 10."
                />
            </div>
        </div>
    );
}
