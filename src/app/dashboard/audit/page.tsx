"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, User, Calendar, FileText, Filter, Download, ArrowRight, Loader2 } from 'lucide-react';
import { auditService } from '@/lib/api';

export default function AuditLogsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await auditService.getAllLogs();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch audit logs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.reference && log.reference.includes(searchTerm))
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs</h1>
                    <p className="text-slate-500 mt-1">Track all system activities, user actions, and security events.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter logs by user, action, or document ID..."
                        className="pl-9 w-full rounded-lg border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Timestamp</th>
                                <th className="px-6 py-3 font-medium">User</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                                <th className="px-6 py-3 font-medium">Details</th>
                                <th className="px-6 py-3 font-medium">Reason</th>
                                <th className="px-6 py-3 font-medium">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                                            <p>Loading audit logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(log.timestamp)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                                                    <User className="h-3 w-3" />
                                                </div>
                                                {log.user || 'System'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${log.action?.includes('Failed') ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                log.action?.includes('Update') ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                                    log.action?.includes('Upload') ? 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' :
                                                        log.action?.includes('Approve') ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/10' :
                                                            'bg-slate-50 text-slate-700 ring-slate-600/10'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-normal break-words">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs italic">
                                            {log.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.reference ? (
                                                <Link
                                                    href={`/dashboard/documents/${log.reference}`}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    <span className="font-mono text-xs">DOC</span>
                                                    <ArrowRight className="h-3 w-3 opacity-50" />
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                        <p>No audit records found matching your filter.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
