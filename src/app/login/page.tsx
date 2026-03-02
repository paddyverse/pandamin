import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

async function verifyPin(formData: FormData) {
    'use server';
    const pin = formData.get('pin')?.toString();
    const correctPin = process.env.DASHBOARD_PIN;

    if (!correctPin) {
        throw new Error('DASHBOARD_PIN is not configured on the server.');
    }

    if (pin === correctPin) {
        // Set a secure HTTP-only cookie valid for 30 days
        const cookieStore = await cookies();
        cookieStore.set('auth_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none', // Needed for iframes
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        redirect('/dashboard');
    }
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
                    Staff Authentication
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                    Please enter the master PIN to access the dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
                    <form action={verifyPin} className="space-y-6">
                        <div>
                            <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                                Dashboard PIN
                            </label>
                            <div className="mt-2">
                                <input
                                    id="pin"
                                    name="pin"
                                    type="password"
                                    required
                                    autoFocus
                                    className="block w-full rounded-md border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 text-center tracking-[0.25em] font-medium"
                                    placeholder="••••"
                                />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-10">
                                Unlock Dashboard
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
