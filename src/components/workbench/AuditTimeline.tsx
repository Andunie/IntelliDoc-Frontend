"use client";

import { useEffect, useState } from 'react';
import { auditService } from '@/lib/api';
import { AuditHistoryItem } from '@/types/api';
import { Loader2, X, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditTimelineProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AuditTimeline({ documentId, isOpen, onClose }: AuditTimelineProps) {
    const [history, setHistory] = useState<AuditHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && documentId) {
            setLoading(true);
            auditService.getHistory(documentId)
                .then(data => {
                    setHistory(data);
                })
                .catch(err => {
                    console.error("Failed to fetch history history", err);
                    setHistory([]); // Set empty history on error
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, documentId]);

    // Format Date: "Today at 10:30" or "Jan 12 at 14:00"
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar / Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Audit History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="h-[calc(100vh-64px)] overflow-y-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <p>No history records found.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                            {history.map((item, index) => (
                                <div key={item.id || index} className="relative pl-8">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-indigo-500 ring-4 ring-slate-50"></div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900">{item.action}</span>
                                            <span className="text-xs text-slate-400 font-medium">{formatDate(item.timestamp)}</span>
                                        </div>

                                        <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            {item.details}
                                        </p>

                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                                            <User className="h-3 w-3" />
                                            <span>
                                                {item.userId === 'system' ? 'System AI' : `User (${item.userId})`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
