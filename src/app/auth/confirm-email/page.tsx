'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/api';

export default function ConfirmEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const confirm = async () => {
            const userId = searchParams.get('userId');
            const token = searchParams.get('token');

            if (!userId || !token) {
                setStatus('error');
                setMessage('Invalid confirmation link. Missing parameters.');
                return;
            }

            try {
                await authService.confirmEmail(userId, token);
                setStatus('success');
                // Redirect after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } catch (err: any) {
                console.error('Email confirmation error:', err);
                setStatus('error');
                // Try to get a friendly error message
                if (err.response?.data && typeof err.response.data === 'string') {
                    setMessage(err.response.data);
                } else if (err.response?.data?.message) {
                    setMessage(err.response.data.message);
                } else {
                    setMessage('Failed to verify email. The link may be expired or invalid.');
                }
            }
        };

        confirm();
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="p-8 sm:p-10 text-center">

                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying Email</h2>
                            <p className="text-gray-500 dark:text-gray-400">Please wait while we verify your email address...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
                            <p className="text-gray-500 dark:text-gray-400">Your email has been successfully verified.</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Redirecting to login...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
                            <p className="text-gray-500 dark:text-gray-400">{message}</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}

                </div>
                {/* Decorational bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${status === 'success' ? 'from-green-400 to-green-600' :
                        status === 'error' ? 'from-red-400 to-red-600' :
                            'from-blue-500 via-indigo-500 to-purple-500'
                    }`}></div>
            </div>
        </div>
    );
}
