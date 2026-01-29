"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Filter, ArrowRight, Loader2, Calendar, User } from 'lucide-react';
import { documentService } from '@/lib/api';
import { authHelper, UserProfile } from '@/lib/auth-helper';
import { DocumentDto } from '@/types/api';

export default function WorkbenchListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState<DocumentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        // Get current user for mapping ID -> Name
        const user = authHelper.getUserFromToken();
        if (user) setCurrentUser(user);

        // Fetch ALL documents from the new endpoint
        const fetchDocs = async () => {
            setLoading(true);
            try {
                // Fetch ONLY the user's documents
                const results = await documentService.getMyDocuments();
                setDocuments(results);
            } catch (error) {
                console.error("Failed to fetch documents", error);
                setDocuments([]); // Handle error gracefully (maybe show toast)
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, []); // Empty dependency array: fetch once on mount

    // Client-side filtering
    const filteredDocs = documents.filter(doc =>
        doc.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Helper to map status number to text/color
    const getStatusBadge = (status: number) => {
        // Enum mapping (Assuming: 0=Uploaded, 1=Processing, 2=Completed, 3=Failed - Example)
        // You should align this with your backend Enum
        switch (status) {
            case 2: return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Completed</span>;
            case 1: return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Processing</span>;
            case 3: return <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">Failed</span>;
            default: return <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Uploaded</span>;
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Workbench</h1>
                    <p className="text-slate-500 mt-1">Manage and validate your processes documents.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 bg-white transition-colors">
                        Refresh List
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search documents by name or user..."
                        className="pl-9 w-full rounded-lg border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Documents Grid/Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full whitespace-nowrap text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-medium">Document Name</th>
                                    <th scope="col" className="px-6 py-3 font-medium">Uploaded By</th>
                                    <th scope="col" className="px-6 py-3 font-medium">Date</th>
                                    <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                    <th scope="col" className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            {doc.originalFileName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-slate-400" />
                                                {/* Show Full Name if it matches current user, otherwise show raw value (ID or Name) */}
                                                {(currentUser && doc.uploadedBy === currentUser.userId) ? currentUser.fullName : (doc.uploadedBy || 'Unknown')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                {formatDate(doc.uploadedAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/documents/${doc.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                                            >
                                                Review <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredDocs.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                <p>No documents found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
